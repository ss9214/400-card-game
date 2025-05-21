const express = require('express');
const router = express.Router();
const playerController = require('../controllers/playerController');

router.get('/', playerController.getAllPlayers);
router.post('/', playerController.createPlayer);

module.exports = router;
