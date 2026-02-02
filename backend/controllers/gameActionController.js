const { getGame } = require('../models/gameModel');

/**
 * Handle game actions for specific games
 */
async function handleGameAction(req, res) {
  const { gameCode } = req.params;
  const { playerId, action, data } = req.body;

  console.log(`[Game Action] Code: ${gameCode}, Action: ${action}, PlayerId: ${playerId}, Data:`, data);

  try {
    // Get the game instance
    const game = await getGame(gameCode);
    if (!game) {
      console.error('[Game Action] Game not found');
      return res.status(404).json({ error: 'Game not found' });
    }

    console.log('[Game Action] Game instance created successfully');

    // Handle the action
    const result = game.handleAction(action, playerId, data);
    
    console.log('[Game Action] Result:', result);

    if (!result.success) {
      console.error('[Game Action] Action failed:', result);
      return res.status(400).json(result);
    }

    // Return success with result data
    res.json(result);
  } catch (error) {
    console.error('Error handling game action:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to handle game action', details: error.message });
  }
}

/**
 * Get player-specific game state
 */
async function getPlayerGameState(req, res) {
  const { gameCode } = req.params;
  const { playerId } = req.query;

  console.log(`[Get Player State] Code: ${gameCode}, PlayerId: ${playerId}`);

  try {
    const game = await getGame(gameCode);
    if (!game) {
      console.error('[Get Player State] Game not found');
      return res.status(404).json({ error: 'Game not found' });
    }

    console.log('[Get Player State] Game instance created, calling getPlayerState');
    const state = game.getPlayerState(playerId);
    
    console.log('[Get Player State] State returned:', JSON.stringify(state, null, 2));
    
    if (!state) {
      console.error('[Get Player State] Player not found in game');
      return res.status(404).json({ error: 'Player not found in game' });
    }

    res.json(state);
  } catch (error) {
    console.error('Error getting player state:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to get game state' });
  }
}

/**
 * Get public game state (visible to all players)
 */
async function getPublicGameState(req, res) {
  const { gameCode } = req.params;

  try {
    const game = await getGame(gameCode);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const state = game.getPublicState();
    res.json(state);
  } catch (error) {
    console.error('Error getting public state:', error);
    res.status(500).json({ error: 'Failed to get game state' });
  }
}

module.exports = {
  handleGameAction,
  getPlayerGameState,
  getPublicGameState
};
