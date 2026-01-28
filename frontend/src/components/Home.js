import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function Home() {
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const handleCreate = async () => {
    try {
      const res = await api.post('/games/create', { name });
      const { game, player } = res.data;

      sessionStorage.setItem('gameCode', game.code);
      localStorage.setItem('gameCode', game.code); // Keep in localStorage for reload recovery
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
    <div>
      <h1>Welcome to 400</h1>
      <input
        placeholder="Enter your name"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <br />
      <button disabled={!name} onClick={handleCreate}>Create Game</button>
      <button disabled={!name} onClick={handleJoin}>Join Game</button>
    </div>
  );
}

export default Home;
