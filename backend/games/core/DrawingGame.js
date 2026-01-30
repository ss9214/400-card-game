const GameBase = require('./GameBase');

/**
 * Base class for drawing/guessing games (Skribbl, Pictionary, etc.)
 */
class DrawingGame extends GameBase {
  constructor(gameCode, gameId) {
    super(gameCode, gameId);
    this.currentDrawer = null;
    this.currentWord = null;
    this.guesses = [];
    this.correctGuessers = [];
    this.roundStartTime = null;
    this.strokes = []; // Canvas drawing data
  }

  /**
   * Select a random word from word list
   * @param {Array} wordList - Available words
   * @returns {String} Selected word
   */
  selectWord(wordList) {
    return wordList[Math.floor(Math.random() * wordList.length)];
  }

  /**
   * Record a drawing stroke
   * @param {Object} stroke - {type: 'line'|'clear', points: [...], color, width}
   */
  addStroke(stroke) {
    this.strokes.push({
      ...stroke,
      timestamp: Date.now()
    });
  }

  /**
   * Clear the canvas
   */
  clearCanvas() {
    this.strokes = [];
  }

  /**
   * Process a guess
   * @param {String} playerId - Player making guess
   * @param {String} guess - Guessed word
   * @returns {Boolean} True if correct
   */
  processGuess(playerId, guess) {
    if (this.correctGuessers.includes(playerId)) {
      return false; // Already guessed correctly
    }
    
    const isCorrect = guess.toLowerCase().trim() === this.currentWord.toLowerCase();
    
    this.guesses.push({
      playerId,
      guess,
      correct: isCorrect,
      timestamp: Date.now()
    });
    
    if (isCorrect) {
      this.correctGuessers.push(playerId);
    }
    
    return isCorrect;
  }

  /**
   * Calculate points for drawer and guessers
   * @returns {Object} {drawerId: points, guessers: [{id, points}]}
   */
  calculateRoundPoints() {
    const roundDuration = Date.now() - this.roundStartTime;
    const maxTime = 80000; // 80 seconds
    
    // Drawer gets points based on how many guessed correctly
    const drawerPoints = this.correctGuessers.length * 50;
    
    // Guessers get points based on speed (faster = more points)
    const guesserPoints = this.correctGuessers.map((guesserId, idx) => {
      const guess = this.guesses.find(g => g.playerId === guesserId && g.correct);
      const timeElapsed = guess.timestamp - this.roundStartTime;
      const speedBonus = Math.max(0, maxTime - timeElapsed) / maxTime;
      const points = Math.floor(100 * speedBonus) + (this.correctGuessers.length - idx) * 10;
      
      return { id: guesserId, points };
    });
    
    return {
      drawerId: this.currentDrawer,
      drawerPoints,
      guessers: guesserPoints
    };
  }

  /**
   * Start a new round
   * @param {String} drawerId - Player who will draw
   * @param {String} word - Word to draw
   */
  startRound(drawerId, word) {
    this.currentDrawer = drawerId;
    this.currentWord = word;
    this.guesses = [];
    this.correctGuessers = [];
    this.strokes = [];
    this.roundStartTime = Date.now();
  }
}

module.exports = DrawingGame;
