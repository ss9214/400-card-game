import React from 'react';
import './RulesModal.css';

function RulesModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        
        <h2>🃏 How to Play 400</h2>
        
        <div className="rules-section">
          <h3>Overview</h3>
          <ul>
            <li><strong>Players:</strong> 4 players in 2 teams (Players 0 & 2 vs Players 1 & 3)</li>
            <li><strong>Trump Suit:</strong> Hearts are always trump</li>
            <li><strong>Goal:</strong> First team to reach 41+ points wins (both players must have ≥ 0)</li>
          </ul>
        </div>

        <div className="rules-section">
          <h3>Round Flow</h3>
          <ol>
            <li><strong>Betting Phase:</strong> Each player bets how many tricks they'll win (0-13)</li>
            <li><strong>Playing Phase:</strong> Play cards following suit when possible</li>
            <li><strong>Scoring:</strong> Points awarded based on whether you met your bet</li>
          </ol>
        </div>

        <div className="rules-section">
          <h3>Scoring Rules</h3>
          <ul>
            <li><strong>Met your bet:</strong> + Tricks bet</li>
            <li><strong>Failed your bet:</strong> - Tricks bet</li>
            <li><strong>Minimum bet:</strong> &lt;30 = min bet 2, 30-39 = min bet 3, 40-49 = min bet 4, etc.</li>
          </ul>
        </div>

        <div className="rules-section">
          <h3>Playing Cards</h3>
          <ul>
            <li><strong>Follow Suit:</strong> Must play the same suit as the first card if you have it</li>
            <li><strong>Trump:</strong> Hearts beat all other suits</li>
            <li><strong>Ranking:</strong> Ace &gt; King &gt; Queen &gt; Jack &gt; 10 &gt; ... &gt; 2</li>
            <li><strong>Trick Winner:</strong> Highest trump, or highest card of leading suit</li>
          </ul>
        </div>

        <div className="rules-section">
          <h3>Winning</h3>
          <p>The game ends when one team reaches 41+ points AND both players on that team have 0 or more points.</p>
        </div>
      </div>
    </div>
  );
}

export default RulesModal;
