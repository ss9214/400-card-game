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
