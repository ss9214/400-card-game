import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './Home.css';

function Home() {
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const handleCreate = async () => {
    try {
      const res = await api.post('/rooms/create', { playerName: name });
      const { room, player } = res.data;

      sessionStorage.setItem('roomCode', room.code);
      localStorage.setItem('roomCode', room.code);
      sessionStorage.setItem('playerName', player.name);
      sessionStorage.setItem('playerId', player.id);
      sessionStorage.setItem('isHost', 'true');
      
      // Store initial player list (just the host)
      sessionStorage.setItem('initialPlayers', JSON.stringify([player]));

      navigate(`/room/${room.code}`);
    } catch (err) {
      console.error(err);
      alert('Failed to create room');
    }
  };

  const handleJoin = () => {
    navigate('/join', { state: { name } });
  };

  return (
    <div className="home-container">
      <div className="home-card">
        <h1>🃏 Welcome to Party Games</h1>
        <p className="subtitle">Play card games and party games with friends online</p>
        
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
            🎮 Create Room
          </button>
          <button 
            className="secondary-button" 
            disabled={!name} 
            onClick={handleJoin}
          >
            👥 Join Room
          </button>
        </div>

        <div className="info-box">
          <p><strong>Create Room:</strong> Start a new room and invite friends</p>
          <p><strong>Join Room:</strong> Enter a room code to join an existing game</p>
        </div>
      </div>
    </div>
  );
}

export default Home;
