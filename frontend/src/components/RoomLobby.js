import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import socket from '../socket';

function RoomLobby() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const playerId = sessionStorage.getItem('playerId');

  useEffect(() => {
    loadRoomData();
    
    // Listen for game selection
    socket.emit('join-lobby', { gameCode: code, playerId });
    
    socket.on('game-selected', ({ gameType }) => {
      // Navigate to the specific game lobby
      navigate(`/room/${code}/${gameType}/lobby`);
    });

    return () => {
      socket.off('game-selected');
    };
  }, [code, playerId, navigate]);

  const loadRoomData = async () => {
    try {
      const roomRes = await api.get(`/rooms/${code}`);
      setRoom(roomRes.data);
      setIsHost(roomRes.data.host_player_id === playerId);
      
      // If game already selected, navigate to it
      if (roomRes.data.game_type) {
        navigate(`/room/${code}/${roomRes.data.game_type}/lobby`);
      }
    } catch (err) {
      console.error('Failed to load room:', err);
      navigate('/');
    }
  };

  const selectGame = async (gameType) => {
    try {
      await api.post(`/rooms/${code}/select-game`, { gameType });
      
      // Emit socket event to notify all players
      socket.emit('select-game', { roomCode: code, gameType });
      
      // Navigate to the specific game
      navigate(`/room/${code}/${gameType}/lobby`);
    } catch (err) {
      console.error('Failed to select game:', err);
    }
  };

  const availableGames = [
    { id: '400', name: '400 Card Game', description: 'Classic 400 card game for 4 players' },
    // Future games will be added here
  ];

  return (
    <div>
      <h1>Room: {code}</h1>
      {room && (
        <>
          <h2>Game Selection</h2>
          {isHost ? (
            <div>
              <p>Select a game to play:</p>
              {availableGames.map(game => (
                <div key={game.id} style={{ margin: '10px 0', padding: '10px', border: '1px solid #ccc' }}>
                  <h3>{game.name}</h3>
                  <p>{game.description}</p>
                  <button onClick={() => selectGame(game.id)}>
                    Start {game.name}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p>Waiting for host to select a game...</p>
          )}
        </>
      )}
    </div>
  );
}

export default RoomLobby;