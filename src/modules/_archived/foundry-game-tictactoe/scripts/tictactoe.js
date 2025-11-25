/**
 * Tic-Tac-Toe for FoundryVTT
 * Uses Core Concepts abstraction layer
 */

// Module constants
const MODULE_ID = "foundry-game-tictactoe";
const MODULE_TITLE = "Tic-Tac-Toe";

/**
 * Core Concepts Mapping:
 * - sheets: Game state stored in world flags
 * - attributes: currentPlayer, turnCount, gameStatus, winner, board state
 * - types: Player roles (X or O)
 * - boards: 3x3 grid (canvas)
 * - tiles: 9 playable positions
 * - objects: X and O markers (tokens or drawings)
 * - rules: Win conditions, turn order
 * - events: moveMade, gameWon, gameDraw
 * - goals: Get 3 in a row
 * - sessions: Game lifecycle
 * - modes: Play mode
 * - systems: Turn-based gameplay, win detection
 */

class TicTacToeGame {
  constructor() {
    // Sheet (game state)
    this.gameState = {
      status: "not_started", // not_started, in_progress, completed
      currentPlayer: null,   // "X" or "O" (types)
      turnCount: 0,          // attribute
      winner: null,          // attribute
      board: Array(9).fill(null), // tiles state (9 tiles)
      playerX: null,         // User ID
      playerO: null          // User ID
    };
  }

  /**
   * Initialize game (session start)
   */
  async startGame(playerXId, playerOId) {
    this.gameState.status = "in_progress";
    this.gameState.currentPlayer = "X";
    this.gameState.turnCount = 1;
    this.gameState.playerX = playerXId;
    this.gameState.playerO = playerOId;
    this.gameState.board = Array(9).fill(null);

    await this.saveGameState();

    ui.notifications.info(`${MODULE_TITLE}: Game started! Player X's turn.`);

    // Event: gameStarted
    Hooks.callAll("tictactoe.gameStarted", this.gameState);
  }

  /**
   * Make a move (place marker on tile)
   * @param {number} tileIndex - Tile position (0-8)
   * @param {string} player - "X" or "O" (type)
   */
  async makeMove(tileIndex, player) {
    // Rule: Can't move if game not in progress
    if (this.gameState.status !== "in_progress") {
      ui.notifications.warn("Game is not in progress!");
      return false;
    }

    // Rule: Must be current player's turn
    if (player !== this.gameState.currentPlayer) {
      ui.notifications.warn(`Not your turn! Current player: ${this.gameState.currentPlayer}`);
      return false;
    }

    // Rule: Tile must be empty
    if (this.gameState.board[tileIndex] !== null) {
      ui.notifications.warn("That tile is already occupied!");
      return false;
    }

    // Place marker (object) on tile
    this.gameState.board[tileIndex] = player;
    this.gameState.turnCount++;

    // Event: moveMade
    Hooks.callAll("tictactoe.moveMade", {
      tileIndex,
      player,
      turnCount: this.gameState.turnCount
    });

    // Check win conditions (rules + goal)
    const winner = this.checkWinner();
    if (winner) {
      this.gameState.status = "completed";
      this.gameState.winner = winner;
      await this.saveGameState();

      ui.notifications.info(`${MODULE_TITLE}: Player ${winner} wins!`);

      // Event: gameWon
      Hooks.callAll("tictactoe.gameWon", { winner });
      return true;
    }

    // Check for draw (rule) - all 9 tiles filled with no winner
    if (!winner && this.gameState.board.every(tile => tile !== null)) {
      this.gameState.status = "completed";
      this.gameState.winner = "draw";
      await this.saveGameState();

      ui.notifications.info(`${MODULE_TITLE}: Game is a draw!`);

      // Event: gameDraw
      Hooks.callAll("tictactoe.gameDraw", {});
      return true;
    }

    // Switch turns (system)
    this.gameState.currentPlayer = (player === "X") ? "O" : "X";
    await this.saveGameState();

    ui.notifications.info(`Player ${this.gameState.currentPlayer}'s turn`);

    return true;
  }

  /**
   * Check win conditions (rules)
   * @returns {string|null} Winner ("X" or "O") or null
   */
  checkWinner() {
    const board = this.gameState.board;

    // Win patterns (3 in a row - goal)
    const winPatterns = [
      // Horizontal
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      // Vertical
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      // Diagonal
      [0, 4, 8],
      [2, 4, 6]
    ];

    for (const pattern of winPatterns) {
      const [a, b, c] = pattern;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a]; // Return winner ("X" or "O")
      }
    }

    return null;
  }

  /**
   * Save game state (sheet persistence)
   */
  async saveGameState() {
    await game.settings.set(MODULE_ID, "gameState", this.gameState);
  }

  /**
   * Load game state (sheet retrieval)
   */
  async loadGameState() {
    try {
      this.gameState = await game.settings.get(MODULE_ID, "gameState");
    } catch (e) {
      // No saved state, use defaults
      console.log(`${MODULE_ID}: No saved game state, using defaults`);
    }
  }

  /**
   * Reset game (new session)
   */
  async resetGame() {
    this.gameState = {
      status: "not_started",
      currentPlayer: null,
      turnCount: 0,
      winner: null,
      board: Array(9).fill(null),
      playerX: null,
      playerO: null
    };

    await this.saveGameState();

    ui.notifications.info(`${MODULE_TITLE}: Game reset`);

    // Event: gameReset
    Hooks.callAll("tictactoe.gameReset", {});
  }

  /**
   * Get current game state (for UI)
   */
  getGameState() {
    return this.gameState;
  }
}

