const express = require('express');
const router = express.Router();
const {
  handleGameAction,
  getPlayerGameState,
  getPublicGameState
} = require('../controllers/gameActionController');

// Handle game-specific actions (start round, make move, etc.)
router.post('/:gameCode/action', handleGameAction);

// Get player-specific game state
router.get('/:gameCode/state', getPlayerGameState);

// Get public game state (visible to all)
router.get('/:gameCode/public', getPublicGameState);

module.exports = router;
