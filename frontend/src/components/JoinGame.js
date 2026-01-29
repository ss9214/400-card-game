import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';
import './JoinGame.css';

function JoinGame() {
  const { state } = useLocation();
  const nameFromHome = state?.name || '';
  const [name, setName] = useState(nameFromHome);
  const [code, setCode] = useState('');
  const navigate = useNavigate();

  const handleJoin = async () => {
    try {
      const existingPlayerId = sessionStorage.getItem('playerId');

      const res = await api.post('/games/join', {
        name,
        code,
        playerId: existingPlayerId
      });

      const { game, player } = res.data;

      sessionStorage.setItem('gameCode', game.code);
      localStorage.setItem('gameCode', game.code);
      sessionStorage.setItem('playerName', player.name);
      sessionStorage.setItem('playerId', player.id);
      sessionStorage.removeItem('isOwner');

      navigate('/game/lobby');
    } catch (err) {
      console.error(err);
      alert('Failed to join game. Please check the code and try again.');
    }
  };

  return (
    <div className="join-container">
      <div className="join-card">
        <h1>👥 Join Game</h1>
        <p className="subtitle">Enter the room code to join your friends</p>
        
        <div className="input-group">
          <label htmlFor="name-input">Your Name</label>
          <input
            id="name-input"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter your name"
          />
        </div>

        <div className="input-group">
          <label htmlFor="code-input">Room Code</label>
          <input
            id="code-input"
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="Enter 5-character code"
            maxLength={5}
            onKeyPress={e => e.key === 'Enter' && name && code && handleJoin()}
            className="code-input"
          />
        </div>

        <button 
          className="join-button" 
          disabled={!name || !code} 
          onClick={handleJoin}
        >
          Join Game
        </button>

        <button 
          className="back-button" 
          onClick={() => navigate('/')}
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}

export default JoinGame;
