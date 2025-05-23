const express = require('express');
const cors = require('cors');
require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});
module.exports.io = io;
const gameRoutes = require('./routes/gameRoutes');
app.use(cors());
app.use(express.json());
app.use('/api/games', gameRoutes);

// SOCKET.IO
const Game = require('./models/gameModel');
const Player = require('./models/playerModel');
const db = require('./db');

const currentTricks = {}; // { [gameCode]: [{ playerId, card }, ...] }
const tricksPlayed = {}; // { [gameCode]: number }
const { finishRoundInternal } = require('./controllers/gameController'); // adjust path if needed

// Top (add helper)
function generateShuffledDeck() {
    const suits = ['spades', 'hearts', 'diamonds', 'clubs'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace'];
    const deck = [];
  
    for (const suit of suits) {
      for (const value of values) {
        deck.push(`${value}_of_${suit}`);
      }
    }
  
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  
    return deck;
  }
  
  const playerHands = {}; // cache

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('join-lobby', async ({ gameCode, playerId }) => {
    socket.join(gameCode);
    socket.join(playerId.toString());
    socket.currentGameCode = gameCode;
    const game = await new Promise(resolve => Game.findGameByCode(gameCode, (err, g) => resolve(g)));
    if (!game) return;

    Player.getPlayersByGameId(game.id, (err, players) => {
      if (!err) {
        io.to(gameCode).emit('update-lobby', players);
      }
    });
  });

  socket.on('bet-placed', ({ playerId: pid, bet, nextIdx }) => {
    const room = socket.currentGameCode;
    if (!room) return;
    io.to(room).emit('bet-placed', { playerId: pid, bet, nextIdx });
  });
  
  socket.on('start-game', async ({ gameCode }) => {
    const game = await new Promise(resolve => Game.findGameByCode(gameCode, (err, g) => resolve(g)));
    if (!game) return;

    Player.getPlayersByGameId(game.id, (err, players) => {
      if (err) return;

      const deck = generateShuffledDeck();
      const hands = {};
      players.forEach((player, i) => {
        const suitOrder = {
            clubs: 0,
            diamonds: 1,
            spades: 2,
            hearts: 3
          };
        const rankOrder = {
            2: 0,
            3: 1,
            4: 2,
            5: 3,
            6: 4,
            7: 5,
            8: 6,
            9: 7,
            10: 8,
            jack: 9,
            queen: 10,
            king: 11,
            ace: 12,
        };
        const hand = deck.slice(i * 13, (i + 1) * 13).sort((a, b) => {
            const rankA = a.split('_of_')[0];
            const rankB = b.split('_of_')[0];
            return rankOrder[rankA] - rankOrder[rankB];
        }).sort((a, b) => {
            const suitA = a.split('_of_')[1];
            const suitB = b.split('_of_')[1];
            return suitOrder[suitA] - suitOrder[suitB];
        });
        hands[player.id] = hand;
        // Save to DB
        Player.setPlayerHand(player.id, hand, (err) => {
          if (err) console.error(`Failed to save hand for player ${player.id}`);
        });
      });

      playerHands[gameCode] = hands;

      players.forEach((player) => {
        io.to(gameCode).emit('game-started', {
          playerId: player.id,
          hand: hands[player.id]
        });
      });
    });
  });

  socket.on('play-card', ({ card, playerId, gameCode }) => {
    // Initialize trick array if not present
    if (!currentTricks[gameCode]) currentTricks[gameCode] = [];
    currentTricks[gameCode].push({ playerId, card });

    // Broadcast the card played to all clients
    io.to(gameCode).emit('card-played', { card, playerId });

    // If 4 cards have been played, finish the trick
    if (currentTricks[gameCode].length === 4) {
      const trick = currentTricks[gameCode];

      // Calculate winner (reuse your logic)
      const leadSuit = trick[0].card.split('_of_')[1];
      const rankOrder = {
        '2': 0, '3': 1, '4': 2, '5': 3, '6': 4, '7': 5, '8': 6, '9': 7,
        '10': 8, 'jack': 9, 'queen': 10, 'king': 11, 'ace': 12
      };
      const getSuit = card => card.split('_of_')[1];
      const getRank = card => rankOrder[card.split('_of_')[0]];
      const hearts = trick.filter(t => getSuit(t.card) === 'hearts');
      const candidates = hearts.length > 0 ? hearts : trick.filter(t => getSuit(t.card) === leadSuit);
      let winner = candidates[0];
      for (let t of candidates) {
        if (getRank(t.card) > getRank(winner.card)) winner = t;
      }
      const winnerId = winner.playerId;

      // --- UPDATE THE DATABASE HERE ---
      if (!tricksPlayed[gameCode]) tricksPlayed[gameCode] = 0;
      tricksPlayed[gameCode] += 1;

      Player.updateRoundScore(winnerId, 1, (err) => {
        if (err) {
          console.error('Failed to update round score for player', winnerId, err);
        }
        io.to(gameCode).emit('trick-finished', {
          winnerId,
          trick
        });

        // After 13 tricks, finish the round
        if (tricksPlayed[gameCode] === 13) {
          finishRoundInternal(gameCode, () => {
            io.to(gameCode).emit('round-finished');
            tricksPlayed[gameCode] = 0; // Reset for next round
          });
        }

        // Reset trick for this game
        currentTricks[gameCode] = [];
      });
    }
  });

  socket.on('skip-round', ({ gameCode }) => {
    // 1. Increment rounds_completed
    db.query('UPDATE games SET rounds_completed = rounds_completed + 1, phase = "betting" WHERE code = ?', [gameCode], (err) => {
      if (err) {
        return;
      }
      // 2. Get the game and players
      Game.findGameByCode(gameCode, (err2, game) => {
        if (err2 || !game) return;
        Player.getPlayersByGameId(game.id, (err3, players) => {
          if (err3) return;
          // 3. Shuffle and deal new hands
          const deck = generateShuffledDeck();
          players.forEach((player, i) => {
            const hand = deck.slice(i * 13, (i + 1) * 13);
            Player.setPlayerHand(player.id, hand, (err4) => {
              // Emit the new hand to this player
              io.to(player.id.toString()).emit('new-hand', { playerId: player.id, hand });
            });
          });
          // Emit round-skipped to the whole room
          io.to(gameCode).emit('round-skipped', { message: "Round skipped: total bets < 11. New hands have been dealt." });
        });
      });
    });
  });
});

const port = process.env.PORT || 3001;
server.listen(port, () => console.log(`Server listening on port ${port}`));


