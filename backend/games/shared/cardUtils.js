/**
 * Shared card utilities for all card games
 */

/**
 * Generate and shuffle a standard 52-card deck
 * @returns {Array} Shuffled deck
 */
function generateShuffledDeck() {
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
 * Get suit from card string
 * @param {String} card - Card like '5_of_hearts'
 * @returns {String} Suit name
 */
function getSuit(card) {
  return card.split('_of_')[1];
}

/**
 * Get value from card string
 * @param {String} card - Card like '5_of_hearts'
 * @returns {String} Value like '5' or 'king'
 */
function getValue(card) {
  return card.split('_of_')[0];
}

/**
 * Get numeric rank of a card value
 * @param {String} value - Card value
 * @returns {Number} Rank (2=0, ace=12)
 */
function getCardRank(value) {
  const ranks = {
    '2': 0, '3': 1, '4': 2, '5': 3, '6': 4, '7': 5, '8': 6,
    '9': 7, '10': 8, 'jack': 9, 'queen': 10, 'king': 11, 'ace': 12
  };
  return ranks[value];
}

/**
 * Deal cards from deck to players
 * @param {Array} deck - Full deck
 * @param {Array} playerIds - Array of player IDs
 * @param {Number} cardsPerPlayer - Cards to deal each
 * @returns {Object} Map of playerId to hand array
 */
function dealCards(deck, playerIds, cardsPerPlayer) {
  const hands = {};
  
  playerIds.forEach((playerId, idx) => {
    const start = idx * cardsPerPlayer;
    const end = start + cardsPerPlayer;
    hands[playerId] = deck.slice(start, end);
  });
  
  return hands;
}

/**
 * Check if a card can be played given the lead suit and player's hand
 * @param {String} card - Card to play
 * @param {String} leadSuit - Lead suit of current trick
 * @param {Array} hand - Player's current hand
 * @returns {Boolean} True if valid play
 */
function isValidPlay(card, leadSuit, hand) {
  const cardSuit = getSuit(card);
  
  // First card of trick, any card is valid
  if (!leadSuit) return true;
  
  // If playing same suit as lead, valid
  if (cardSuit === leadSuit) return true;
  
  // If playing different suit, check if player has any cards of lead suit
  const hasLeadSuit = hand.some(c => getSuit(c) === leadSuit);
  
  // If no cards of lead suit, any card is valid
  return !hasLeadSuit;
}

module.exports = {
  generateShuffledDeck,
  getSuit,
  getValue,
  getCardRank,
  dealCards,
  isValidPlay
};
