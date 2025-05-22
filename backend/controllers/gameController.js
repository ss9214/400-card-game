const Game = require('../models/gameModel');
const Player = require('../models/playerModel');
const { io } = require('../server');
const db = require('../db');

const dbQuery = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

function generateCode(length = 5) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

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

exports.createGame = (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const code = generateCode();
  Game.createGame(code, (err, game) => {
    if (err) return res.status(500).json({ error: 'Failed to create game' });

    Player.addPlayerToGame(name, game.id, (err2, player) => {
      if (err2) return res.status(500).json({ error: 'Failed to add player' });

      res.status(201).json({
        game: { id: game.id, code: game.code },
        player: { id: player.id, name }
      });
    });
  });
};

exports.joinGame = (req, res) => {
  const { code, name, playerId } = req.body;
  if (!name || !code) return res.status(400).json({ error: 'Code and name are required' });

  Game.findGameByCode(code.toUpperCase(), (err, game) => {
    if (err || !game) return res.status(404).json({ error: 'Game not found' });

    if (playerId) {
      Player.findPlayerById(playerId, (err2, player) => {
        if (err2 || !player || player.game_id !== game.id) {
          createNew();
        } else {
          Player.updatePlayerName(playerId, name, (err3) => {
            if (err3) return res.status(500).json({ error: 'Update failed' });
            res.json({ game, player: { id: playerId, name } });
          });
        }
      });
    } else {
      createNew();
    }

    function createNew() {
      Player.addPlayerToGame(name, game.id, (err4, player) => {
        if (err4) return res.status(500).json({ error: 'Failed to join game' });
        res.status(200).json({ game, player });
      });
    }
  });
};

exports.getGamePlayers = (req, res) => {
  const code = req.params.code.toUpperCase();
  Game.findGameByCode(code, (err, game) => {
    if (err || !game) return res.status(404).json({ error: 'Game not found' });

    Player.getPlayersByGameId(game.id, (err2, players) => {
      if (err2) return res.status(500).send(err2);
      res.json(players);
    });
  });
};

exports.getGameStatus = (req, res) => {
  const code = req.params.code.toUpperCase();
  Game.findGameByCode(code, (err, game) => {
    if (err || !game) return res.status(404).json({ error: 'Game not found' });
    res.json({ status: game.status });
  });
};

exports.getPlayerHand = (req, res) => {
  const playerId = parseInt(req.params.playerId, 10);
  if (!playerId) return res.status(400).json({ error: 'Invalid player ID' });

  Player.getPlayerHand(playerId, (err, hand) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch hand' });
    res.json({ hand });
  });
};

exports.placeBet = async (req, res) => {
  try {
    const { playerId, bet, gameCode } = req.body;  // Get gameCode from body instead of params
    if (!gameCode) return res.status(400).json({ error: 'Game code is required' });
    if (bet < 2) return res.status(400).json({ error: 'Minimum bet is 2' });

    // First place the bet
    await dbQuery(
      'UPDATE players SET bet = ? WHERE id = ?',
      [bet, playerId]
    );

    // Get all bets for this game
    const [game] = await dbQuery(
      'SELECT id FROM games WHERE code = ?',
      [gameCode.toUpperCase()]
    );
    if (!game) return res.status(404).json({ error: 'Game not found' });

    const bets = await dbQuery(
      'SELECT COUNT(*) as count FROM players WHERE game_id = ? AND bet IS NOT NULL',
      [game.id]
    );

    // If this was the last bet, update phase to 'playing'
    if (bets[0].count === 4) {
      await dbQuery(
        'UPDATE games SET phase = ? WHERE code = ?',
        ['playing', gameCode.toUpperCase()]
      );
    }

    res.json({ success: true, playerId, bet });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getBets = (req, res) => {
  const code = req.params.code.toUpperCase();
  Game.findGameByCode(code, (err, game) => {
    if (err || !game) return res.status(404).json({ error: 'Game not found' });
    Player.getPlayersByGameId(game.id, (err2, rows) => {
      if (err2) return res.status(500).json({ error: err2 });
      res.json(rows);
    });
  });
};

// Called when a trick is won
exports.recordTrickWin = (req, res) => {
  const { playerId } = req.body;
  Player.updateRoundScore(playerId, 1, (err) => {
    if (err) return res.status(500).json({ error: 'Failed to record trick' });
    res.json({ success: true, playerId });
  });
};

exports.finishRoundInternal = (code, callback) => {
  code = code.toUpperCase();
  Game.findGameByCode(code, (err, game) => {
    if (err || !game) return callback && callback(err || new Error('Game not found'));

    Player.getPlayersByGameId(game.id, (err2, players) => {
      if (err2) return callback && callback(err2);

      // Calculate each player's game_score delta
      const updates = players.map(p => {
        let delta = 0;
        const { bet, roundScore } = p;
        console.log(p)
        if (bet >= 8) delta = bet * 3;
        else if (bet >= 6) delta = bet * 2;
        else delta = bet;
        if (roundScore < bet) delta = delta * -1 
        return { id: p.id, delta };
      });

      // Apply updates in series
      let done = 0, errs = [];
      updates.forEach(u => {
        Player.updateGameScore(u.id, u.delta, (e) => {
          if (e) errs.push(e);
          done++;
          if (done === updates.length) {
            // Reset bets and round_scores
            Player.resetRound(game.id, (e2) => {
              if (errs.length || e2) {
                return callback && callback(errs.concat(e2));
              }
              // Reset phase to betting for next round
              db.query('UPDATE games SET phase = ? WHERE code = ?', ['betting', code], (err3) => {
                if (err3) return callback && callback(err3);

                // --- DEAL NEW HANDS ---
                const deck = generateShuffledDeck();
                // Re-fetch players to get their IDs in the right order
                Player.getPlayersByGameId(game.id, (err4, freshPlayers) => {
                  if (err4) return callback && callback(err4);
                  let handsDone = 0;
                  freshPlayers.forEach((player, i) => {
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
                    Player.setPlayerHand(player.id, hand, (err5) => {
                      handsDone++;
                      // Emit the new hand to this player
                      io.to(player.id.toString()).emit('new-hand', { playerId: player.id, hand });
                      if (handsDone === freshPlayers.length) {
                        // All hands dealt, respond success
                        db.query('UPDATE games SET rounds_completed = rounds_completed + 1 WHERE code = ?', [code], (err6) => {
                          if (err6) return callback && callback(err6);

                          // --- EMIT SCORES UPDATED HERE ---
                          Player.getPlayersByGameId(game.id, (err7, updatedPlayers) => {
                            if (!err7 && updatedPlayers) {
                              io.to(code).emit('scores-updated', {
                                players: updatedPlayers.map(p => ({
                                  id: p.id,
                                  name: p.name,
                                  gameScore: p.gameScore
                                }))
                              });
                            }
                            if (callback) callback(null);
                          });
                          // --- END EMIT ---
                        });
                      }
                    });
                  });
                });
                // --- END DEAL NEW HANDS ---
              });
            });
          }
        });
      });
    });
  });
};

// Keep your HTTP handler for compatibility
exports.finishRound = (req, res) => {
  exports.finishRoundInternal(req.params.code, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
};
