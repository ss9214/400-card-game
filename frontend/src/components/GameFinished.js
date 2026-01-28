// frontend/src/components/GameFinished.js
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';
import socket from '../socket';

function GameFinished() {
  const location = useLocation();
  const navigate = useNavigate();
  const playerId = sessionStorage.getItem('playerId');
  const players = JSON.parse(sessionStorage.getItem('players') || '[]')
  const { winningTeam, winningPlayers } = location.state || {}; // Get winningTeam and winningPlayers from navigation state
  const gameCode = sessionStorage.getItem('gameCode');
  const isHost = players.length > 0 && players[0].id === playerId;

  useEffect(() => {
    socket.on('game-started', ({ playerId: incomingId, hand }) => {
        if (incomingId === playerId) {
          sessionStorage.setItem('playerHand', JSON.stringify(hand));
          navigate('/game/play');
        }
      });
    

    return () => {
      socket.off('game-started');
    };
  }, [gameCode, playerId, navigate]);

  const handlePlayAgain = async () => {
    try {
      // Reset game state (phase, indices, rounds)
      await api.post(`/games/${gameCode}/reset`);
      // Reset all player scores to 0
      for (const player of players) {
        await api.post('/games/bet', { 
          playerId: player.id, 
          gameCode: gameCode,
          resetScore: true 
        }).catch(() => {}); // Ignore errors if endpoint doesn't support this
      }
      // Start the game
      socket.emit('start-game', { gameCode });
    } catch (err) {
      console.error('Error resetting game:', err);
    }
  };

  // Determine the team number to display (assuming team1 is players 0 & 2, team2 is players 1 & 3 based on backend sort)
   // Note: This assumes the players array in GamePlay was sorted by ID.
   // If you have specific player IDs for teams, you might need a mapping here.


  return (
    <div>
      <h1>Game Over!</h1>
      {winningTeam && winningPlayers && <p>{`${winningTeam} with ${winningPlayers[0]} and ${winningPlayers[1]} won!`}</p>}
      {!winningTeam && <p>The game finished.</p>}
      {isHost && <button onClick={handlePlayAgain}>Play Again</button>}
    </div>
  );
}

export default GameFinished;