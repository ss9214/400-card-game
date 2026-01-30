const SocialDeductionGame = require('../core/SocialDeductionGame');

/**
 * Mafia Game Implementation
 * - 5-12 players
 * - Mafia vs Citizens
 * - Night/Day phases with voting
 */
class GameMafia extends SocialDeductionGame {
  constructor(gameCode, gameId) {
    super(gameCode, gameId);
  }

  static getConfig() {
    return {
      id: 'mafia',
      name: 'Mafia',
      description: 'Social deduction game - Find the mafia before they eliminate everyone',
      minPlayers: 5,
      maxPlayers: 12,
      category: 'social-deduction',
      icon: '🕵️',
      roles: ['mafia', 'citizen', 'doctor', 'detective']
    };
  }

  initialize(players, callback) {
    this.players = players;
    
    // Calculate role distribution
    const playerCount = players.length;
    const mafiaCount = Math.floor(playerCount / 3);
    const roleDistribution = [
      ...Array(mafiaCount).fill('mafia'),
      'doctor',
      'detective',
      ...Array(playerCount - mafiaCount - 2).fill('citizen')
    ];
    
    this.assignRoles(roleDistribution);
    this.phase = 'night';
    
    callback(null, {
      phase: this.phase,
      playerCount: playerCount
    });
  }

  checkWinCondition(callback) {
    const alive = this.players.filter(p => !this.eliminated.includes(p.id));
    const aliveMafia = alive.filter(p => this.roles[p.id] === 'mafia').length;
    const aliveCitizens = alive.length - aliveMafia;
    
    if (aliveMafia === 0) {
      callback(null, { winner: 'citizens', eliminated: this.eliminated });
    } else if (aliveMafia >= aliveCitizens) {
      callback(null, { winner: 'mafia', eliminated: this.eliminated });
    } else {
      callback(null, null);
    }
  }

  handleAction(action, playerId, data, callback) {
    // TODO: Implement actions (vote, kill, investigate, heal)
    callback(new Error('Not yet implemented'));
  }

  getPlayerState(playerId, callback) {
    const role = this.roles[playerId];
    const alive = !this.eliminated.includes(playerId);
    
    callback(null, {
      role,
      alive,
      phase: this.phase,
      eliminated: this.eliminated
    });
  }

  getPublicState(callback) {
    callback(null, {
      phase: this.phase,
      playerCount: this.players.length,
      aliveCount: this.players.length - this.eliminated.length,
      eliminated: this.eliminated
    });
  }

  initializeSocketHandlers(io, socket) {
    // TODO: Implement socket handlers for Mafia
  }
}

module.exports = GameMafia;
