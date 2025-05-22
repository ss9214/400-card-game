// src/components/Bet.js
import React, { useState } from 'react';
import './Bet.css';

export default function Bet({ player, minBet, onSubmit }) {
  const [value, setValue] = useState(minBet);
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>It is {player.name}’s turn to bet!</h2>
        <input
          type="number"
          min={minBet}
          value={value}
          onChange={e => setValue(+e.target.value)}
        />
        <button
          disabled={value < minBet}
          onClick={() => onSubmit(value)}
        >
          Submit Bet
        </button>
      </div>
    </div>
  );
}
