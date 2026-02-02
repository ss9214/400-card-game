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
    
    const addPlayerToRoomAndGame = (player) => {
      // Add player to room - this now returns the updated room
      Room.addPlayerToRoom(code, player.id, (err3, updatedRoom) => {
        if (err3) {
          console.error('Failed to add player to room:', err3);
          return res.status(500).json({ error: 'Failed to add player to room' });
        }
        
        // Get all room players and broadcast
        Room.getRoomPlayers(code, (err4, players) => {
          if (!err4 && players) {
            console.log(`Broadcasting ${players.length} players to room ${code}:`, players.map(p => p.name));
            const io = require('../server').io;
            io.to(code).emit('update-lobby', players);
            res.json({ room: updatedRoom, player, players });
          } else {
            res.json({ room: updatedRoom, player, players: [] });
          }
        });
      });
    };
    
    if (playerId) {
      // Existing player rejoining
      Player.findPlayerById(playerId, (err2, player) => {
        if (err2 || !player) return res.status(404).json({ error: 'Player not found' });
        addPlayerToRoomAndGame(player);
      });
    } else {
      // New player joining
      Player.createPlayer(name, (err2, player) => {
        if (err2) return res.status(500).json({ error: 'Failed to create player' });
        addPlayerToRoomAndGame(player);
      });
    }
  });
};

exports.selectGame = (req, res) => {
  const { code } = req.params;
  const { gameType } = req.body;
  
  if (!gameType) return res.status(400).json({ error: 'Game type required' });
  
  // Just update the room's selected game type
  Room.updateRoomGameType(code, gameType, (err) => {
    if (err) return res.status(500).json({ error: 'Failed to update room' });
    res.json({ success: true, gameType });
  });
};

exports.deselectGame = (req, res) => {
  const { code } = req.params;
  
  Room.updateRoomGameType(code, null, (err) => {
    if (err) return res.status(500).json({ error: 'Failed to deselect game' });
    res.json({ success: true });
  });
};

exports.startGame = (req, res) => {
  const { code } = req.params;
  
  // Clear any cached game instance for this room
  const Game = require('../models/gameModel');
  Game.clearGameInstance(code);
  
  // Get room with selected game type
  Room.findRoomByCode(code, (err, room) => {
    if (err || !room) return res.status(404).json({ error: 'Room not found' });
    if (!room.game_type) return res.status(400).json({ error: 'No game selected' });
    
    console.log(`[Start Game] Room ${code} starting game type: ${room.game_type}`);
    
    // Get all players in room
    Room.getRoomPlayers(code, (err2, players) => {
      if (err2) return res.status(500).json({ error: 'Failed to get room players' });
      
      // Create the game entry
      Game.createGame(code, (err3, game) => {
        if (err3) return res.status(500).json({ error: 'Failed to create game' });
        
        // Associate all players with the game
        const Player = require('../models/playerModel');
        let playersAssociated = 0;
        
        if (players.length === 0) {
          return res.json({ success: true, game, gameType: room.game_type });
        }
        
        players.forEach((player) => {
          Player.updatePlayerGame(player.id, game.id, (err4) => {
            if (err4) console.error('Failed to associate player with game:', err4);
            
            playersAssociated++;
            if (playersAssociated === players.length) {
              console.log(`Game started: ${room.game_type}, ${players.length} players associated`);
              res.json({ success: true, game, gameType: room.game_type });
            }
          });
        });
      });
    });
  });
};

exports.getRoomStatus = (req, res) => {
  const { code } = req.params;
  
  Room.findRoomByCode(code, (err, room) => {
    if (err || !room) return res.status(404).json({ error: 'Room not found' });
    res.json(room);
  });
};

exports.getRoomPlayers = (req, res) => {
  const { code } = req.params;
  
  Room.getRoomPlayers(code, (err, players) => {
    if (err) return res.status(500).json({ error: 'Failed to get room players' });
    res.json(players);
  });
};