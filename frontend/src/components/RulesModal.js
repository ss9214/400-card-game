import React from 'react';
import './RulesModal.css';

const gameRules = {
  '400': {
    title: '400 Card Game Rules',
    sections: [
      {
        heading: 'Overview',
        content: '400 is a trick-taking card game for 4 players in teams of 2. The goal is to be the first team to reach 400 points.'
      },
      {
        heading: 'Trump Suit',
        content: 'Hearts are always trump in this version. Trump cards beat all other suits.'
      },
      {
        heading: 'Gameplay',
        content: `• Each player is dealt 10 cards
• Players place bets on how many tricks they think they'll win
• Minimum bet increases by 1 each round, starting at 2
• Play proceeds clockwise, with each player playing one card
• Must follow suit if possible, otherwise can play any card
• Highest trump wins the trick, or highest card of the led suit if no trump`
      },
      {
        heading: 'Scoring',
        content: `• Base points: Points equal to your bet
• Bet 6+ tricks: Points are DOUBLED (×2)
• Bet 8+ tricks: Points are TRIPLED (×3)
• Bet 10+ tricks: Points are QUADRUPLED (×4)
• Fail your bet: Lose the multiplied value
• First team to 41 points wins (both players must be ≥0)
• Dynamic thresholds: At 30+ points, multiplier thresholds increase by 1 per 10 points
  (e.g., 30-39: need 7/9/11 for 2×/3×/4×; 40+: need 8/10/12)`
      },
      {
        heading: 'Card Rankings',
        content: 'From highest to lowest: Ace, King, Queen, Jack, 10, 9, 8, 7, 6, 5, 4, 3, 2'
      }
    ]
  },
  'spades': {
    title: 'Spades Card Game Rules',
    sections: [
      {
        heading: 'Overview',
        content: 'Spades is a trick-taking card game for 4 players in teams of 2. Spades are always trump and the goal is to accurately predict and win the number of tricks you bid.'
      },
      {
        heading: 'Trump Suit',
        content: 'Spades are always trump and beat all other suits. Spades cannot be led until they have been "broken" (played when unable to follow suit) or a player only has spades.'
      },
      {
        heading: 'Gameplay',
        content: `• Each player is dealt 13 cards
• Players bid how many tricks they expect to win (0-13)
• Bidding "nil" (0) is a special bid worth bonus points
• Play proceeds clockwise, must follow suit if possible
• Highest spade wins the trick, or highest card of led suit if no spades played
• First lead can be any card except a spade (unless player only has spades)`
      },
      {
        heading: 'Scoring',
        content: `• Make your bid: +10 points per trick bid
• Overtricks (bags): +1 point each, but 10 bags = -100 points
• Make nil bid: +100 points (partner must still make their bid)
• Make blind nil bid: +200 points (bid nil before seeing cards!)
• Fail nil bid: -100 points
• Fail blind nil bid: -200 points
• Fail regular bid: -10 points per trick bid
• First team to 500 points wins`
      },
      {
        heading: 'Card Rankings',
        content: 'From highest to lowest: Ace, King, Queen, Jack, 10, 9, 8, 7, 6, 5, 4, 3, 2'
      },
      {
        heading: 'Strategy Tips',
        content: `• Count your high cards and length in suits when bidding
• Avoid accumulating 10 bags (sandbags) as it costs 100 points
• Nil bids are risky but can swing the game
• Spades are powerful - use them wisely`
      }
    ]
  }
};

function RulesModal({ isOpen, onClose, gameType = '400' }) {
  if (!isOpen) return null;

  const rules = gameRules[gameType] || gameRules['400'];

  return (
    <div className="rules-modal-overlay" onClick={onClose}>
      <div className="rules-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        
        <h1>{rules.title}</h1>
        
        {rules.sections.map((section, index) => (
          <div key={index} className="rules-section">
            <h2>{section.heading}</h2>
            <p style={{ whiteSpace: 'pre-line' }}>{section.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RulesModal;
