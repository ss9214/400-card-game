/**
 * Imposter Game
 * A social deduction game where one player is the imposter with a different word
 */

const GameBase = require('../core/GameBase');
const { getWords } = require('./wordBank');

class GameImposter extends GameBase {
  static get id() { return 'imposter'; }
  static get name() { return 'Imposter'; }
  static get description() { return 'One player is secretly the imposter with a different word'; }
  static get minPlayers() { return 3; }
  static get maxPlayers() { return 10; }
  static get category() { return 'social-deduction'; }

  static getConfig() {
    return {
      id: 'imposter',
      name: 'Imposter',
      description: 'One player is secretly the imposter with a different word',
      minPlayers: 3,
      maxPlayers: 10,
      category: 'social-deduction',
      icon: '🕵️',
      options: [
        {
          id: 'difficulty',
          name: 'Difficulty Level for the Imposter',
          type: 'select',
          defaultValue: 'medium',
          choices: [
            { value: 'easy', label: 'Easy' },
            { value: 'medium', label: 'Medium' },
            { value: 'hard', label: 'Hard' }
          ]
        }
      ]
    };
  }

  constructor(players, gameCode) {
    super(gameCode, 'imposter');
    this.players = players.map(p => ({
      id: p.id || p.player_id,
      name: p.name,
      hasSeenWord: false,
      ready: false
    }));
    this.difficulty = 'easy'; // easy, medium, hard
    this.playMode = 'multi-device'; // single-device or multi-device
    this.currentPlayerIndex = 0; // For single-device mode
    this.wordRevealed = false;
    this.roundActive = false;
    this.roundFinished = false;
    this.imposterIndex = -1;
    this.imposterRevealed = false;
    this.imposterGuess = null;
    this.normalWord = '';
    this.imposterWord = '';
    this.playerWords = {}; // playerId -> word
    this.playerOrder = []; // For single-device mode
    this.winner = null; // 'imposters' or 'normal'
    this.state = 'setup'; // setup, active, guessing, finished
  }

  initialize() {
    this.state = 'setup'; // setup, active, guessing, finished
    this.players.forEach(player => {
      player.ready = false;
      player.hasSeenWord = false;
    });
  }

  /**
   * Handle game actions
   */
  handleAction(action, playerId, data) {
    switch (action) {
      case 'set-difficulty':
        return this.setDifficulty(data.difficulty);
      case 'set-play-mode':
        return this.setPlayMode(data.mode);
      case 'start-round':
        return this.startRound(data.difficulty);
      case 'finish-round':
        return this.finishRound();
      case 'imposter-guess':
        return this.submitImposterGuess(playerId, data.guess);
      case 'determine-winner':
        return this.determineWinner(data.imposterCaught);
      default:
        return { success: false, error: 'Unknown action' };
    }
  }

