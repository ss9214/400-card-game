import React, { useState } from 'react';
import RulesModal from './RulesModal';
import './RulesButton.css';

function RulesButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button 
        className="rules-button" 
        onClick={() => setIsModalOpen(true)}
        title="View Rules"
      >
        📖 Rules
      </button>
      <RulesModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}

export default RulesButton;
