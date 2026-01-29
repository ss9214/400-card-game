const Room = require('../models/roomModel');
const Player = require('../models/playerModel');

function generateCode(length = 5) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

exports.createRoom = (req, res) => {
  const { playerName } = req.body;
  
  if (!playerName || !playerName.trim()) {
    return res.status(400).json({ error: 'Player name is required' });
  }

  const code = generateCode();
  
  // First create the player
  Player.createPlayer(playerName, (err, player) => {
    if (err) return res.status(500).json({ error: 'Failed to create player' });
    
    // Then create the room with the player as host
    Room.createRoom(code, player.id, (err2, room) => {
      if (err2) return res.status(500).json({ error: 'Failed to create room' });
      
      res.json({ room, player });
    });
  });
};

exports.joinRoom = (req, res) => {
  const { code, name, playerId } = req.body;
  
  if (!code) return res.status(400).json({ error: 'Room code required' });
  if (!name && !playerId) return res.status(400).json({ error: 'Player name or ID required' });

  // Check if room exists
  Room.findRoomByCode(code, (err, room) => {
    if (err || !room) return res.status(404).json({ error: 'Room not found' });
    
    if (playerId) {
      // Existing player rejoining
      Player.findPlayerById(playerId, (err2, player) => {
        if (err2 || !player) return res.status(404).json({ error: 'Player not found' });
        res.json({ room, player });
      });
    } else {
      // New player joining
      Player.createPlayer(name, (err2, player) => {
        if (err2) return res.status(500).json({ error: 'Failed to create player' });
        res.json({ room, player });
      });
    }
  });
};

exports.selectGame = (req, res) => {
  const { code } = req.params;
  const { gameType } = req.body;
  
  if (!gameType) return res.status(400).json({ error: 'Game type required' });
  
  Room.updateRoomGameType(code, gameType, (err, result) => {
    if (err) return res.status(500).json({ error: 'Failed to select game' });
    res.json(result);
  });
};

exports.getRoomStatus = (req, res) => {
  const { code } = req.params;
  
  Room.findRoomByCode(code, (err, room) => {
    if (err || !room) return res.status(404).json({ error: 'Room not found' });
    res.json(room);
  });
};