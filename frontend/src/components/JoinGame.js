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
      const existingPlayerName = sessionStorage.getItem('playerName');
      
      // Only send playerId if the name matches (user is rejoining as same player)
      const shouldReusePlayer = existingPlayerId && existingPlayerName === name;

      const res = await api.post('/rooms/join', {
        name,
        code,
        playerId: shouldReusePlayer ? existingPlayerId : null
      });

      const { room, player } = res.data;

      sessionStorage.setItem('roomCode', room.code);
      localStorage.setItem('roomCode', room.code);
      sessionStorage.setItem('playerName', player.name);
      sessionStorage.setItem('playerId', player.id);
      sessionStorage.removeItem('isHost');

      if (room.game_type) {
        navigate(`/room/${room.code}/${room.game_type}/lobby`);
      } else {
        navigate(`/room/${room.code}`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to join room. Please check the code and try again.');
    }
  };

  return (
    <div className="join-container">
      <div className="join-card">
        <h1>👥 Join Room</h1>
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
          Join Room
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
