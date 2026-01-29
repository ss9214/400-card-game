import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './Home.css';

function Home() {
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const handleCreate = async () => {
    try {
      const res = await api.post('/games/create', { name });
      const { game, player } = res.data;

      sessionStorage.setItem('gameCode', game.code);
      localStorage.setItem('gameCode', game.code);
      sessionStorage.setItem('playerName', player.name);
      sessionStorage.setItem('playerId', player.id);
      sessionStorage.setItem('isOwner', 'true');

      navigate('/game/lobby');
    } catch (err) {
      console.error(err);
      alert('Failed to create game');
    }
  };

  const handleJoin = () => {
    navigate('/game/join', { state: { name } });
  };

  return (
    <div className="home-container">
      <div className="home-card">
        <h1>🃏 Welcome to 400</h1>
        <p className="subtitle">Play the classic card game with friends online</p>
        
        <div className="input-group">
          <label htmlFor="name-input">Your Name</label>
          <input
            id="name-input"
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && name && handleCreate()}
          />
        </div>

        <div className="button-group">
          <button 
            className="primary-button" 
            disabled={!name} 
            onClick={handleCreate}
          >
            🎮 Create Game
          </button>
          <button 
            className="secondary-button" 
            disabled={!name} 
            onClick={handleJoin}
          >
            👥 Join Game
          </button>
        </div>

        <div className="info-box">
          <p><strong>Create Game:</strong> Start a new game and invite friends</p>
          <p><strong>Join Game:</strong> Enter a room code to join an existing game</p>
        </div>
      </div>
    </div>
  );
}

export default Home;
