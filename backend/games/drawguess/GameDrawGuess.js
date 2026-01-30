const DrawingGame = require('../core/DrawingGame');

/**
 * Draw & Guess Game Implementation (Skribbl-style)
 * - 4-10 players
 * - Take turns drawing while others guess
 * - Points for speed and accuracy
 */
class GameDrawGuess extends DrawingGame {
  constructor(gameCode, gameId) {
    super(gameCode, gameId);
    this.scores = {};
    this.roundNumber = 0;
    this.wordList = [
      'cat', 'dog', 'house', 'car', 'tree', 'sun', 'moon', 'star',
      'flower', 'bird', 'fish', 'apple', 'banana', 'pizza', 'book',
      'computer', 'phone', 'guitar', 'piano', 'umbrella', 'clock'
    ];
  }

  static getConfig() {
    return {
      id: 'drawguess',
      name: 'Draw & Guess',
      description: 'Draw pictures and guess what others are drawing',
      minPlayers: 3,
      maxPlayers: 10,
      category: 'drawing',
      icon: '🎨',
      roundDuration: 80 // seconds
    };
  }

  initialize(players, callback) {
    this.players = players;
    this.roundNumber = 0;
    
    // Initialize scores
    players.forEach(p => {
      this.scores[p.id] = 0;
    });
    
    // Start first round
    this.startNewRound();
    
    callback(null, {
      currentDrawer: this.currentDrawer,
      roundNumber: this.roundNumber,
      scores: this.scores
    });
  }

  startNewRound() {
    const drawerIdx = this.roundNumber % this.players.length;
    const drawer = this.players[drawerIdx];
    const word = this.selectWord(this.wordList);
    
    this.startRound(drawer.id, word);
    this.roundNumber++;
  }

  endRound() {
    const points = this.calculateRoundPoints();
    
    // Update scores
    this.scores[points.drawerId] = (this.scores[points.drawerId] || 0) + points.drawerPoints;
    points.guessers.forEach(g => {
      this.scores[g.id] = (this.scores[g.id] || 0) + g.points;
    });
    
    return points;
  }

  checkWinCondition(callback) {
    // Game ends after each player has drawn once
    if (this.roundNumber >= this.players.length) {
      const winner = Object.entries(this.scores).reduce((max, [id, score]) => 
        score > max.score ? { id, score } : max
      , { score: -1 });
      
      callback(null, { winner: winner.id, scores: this.scores });
    } else {
      callback(null, null);
    }
  }

  handleAction(action, playerId, data, callback) {
    switch (action) {
      case 'draw':
        this.addStroke(data.stroke);
        callback(null, { success: true });
        break;
      
      case 'guess':
        const isCorrect = this.processGuess(playerId, data.guess);
        callback(null, { correct: isCorrect });
        break;
      
      case 'clear':
        this.clearCanvas();
        callback(null, { success: true });
        break;
      
      default:
        callback(new Error('Unknown action'));
    }
  }

  getPlayerState(playerId, callback) {
    const isDrawer = playerId === this.currentDrawer;
    
    callback(null, {
      isDrawer,
      word: isDrawer ? this.currentWord : null,
      hint: isDrawer ? null : this.currentWord.replace(/./g, '_'),
      hasGuessed: this.correctGuessers.includes(playerId),
      scores: this.scores
    });
  }

  getPublicState(callback) {
    callback(null, {
      currentDrawer: this.currentDrawer,
      roundNumber: this.roundNumber,
      strokes: this.strokes,
      scores: this.scores,
      correctGuessCount: this.correctGuessers.length
    });
  }

  initializeSocketHandlers(io, socket) {
    // TODO: Implement socket handlers for drawing/guessing
  }
}

module.exports = GameDrawGuess;
