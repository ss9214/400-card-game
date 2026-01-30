const CardGame = require('../core/CardGame');

/**
 * 400 Card Game Implementation
 * - 4 players in teams (0+2 vs 1+3)
 * - Hearts are trump
 * - Betting phase, then 13 tricks
 * - Win at 41 points with both teammates >= 0
 */
class Game400 extends CardGame {
  constructor(gameCode, gameId) {
    super(gameCode, gameId);
    this.trumpSuit = 'hearts';
    this.trickStarterIdx = 0;
    this.currentBetIdx = 0;
    this.roundsCompleted = 0;
  }

  static getConfig() {
    return {
      id: '400',
      name: '400 Card Game',
      description: 'Classic 400 card game for 4 players',
      minPlayers: 4,
      maxPlayers: 4,
      category: 'card',
      icon: '🃏',
      teams: [[0, 2], [1, 3]],
      trumpSuit: 'hearts'
    };
  }

  /**
   * Determine trick winner based on 400 rules (hearts trump)
   */
  determineTrickWinner(trick, leadSuit) {
    // Hearts trump all
    const hearts = trick.filter(t => this.getSuit(t.card) === 'hearts');
    
    let candidates;
    if (hearts.length > 0) {
      candidates = hearts;
    } else {
      // No trump, follow lead suit
      candidates = trick.filter(t => this.getSuit(t.card) === leadSuit);
    }
    
    // Find highest rank among candidates
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

  /**
   * Calculate score delta for a player based on bet vs tricks won
   */
  calculateScore(playerId, bet, tricksWon, playerScore) {
    let delta;
    
    // Determine doubling/tripling thresholds based on current score
    let doubleThreshold = 6;
    let tripleThreshold = 8;
    let quadrupleThreshold = 10;  
    if (playerScore >= 30) {
        doubleThreshold += (Math.floor(playerScore/10) - 2)
        tripleThreshold += (Math.floor(playerScore/10) - 2)
        quadrupleThreshold += (Math.floor(playerScore/10) - 2)
    }
    
    // Calculate multiplier based on bet size and thresholds
    if (bet >= quadrupleThreshold) {
      delta = bet * 4;
    } else if (bet >= tripleThreshold) {
      delta = bet * 3;
    } else if (bet >= doubleThreshold) {
      delta = bet * 2;
    } else {
      delta = bet;
    }
    
    // If failed bet, make negative and add penalty
    if (tricksWon < bet) {
      delta = delta * -1;
    }
    
    return delta;
  }

  /**
   * Calculate minimum bet based on current score
   */
  getMinimumBet(score) {
    return 2 + Math.floor(score / 10);
  }

  /**
   * Calculate minimum total bets for all players
   */
  getMinimumTotalBets(maxScore) {
    return 11 + Math.floor(maxScore / 10);
  }

  /**
   * Check if win condition is met (41+ points, both teammates >= 0)
   */
  checkWinCondition(players) {
    const team1 = [players[0], players[2]];
    const team2 = [players[1], players[3]];
    
    const team1Total = team1[0].game_score + team1[1].game_score;
    const team2Total = team2[0].game_score + team2[1].game_score;
    
    // Check team 1
    if (team1Total >= 41 && team1[0].game_score >= 0 && team1[1].game_score >= 0) {
      return {
        winner: true,
        team: 1,
        players: team1,
        score: team1Total
      };
    }
    
    // Check team 2
    if (team2Total >= 41 && team2[0].game_score >= 0 && team2[1].game_score >= 0) {
      return {
        winner: true,
        team: 2,
        players: team2,
        score: team2Total
      };
    }
    
    return { winner: false };
  }

  /**
   * Sort cards for display (clubs, diamonds, spades, hearts)
   */
  sortCards(cards) {
    const suitOrder = { 'clubs': 0, 'diamonds': 1, 'spades': 2, 'hearts': 3 };
    
    return cards.sort((a, b) => {
      const suitA = this.getSuit(a);
      const suitB = this.getSuit(b);
      
      if (suitA !== suitB) {
        return suitOrder[suitA] - suitOrder[suitB];
      }
      
      return this.getCardRank(this.getValue(a)) - this.getCardRank(this.getValue(b));
    });
  }

  /**
   * Initialize a new game
   */
  initialize(players, callback) {
    this.players = players.sort((a, b) => a.id - b.id);
    this.dealCards(13);
    
    // Sort each player's hand
    this.players.forEach(player => {
      this.hands[player.id] = this.sortCards(this.hands[player.id]);
    });
    
    this.phase = 'betting';
    this.currentBetIdx = 0;
    this.trickStarterIdx = 0;
    
    callback(null, {
      phase: this.phase,
      hands: this.hands,
      currentBetIdx: this.currentBetIdx
    });
  }
}

module.exports = Game400;
