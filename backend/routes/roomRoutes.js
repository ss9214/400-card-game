const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');

router.post('/create', roomController.createRoom);
router.post('/join', roomController.joinRoom);
router.get('/:code', roomController.getRoomStatus);
router.get('/:code/players', roomController.getRoomPlayers);
router.post('/:code/select-game', roomController.selectGame);
router.post('/:code/deselect-game', roomController.deselectGame);
router.post('/:code/start-game', roomController.startGame);

module.exports = router;