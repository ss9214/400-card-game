const Game = require('../models/gameModel');
const Player = require('../models/playerModel');

function generateCode(length = 5) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

exports.createGame = (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const code = generateCode();
  Game.createGame(code, (err, game) => {
    if (err) return res.status(500).json({ error: 'Failed to create game' });

    Player.addPlayerToGame(name, game.id, (err2, player) => {
      if (err2) return res.status(500).json({ error: 'Failed to add player' });

      res.status(201).json({
        game: { id: game.id, code: game.code },
        player: { id: player.id, name }
      });
    });
  });
};

exports.joinGame = (req, res) => {
  const { code, name, playerId } = req.body;
  if (!name || !code) return res.status(400).json({ error: 'Code and name are required' });

  Game.findGameByCode(code.toUpperCase(), (err, game) => {
    if (err || !game) return res.status(404).json({ error: 'Game not found' });

    if (playerId) {
      Player.findPlayerById(playerId, (err2, player) => {
        if (err2 || !player || player.game_id !== game.id) {
          createNew();
        } else {
          Player.updatePlayerName(playerId, name, (err3) => {
            if (err3) return res.status(500).json({ error: 'Update failed' });
            res.json({ game, player: { id: playerId, name } });
          });
        }
      });
    } else {
      createNew();
    }

    function createNew() {
      Player.addPlayerToGame(name, game.id, (err4, player) => {
        if (err4) return res.status(500).json({ error: 'Failed to join game' });
        res.status(200).json({ game, player });
      });
    }
  });
};

exports.getGamePlayers = (req, res) => {
  const code = req.params.code.toUpperCase();
  Game.findGameByCode(code, (err, game) => {
    if (err || !game) return res.status(404).json({ error: 'Game not found' });

    Player.getPlayersByGameId(game.id, (err2, players) => {
      if (err2) return res.status(500).send(err2);
      res.json(players);
    });
  });
};

exports.getGameStatus = (req, res) => {
  const code = req.params.code.toUpperCase();
  Game.findGameByCode(code, (err, game) => {
    if (err || !game) return res.status(404).json({ error: 'Game not found' });
    res.json({ status: game.status });
  });
};
