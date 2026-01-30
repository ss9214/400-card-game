import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import socket from '../socket';
import './RoomLobby.css';

function RoomLobby() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [availableGames, setAvailableGames] = useState([]);
  const playerId = sessionStorage.getItem('playerId');

  useEffect(() => {
    loadRoomData();
    loadAvailableGames();
    
    socket.emit('join-lobby', { gameCode: code, playerId });
    
    socket.on('game-selected', ({ gameType }) => {
      navigate(`/room/${code}/${gameType}/lobby`);
    });

    return () => {
      socket.off('game-selected');
    };
  }, [code, playerId, navigate]);

  const loadAvailableGames = async () => {
    try {
      const res = await api.get('/games/available');
      setAvailableGames(res.data);
    } catch (err) {
      console.error('Failed to load games:', err);
    }
  };

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
      socket.emit('select-game', { roomCode: code, gameType });
      navigate(`/room/${code}/${gameType}/lobby`);
    } catch (err) {
      console.error('Failed to select game:', err);
    }
  };

  const getGameIcon = (category) => {
    const icons = {
      'card': '🃏',
      'social-deduction': '🕵️',
      'drawing': '🎨',
    };
    return icons[category] || '🎮';
  };

  return (
    <div className="room-lobby-container">
      <div className="room-lobby-card">
        <h1>Room: {code}</h1>
        {room && (
          <>
            <h2>Game Selection</h2>
            {isHost ? (
              <div className="games-grid">
                {availableGames.map(game => (
                  <div key={game.id} className="game-card">
                    <div className="game-icon">{game.icon || getGameIcon(game.category)}</div>
                    <h3>{game.name}</h3>
                    <p className="game-description">{game.description}</p>
                    <p className="game-players">
                      {game.minPlayers === game.maxPlayers 
                        ? `${game.minPlayers} players`
                        : `${game.minPlayers}-${game.maxPlayers} players`}
                    </p>
                    <button 
                      className="select-game-button"
                      onClick={() => selectGame(game.id)}
                    >
                      Play {game.name}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="waiting-text">Waiting for host to select a game...</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default RoomLobby;