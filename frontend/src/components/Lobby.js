import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import socket from '../socket';
import './Lobby.css';

function Lobby() {
  const navigate = useNavigate();
  const { code } = useParams(); // Get code from URL
  const gameCode = code || sessionStorage.getItem('gameCode') || localStorage.getItem('gameCode');
  const playerId = sessionStorage.getItem('playerId');
  const playerName = sessionStorage.getItem('playerName');
  const isOwner = sessionStorage.getItem('isOwner') === 'true';
  const [players, setPlayers] = useState([]);
  const [showRejoinPrompt, setShowRejoinPrompt] = useState(false);
  const [rejoinName, setRejoinName] = useState('');

  useEffect(() => {
    // If we have a gameCode but no playerId, player likely reloaded
    if (gameCode && !playerId) {
      setShowRejoinPrompt(true);
      return;
    }

    console.log('Lobby: Joining with', { gameCode, playerId, playerName });
    socket.emit('join-lobby', { gameCode, playerId });

    socket.on('update-lobby', (playerList) => {
      console.log('Received update-lobby:', playerList);
      sessionStorage.setItem('players', JSON.stringify(playerList));
      setPlayers(playerList);
    });

    // Request player list immediately
    setTimeout(() => {
      console.log('Requesting player list update');
      socket.emit('join-lobby', { gameCode, playerId });
    }, 500);

    socket.on('game-started', ({ playerId: incomingId, hand }) => {
        if (incomingId === playerId) {
          sessionStorage.setItem('playerHand', JSON.stringify(hand));
          navigate('/game/play');
        }
      });
    

    return () => {
      socket.off('update-lobby');
      socket.off('game-started');
    };
  }, [gameCode, playerId, navigate]);
  
  // Ensure current player is always in the list if we have their info
  const displayPlayers = players.length > 0 ? players : 
    (playerId && playerName ? [{ id: playerId, name: playerName }] : []);

  const handleRejoin = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/games/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: gameCode,
          name: rejoinName,
          playerId: null
        })
      });
      
      if (!res.ok) throw new Error('Failed to rejoin');
      const { game, player } = await res.json();

      sessionStorage.setItem('gameCode', game.code);
      sessionStorage.setItem('playerName', player.name);
      sessionStorage.setItem('playerId', player.id);
      sessionStorage.removeItem('isOwner');
      
      setShowRejoinPrompt(false);
      // Trigger re-render by calling join-lobby
      socket.emit('join-lobby', { gameCode: game.code, playerId: player.id });
    } catch (err) {
      console.error(err);
      alert('Failed to rejoin game');
    }
  };

  if (showRejoinPrompt) {
    return (
      <div className="lobby-container">
        <div className="lobby-card">
          <h2>🔄 Rejoin Game</h2>
          <p className="subtitle">You were in game <strong>{gameCode}</strong></p>
          <p>Enter your name to rejoin:</p>
          <div className="input-group">
            <input
              value={rejoinName}
              onChange={(e) => setRejoinName(e.target.value)}
              placeholder="Enter your name"
              onKeyPress={(e) => e.key === 'Enter' && rejoinName && handleRejoin()}
            />
          </div>
          <button className="primary-button" onClick={handleRejoin} disabled={!rejoinName}>
            Rejoin Game
          </button>
          <button className="secondary-button" onClick={() => { sessionStorage.clear(); localStorage.removeItem('gameCode'); navigate('/'); }}>
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const handleStartGame = () => {
    socket.emit('start-game', { gameCode });
  };

  // Find current player from the players list using playerId
  const currentPlayer = displayPlayers.find(p => p.id === playerId);
  const displayPlayerName = currentPlayer?.name || playerName;

  return (
    <div className="lobby-container">
      <div className="lobby-card">
        <h2>🎮 Game Lobby</h2>
        
        <div className="game-code-display">
          <span className="label">Game Code</span>
          <span className="code">{gameCode}</span>
        </div>

        <div className="current-player">
          <span className="label">You:</span>
          <span className="name">{displayPlayerName}</span>
        </div>

        <div className="players-section">
          <h3>Players ({displayPlayers.length}/4)</h3>
          <div className="players-grid">
            {displayPlayers.map((p, idx) => (
              <div key={p.id} className="player-card">
                <div className="player-avatar">{['🎭', '🎪', '🎨', '🎯'][idx]}</div>
                <div className="player-name">{p.name}</div>
              </div>
            ))}
            {[...Array(4 - displayPlayers.length)].map((_, idx) => (
              <div key={`empty-${idx}`} className="player-card empty">
                <div className="player-avatar">⏳</div>
                <div className="player-name">Waiting...</div>
              </div>
            ))}
          </div>
        </div>

        {isOwner && displayPlayers.length === 4 && (
          <button className="start-button" onClick={handleStartGame}>
            🚀 Start Game
          </button>
        )}

        {isOwner && displayPlayers.length < 4 && (
          <div className="waiting-message">
            Waiting for {4 - displayPlayers.length} more player{4 - displayPlayers.length !== 1 ? 's' : ''}...
          </div>
        )}

        {!isOwner && (
          <div className="waiting-message">
            ⏳ Waiting for host to start the game...
          </div>
        )}
      </div>
    </div>
  );
}

export default Lobby;
