const db = require('../db');

exports.db = db;

exports.createGame = (code, callback) => {
  db.query('INSERT INTO games (code) VALUES (?)', [code], (err, result) => {
    if (err) return callback(err);
    callback(null, { id: result.insertId, code });
  });
};

exports.findGameByCode = (code, callback) => {
  db.query('SELECT * FROM games WHERE code = ?', [code], (err, results) => {
    if (err) return callback(err);
    callback(null, results[0]);
  });
};

exports.getGameState = function(code, callback) {
  db.query(
    'SELECT phase, current_bet_idx, trick_starter_idx, rounds_completed FROM games WHERE code = ?',
    [code],
    (err, results) => {
      if (err) return callback(err);
      if (results.length === 0) return callback(new Error('Game not found'));
      console.log(results[0].rounds_completed);
      callback(null, {
        phase: results[0].phase, // 'betting' or 'playing'
        currentBetIdx: results[0].current_bet_idx,
        trickStarterIdx: results[0].trick_starter_idx,
        roundsCompleted: results[0].rounds_completed
      });
    }
  );
};

function findGameByCodeAsync(code) {
  return new Promise((resolve, reject) => {
    const Game = require('../models/gameModel');
    Game.findGameByCode(code, (err, game) => {
      if (err) reject(err);
      else resolve(game);
    });
  });
}
