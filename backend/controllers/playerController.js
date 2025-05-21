const Player = require('../models/playerModel');

exports.getAllPlayers = (req, res) => {
  Player.getAll((err, players) => {
    if (err) return res.status(500).send(err);
    res.json(players);
  });
};

exports.createPlayer = (req, res) => {
  const { name } = req.body;
  Player.create(name, (err, result) => {
    if (err) return res.status(500).send(err);
    res.status(201).json({ id: result.insertId, name });
  });
};
