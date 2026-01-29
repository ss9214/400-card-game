import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function Home() {
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const handleCreate = async () => {
    try {
      const res = await api.post('/rooms/create', { playerName: name });
      const { room, player } = res.data;

      sessionStorage.setItem('roomCode', room.code);
      localStorage.setItem('roomCode', room.code); // Keep in localStorage for reload recovery
      sessionStorage.setItem('playerName', player.name);
      sessionStorage.setItem('playerId', player.id);
      sessionStorage.setItem('isHost', 'true');

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
    <div>
      <h1>Welcome to Party Games</h1>
      <input
        placeholder="Enter your name"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <br />
      <button disabled={!name} onClick={handleCreate}>Create Room</button>
      <button disabled={!name} onClick={handleJoin}>Join Room</button>
    </div>
  );
}

export default Home;
