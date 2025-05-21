const db = require('../db');

exports.addPlayerToGame = (name, gameId, callback) => {
  db.query('INSERT INTO players (name, game_id) VALUES (?, ?)', [name, gameId], (err, result) => {
    if (err) return callback(err);
    callback(null, { id: result.insertId, name });
  });
};

exports.findPlayerById = (id, callback) => {
  db.query('SELECT * FROM players WHERE id = ?', [id], (err, results) => {
    if (err) return callback(err);
    callback(null, results[0]);
  });
};

exports.updatePlayerName = (id, name, callback) => {
  db.query('UPDATE players SET name = ? WHERE id = ?', [name, id], callback);
};

exports.getPlayersByGameId = (gameId, callback) => {
  db.query('SELECT id, name FROM players WHERE game_id = ?', [gameId], callback);
};
