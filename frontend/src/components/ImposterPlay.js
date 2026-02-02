import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import socket from '../socket';
import api from '../api';
import './ImposterPlay.css';

function ImposterPlay() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [myWord, setMyWord] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [players, setPlayers] = useState([]);
  const [imposterName, setImposterName] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isImposter, setIsImposter] = useState(false);
  const [imposterGuess, setImposterGuess] = useState('');
  const [guessSubmitted, setGuessSubmitted] = useState(false);
  const [gameResult, setGameResult] = useState(null);
  const [loading, setLoading] = useState(true);

  const currentPlayerId = sessionStorage.getItem('playerId');

  useEffect(() => {
    let mounted = true;

    // Load game state
    const loadGameState = async () => {
      try {
        console.log('Loading game state for room:', code, 'player:', currentPlayerId);
        const response = await api.get(`/games/${code}/state`, {
          params: { playerId: currentPlayerId }
        });
        
        console.log('Game state response:', response.data);
        const state = response.data;
        
        if (mounted) {
          setMyWord(state.myWord);
          setGameState(state.gameState);
          setPlayers(state.players || []);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading game state:', error);
        console.error('Error details:', error.response?.data);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Check if owner
    const checkOwner = async () => {
      try {
        const roomResponse = await api.get(`/rooms/${code}`);
        if (mounted) {
          const room = roomResponse.data;
          // Handle both owner_id and host_player_id field names
          const ownerId = room.owner_id || room.host_player_id;
          setIsOwner(ownerId === currentPlayerId);
          console.log('Is owner:', ownerId === currentPlayerId, 'Owner ID:', ownerId, 'Current Player:', currentPlayerId);
        }
      } catch (error) {
        console.error('Error checking owner:', error);
      }
    };

    loadGameState();
    checkOwner();

    // Listen for game state updates (but preserve myWord)
    socket.on('imposter-state-update', (data) => {
      console.log('Received imposter-state-update:', data);
      if (data.state) setGameState(data.state);
      if (data.players) setPlayers(data.players);
      // Don't override myWord from socket updates
    });

    socket.on('imposter-revealed', (data) => {
      setImposterName(data.imposterName);
      setIsImposter(data.imposterPlayerId === currentPlayerId);
      setGameState('guessing');
    });

    socket.on('guess-submitted', (data) => {
      console.log('Received guess-submitted event:', data);
      setGuessSubmitted(true);
    });

    socket.on('game-finished', (data) => {
      setGameResult(data);
      setGameState('finished');
    });

    socket.on('back-to-lobby', () => {
      console.log('Received back-to-lobby event');
      navigate(`/room/${code}`);
    });

    return () => {
      mounted = false;
      socket.off('imposter-state-update');
      socket.off('imposter-revealed');
      socket.off('guess-submitted');
      socket.off('game-finished');
      socket.off('back-to-lobby');
    };
  }, [code, currentPlayerId, navigate]);

  const handleFinishGame = async () => {
    if (!isOwner || gameState !== 'active') {
      console.log('Cannot finish game:', { isOwner, gameState });
      return;
    }
    
    try {
      const response = await api.post(`/games/${code}/action`, {
        playerId: currentPlayerId,
        action: 'finish-round',
        data: {}
      });

      if (response.data.success) {
        setImposterName(response.data.imposterName);
        setIsImposter(response.data.imposterPlayerId === currentPlayerId);
        setGameState('guessing');
        
        // Emit socket event so all players get updated
        socket.emit('imposter-action', {
          roomCode: code,
          action: 'imposter-revealed',
          data: response.data
        });
      }
    } catch (error) {
      console.error('Error finishing round:', error);
      alert('Failed to finish game');
    }
  };

  const handleSubmitGuess = async () => {
    if (!isImposter || !imposterGuess.trim()) return;
    
    setLoading(true);
    try {
      await api.post(`/games/${code}/action`, {
        playerId: currentPlayerId,
        action: 'imposter-guess',
        data: { guess: imposterGuess.trim() }
      });
      
      setGuessSubmitted(true);
      
      // Broadcast to all players that guess has been submitted
      socket.emit('imposter-action', {
        roomCode: code,
        action: 'guess-submitted',
        data: { imposterPlayerId: currentPlayerId }
      });
    } catch (error) {
      console.error('Error submitting guess:', error);
      alert('Failed to submit guess');
    } finally {
      setLoading(false);
    }
  };

  const handleDetermineWinner = async (caught) => {
    if (!isOwner) return;
    
    setLoading(true);
    try {
      const response = await api.post(`/games/${code}/action`, {
        playerId: currentPlayerId,
        action: 'determine-winner',
        data: { imposterCaught: caught }
      });

      if (response.data.success) {
        setGameResult(response.data);
        setGameState('finished');
        
        // Emit socket event so all players get results
        socket.emit('imposter-action', {
          roomCode: code,
          action: 'game-finished',
          data: response.data
        });
      }
    } catch (error) {
      console.error('Error determining winner:', error);
      alert('Failed to determine winner');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLobby = () => {
    if (isOwner) {
      // Owner broadcasts to all players
      socket.emit('back-to-lobby', { roomCode: code });
    }
    // Navigate locally
    navigate(`/room/${code}`);
  };

  return (
    <div className="imposter-play">
      <h1>Imposter</h1>
      <p className="room-code">Room: {code}</p>

      {loading && (
        <div className="loading-state">
          <p>Loading game...</p>
        </div>
      )}

      {/* Active Phase - Show word and discuss */}
      {!loading && gameState === 'active' && (
        <div className="active-phase">
          <div className="word-display">
            <h2>Your Word:</h2>
            <div className="word-card">{myWord}</div>
            <p className="instructions">
              Discuss with other players to find the imposter!
            </p>
          </div>

          <div className="players-grid">
            {players.map((player) => (
              <div key={player.id} className="player-card">
                {player.name}
              </div>
            ))}
          </div>

          {isOwner && (
            <>
              <button
                className="finish-btn"
                onClick={handleFinishGame}
              >
                Finish Discussion & Reveal Imposter
              </button>
              <button
                className="back-lobby-btn"
                onClick={handleBackToLobby}
              >
                Back to Lobby
              </button>
            </>
          )}

          {!isOwner && (
            <p className="waiting-text">Waiting for owner to finish the game...</p>
          )}
        </div>
      )}

      {/* Guessing Phase - Imposter revealed, waiting for guess */}
      {gameState === 'guessing' && (
        <div className="guessing-phase">
          <div className="imposter-revealed">
            <h2>The Imposter is...</h2>
            <div className="imposter-name">{imposterName}!</div>
          </div>

          {isImposter && !guessSubmitted && (
            <div className="guess-section">
              <h3>You are the imposter!</h3>
              <p>Can you guess what the real word was?</p>
              <input
                type="text"
                value={imposterGuess}
                onChange={(e) => setImposterGuess(e.target.value)}
                placeholder="Enter your guess..."
                className="guess-input"
              />
              <button
                className="submit-guess-btn"
                onClick={handleSubmitGuess}
                disabled={loading || !imposterGuess.trim()}
              >
                {loading ? 'Submitting...' : 'Submit Guess'}
              </button>
            </div>
          )}

          {isImposter && guessSubmitted && (
            <div className="guess-submitted">
              <p>✓ Your guess has been submitted</p>
              <p>Waiting for owner to determine the winner...</p>
            </div>
          )}

          {!isImposter && (
            <div className="waiting-imposter">
              <p>Waiting for {imposterName} to guess the word...</p>
            </div>
          )}

          {isOwner && guessSubmitted && gameState === 'guessing' && (
            <div className="determine-winner-section">
              <h3>Did the players catch the imposter?</h3>
              <div className="winner-buttons">
                <button
                  className="caught-btn yes"
                  onClick={() => handleDetermineWinner(true)}
                  disabled={loading}
                >
                  Yes - Imposter Caught
                </button>
                <button
                  className="caught-btn no"
                  onClick={() => handleDetermineWinner(false)}
                  disabled={loading}
                >
                  No - Imposter Not Caught
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Finished Phase - Show results */}
      {gameState === 'finished' && gameResult && (
        <div className="finished-phase">
          <h2>Game Over!</h2>
          
          <div className="results-card">
            <div className="result-item">
              <strong>Imposter:</strong> {imposterName}
            </div>
            <div className="result-item">
              <strong>Normal Word:</strong> {gameResult.normalWord}
            </div>
            <div className="result-item">
              <strong>Imposter Word:</strong> {gameResult.imposterWord}
            </div>
            <div className="result-item">
              <strong>Imposter's Guess:</strong> {gameResult.imposterGuess}
            </div>
            <div className="result-item">
              <strong>Imposter Guessed Correctly:</strong> {gameResult.imposterGuessedCorrectly ? 'Yes' : 'No'}
            </div>
            <div className="result-item">
              <strong>Imposter Caught:</strong> {gameResult.imposterCaught ? 'Yes' : 'No'}
            </div>
          </div>

          <div className={`winner-banner ${gameResult.winner}`}>
            {gameResult.winner === 'imposters' ? '🎭 Imposter Wins!' : '🕵️ Normal Players Win!'}
          </div>

          {isOwner && (
            <button
              className="back-btn"
              onClick={handleBackToLobby}
            >
              Back to Lobby (All Players)
            </button>
          )}

          {!isOwner && (
            <p className="waiting-text">Waiting for owner to return to lobby...</p>
          )}
        </div>
      )}
    </div>
  );
}

export default ImposterPlay;
