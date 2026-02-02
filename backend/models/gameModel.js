const { v4: uuidv4 } = require('uuid');
const { docClient, GAMES_TABLE, GetCommand, PutCommand, QueryCommand, UpdateCommand } = require('../db');

exports.createGame = (code, callback) => {
  (async () => {
    try {
      const gameId = uuidv4();
      const params = {
        TableName: GAMES_TABLE,
        Item: {
          code: code,
          id: gameId,
          phase: 'betting', // 'betting' or 'playing'
          current_bet_idx: 0,
          trick_starter_idx: 0,
          rounds_completed: 0,
          createdAt: new Date().toISOString()
        }
      };
      await docClient.send(new PutCommand(params));
      callback(null, { id: gameId, code });
    } catch (err) {
      callback(err);
    }
  })();
};

exports.findGameByCode = (code, callback) => {
  (async () => {
    try {
      const params = {
        TableName: GAMES_TABLE,
        Key: {
          code: code.toUpperCase()
        }
      };
      const result = await docClient.send(new GetCommand(params));
      callback(null, result.Item);
    } catch (err) {
      callback(err);
    }
  })();
};

exports.getGameState = function(code, callback) {
  try {
    const params = {
      TableName: GAMES_TABLE,
      Key: {
        code: code.toUpperCase()
      }
    };
    docClient.send(new GetCommand(params)).then(result => {
      if (!result.Item) return callback(new Error('Game not found'));
      console.log(result.Item.rounds_completed);
      callback(null, {
        phase: result.Item.phase,
        currentBetIdx: result.Item.current_bet_idx,
        trickStarterIdx: result.Item.trick_starter_idx,
        roundsCompleted: result.Item.rounds_completed
      });
    }).catch(err => callback(err));
  } catch (err) {
    callback(err);
  }
};

exports.updateGameState = function(code, updates, callback) {
  (async () => {
    try {
      const updateExpressions = [];
      const expressionValues = {};
      let expressionCounter = 0;

      if (updates.phase !== undefined) {
        updateExpressions.push(`phase = :val${expressionCounter}`);
        expressionValues[`:val${expressionCounter}`] = updates.phase;
        expressionCounter++;
      }
      if (updates.current_bet_idx !== undefined) {
        updateExpressions.push(`current_bet_idx = :val${expressionCounter}`);
        expressionValues[`:val${expressionCounter}`] = updates.current_bet_idx;
        expressionCounter++;
      }
      if (updates.trick_starter_idx !== undefined) {
        updateExpressions.push(`trick_starter_idx = :val${expressionCounter}`);
        expressionValues[`:val${expressionCounter}`] = updates.trick_starter_idx;
        expressionCounter++;
      }

      if (updateExpressions.length === 0) {
        return callback(null, { success: true });
      }

      const params = {
        TableName: GAMES_TABLE,
        Key: { code: code.toUpperCase() },
        UpdateExpression: 'SET ' + updateExpressions.join(', '),
        ExpressionAttributeValues: expressionValues
      };

      await docClient.send(new UpdateCommand(params));
      callback(null, { success: true });
    } catch (err) {
      callback(err);
    }
  })();
};

exports.resetGame = function(code, callback) {
  (async () => {
    try {
      const params = {
        TableName: GAMES_TABLE,
        Key: { code: code.toUpperCase() },
        UpdateExpression: 'SET phase = :betting, current_bet_idx = :zero, trick_starter_idx = :zero, rounds_completed = :zero',
        ExpressionAttributeValues: {
          ':betting': 'betting',
          ':zero': 0
        }
      };
      await docClient.send(new UpdateCommand(params));
      callback(null, { success: true });
    } catch (err) {
      callback(err);
    }
  })();
};;

function findGameByCodeAsync(code) {
  return new Promise((resolve, reject) => {
    const Game = require('../models/gameModel');
    Game.findGameByCode(code, (err, game) => {
      if (err) reject(err);
      else resolve(game);
    });
  });
}

// In-memory cache for game instances
const gameInstances = {};

/**
 * Get a game instance with the appropriate game class
 */
exports.getGame = async (gameCode) => {
  try {
    // Check if we already have an instance in memory
    if (gameInstances[gameCode]) {
      console.log(`[Get Game] Using cached instance for ${gameCode}`);
      return gameInstances[gameCode];
    }

    console.log(`[Get Game] Creating new instance for ${gameCode}`);
    const Room = require('./roomModel');
    
    // Find the room to get game type
    const room = await new Promise((resolve, reject) => {
      Room.findRoomByCode(gameCode, (err, room) => {
        if (err) reject(err);
        else resolve(room);
      });
    });
    
    if (!room) throw new Error('Room not found');
    if (!room.game_type) throw new Error('No game type selected');
    
    console.log(`[Get Game] Room game type: ${room.game_type}`);
    
    // Get players from the room
    const players = await new Promise((resolve, reject) => {
      Room.getRoomPlayers(gameCode, (err, players) => {
        if (err) reject(err);
        else resolve(players);
      });
    });
    
    console.log(`[Get Game] Found ${players.length} players`);
    
    // Get the game class from registry
    const gameRegistry = require('../games/registry');
    const GameClass = gameRegistry.getGameClass(room.game_type);
    
    if (!GameClass) throw new Error(`Game type ${room.game_type} not found`);
    
    // Create a new game instance with players
    const gameInstance = new GameClass(players, gameCode);
    
    // Cache the instance
    gameInstances[gameCode] = gameInstance;
    console.log(`[Get Game] Cached instance for ${gameCode}`);
    
    return gameInstance;
  } catch (error) {
    console.error('Error getting game:', error);
    throw error;
  }
};

/**
 * Clear a game instance from cache (e.g., when game ends)
 */
exports.clearGameInstance = (gameCode) => {
  if (gameInstances[gameCode]) {
    delete gameInstances[gameCode];
    console.log(`[Clear Game] Removed cached instance for ${gameCode}`);
  }
};

