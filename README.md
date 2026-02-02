# Multi-Game Platform (Dev Branch)

A Jackbox-style multiplayer card game platform supporting multiple card games. Currently features the 400 Card Game with plans to add Spades and other games.

🌐 **Live Site**: [https://sri-party-games.vercel.app/](https://sri-party-games.vercel.app)

## Architecture

### Tech Stack
- **Frontend**: React, Socket.io-client, Axios
- **Backend**: Node.js, Express, Socket.io
- **Database**: AWS DynamoDB
- **Deployment**: Vercel (frontend), AWS EC2 (backend)

### Current Structure
```
400-card-game/
├── frontend/           # React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── Home.js          # Landing page
│   │   │   ├── RoomLobby.js     # Game selection
│   │   │   ├── JoinGame.js      # Room joining
│   │   │   ├── Lobby.js         # Game lobby
│   │   │   ├── GamePlay.js      # 400 gameplay
│   │   │   └── GameFinished.js  # Results screen
│   │   ├── api.js               # REST API client
│   │   └── socket.js            # WebSocket client
│   └── public/cards/            # Card images
│
├── backend/            # Express server
│   ├── controllers/
│   │   ├── roomController.js    # Room management
│   │   └── gameController.js    # Game logic
│   ├── models/
│   │   ├── roomModel.js         # Room data access
│   │   ├── gameModel.js         # Game data access
│   │   └── playerModel.js       # Player data access
│   ├── routes/
│   │   ├── roomRoutes.js        # /api/rooms
│   │   └── gameRoutes.js        # /api/games
│   └── server.js                # Socket.io server
```

## Features

### Implemented
- ✅ Room-based multiplayer system
- ✅ Real-time gameplay with Socket.io
- ✅ 400 Card Game (4-player, hearts trump)
- ✅ Dynamic betting system with minimums based on score
- ✅ Round skipping functionality
- ✅ Win condition (41 points, both team players >= 0)
- ✅ AWS DynamoDB persistence
- ✅ Responsive card UI with drag & drop

### In Progress
- 🔄 Multi-game architecture refactoring
- 🔄 Game-specific rule engines

### Planned Features
- 📋 Spades game (spades trump, different scoring)
- 📋 Additional card games (Hearts, Euchre, etc.)
- 📋 Spectator mode
- 📋 Game replays
- 📋 Player statistics & leaderboards
- 📋 Custom room settings
- 📋 Mobile-responsive design improvements

## Development Setup

### Prerequisites
- Node.js 20.x or higher
- AWS account with DynamoDB access
- AWS credentials (Access Key ID, Secret Access Key)

### Environment Configuration

Create `backend/.env`:
```env
AWS_REGION=us-east-2
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
DYNAMODB_ROOMS_TABLE=rooms_dev
DYNAMODB_GAMES_TABLE=games_dev
DYNAMODB_PLAYERS_TABLE=players_dev
PORT=5001
```

Create `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:5001/api
REACT_APP_SOCKET_URL=http://localhost:5001
```

### Database Setup

Create DynamoDB tables:
```bash
cd backend
node setup-dynamodb.js
node create-rooms-table.js
```

This creates three tables:
- `rooms_dev` - Room management (partition key: `code`)
- `games_dev` - Game instances (partition key: `code`)
- `players_dev` - Player data (partition key: `id`, GSI: `game_id`)

### Installation & Running

**Backend:**
```bash
cd backend
npm install
npm start
```
Server runs on port 5001

**Frontend:**
```bash
cd frontend
npm install
npm start
```
Development server runs on port 3000

## Game Flow

1. **Create/Join Room** → Player creates/joins a room with a 5-character code
2. **Game Selection** → Host selects which game to play (currently only 400)
3. **Lobby** → Players wait until 4 players join
4. **Gameplay** → Betting phase → Playing tricks → Round completion
5. **Game Over** → Display winning team and scores

## API Endpoints

### Room Management
- `POST /api/rooms/create` - Create a new room
- `POST /api/rooms/join` - Join an existing room
- `GET /api/rooms/:code` - Get room status
- `POST /api/rooms/:code/select-game` - Select game type

### Game Management
- `POST /api/games/create` - Create game instance
- `POST /api/games/join` - Join game
- `GET /api/games/:code/players` - Get all players
- `POST /api/games/start` - Start the game
- `POST /api/games/bet` - Place a bet
- `POST /api/games/play-card` - Play a card
- `POST /api/games/finish-round` - Complete round

### Socket Events
- `join-lobby` - Join game lobby
- `select-game` - Broadcast game selection
- `game-selected` - Receive game selection
- `update-lobby` - Player list updates
- `bet-placed` - Bet notifications
- `card-played` - Card play notifications
- `trick-completed` - Trick results
- `round-finished` - Round completion
- `game-over` - Game end

## 400 Card Game Rules

### Overview
- 4 players in 2 teams (0+2 vs 1+3)
- Hearts are trump
- Win condition: Team reaches 41+ points with both players >= 0

### Gameplay
1. **Betting**: Each player bets 0-13 tricks
2. **Playing**: Follow suit if possible, trump with hearts
3. **Scoring**: 
   - Met bet: +5 + tricks won
   - Failed bet: -5 - (bet - tricks won)
   - Dynamic minimum bet: 2 + floor(score/10)

### Win Condition
- One team reaches 41+ points
- Both players on winning team must have >= 0 points

## Deployment

### Frontend (Vercel)
```bash
cd frontend
vercel deploy --prod
```

### Backend (AWS EC2)
```bash
# SSH to EC2 instance
ssh -i key.pem ubuntu@your-ec2-ip

# Setup with PM2
cd 400-card-game/backend
npm install
pm2 start server.js --name "400-backend"
pm2 save
pm2 startup
```

## Future Architecture (Multi-Game Support)

### Planned Structure
```
backend/games/
├── 400/
│   ├── rules.js       # Trump=hearts, win at 41
│   └── scoring.js     # Bet-based scoring
├── spades/
│   ├── rules.js       # Trump=spades, nil bids
│   └── scoring.js     # Bags system
└── shared/
    ├── cardUtils.js   # Deck, card comparison
    └── gameLogic.js   # Trick mechanics
```

### Game Configuration Interface
```javascript
{
  id: 'spades',
  name: 'Spades',
  trumpSuit: 'spades',
  numberOfPlayers: 4,
  winCondition: (players) => { ... },
  calculateScore: (bet, tricksWon) => { ... },
  minBet: 0,
  maxBet: 13
}
```

## Contributing

This is a personal project but open to ideas and suggestions.

## Known Issues

- ⚠️ Round skip requires proper synchronization
- ⚠️ Socket reconnection needs improvement
- ⚠️ No spectator mode yet

## License

MIT

---

**Current Branch**: Development  
**Last Updated**: January 2026
