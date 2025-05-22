// server/routes/gameRoutes.js
const express = require('express');
const router  = express.Router();
const gameController    = require('../controllers/gameController');
const Game = require('../models/gameModel');

router.post('/create',          gameController.createGame);
router.post('/join',            gameController.joinGame);
router.get('/:code',            gameController.getGameStatus);
router.get('/:code/players',    gameController.getGamePlayers);
router.get('/hand/:playerId',   gameController.getPlayerHand);

// bets & scoring
router.post('/bet',             gameController.placeBet);
router.get('/bets/:code',       gameController.getBets);
router.post('/trick-win',       gameController.recordTrickWin);
router.post('/finish-round/:code', gameController.finishRound);

router.get('/:code/state', (req, res) => {
  Game.getGameState(req.params.code, (err, state) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(state);
  });
});

module.exports = router;
