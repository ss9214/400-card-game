import React, { useState } from 'react';
import RulesModal from './RulesModal';
import './RulesButton.css';

function RulesButton({ gameType = '400' }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      />
    </>
  );
}

export default RulesButton;
