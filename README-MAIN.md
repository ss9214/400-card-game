# 400 Card Game Online

🃏 **Play the classic 400 card game with friends online!**

🌐 **[Play Now](https://400-card-game.vercel.app/)**

## About

400 Card Game is a multiplayer card game platform where you and three friends can play the classic trick-taking game online in real-time. Create a room, share the code with your friends, and start playing!

## How to Play

### Getting Started
1. Visit [https://400-card-game.vercel.app/](https://400-card-game.vercel.app/)
2. Click **"Create Room"** and enter your name
3. Share the 5-character room code with 3 friends
4. Once 4 players join, click **"Start Game"**

### Game Rules

**400** is a 4-player trick-taking card game played in teams:
- **Teams**: Players 0 & 2 vs Players 1 & 3
- **Trump Suit**: Hearts are always trump
- **Goal**: First team to reach 41+ points (with both players >= 0) wins

#### Round Flow
1. **Betting Phase**: Each player bets how many tricks they'll win (0-13)
2. **Playing Phase**: Play cards following suit when possible
3. **Scoring**: Points awarded based on whether you met your bet

#### Scoring Rules
- **Met your bet**: +5 points + number of tricks won
- **Failed your bet**: -5 points - (bet - tricks won)
- **Minimum bet**: Increases as your score increases (2 + score/10)

#### Card Ranking
- **Trump (Hearts)**: Ace > King > Queen > Jack > 10 > ... > 2
- **Other Suits**: Same ranking within suit
- Must follow suit if possible, otherwise can play any card

## Features

✅ Real-time multiplayer gameplay  
✅ Create private rooms with shareable codes  
✅ Dynamic betting minimums based on score  
✅ Skip rounds when needed  
✅ Persistent game state (survive refreshes)  
✅ Clean, intuitive card interface  

## Tech Stack

Built with modern web technologies:
- React frontend
- Node.js + Express backend
- Socket.io for real-time communication
- AWS DynamoDB for data persistence
- Deployed on Vercel & AWS EC2

## Coming Soon

🚀 More games (Spades, Hearts, Social Deduction Games)  
🚀 Game statistics & leaderboards  
🚀 Mobile-optimized design  

## Support

Found a bug or have a feature request? Feel free to open an issue on GitHub.

## Local Development

Want to run this locally? Check out the [Development README](README.md) for setup instructions.

---

**Enjoy playing 400 with your friends!** 🎴

*Created with ❤️ for card game enthusiasts*
