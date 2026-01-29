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
      const existingPlayerId = sessionStorage.getItem('playerId');

      const res = await api.post('/rooms/join', {
        name,
        code,
        playerId: existingPlayerId
      });

      const { room, player } = res.data;

      sessionStorage.setItem('roomCode', room.code);
      localStorage.setItem('roomCode', room.code);
      sessionStorage.setItem('playerName', player.name);
      sessionStorage.setItem('playerId', player.id);
      sessionStorage.removeItem('isHost');

      // Check if game has been selected
      if (room.game_type) {
        // Navigate directly to the game
        navigate(`/room/${room.code}/${room.game_type}/lobby`);
      } else {
        // Navigate to room lobby to wait for game selection
        navigate(`/room/${room.code}`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to join room');
    }
  };

  return (
    <div>
      <h1>Join Room</h1>
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
        Room Code:
        <input
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="Enter room code"
        />
      </label>
      <br />
      <button disabled={!name || !code} onClick={handleJoin}>Join</button>
    </div>
  );
}

export default JoinGame;
