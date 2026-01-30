const GameBase = require('./GameBase');

/**
 * Base class for social deduction games (Mafia, Werewolf, etc.)
 */
class SocialDeductionGame extends GameBase {
  constructor(gameCode, gameId) {
    super(gameCode, gameId);
    this.roles = {};
    this.phase = 'night'; // 'night', 'day', 'voting', 'ended'
    this.votes = {};
    this.eliminated = [];
  }

  /**
   * Assign roles to players
   * @param {Array} roleDistribution - e.g., ['mafia', 'mafia', 'citizen', 'citizen', 'doctor']
   */
  assignRoles(roleDistribution) {
    const shuffledRoles = [...roleDistribution];
    for (let i = shuffledRoles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledRoles[i], shuffledRoles[j]] = [shuffledRoles[j], shuffledRoles[i]];
    }
    
    this.players.forEach((player, idx) => {
      this.roles[player.id] = shuffledRoles[idx];
    });
  }

  /**
   * Record a vote
   * @param {String} voterId - Player casting vote
   * @param {String} targetId - Player being voted for
   */
  recordVote(voterId, targetId) {
    this.votes[voterId] = targetId;
  }

  /**
   * Tally votes and eliminate player
   * @returns {String} Eliminated player's ID
   */
  tallyVotes() {
    const voteCounts = {};
    Object.values(this.votes).forEach(targetId => {
      voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
    });
    
    let maxVotes = 0;
    let eliminated = null;
    
    Object.entries(voteCounts).forEach(([playerId, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        eliminated = playerId;
      }
    });
    
    if (eliminated) {
      this.eliminated.push(eliminated);
    }
    
    this.votes = {}; // Reset votes
    return eliminated;
  }

  /**
   * Check if game has ended (e.g., all mafia eliminated or mafia >= citizens)
   * @returns {Object|null} {winner: 'mafia'|'citizens', eliminated: [...]}
   */
  checkEndCondition() {
    throw new Error('checkEndCondition() must be implemented by social deduction subclass');
  }
}

module.exports = SocialDeductionGame;
