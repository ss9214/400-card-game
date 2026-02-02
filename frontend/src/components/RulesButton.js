import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import RulesModal from './RulesModal';
import './RulesButton.css';

function RulesButton({ gameType = '400' }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const location = useLocation();
  
  // Determine context: 'home', 'room-lobby', or specific game
  let context = 'game'; // default to showing game rules
  if (location.pathname === '/' || location.pathname === '/join') {
    context = 'home';
  } else if (location.pathname.match(/^\/room\/[^/]+$/) && gameType === 'room-lobby') {
    context = 'room-lobby'; // in room but no game selected yet
  }

  return (
    <>
      <button 
        className="rules-button" 
        onClick={() => setIsModalOpen(true)}
        title="View Rules"
      >
        📖
      </button>
      <RulesModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        gameType={gameType}
        context={context}
      />
    </>
  );
}

export default RulesButton;
