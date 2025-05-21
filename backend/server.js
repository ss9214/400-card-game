const express = require('express');
const cors = require('cors');
require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const gameRoutes = require('./routes/gameRoutes');
app.use(cors());
app.use(express.json());
app.use('/api/games', gameRoutes);

// SOCKET.IO
const Game = require('./models/gameModel');
const Player = require('./models/playerModel');

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('join-lobby', async ({ gameCode, playerId }) => {
    socket.join(gameCode);
    const game = await new Promise(resolve => Game.findGameByCode(gameCode, (err, g) => resolve(g)));
    if (!game) return;

    Player.getPlayersByGameId(game.id, (err, players) => {
      if (!err) {
        io.to(gameCode).emit('update-lobby', players);
      }
    });
  });

  socket.on('start-game', ({ gameCode }) => {
    io.to(gameCode).emit('game-started');
  });
});

const port = process.env.PORT || 3001;
server.listen(port, () => console.log(`Server listening on port ${port}`));