/**
 * Tic-Tac-Toe UI Application
 * Uses FoundryVTT Application class for rendering
 */
class TicTacToeApp extends Application {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "tictactoe-app",
      title: game.i18n.localize("TICTACTOE.Title"),
      template: "modules/foundry-game-tictactoe/templates/game-board.html",
      width: 400,
      height: 500,
      resizable: false
    });
  }

  /**
   * Prepare data for template rendering
   */
  getData() {
    const gameState = tictactoeGame.getGameState();

    // Prepare tiles array with indices
    const tiles = gameState.board.map((value, index) => ({
      index,
      value
    }));

    // Generate status message
    let status;
    if (gameState.status === "not_started") {
      status = game.i18n.localize("TICTACTOE.NotStarted");
    } else if (gameState.status === "completed") {
      if (gameState.winner === "draw") {
        status = game.i18n.localize("TICTACTOE.Draw");
      } else {
        status = game.i18n.format("TICTACTOE.PlayerXWins", { player: gameState.winner });
      }
    } else {
      status = game.i18n.format("TICTACTOE.PlayerXTurn", { player: gameState.currentPlayer });
    }

    return {
      tiles,
      status
    };
  }

  /**
   * Activate event listeners
   */
  activateListeners(html) {
    super.activateListeners(html);

    // Tile click handler
    html.find(".tictactoe-tile").on("click", async (event) => {
      const tileIndex = parseInt(event.currentTarget.dataset.index);
      const currentPlayer = tictactoeGame.getGameState().currentPlayer;

      if (currentPlayer) {
        await tictactoeGame.makeMove(tileIndex, currentPlayer);
        this.render(false); // Re-render UI
      }
    });

    // New game button
    html.find(".tictactoe-new-game").on("click", async () => {
      const playerXId = game.user.id;
      const playerOId = game.user.id; // For single-player, both are same user
      await tictactoeGame.startGame(playerXId, playerOId);
      this.render(false);
    });

    // Reset game button
    html.find(".tictactoe-reset-game").on("click", async () => {
      await tictactoeGame.resetGame();
      this.render(false);
    });
  }
}

// Global instances
let tictactoeGame = null;
let tictactoeApp = null;

/**
 * Initialize module
 */
Hooks.once("init", function() {
  console.log(`${MODULE_ID}: Initializing ${MODULE_TITLE}`);

  // Register game state setting (sheet storage)
  game.settings.register(MODULE_ID, "gameState", {
    name: "Game State",
    scope: "world",
    config: false,
    type: Object,
    default: {
      status: "not_started",
      currentPlayer: null,
      turnCount: 0,
      winner: null,
      board: Array(9).fill(null),
      playerX: null,
      playerO: null
    }
  });

  console.log(`${MODULE_ID}: Initialized`);
});

/**
 * Setup module (after Foundry is ready)
 */
Hooks.once("ready", async function() {
  console.log(`${MODULE_ID}: Ready`);

  // Create game instance
  tictactoeGame = new TicTacToeGame();
  await tictactoeGame.loadGameState();

  // Create UI app instance
  tictactoeApp = new TicTacToeApp();

  // Expose to global scope for console/macro access
  game.tictactoe = tictactoeGame;
  game.tictactoeApp = tictactoeApp;

  // Add UI controls button
  Hooks.on("getSceneControlButtons", (controls) => {
    controls.push({
      name: "tictactoe",
      title: MODULE_TITLE,
      icon: "fas fa-hashtag",
      button: true,
      onClick: () => tictactoeApp.render(true)
    });
  });

  console.log(`${MODULE_ID}: Game loaded, status: ${tictactoeGame.getGameState().status}`);
});

/**
 * Hook listeners for UI updates
 */
Hooks.on("tictactoe.gameStarted", function() {
  if (tictactoeApp && tictactoeApp.rendered) {
    tictactoeApp.render(false);
  }
});

Hooks.on("tictactoe.moveMade", function() {
  if (tictactoeApp && tictactoeApp.rendered) {
    tictactoeApp.render(false);
  }
});

Hooks.on("tictactoe.gameWon", function() {
  if (tictactoeApp && tictactoeApp.rendered) {
    tictactoeApp.render(false);
  }
});

Hooks.on("tictactoe.gameDraw", function() {
  if (tictactoeApp && tictactoeApp.rendered) {
    tictactoeApp.render(false);
  }
});

Hooks.on("tictactoe.gameReset", function() {
  if (tictactoeApp && tictactoeApp.rendered) {
    tictactoeApp.render(false);
  }
});

// Export for use in macros/console
export { TicTacToeGame, TicTacToeApp, tictactoeGame, tictactoeApp };
