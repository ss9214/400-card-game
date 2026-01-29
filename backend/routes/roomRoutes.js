const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');

router.post('/create', roomController.createRoom);
router.post('/join', roomController.joinRoom);
router.get('/:code', roomController.getRoomStatus);
router.post('/:code/select-game', roomController.selectGame);

module.exports = router;