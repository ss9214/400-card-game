const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

router.post('/create', gameController.createGame);
router.post('/join', gameController.joinGame);
router.get('/:code', gameController.getGameStatus);
router.get('/:code/players', gameController.getGamePlayers);

module.exports = router;
