import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import socket from '../socket';
import api from '../api';
import './ImposterSetup.css';

function ImposterSetup() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState('medium');
  const [players, setPlayers] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load room and player data
    const loadData = async () => {
      try {
        const roomResponse = await api.get(`/rooms/${code}`);
        const currentPlayerId = sessionStorage.getItem('playerId');
        setPlayers(roomResponse.data.players || []);
        setIsOwner(roomResponse.data.room.owner_id === currentPlayerId);
      } catch (error) {
        console.error('Error loading room:', error);
      }
    };

    loadData();

    // Listen for updates
    socket.on('update-lobby', (data) => {
      if (data.players) {
        setPlayers(data.players);
      }
    });

    return () => {
      socket.off('update-lobby');
    };
  }, [code]);

  const handleStartGame = async () => {
    if (!isOwner) return;
    
    setLoading(true);
    try {
      // Set difficulty on the game
      await api.post(`/games/${code}/action`, {
        playerId: sessionStorage.getItem('playerId'),
        action: 'set-difficulty',
        data: { difficulty }
      });

      // Start the round (assigns words)
      await api.post(`/games/${code}/action`, {
        playerId: sessionStorage.getItem('playerId'),
        action: 'start-round',
        data: {}
      });

      // Navigate to game screen
      navigate(`/room/${code}/imposter/play`);
    } catch (error) {
      console.error('Error starting game:', error);
      alert('Failed to start game');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="imposter-setup">
      <h1>Imposter Setup</h1>
      <p className="room-code">Room: {code}</p>

      <div className="players-section">
        <h2>Players ({players.length})</h2>
        <div className="player-list">
          {players.map((player) => (
            <div key={player.player_id} className="player-chip">
              {player.name}
            </div>
          ))}
        </div>
      </div>

      <div className="setup-section">
        <h2>Game Settings</h2>
        
        <div className="difficulty-selector">
          <label>Difficulty:</label>
          <div className="difficulty-options">
            <button
              className={`difficulty-btn ${difficulty === 'easy' ? 'selected' : ''}`}
              onClick={() => setDifficulty('easy')}
              disabled={!isOwner}
            >
              Easy
              <span className="difficulty-desc">Same category</span>
            </button>
            <button
              className={`difficulty-btn ${difficulty === 'medium' ? 'selected' : ''}`}
              onClick={() => setDifficulty('medium')}
              disabled={!isOwner}
            >
              Medium
              <span className="difficulty-desc">Similar categories</span>
            </button>
            <button
              className={`difficulty-btn ${difficulty === 'hard' ? 'selected' : ''}`}
              onClick={() => setDifficulty('hard')}
              disabled={!isOwner}
            >
              Hard
              <span className="difficulty-desc">Different categories</span>
            </button>
          </div>
        </div>

        {isOwner && (
          <button
            className="start-game-btn"
            onClick={handleStartGame}
            disabled={loading || players.length < 3}
          >
            {loading ? 'Starting...' : 'Start Game'}
          </button>
        )}

        {!isOwner && (
          <p className="waiting-message">Waiting for owner to start the game...</p>
        )}

        {players.length < 3 && (
          <p className="warning-message">Need at least 3 players to start</p>
        )}
      </div>
    </div>
  );
}

export default ImposterSetup;
