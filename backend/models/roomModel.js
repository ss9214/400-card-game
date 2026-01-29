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
          game_type: null, // No game selected yet
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