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
      // Add player to room
      Room.addPlayerToRoom(code, player.id, (err3) => {
        if (err3) console.error('Failed to add player to room:', err3);
        
        // If room has a game already, add player to game too
        if (room.game_type) {
          const Game = require('../models/gameModel');
          Game.findGameByCode(code, (err4, game) => {
            if (!err4 && game) {
              Player.updatePlayerGame(player.id, game.id, (err5) => {
                if (err5) console.error('Failed to add player to game:', err5);
                
                // Broadcast updated player list
                Player.getPlayersByGameId(game.id, (err6, gamePlayers) => {
                  if (!err6 && gamePlayers) {
                    const io = require('../server').io;
                    io.to(code).emit('update-lobby', gamePlayers);
                  }
                });
              });
            }
          });
        } else {
          // No game yet, just broadcast room players
          Room.getRoomPlayers(code, (err4, players) => {
            if (!err4 && players) {
              const io = require('../server').io;
              io.to(code).emit('update-lobby', players);
            }
          });
        }
        
        res.json({ room, player });
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
  
  // First get room and its players
  Room.findRoomByCode(code, (err, room) => {
    if (err || !room) return res.status(404).json({ error: 'Room not found' });
    
    Room.getRoomPlayers(code, (err2, players) => {
      if (err2) return res.status(500).json({ error: 'Failed to get room players' });
      
      // Create a game entry with the same code
      const Game = require('../models/gameModel');
      Game.createGame(code, (err3, game) => {
        if (err3) return res.status(500).json({ error: 'Failed to create game' });
        
        // Associate each player with the game
        const Player = require('../models/playerModel');
        let playersAssociated = 0;
        
        if (players.length === 0) {
          // No players to associate, just update room
          Room.updateRoomGameType(code, gameType, (err4) => {
            if (err4) return res.status(500).json({ error: 'Failed to update room' });
            res.json({ success: true, game });
          });
          return;
        }
        
        players.forEach((player, idx) => {
          Player.updatePlayerGame(player.id, game.id, (err4) => {
            if (err4) console.error('Failed to associate player with game:', err4);
            
            playersAssociated++;
            if (playersAssociated === players.length) {
              // All players associated, update room
              Room.updateRoomGameType(code, gameType, (err5) => {
                if (err5) return res.status(500).json({ error: 'Failed to update room' });
                
                // Fetch updated players to broadcast
                Player.getPlayersByGameId(game.id, (err6, gamePlayers) => {
                  if (!err6 && gamePlayers) {
                    // Broadcast to all players in room that game is ready
                    const io = require('../server').io;
                    io.to(code).emit('update-lobby', gamePlayers);
                  }
                  res.json({ success: true, game });
                });
              });
            }
          });
        });
      });
    });
  });
};

exports.deselectGame = (req, res) => {
  const { code } = req.params;
  
  Room.updateRoomGameType(code, null, (err) => {
    if (err) return res.status(500).json({ error: 'Failed to deselect game' });
    res.json({ success: true });
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