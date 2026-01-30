/**
 * Base class for all games
 * Defines the common interface that all game types must implement
 */
class GameBase {
  constructor(gameCode, gameId) {
    this.gameCode = gameCode;
    this.gameId = gameId;
    this.players = [];
  }

  /**
   * Get game metadata
   * @returns {Object} Game configuration
   */
  static getConfig() {
    throw new Error('getConfig() must be implemented by subclass');
  }

  /**
   * Initialize game state
   * @param {Array} players - Array of player objects
   * @param {Function} callback - (err, initialState) => void
   */
  initialize(players, callback) {
    throw new Error('initialize() must be implemented by subclass');
  }

  /**
   * Handle a player action
   * @param {String} action - Action type (e.g., 'play-card', 'vote', 'draw')
   * @param {String} playerId - Player performing action
   * @param {Object} data - Action-specific data
   * @param {Function} callback - (err, result) => void
   */
  handleAction(action, playerId, data, callback) {
    throw new Error('handleAction() must be implemented by subclass');
  }

  /**
   * Check if win condition is met
   * @param {Function} callback - (err, winner) => void where winner is null or {team, players}
   */
  checkWinCondition(callback) {
    throw new Error('checkWinCondition() must be implemented by subclass');
  }

  /**
   * Get state visible to a specific player
   * @param {String} playerId - Player requesting state
   * @param {Function} callback - (err, state) => void
   */
  getPlayerState(playerId, callback) {
    throw new Error('getPlayerState() must be implemented by subclass');
  }

  /**
   * Get public state visible to all players
   * @param {Function} callback - (err, state) => void
   */
  getPublicState(callback) {
    throw new Error('getPublicState() must be implemented by subclass');
  }

  /**
   * Register socket event handlers for this game
   * @param {Object} io - Socket.io server instance
   * @param {Object} socket - Individual socket connection
   */
  initializeSocketHandlers(io, socket) {
    throw new Error('initializeSocketHandlers() must be implemented by subclass');
  }
}

module.exports = GameBase;
