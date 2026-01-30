const CardGame = require('../core/CardGame');

/**
 * Spades Card Game Implementation
 * - 4 players in teams (0+2 vs 1+3)
 * - Spades are trump
 * - Nil bids, bags system, 10 bags = -100 penalty
 * - First to 500 wins
 */
class GameSpades extends CardGame {
  constructor(gameCode, gameId) {
    super(gameCode, gameId);
    this.trumpSuit = 'spades';
    this.teamBags = { 0: 0, 1: 0 }; // Track bags per team
    this.teamScores = { 0: 0, 1: 0 };
    this.spadesBroken = false;
    this.roundNumber = 1;
    this.blindNils = {}; // Track which players bid blind nil
  }

  static getConfig() {
    return {
      id: 'spades',
      name: 'Spades',
      description: 'Classic Spades card game with nil bids and bags',
      minPlayers: 4,
      maxPlayers: 4,
      category: 'card',
      icon: '♠️',
      teams: [[0, 2], [1, 3]],
      trumpSuit: 'spades'
    };
  }

  determineTrickWinner(trick, leadSuit) {
    // Spades trump all
    const spades = trick.filter(t => this.getSuit(t.card) === 'spades');
    
    let candidates;
    if (spades.length > 0) {
      candidates = spades;
    } else {
      candidates = trick.filter(t => this.getSuit(t.card) === leadSuit);
    }
    
    let winner = candidates[0];
    let maxRank = this.getCardRank(this.getValue(winner.card));
    
    for (let i = 1; i < candidates.length; i++) {
      const rank = this.getCardRank(this.getValue(candidates[i].card));
      if (rank > maxRank) {
        maxRank = rank;
        winner = candidates[i];
      }
    }
    
    return winner.playerId;
  }

  calculateRoundScore() {
    const scores = { 0: 0, 1: 0 }; // Team scores for this round
    const teams = [[0, 2], [1, 3]];
    
    teams.forEach((team, teamIdx) => {
      let teamBid = 0;
      let teamTricks = 0;
      let nilBids = [];
      
      // Check each player on the team
      team.forEach(playerId => {
        const bet = this.bets[playerId];
        const tricks = this.tricksWon[playerId] || 0;
        
        if (bet === 0) {
          // Nil bid - scored separately
          const isBlind = this.blindNils[playerId] === true;
          nilBids.push({ playerId, tricks, isBlind });
        } else {
          teamBid += bet;
          teamTricks += tricks;
        }
      });
      
      // Score nil bids first
      nilBids.forEach(({ playerId, tricks, isBlind }) => {
        const nilValue = isBlind ? 200 : 100;
        if (tricks === 0) {
          scores[teamIdx] += nilValue; // Nil made
        } else {
          scores[teamIdx] -= nilValue; // Nil failed
        }
      });
      
      // Score regular bids
      if (teamTricks >= teamBid) {
        // Made the bid
        scores[teamIdx] += teamBid * 10;
        const bags = teamTricks - teamBid;
        scores[teamIdx] += bags;
        
        // Track bags
        this.teamBags[teamIdx] += bags;
        
        // Bag penalty (every 10 bags = -100)
        if (this.teamBags[teamIdx] >= 10) {
          scores[teamIdx] -= 100;
          this.teamBags[teamIdx] -= 10;
        }
      } else {
        // Failed the bid
        scores[teamIdx] -= teamBid * 10;
      }
    });
    
    return scores;
  }

  initialize(players, callback) {
    this.players = players;
    this.dealCards(13);
    this.phase = 'betting';
    this.spadesBroken = false;
    
    callback(null, {
      phase: this.phase,
      hands: this.hands,
      roundNumber: this.roundNumber,
      teamScores: this.teamScores,
      teamBags: this.teamBags
    });
  }

  checkWinCondition(players) {
    // First team to 500 wins
    if (this.teamScores[0] >= 500) {
      return { 
        winner: true, 
        winningTeam: 0,
        players: [players[0], players[2]],
        finalScore: this.teamScores
      };
    }
    if (this.teamScores[1] >= 500) {
      return { 
        winner: true, 
        winningTeam: 1,
        players: [players[1], players[3]],
        finalScore: this.teamScores
      };
    }
    return { winner: false };
  }

  isValidPlay(playerId, card) {
    const hand = this.hands[playerId];
    if (!hand.includes(card)) return false;

    // First card of trick - check if spades can be led
    if (this.currentTrick.length === 0) {
      const cardSuit = this.getSuit(card);
      
      // Can't lead spades unless broken or only have spades
      if (cardSuit === 'spades' && !this.spadesBroken) {
        const hasOnlySpades = hand.every(c => this.getSuit(c) === 'spades');
        if (!hasOnlySpades) {
          return false;
        }
      }
      return true;
    }

    // Must follow suit if possible
    const leadSuit = this.getSuit(this.currentTrick[0].card);
    const hasSuit = hand.some(c => this.getSuit(c) === leadSuit);
    
    if (hasSuit) {
      return this.getSuit(card) === leadSuit;
    }
    
    // No cards of lead suit - can play anything
    // Mark spades as broken if playing a spade
    if (this.getSuit(card) === 'spades') {
      this.spadesBroken = true;
    }
    
    return true;
  }

  handleAction(action, playerId, data, callback) {
    try {
      if (action === 'place-bet') {
        return this.handleBet(playerId, data.bet, callback, data.isBlindNil);
      } else if (action === 'play-card') {
        return this.handlePlayCard(playerId, data.card, callback);
      }
      callback(new Error('Invalid action'));
    } catch (err) {
      callback(err);
    }
  }

