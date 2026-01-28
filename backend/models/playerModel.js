// server/models/playerModel.js
const { v4: uuidv4 } = require('uuid');
const { docClient, PLAYERS_TABLE, GAMES_TABLE, GetCommand, PutCommand, UpdateCommand, QueryCommand } = require('../db');

exports.addPlayerToGame = (name, gameId, cb) => {
  (async () => {
    try {
      const playerId = uuidv4();
      console.log(`[addPlayerToGame] Adding player "${name}" (${playerId}) to game ${gameId}`);
      const params = {
        TableName: PLAYERS_TABLE,
        Item: {
          id: playerId,
          name: name,
          game_id: gameId,
          bet: null,
          round_score: 0,
          game_score: 0,
          hand: [],
          createdAt: new Date().toISOString()
        }
      };
      console.log(`[addPlayerToGame] Storing item:`, JSON.stringify(params.Item));
      await docClient.send(new PutCommand(params));
      console.log(`[addPlayerToGame] Player "${name}" added successfully`);
      cb(null, { id: playerId, name, game_id: gameId });
    } catch (err) {
      console.error(`[addPlayerToGame] Error:`, err);
      cb(err);
    }
  })();
};

exports.findPlayerById = (id, cb) => {
  (async () => {
    try {
      const params = {
        TableName: PLAYERS_TABLE,
        Key: {
          id: id
        }
      };
      const result = await docClient.send(new GetCommand(params));
      cb(null, result.Item);
    } catch (err) {
      cb(err);
    }
  })();
};

exports.getPlayersByGameId = (gameId, cb) => {
  (async () => {
    try {
      console.log(`[getPlayersByGameId] Querying for gameId: ${gameId}`);
      const params = {
        TableName: PLAYERS_TABLE,
        IndexName: 'game_id-index',
        KeyConditionExpression: 'game_id = :gameId',
        ExpressionAttributeValues: {
          ':gameId': gameId
        }
      };
      const result = await docClient.send(new QueryCommand(params));
      console.log(`[getPlayersByGameId] Raw query result:`, JSON.stringify(result.Items));
      console.log(`[getPlayersByGameId] Found ${result.Items?.length || 0} players`);
      const players = result.Items.map(p => ({
        id: p.id,
        name: p.name,
        bet: p.bet,
        roundScore: p.round_score,
        gameScore: p.game_score
      }));
      console.log(`[getPlayersByGameId] Mapped players:`, JSON.stringify(players));
      cb(null, players);
    } catch (err) {
      console.error(`[getPlayersByGameId] Error:`, err);
      cb(err);
    }
  })();
};

exports.setPlayerHand = (id, hand, cb) => {
  (async () => {
    try {
      const params = {
        TableName: PLAYERS_TABLE,
        Key: {
          id: id
        },
        UpdateExpression: 'SET hand = :hand',
        ExpressionAttributeValues: {
          ':hand': hand
        }
      };
      await docClient.send(new UpdateCommand(params));
      cb(null);
    } catch (err) {
      cb(err);
    }
  })();
};

exports.getPlayerHand = (id, cb) => {
  (async () => {
    try {
      const params = {
        TableName: PLAYERS_TABLE,
        Key: {
          id: id
        }
      };
      const result = await docClient.send(new GetCommand(params));
      const hand = result.Item?.hand || [];
      cb(null, hand);
    } catch (err) {
      cb(err);
    }
  })();
};

exports.setBet = (id, bet, cb) => {
  (async () => {
    try {
      const params = {
        TableName: PLAYERS_TABLE,
        Key: {
          id: id
        },
        UpdateExpression: 'SET bet = :bet',
        ExpressionAttributeValues: {
          ':bet': bet
        }
      };
      await docClient.send(new UpdateCommand(params));
      cb(null);
    } catch (err) {
      cb(err);
    }
  })();
};

exports.updateRoundScore = (id, inc, cb) => {
  (async () => {
    try {
      const params = {
        TableName: PLAYERS_TABLE,
        Key: {
          id: id
        },
        UpdateExpression: 'SET round_score = round_score + :inc',
        ExpressionAttributeValues: {
          ':inc': inc
        }
      };
      await docClient.send(new UpdateCommand(params));
      cb(null);
    } catch (err) {
      cb(err);
    }
  })();
};

exports.resetRound = (gameId, cb) => {
  (async () => {
    try {
      // Query all players for this game
      const queryParams = {
        TableName: PLAYERS_TABLE,
        IndexName: 'game_id-index',
        KeyConditionExpression: 'game_id = :gameId',
        ExpressionAttributeValues: {
          ':gameId': gameId
        }
      };
      const result = await docClient.send(new QueryCommand(queryParams));
      
      // Update each player
      const updates = result.Items.map(player => ({
        Update: {
          TableName: PLAYERS_TABLE,
          Key: { id: player.id },
          UpdateExpression: 'SET bet = :null, round_score = :zero',
          ExpressionAttributeValues: {
            ':null': null,
            ':zero': 0
          }
        }
      }));

      // Send batch updates
      if (updates.length > 0) {
        for (const update of updates) {
          await docClient.send(new UpdateCommand(update.Update));
        }
      }
      cb(null);
    } catch (err) {
      cb(err);
    }
  })();
};

exports.updateGameScore = (id, delta, cb) => {
  (async () => {
    try {
      const params = {
        TableName: PLAYERS_TABLE,
        Key: {
          id: id
        },
        UpdateExpression: 'SET game_score = game_score + :delta',
        ExpressionAttributeValues: {
          ':delta': delta
        }
      };
      await docClient.send(new UpdateCommand(params));
      cb(null);
    } catch (err) {
      cb(err);
    }
  })();
};
