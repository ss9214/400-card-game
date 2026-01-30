/**
 * Shared trick-taking logic
 */

const { getSuit, getValue, getCardRank } = require('./cardUtils');

/**
 * Determine trick winner for standard trump-based trick-taking
 * @param {Array} trick - Array of {playerId, card}
 * @param {String} leadSuit - Suit of first card played
 * @param {String} trumpSuit - Trump suit for this game
 * @returns {String} Winner's playerId
 */
function determineTrickWinner(trick, leadSuit, trumpSuit) {
  // Trump cards beat all others
  const trumpCards = trick.filter(t => getSuit(t.card) === trumpSuit);
  
  let candidates;
  if (trumpCards.length > 0) {
    // Trump was played, only trump cards can win
    candidates = trumpCards;
  } else {
    // No trump, follow lead suit
    candidates = trick.filter(t => getSuit(t.card) === leadSuit);
  }
  
  // Find highest rank among candidates
  let winner = candidates[0];
  let maxRank = getCardRank(getValue(winner.card));
  
  for (let i = 1; i < candidates.length; i++) {
    const rank = getCardRank(getValue(candidates[i].card));
    if (rank > maxRank) {
      maxRank = rank;
      winner = candidates[i];
    }
  }
  
  return winner.playerId;
}

/**
 * Sort cards by suit and rank
 * @param {Array} cards - Array of card strings
 * @param {Array} suitOrder - Suit priority (e.g., ['clubs', 'diamonds', 'spades', 'hearts'])
 * @returns {Array} Sorted cards
 */
function sortCards(cards, suitOrder = ['clubs', 'diamonds', 'spades', 'hearts']) {
  const suitPriority = {};
  suitOrder.forEach((suit, idx) => {
    suitPriority[suit] = idx;
  });
  
  return cards.sort((a, b) => {
    const suitA = getSuit(a);
    const suitB = getSuit(b);
    
    if (suitA !== suitB) {
      return suitPriority[suitA] - suitPriority[suitB];
    }
    
    return getCardRank(getValue(a)) - getCardRank(getValue(b));
  });
}

module.exports = {
  determineTrickWinner,
  sortCards
};
