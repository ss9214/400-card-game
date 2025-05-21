import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../socket';

function Lobby() {
  const navigate = useNavigate();
  const gameCode = localStorage.getItem('gameCode');
  const playerId = parseInt(localStorage.getItem('playerId'), 10);
  const playerName = localStorage.getItem('playerName');
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    socket.emit('join-lobby', { gameCode, playerId });

    socket.on('update-lobby', (playerList) => {
      setPlayers(playerList);
    });

    socket.on('game-started', () => {
      navigate('/game/play');
    });

    return () => {
      socket.off('update-lobby');
      socket.off('game-started');
    };
  }, [gameCode, playerId, navigate]);

  const isHost = players.length > 0 && players[0].id === playerId;

  const handleStartGame = () => {
    socket.emit('start-game', { gameCode });
  };

  return (
    <div>
      <h2>Game Lobby</h2>
      <p><strong>Game Code:</strong> {gameCode}</p>
      <p><strong>You:</strong> {playerName}</p>

      <h3>Players:</h3>
      <ul>
        {players.map(p => (
          <li key={p.id}>{p.name}</li>
        ))}
      </ul>

      {isHost && players.length === 4 && (
        <button onClick={handleStartGame}>Start Game</button>
      )}

      {!isHost && <p>Waiting for host to start the game...</p>}
    </div>
  );
}

export default Lobby;
