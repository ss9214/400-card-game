// server/models/playerModel.js
const db = require('../db');

exports.addPlayerToGame = (name, gameId, cb) => {
  db.query(
    'INSERT INTO players (name, game_id) VALUES (?, ?)',
    [name, gameId],
    (err, result) => {
      if (err) return cb(err);
      cb(null, { id: result.insertId, name, game_id: gameId });
    }
  );
};

exports.findPlayerById = (id, cb) => {
  db.query(
    'SELECT * FROM players WHERE id = ?',
    [id],
    (err, results) => {
      if (err) return cb(err);
      cb(null, results[0]);
    }
  );
};

exports.getPlayersByGameId = (gameId, cb) => {
  db.query(
    `SELECT id, name, bet, round_score AS roundScore, game_score AS gameScore
     FROM players WHERE game_id = ?`,
    [gameId],
    cb
  );
};

exports.setPlayerHand = (id, hand, cb) => {
  db.query(
    'UPDATE players SET hand = ? WHERE id = ?',
    [JSON.stringify(hand), id],
    cb
  );
};

exports.getPlayerHand = (id, cb) => {
  db.query(
    'SELECT hand FROM players WHERE id = ?',
    [id],
    (err, results) => {
      if (err) return cb(err);
      const hand = results[0]?.hand ? JSON.parse(results[0].hand) : [];
      cb(null, hand);
    }
  );
};

exports.setBet = (id, bet, cb) => {
  db.query(
    'UPDATE players SET bet = ? WHERE id = ?',
    [bet, id],
    cb
  );
};

exports.updateRoundScore = (id, inc, cb) => {
  db.query(
    'UPDATE players SET round_score = round_score + ? WHERE id = ?',
    [inc, id],
    cb
  );
};

exports.resetRound = (gameId, cb) => {
  db.query(
    'UPDATE players SET bet = NULL, round_score = 0 WHERE game_id = ?',
    [gameId],
    cb
  );
};

exports.updateGameScore = (id, delta, cb) => {
  db.query(
    'UPDATE players SET game_score = game_score + ? WHERE id = ?',
    [delta, id],
    cb
  );
};
