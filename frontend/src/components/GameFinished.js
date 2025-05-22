// frontend/src/components/GameFinished.js
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function GameFinished() {
  const location = useLocation();
  const navigate = useNavigate();
  const { winningTeam } = location.state || {}; // Get winningTeam from navigation state

  const handlePlayAgain = () => {
    // Clear game-specific local storage
    localStorage.removeItem('gameCode');
    // localStorage.removeItem('playerId'); // Decide if you want to keep the same player ID or create a new one
    // localStorage.removeItem('playerName'); // Decide if you want to keep the same name
    // localStorage.removeItem('playerHand'); // Clear player hand

    // Navigate back to the home or lobby screen to start a new game
    navigate('/'); // Navigate to home page
    // Or navigate to the lobby or a game creation screen
  };

  // Determine the team number to display (assuming team1 is players 0 & 2, team2 is players 1 & 3)
  const winningTeamNumber = winningTeam === 'team1' ? '1 & 3' : (winningTeam === 'team2' ? '2 & 4' : 'Unknown Team');

  return (
    <div>
      <h1>Game Over!</h1>
      {winningTeam && <p>{`Team ${winningTeamNumber} won!`}</p>}
      {!winningTeam && <p>The game finished.</p>} {/* Handle case where winningTeam might not be set */}
      <button onClick={handlePlayAgain}>Play Again</button>
    </div>
  );
}

export default GameFinished;