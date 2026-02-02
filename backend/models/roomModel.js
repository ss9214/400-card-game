const { v4: uuidv4 } = require('uuid');
const { docClient, ROOMS_TABLE, GetCommand, PutCommand, UpdateCommand } = require('../db');

exports.createRoom = (code, hostPlayerId, callback) => {
  (async () => {
    try {
      const roomId = uuidv4();
      const params = {
        TableName: ROOMS_TABLE,
        Item: {
          code: code,
          id: roomId,
          host_player_id: hostPlayerId,
          player_ids: [hostPlayerId], // Plain array
          game_type: null,
          status: 'waiting',
          created_at: new Date().toISOString()
        }
      };
      await docClient.send(new PutCommand(params));
      callback(null, { id: roomId, code });
    } catch (err) {
      callback(err);
    }
  })();
};

exports.findRoomByCode = (code, callback) => {
  (async () => {
    try {
      const params = {
        TableName: ROOMS_TABLE,
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

exports.updateRoomGameType = (code, gameType, callback) => {
  (async () => {
    try {
      const params = {
        TableName: ROOMS_TABLE,
        Key: { code: code.toUpperCase() },
        UpdateExpression: 'SET game_type = :gameType, #status = :status',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':gameType': gameType,
          ':status': 'game_selected'
        }
      };
      await docClient.send(new UpdateCommand(params));
      callback(null, { success: true });
    } catch (err) {
      callback(err);
    }
  })();
};

exports.addPlayerToRoom = (code, playerId, callback) => {
  (async () => {
    try {
      // First get the room
      const room = await new Promise((resolve, reject) => {
        exports.findRoomByCode(code, (err, r) => {
          if (err) reject(err);
          else resolve(r);
        });
      });
      
      if (!room) {
        return callback(new Error('Room not found'));
      }
      
      // Check if player already in room
      const currentPlayerIds = room.player_ids || [];
      if (currentPlayerIds.includes(playerId)) {
        console.log(`Player ${playerId} already in room ${code}`);
        return callback(null, room);
      }
      
      // Append player to list
      const params = {
        TableName: ROOMS_TABLE,
        Key: { code: code.toUpperCase() },
        UpdateExpression: 'SET player_ids = list_append(if_not_exists(player_ids, :empty_list), :playerId)',
        ExpressionAttributeValues: {
          ':playerId': [playerId],
          ':empty_list': []
        },
        ReturnValues: 'ALL_NEW'
      };
      const result = await docClient.send(new UpdateCommand(params));
      console.log(`Player ${playerId} added to room ${code}. Total players: ${result.Attributes.player_ids.length}`);
      callback(null, result.Attributes);
    } catch (err) {
      callback(err);
    }
  })();
};

exports.getRoomPlayers = (code, callback) => {
  (async () => {
    try {
      const room = await new Promise((resolve, reject) => {
        exports.findRoomByCode(code, (err, r) => {
          if (err) reject(err);
          else resolve(r);
        });
      });
      
      if (!room || !room.player_ids || !Array.isArray(room.player_ids)) {
        return callback(null, []);
      }
      
      const Player = require('./playerModel');
      const players = [];
      
      for (const playerId of room.player_ids) {
        const player = await new Promise((resolve) => {
          Player.findPlayerById(playerId, (err, p) => {
            resolve(err ? null : p);
          });
        });
        if (player) players.push(player);
      }
      
      callback(null, players);
    } catch (err) {
      callback(err);
    }
  })();
};