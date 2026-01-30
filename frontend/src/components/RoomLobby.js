import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import socket from '../socket';
import RulesButton from './RulesButton';
import './RoomLobby.css';

function RoomLobby() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [availableGames, setAvailableGames] = useState([]);
  const [players, setPlayers] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const playerId = sessionStorage.getItem('playerId');
  const playerName = sessionStorage.getItem('playerName');

  useEffect(() => {
    loadRoomData();
    loadAvailableGames();
    
    socket.emit('join-lobby', { gameCode: code, playerId });
    
    socket.on('update-lobby', (playerList) => {
      console.log('RoomLobby received update-lobby:', playerList);
      setPlayers(playerList);
    });
    
    socket.on('game-selected', ({ gameType }) => {
      console.log('Game selected:', gameType);
      const game = availableGames.find(g => g.id === gameType);
      setSelectedGame(game);
      setRoom(prev => ({ ...prev, game_type: gameType }));
    });
    
    socket.on('game-deselected', () => {
      console.log('Game deselected');
      setSelectedGame(null);
      setRoom(prev => ({ ...prev, game_type: null }));
    });

    return () => {
      socket.off('update-lobby');
      socket.off('game-selected');
      socket.off('game-deselected');
    };
  }, [code, playerId]);

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
      
      // Load selected game if any
      if (roomRes.data.game_type) {
        const game = availableGames.find(g => g.id === roomRes.data.game_type);
        setSelectedGame(game);
      }
    } catch (err) {
      console.error('Failed to load room:', err);
      navigate('/');
    }
  };

  const selectGame = async (gameType) => {
    if (!isHost) return;
    
    try {
      // Clear session storage
      sessionStorage.removeItem('gameCode');
      sessionStorage.removeItem('playerHand');
      sessionStorage.removeItem('players');
      
      await api.post(`/rooms/${code}/select-game`, { gameType });
      socket.emit('select-game', { roomCode: code, gameType });
      
      const game = availableGames.find(g => g.id === gameType);
      setSelectedGame(game);
    } catch (err) {
      console.error('Failed to select game:', err);
    }
  };

  const deselectGame = async () => {
    if (!isHost) return;
    
    try {
      await api.post(`/rooms/${code}/deselect-game`);
      socket.emit('deselect-game', { roomCode: code });
      setSelectedGame(null);
    } catch (err) {
      console.error('Failed to deselect game:', err);
    }
  };

  const canSelectGame = (game) => {
    if (!isHost) return false;
    if (game.minPlayers === game.maxPlayers) {
      return players.length === game.minPlayers;
    }
    return players.length >= game.minPlayers && players.length <= game.maxPlayers;
  };

  const startGame = async () => {
    if (!isHost || !selectedGame) return;
    
    // Navigate to game lobby
    navigate(`/room/${code}/${selectedGame.id}/lobby`);
  };

  const getGameIcon = (category) => {
    const icons = {
      'card': '🃏',
      'social-deduction': '🕵️',
      'drawing': '🎨',
    };
    return icons[category] || '🎮';
  };

  // Fallback player list if empty
  const displayPlayers = players.length > 0 ? players : 
    (playerId && playerName ? [{ id: playerId, name: playerName }] : []);

  return (
    <div className="room-lobby-container">
      <RulesButton gameType={selectedGame?.id || '400'} />
      <div className="room-lobby-card">
        <h1>🎮 Room: {code}</h1>
        
        {/* Player List Section */}
        <div className="players-section">
          <h3>Players ({displayPlayers.length})</h3>
          <div className="players-list">
            {displayPlayers.map((p, idx) => (
              <div key={p.id} className="player-chip">
                <span className="player-emoji">{['🎭', '🎪', '🎨', '🎯', '🎲', '🎸'][idx]}</span>
                <span className="player-name">{p.name}</span>
                {room?.host_player_id === p.id && <span className="host-badge">👑</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Selected Game Display */}
        {selectedGame && (
          <div className="selected-game-section">
            <h3>Selected Game</h3>
            <div className="selected-game-card">
              <div className="game-icon-large">{selectedGame.icon || getGameIcon(selectedGame.category)}</div>
              <div className="selected-game-info">
                <h2>{selectedGame.name}</h2>
                <p>{selectedGame.description}</p>
                <p className="player-requirement">
                  {selectedGame.minPlayers === selectedGame.maxPlayers 
                    ? `Requires ${selectedGame.minPlayers} players`
                    : `Requires ${selectedGame.minPlayers}-${selectedGame.maxPlayers} players`}
                </p>
              </div>
              {isHost && (
                <button className="change-game-button" onClick={deselectGame}>
                  Change Game
                </button>
              )}
            </div>
            
            {isHost && canSelectGame(selectedGame) && (
              <button className="start-game-button" onClick={startGame}>
                🚀 Start Game
              </button>
            )}
            
            {!canSelectGame(selectedGame) && (
              <div className="waiting-message">
                {players.length < selectedGame.minPlayers 
                  ? `Waiting for ${selectedGame.minPlayers - players.length} more player${selectedGame.minPlayers - players.length !== 1 ? 's' : ''}...`
                  : `Too many players! Maximum is ${selectedGame.maxPlayers}.`}
              </div>
            )}
          </div>
        )}

        {/* Game Selection Grid */}
        {!selectedGame && room && (
          <>
            <h2>Select a Game</h2>
            {isHost ? (
              <div className="games-grid">
                {availableGames.map(game => {
                  const canSelect = canSelectGame(game);
                  return (
                    <div key={game.id} className={`game-card ${!canSelect ? 'disabled' : ''}`}>
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
                        disabled={!canSelect}
                      >
                        {canSelect ? `Play ${game.name}` : 'Wrong player count'}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="waiting-text">⏳ Waiting for host to select a game...</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default RoomLobby;