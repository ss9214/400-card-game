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
  const [gameOptions, setGameOptions] = useState({});
  const [copied, setCopied] = useState(false);
  const playerId = sessionStorage.getItem('playerId');
  const playerName = sessionStorage.getItem('playerName');

  useEffect(() => {
    // Load initial player list if available
    const initialPlayersStr = sessionStorage.getItem('initialPlayers');
    if (initialPlayersStr) {
      try {
        const initialPlayers = JSON.parse(initialPlayersStr);
        setPlayers(initialPlayers);
        sessionStorage.removeItem('initialPlayers'); // Clear after using
      } catch (e) {
        console.error('Failed to parse initial players:', e);
      }
    }
    
    loadRoomData();
    loadAvailableGames();
    
    socket.emit('join-lobby', { gameCode: code, playerId });
    
    socket.on('update-lobby', (playerList) => {
      console.log('RoomLobby received update-lobby:', playerList);
      setPlayers(playerList);
    });

    return () => {
      socket.off('update-lobby');
      socket.off('game-selected');
      socket.off('game-deselected');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, playerId]);

  // Separate effect for game selection listeners that needs availableGames
  useEffect(() => {
    if (availableGames.length === 0) return;
    
    socket.on('game-selected', ({ gameType }) => {
      console.log('Game selected:', gameType);
      const game = availableGames.find(g => g.id === gameType);
      if (game) {
        setSelectedGame(game);
        setRoom(prev => ({ ...prev, game_type: gameType }));
        
        // Initialize default options for the game
        if (game.options) {
          const defaults = {};
          game.options.forEach(opt => {
            defaults[opt.id] = opt.defaultValue;
          });
          setGameOptions(defaults);
        }
      }
    });
    
    socket.on('game-deselected', () => {
      console.log('Game deselected');
      setSelectedGame(null);
      setGameOptions({});
      setRoom(prev => ({ ...prev, game_type: null }));
    });

    socket.on('game-started', ({ gameType }) => {
      console.log('Game started, navigating to:', gameType);
      if (gameType === 'imposter') {
        navigate(`/room/${code}/imposter/play`);
      } else {
        navigate(`/room/${code}/${gameType}/lobby`);
      }
    });

    return () => {
      socket.off('game-selected');
      socket.off('game-deselected');
      socket.off('game-started');
    };
  }, [availableGames, code, navigate]);

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
      if (roomRes.data.game_type && availableGames.length > 0) {
        const game = availableGames.find(g => g.id === roomRes.data.game_type);
        if (game) {
          setSelectedGame(game);
          // Initialize default options
          if (game.options) {
            const defaults = {};
            game.options.forEach(opt => {
              defaults[opt.id] = opt.defaultValue;
            });
            setGameOptions(defaults);
          }
        }
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
      setGameOptions({});
    } catch (err) {
      console.error('Failed to deselect game:', err);
    }
  };

  const handleOptionChange = (optionId, value) => {
    setGameOptions(prev => ({
      ...prev,
      [optionId]: value
    }));
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
    
    try {
      // Call backend to create the game and associate players
      const res = await api.post(`/rooms/${code}/start-game`);
      const { gameType } = res.data;
      
      // For Imposter game, set difficulty and start round before navigating
      if (gameType === 'imposter') {
        // Start the round with difficulty
        const difficulty = gameOptions.difficulty || 'medium';
        console.log('Starting Imposter round with difficulty:', difficulty);
        const roundResult = await api.post(`/games/${code}/action`, {
          playerId: sessionStorage.getItem('playerId'),
          action: 'start-round',
          data: { difficulty }
        });
        console.log('Round started result:', roundResult.data);

        // Navigate directly to play screen
        navigate(`/room/${code}/imposter/play`);
        
        // Broadcast to other players to navigate
        socket.emit('game-started', { roomCode: code, gameType });
      } else {
        // For other games, navigate to their lobby
        navigate(`/room/${code}/${gameType}/lobby`);
      }
    } catch (err) {
      console.error('Failed to start game:', err);
      alert('Failed to start game. Please try again.');
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

  // Fallback player list if empty
  const displayPlayers = players.length > 0 ? players : 
    (playerId && playerName ? [{ id: playerId, name: playerName }] : []);

  return (
    <>
      {/* Full-Width Header at Top of Page */}
      <div className="lobby-page-header">
        <RulesButton gameType={selectedGame?.id || 'room-lobby'} />
        <div className="player-name-display">
          {playerName}
        </div>
        <div className="header-spacer"></div>
      </div>

      <div className="room-lobby-container">
        <div className="room-lobby-card">
        <div className="room-header">
          <h1>🎮 Room: {code}</h1>
          <button className="copy-code-button" onClick={copyRoomCode}>
            {copied ? '✓ Copied!' : '📋 Copy Code'}
          </button>
        </div>
        
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
          </div>
        )}

        {/* Game Options Section */}
        {selectedGame && selectedGame.options && selectedGame.options.length > 0 && (
          <div className="game-options-section">
            <h3>Game Options</h3>
            <div className="options-container">
              {selectedGame.options.map(option => (
                <div key={option.id} className="option-group">
                  <label className="option-label"><u> {option.name} </u></label>
                  {option.type === 'select' && (
                    <div className="option-choices">
                      {option.choices.map(choice => (
                        <button
                          key={choice.value}
                          className={`option-choice ${gameOptions[option.id] === choice.value ? 'selected' : ''}`}
                          onClick={() => isHost && handleOptionChange(option.id, choice.value)}
                          disabled={!isHost}
                        >
                          <span className="choice-label">{choice.label}</span>
                          {choice.description && <span className="choice-description">{choice.description}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Start Game Button */}
        {selectedGame && (
          <>
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
          </>
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
    </>
  );
}

export default RoomLobby;