  handleBet(playerId, bet, callback, isBlindNil = false) {
    if (this.phase !== 'betting') {
      return callback(new Error('Not in betting phase'));
    }
    
    if (bet < 0 || bet > 13) {
      return callback(new Error('Bet must be between 0 and 13'));
    }
    
    this.bets[playerId] = bet;
    
    // Track if this is a blind nil
    if (bet === 0 && isBlindNil) {
      this.blindNils[playerId] = true;
    }
    
    // Check if all players have bet
    const allBetsPlaced = this.players.every(p => this.bets[p.id] !== undefined);
    
    if (allBetsPlaced) {
      this.phase = 'playing';
      this.currentTrick = [];
      this.currentPlayerIndex = 0; // Player 0 leads first round
    }
    
    callback(null, {
      phase: this.phase,
      bets: this.bets,
      currentPlayer: this.players[this.currentPlayerIndex]?.id
    });
  }

  handlePlayCard(playerId, card, callback) {
    if (this.phase !== 'playing') {
      return callback(new Error('Not in playing phase'));
    }
    
    const currentPlayer = this.players[this.currentPlayerIndex];
    if (currentPlayer.id !== playerId) {
      return callback(new Error('Not your turn'));
    }
    
    if (!this.isValidPlay(playerId, card)) {
      return callback(new Error('Invalid card play'));
    }
    
    // Remove card from hand
    this.hands[playerId] = this.hands[playerId].filter(c => c !== card);
    
    // Add to current trick
    this.currentTrick.push({ playerId, card });
    
    // Check if trick is complete
    if (this.currentTrick.length === 4) {
      return this.completeTrick(callback);
    }
    
    // Next player
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % 4;
    
    callback(null, {
      currentTrick: this.currentTrick,
      currentPlayer: this.players[this.currentPlayerIndex].id,
      spadesBroken: this.spadesBroken
    });
  }

  completeTrick(callback) {
    const leadSuit = this.getSuit(this.currentTrick[0].card);
    const winnerId = this.determineTrickWinner(this.currentTrick, leadSuit);
    
    // Award trick
    this.tricksWon[winnerId] = (this.tricksWon[winnerId] || 0) + 1;
    
    // Winner leads next trick
    this.currentPlayerIndex = this.players.findIndex(p => p.id === winnerId);
    
    const trickResult = {
      trick: [...this.currentTrick],
      winner: winnerId,
      tricksWon: { ...this.tricksWon }
    };
    
    this.currentTrick = [];
    
    // Check if round is complete (all 13 tricks played)
    const totalTricks = Object.values(this.tricksWon).reduce((sum, t) => sum + t, 0);
    
    if (totalTricks === 13) {
      return this.completeRound(trickResult, callback);
    }
    
    callback(null, {
      ...trickResult,
      currentPlayer: this.players[this.currentPlayerIndex].id,
      phase: 'playing'
    });
  }

  completeRound(trickResult, callback) {
    // Calculate scores for this round
    const roundScores = this.calculateRoundScore();
    
    // Update team totals
    this.teamScores[0] += roundScores[0];
    this.teamScores[1] += roundScores[1];
    
    // Check for winner
    const winCheck = this.checkWinCondition(this.players);
    
    if (winCheck.winner) {
      this.phase = 'finished';
      return callback(null, {
        ...trickResult,
        phase: 'finished',
        roundScores,
        teamScores: this.teamScores,
        teamBags: this.teamBags,
        winner: winCheck
      });
    }
    
    // Start new round
    this.roundNumber++;
    this.phase = 'betting';
    this.bets = {};
    this.tricksWon = {};
    this.blindNils = {};
    this.spadesBroken = false;
    this.dealCards(13);
    
    callback(null, {
      ...trickResult,
      phase: 'betting',
      roundNumber: this.roundNumber,
      roundScores,
      teamScores: this.teamScores,
      teamBags: this.teamBags,
      hands: this.hands
    });
  }

  getPlayerState(playerId, callback) {
    callback(null, { 
      hand: this.hands[playerId] || [],
      bet: this.bets[playerId],
      tricksWon: this.tricksWon[playerId] || 0
    });
  }

  getPublicState(callback) {
    callback(null, { 
      phase: this.phase,
      bets: this.bets,
      blindNils: this.blindNils,
      currentTrick: this.currentTrick,
      tricksWon: this.tricksWon,
      currentPlayer: this.players[this.currentPlayerIndex]?.id,
      teamScores: this.teamScores,
      teamBags: this.teamBags,
      roundNumber: this.roundNumber,
      spadesBroken: this.spadesBroken
    });
  }

  initializeSocketHandlers(io, socket) {
    socket.on('spades:place-bet', (data) => {
      this.handleAction('place-bet', socket.playerId, data, (err, result) => {
        if (err) {
          socket.emit('error', { message: err.message });
        } else {
          io.to(this.gameCode).emit('spades:bet-placed', result);
        }
      });
    });

    socket.on('spades:play-card', (data) => {
      this.handleAction('play-card', socket.playerId, data, (err, result) => {
        if (err) {
          socket.emit('error', { message: err.message });
        } else {
          io.to(this.gameCode).emit('spades:card-played', result);
        }
      });
    });
  }
}

module.exports = GameSpades;

