const CardGame = require('../core/CardGame');

/**
 * Spades Card Game Implementation
 * - 4 players in teams (0+2 vs 1+3)
 * - Spades are trump
 * - Nil bids, bags system
 */
class GameSpades extends CardGame {
  constructor(gameCode, gameId) {
    super(gameCode, gameId);
    this.trumpSuit = 'spades';
    this.bags = {}; // Track overtricks
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

  calculateScore(playerId, bet, tricksWon) {
    // Nil bid (0) scores
    if (bet === 0) {
      return tricksWon === 0 ? 100 : -100;
    }
    
    // Made bid
    if (tricksWon >= bet) {
      const bags = tricksWon - bet;
      this.bags[playerId] = (this.bags[playerId] || 0) + bags;
      
      let score = bet * 10 + bags;
      
      // Bag penalty (10 bags = -100)
      if (this.bags[playerId] >= 10) {
        score -= 100;
        this.bags[playerId] -= 10;
      }
      
      return score;
    }
    
    // Failed bid
    return -bet * 10;
  }

  initialize(players, callback) {
    this.players = players;
    this.dealCards(13);
    this.phase = 'betting';
    
    // Initialize bags
    players.forEach(p => {
      this.bags[p.id] = 0;
    });
    
    callback(null, {
      phase: this.phase,
      hands: this.hands
    });
  }

  checkWinCondition(players) {
    // TODO: Implement Spades win condition (500 points)
    return { winner: false };
  }

  handleAction(action, playerId, data, callback) {
    // TODO: Implement action handlers
    callback(new Error('Not yet implemented'));
  }

  getPlayerState(playerId, callback) {
    callback(null, { hand: this.hands[playerId] || [] });
  }

  getPublicState(callback) {
    callback(null, { phase: this.phase, bets: this.bets });
  }

  initializeSocketHandlers(io, socket) {
    // TODO: Implement socket handlers for Spades
  }
}

module.exports = GameSpades;
