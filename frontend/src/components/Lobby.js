import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../socket';

function Lobby() {
  const navigate = useNavigate();
  const gameCode = sessionStorage.getItem('gameCode') || localStorage.getItem('gameCode');
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
      // Trigger re-render by calling join-lobby
      socket.emit('join-lobby', { gameCode: game.code, playerId: player.id });
    } catch (err) {
      console.error(err);
      alert('Failed to rejoin game');
    }
  };

  if (showRejoinPrompt) {
    return (
      <div>
        <h2>Rejoin Game</h2>
        <p>You were in game {gameCode}. Enter your name to rejoin:</p>
        <input
          value={rejoinName}
          onChange={(e) => setRejoinName(e.target.value)}
          placeholder="Enter your name"
        />
        <button onClick={handleRejoin} disabled={!rejoinName}>
          Rejoin Game
        </button>
        <button onClick={() => { sessionStorage.clear(); localStorage.removeItem('gameCode'); navigate('/'); }}>
          Go Home
        </button>
      </div>
    );
  }

  const handleStartGame = () => {
    socket.emit('start-game', { gameCode });
  };

  // Find current player from the players list using playerId
  const currentPlayer = players.find(p => p.id === playerId);
  const displayPlayerName = currentPlayer?.name || playerName;

  return (
    <div>
      <h2>Game Lobby</h2>
      <p><strong>Game Code:</strong> {gameCode}</p>
      <p><strong>You:</strong> {displayPlayerName}</p>

      <h3>Players:</h3>
      <ul>
        {players.map(p => (
          <li key={p.id}>{p.name}</li>
        ))}
      </ul>

      {isOwner && players.length === 4 && (
        <button onClick={handleStartGame}>Start Game</button>
      )}

      {!isOwner && <p>Waiting for host to start the game...</p>}
    </div>
  );
}

export default Lobby;
