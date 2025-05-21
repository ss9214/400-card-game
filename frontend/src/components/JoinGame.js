import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';

function JoinGame() {
  const { state } = useLocation();
  const nameFromHome = state?.name || '';
  const [name, setName] = useState(nameFromHome);
  const [code, setCode] = useState('');
  const navigate = useNavigate();

  const handleJoin = async () => {
    try {
      const existingPlayerId = localStorage.getItem('playerId');

      const res = await api.post('/games/join', {
        name,
        code,
        playerId: existingPlayerId
      });

      const { game, player } = res.data;

      localStorage.setItem('gameCode', game.code);
      localStorage.setItem('playerName', player.name);
      localStorage.setItem('playerId', player.id);

      navigate('/game/lobby');
    } catch (err) {
      console.error(err);
      alert('Failed to join game');
    }
  };

  return (
    <div>
      <h1>Join Game</h1>
      <label>
        Your Name:
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Enter your name"
        />
      </label>
      <br />
      <label>
        Game Code:
        <input
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="Enter game code"
        />
      </label>
      <br />
      <button disabled={!name || !code} onClick={handleJoin}>Join</button>
    </div>
  );
}

export default JoinGame;
