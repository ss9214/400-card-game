import React from 'react';
import './RulesModal.css';

const homeContent = {
  title: 'Welcome to Multi-Game Platform',
  sections: [
    {
      heading: 'What is this?',
      content: 'A multiplayer gaming platform where you can play various card and social deduction games with friends online in real-time.'
    },
    {
      heading: 'How to Get Started',
      content: `1. Create a Room: Click "Create Room" to generate a unique room code\n2. Share the Code: Give the room code to your friends\n3. Join Room: Friends click "Join Room" and enter the code\n4. Select a Game: Once everyone is in, the host selects which game to play\n5. Start Playing: Follow the game-specific rules and have fun!`
    },
    {
      heading: 'Available Games',
      content: `🃏 400 Card Game (4 players)\n   Classic trick-taking game with betting and trump suits\n\n🕵️ Imposter (3-10 players)\n   Social deduction game where one player has a different word\n\nMore games coming soon!`
    },
    {
      heading: 'Create vs Join Room',
      content: `Create Room:\n• Generates a new game room with a unique code\n• You become the room host\n• You control game selection and starting\n\nJoin Room:\n• Enter an existing room code\n• Join other players already in the room\n• Wait for host to select and start the game`
    }
  ]
};

const roomLobbyContent = {
  title: 'Available Games',
  sections: [
    {
      heading: '🃏 400 Card Game',
      content: 'Players: 4\n\nA classic trick-taking card game where teams compete to reach 41 points. Players bet on tricks, and successful bets earn multiplied points. Hearts are always trump!'
    },
    {
      heading: '🕵️ Imposter',
      content: 'Players: 3-10\n\nA social deduction game where one player (the imposter) receives a different word. Players discuss and try to identify the imposter, who attempts to blend in without revealing they have a different word.'
    },
    {
      heading: 'How to Play',
      content: `1. The host selects a game from the list\n2. The game card will highlight when player count is correct\n3. Click "Start Game" to begin\n4. Follow the specific game instructions\n\nTip: Click the rules button again after selecting a game to see detailed rules!`
    }
  ]
};

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
  },
  'imposter': {
    title: 'Imposter Game Rules',
    sections: [
      {
        heading: 'Overview',
        content: 'Imposter is a social deduction game where one player (the imposter) receives a different word than everyone else. The imposter doesn\'t know they\'re the imposter!'
      },
      {
        heading: 'Setup',
        content: `• Choose difficulty: Easy (same category), Medium (similar categories), or Hard (different categories)
• Choose play mode: Single Device (pass around) or Multiple Devices
• In single device mode, order players by seating position
• Each player gets a secret word`
      },
      {
        heading: 'How to Play',
        content: `• All players except the imposter get the SAME word
• The imposter gets a DIFFERENT word
• Players take turns describing their word WITHOUT saying it
• Players try to figure out who the imposter is
• The imposter tries to blend in without revealing they have a different word`
      },
      {
        heading: 'Difficulty Levels',
        content: `• Easy: Both words from the same category (e.g., Basketball and Soccer)
• Medium: Words from similar categories (e.g., Books and School)
• Hard: Words from completely different categories (e.g., Animals and Movies)`
      },
      {
        heading: 'Play Modes',
        content: `Single Device Mode:
• Pass one phone around
• Each player clicks to reveal their word
• Click again to hide before passing to next player

Multiple Devices Mode:
• Each player sees their word on their own device
• Play continues naturally with everyone having their word`
      },
      {
        heading: 'Winning',
        content: `• After discussion, players vote on who they think is the imposter
• If the imposter is correctly identified, the normal players win
• If the imposter avoids detection, the imposter wins
• The host reveals the answer at the end of the round`
      }
    ]
  }
};

function RulesModal({ isOpen, onClose, gameType, context = 'game' }) {
  // Determine which content to show based on context
  let content;
  if (context === 'home') {
    content = homeContent;
  } else if (context === 'room-lobby') {
    content = roomLobbyContent;
  } else {
    content = gameRules[gameType] || gameRules['400'];
  }

  if (!isOpen) return null;

  return (
    <div className="rules-modal-overlay" onClick={onClose}>
      <div className="rules-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        
        <h1>{content.title}</h1>
        
        {content.sections.map((section, index) => (
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
