const GameBase = require('./GameBase');

/**
 * Base class for trick-taking card games (400, Spades, etc.)
 */
class CardGame extends GameBase {
  constructor(gameCode, gameId) {
    super(gameCode, gameId);
    this.deck = [];
    this.hands = {};
    this.currentTrick = [];
    this.tricksWon = {};
    this.bets = {};
    this.phase = 'betting'; // 'betting' or 'playing'
  }

  /**
   * Generate and shuffle a standard 52-card deck
   * @returns {Array} Shuffled deck
   */
  generateDeck() {
    const suits = ['spades', 'hearts', 'diamonds', 'clubs'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace'];
    const deck = [];
    
    for (const suit of suits) {
      for (const value of values) {
        deck.push(`${value}_of_${suit}`);
      }
    }
    
    // Fisher-Yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    
    return deck;
  }

  /**
   * Deal cards to players
   * @param {Number} cardsPerPlayer - Number of cards each player receives
   */
  dealCards(cardsPerPlayer) {
    this.deck = this.generateDeck();
    this.hands = {};
    
    this.players.forEach((player, idx) => {
      const start = idx * cardsPerPlayer;
      const end = start + cardsPerPlayer;
      this.hands[player.id] = this.deck.slice(start, end);
    });
  }

  /**
   * Get suit from card string
   * @param {String} card - Card like '5_of_hearts'
   * @returns {String} Suit name
   */
  getSuit(card) {
    return card.split('_of_')[1];
  }

  /**
   * Get value from card string
   * @param {String} card - Card like '5_of_hearts'
   * @returns {String} Value like '5' or 'king'
   */
  getValue(card) {
    return card.split('_of_')[0];
  }

  /**
   * Get numeric rank of a card value
   * @param {String} value - Card value
   * @returns {Number} Rank (2=0, ace=12)
   */
  getCardRank(value) {
    const ranks = {
      '2': 0, '3': 1, '4': 2, '5': 3, '6': 4, '7': 5, '8': 6,
      '9': 7, '10': 8, 'jack': 9, 'queen': 10, 'king': 11, 'ace': 12
    };
    return ranks[value];
  }

  /**
   * Determine trick winner (to be overridden by specific games)
   * @param {Array} trick - Array of {playerId, card}
   * @param {String} trumpSuit - Trump suit for this game
   * @returns {String} Winner's playerId
   */
  determineTrickWinner(trick, trumpSuit) {
    throw new Error('determineTrickWinner() must be implemented by card game subclass');
  }

  /**
   * Calculate score for a round (to be overridden by specific games)
   * @param {String} playerId - Player to score
   * @param {Number} bet - Player's bet
   * @param {Number} tricksWon - Tricks actually won
   * @returns {Number} Score delta
   */
  calculateScore(playerId, bet, tricksWon) {
    throw new Error('calculateScore() must be implemented by card game subclass');
  }
}

module.exports = CardGame;