  setDifficulty(difficulty) {
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return { success: false, error: 'Invalid difficulty' };
    }
    this.difficulty = difficulty;
    return { success: true, difficulty };
  }

  setPlayMode(mode) {
    if (!['single-device', 'multi-device'].includes(mode)) {
      return { success: false, error: 'Invalid play mode' };
    }
    this.playMode = mode;
    return { success: true, mode };
  }

  startRound(difficulty) {
    if (this.state !== 'setup') {
      return { success: false, error: 'Game not in setup state' };
    }

    // Set difficulty if provided, otherwise use existing
    if (difficulty) {
      this.difficulty = difficulty;
    }

    // Select random imposter
    this.imposterIndex = Math.floor(Math.random() * this.players.length);
    
    // Get words based on difficulty
    const wordData = getWords(this.difficulty);
    this.normalWord = wordData.normalWord;
    this.imposterWord = wordData.imposterWord;
    
    // Assign words to players
    this.players.forEach((player, index) => {
      const word = index === this.imposterIndex ? this.imposterWord : this.normalWord;
      this.playerWords[player.id] = word;
      player.hasSeenWord = true;
    });

    this.roundActive = true;
    this.state = 'active';

    return {
      success: true,
      message: 'Round started - words assigned to players',
      difficulty: this.difficulty
    };
  }

  finishRound() {
    if (this.state !== 'active') {
      return { success: false, error: 'Round not active' };
    }

    this.roundFinished = true;
    this.imposterRevealed = true;
    this.state = 'guessing';

    return {
      success: true,
      imposterName: this.players[this.imposterIndex].name,
      imposterPlayerId: this.players[this.imposterIndex].id,
      message: 'Imposter revealed - waiting for imposter to guess the word'
    };
  }

  submitImposterGuess(playerId, guess) {
    if (this.state !== 'guessing') {
      return { success: false, error: 'Not in guessing phase' };
    }

    // Verify this is the imposter
    if (this.players[this.imposterIndex].id !== playerId) {
      return { success: false, error: 'Only the imposter can guess' };
    }

    this.imposterGuess = guess;

    return {
      success: true,
      guess,
      message: 'Imposter guess submitted'
    };
  }

  determineWinner(imposterCaught) {
    if (this.state !== 'guessing' || !this.imposterGuess) {
      return { success: false, error: 'Cannot determine winner yet' };
    }

    // Check if imposter guessed correctly (case-insensitive comparison)
    const imposterGuessedCorrectly = this.imposterGuess.toLowerCase().trim() === this.normalWord.toLowerCase().trim();

    // Imposters win if: 1) They weren't caught OR 2) They guessed the word correctly
    // Normal players win if: Imposter was caught AND didn't guess the word
    let winner;
    if (!imposterCaught || imposterGuessedCorrectly) {
      winner = 'imposters';
    } else {
      winner = 'normal';
    }

    this.winner = winner;
    this.state = 'finished';
    this.roundActive = false;

    return {
      success: true,
      winner,
      imposterGuessedCorrectly,
      imposterCaught,
      normalWord: this.normalWord,
      imposterWord: this.imposterWord,
      imposterGuess: this.imposterGuess
    };
  }

  checkWinCondition() {
    // No automatic win condition - host ends round manually
    return null;
  }

  getPlayerState(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) {
      console.log(`[Imposter getPlayerState] Player ${playerId} not found`);
      return null;
    }

    console.log(`[Imposter getPlayerState] Getting state for player ${playerId}`);
    console.log(`[Imposter getPlayerState] Game state: ${this.state}, Round active: ${this.roundActive}`);
    console.log(`[Imposter getPlayerState] Player word: ${this.playerWords[playerId]}`);

    const state = {
      playerId,
      playerName: player.name,
      difficulty: this.difficulty,
      playMode: this.playMode,
      gameState: this.state,
      roundActive: this.roundActive,
      players: this.players.map(p => ({
        id: p.id,
        name: p.name
      }))
    };

    // Show player their word when game is active
    if (this.state === 'active' && this.playerWords[playerId]) {
      state.myWord = this.playerWords[playerId];
      console.log(`[Imposter getPlayerState] Adding word to state: ${state.myWord}`);
    }

    // Show imposter info in guessing and finished states
    if (this.state === 'guessing' || this.state === 'finished') {
      state.imposterName = this.players[this.imposterIndex]?.name;
      state.imposterPlayerId = this.players[this.imposterIndex]?.id;
      state.isImposter = this.players[this.imposterIndex]?.id === playerId;
    }

    // Show results in finished state
    if (this.state === 'finished') {
      state.normalWord = this.normalWord;
      state.imposterWord = this.imposterWord;
      state.imposterGuess = this.imposterGuess;
      state.winner = this.winner;
    }

    console.log(`[Imposter getPlayerState] Returning state:`, JSON.stringify(state, null, 2));
    return state;
  }

  getPublicState() {
    return {
      gameType: 'imposter',
      difficulty: this.difficulty,
      playMode: this.playMode,
      state: this.state,
      roundActive: this.roundActive,
      playerCount: this.players.length,
      players: this.players.map(p => ({
        id: p.id,
        name: p.name
      })),
      imposterRevealed: this.imposterRevealed,
      roundFinished: this.roundFinished
    };
  }
}

module.exports = GameImposter;
