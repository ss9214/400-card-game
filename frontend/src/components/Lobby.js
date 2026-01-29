import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../socket';
import './Lobby.css';

function Lobby() {
  const navigate = useNavigate();
  const gameCode = sessionStorage.getItem('gameCode') || localStorage.getItem('gameCode');
  const playerId = sessionStorage.getItem('playerId');
  const playerName = sessionStorage.getItem('playerName');
  const isOwner = sessionStorage.getItem('isOwner') === 'true';
  const [players, setPlayers] = useState([]);
  const [showRejoinPrompt, setShowRejoinPrompt] = useState(false);
  const [rejoinName, setRejoinName] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (gameCode && !playerId) {
      setShowRejoinPrompt(true);
      return;
    }

    socket.emit('join-lobby', { gameCode, playerId });

    socket.on('update-lobby', (playerList) => {
      sessionStorage.setItem('players', JSON.stringify(playerList))
      setPlayers(playerList);
    });

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
      socket.emit('join-lobby', { gameCode: game.code, playerId: player.id });
    } catch (err) {
      console.error(err);
      alert('Failed to rejoin game');
    }
  };

  const copyGameCode = () => {
    navigator.clipboard.writeText(gameCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (showRejoinPrompt) {
    return (
      <div className="lobby-container">
        <div className="lobby-card rejoin-card">
          <h2>🔄 Rejoin Game</h2>
          <p>You were in game <strong>{gameCode}</strong></p>
          <div className="input-group">
            <label>Enter your name to rejoin:</label>
            <input
              value={rejoinName}
              onChange={(e) => setRejoinName(e.target.value)}
              placeholder="Enter your name"
              onKeyPress={e => e.key === 'Enter' && rejoinName && handleRejoin()}
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

  const currentPlayer = players.find(p => p.id === playerId);
  const displayPlayerName = currentPlayer?.name || playerName;

  return (
    <div className="lobby-container">
      <div className="lobby-card">
        <h2>🎮 Game Lobby</h2>
        
        <div className="code-section">
          <p className="label">Game Code</p>
          <div className="code-display">
            <span className="code">{gameCode}</span>
            <button className="copy-button" onClick={copyGameCode}>
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
          </div>
          <p className="code-hint">Share this code with your friends!</p>
        </div>

        <div className="player-info">
          <p><strong>You:</strong> {displayPlayerName}</p>
        </div>

        <div className="players-section">
          <h3>Players ({players.length}/4)</h3>
          <div className="players-grid">
            {players.map((p, idx) => (
              <div key={p.id} className="player-card">
                <span className="player-number">#{idx + 1}</span>
                <span className="player-name">{p.name}</span>
                {p.id === playerId && <span className="player-badge">You</span>}
              </div>
            ))}
            {[...Array(4 - players.length)].map((_, idx) => (
              <div key={`empty-${idx}`} className="player-card empty">
                <span className="player-number">#{players.length + idx + 1}</span>
                <span className="player-name waiting">Waiting...</span>
              </div>
            ))}
          </div>
        </div>

        <div className="action-section">
          {isOwner && players.length === 4 && (
            <button className="start-button" onClick={handleStartGame}>
              🚀 Start Game
            </button>
          )}

          {isOwner && players.length < 4 && (
            <p className="waiting-text">Waiting for {4 - players.length} more player{4 - players.length !== 1 ? 's' : ''}...</p>
          )}

          {!isOwner && players.length < 4 && (
            <p className="waiting-text">Waiting for {4 - players.length} more player{4 - players.length !== 1 ? 's' : ''}...</p>
          )}

          {!isOwner && players.length === 4 && (
            <p className="waiting-text">Waiting for host to start the game...</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Lobby;
