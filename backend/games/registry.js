/**
 * Game Registry - Central registry for all available games
 */

const Game400 = require('./400/Game400');
// const GameSpades = require('./spades/GameSpades');
// const GameMafia = require('./mafia/GameMafia');
// const GameDrawGuess = require('./drawguess/GameDrawGuess');
const GameImposter = require('./imposter/GameImposter');

class GameRegistry {
  constructor() {
    this.games = new Map();
    this.registerDefaultGames();
  }

  /**
   * Register default games
   */
  registerDefaultGames() {
    this.register(Game400);
    // this.register(GameSpades);
    // this.register(GameMafia);
    // this.register(GameDrawGuess);
    this.register(GameImposter);
  }

  /**
   * Register a game class
   * @param {Class} GameClass - Game class extending GameBase
   */
  register(GameClass) {
    const config = GameClass.getConfig();
    this.games.set(config.id, {
      class: GameClass,
      config: config
    });
  }

  /**
   * Get a game class by ID
   * @param {String} gameId - Game identifier
   * @returns {Class} Game class
   */
  getGameClass(gameId) {
    const game = this.games.get(gameId);
    return game ? game.class : null;
  }

  /**
   * Get game configuration
   * @param {String} gameId - Game identifier
   * @returns {Object} Game config
   */
  getGameConfig(gameId) {
    const game = this.games.get(gameId);
    return game ? game.config : null;
  }

  /**
   * Get all available games
   * @returns {Array} Array of game configs
   */
  getAllGames() {
    return Array.from(this.games.values()).map(g => g.config);
  }

  /**
   * Create a game instance
   * @param {String} gameId - Game identifier
   * @param {String} gameCode - Game room code
   * @param {String} dbGameId - Database game ID
   * @returns {Object} Game instance
   */
  createInstance(gameId, gameCode, dbGameId) {
    const GameClass = this.getGameClass(gameId);
    if (!GameClass) {
      throw new Error(`Game type "${gameId}" not found in registry`);
    }
    return new GameClass(gameCode, dbGameId);
  }
}

// Export singleton instance
module.exports = new GameRegistry();
