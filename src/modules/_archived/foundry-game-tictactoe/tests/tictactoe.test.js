/**
 * Tic-Tac-Toe Module Tests
 * Unit tests for game logic and Core Concepts validation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock FoundryVTT globals
global.game = {
  settings: {
    register: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
  },
  i18n: {
    localize: vi.fn((key) => key),
    format: vi.fn((key, data) => `${key}:${JSON.stringify(data)}`),
  },
  user: {
    id: 'test-user-1',
  },
};

global.Hooks = {
  once: vi.fn(),
  on: vi.fn(),
  callAll: vi.fn(),
};

global.ui = {
  notifications: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
};

global.foundry = {
  utils: {
    mergeObject: vi.fn((base, override) => ({ ...base, ...override })),
  },
};

global.Application = class Application {
  static get defaultOptions() {
    return {};
  }
  render() {}
  getData() {
    return {};
  }
  activateListeners() {}
};

// Import after mocking globals
import { TicTacToeGame } from '../scripts/tictactoe.js';

describe('TicTacToeGame - Core Concepts Validation', () => {
  let game;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create new game instance
    game = new TicTacToeGame();

    // Mock saveGameState to avoid actual settings calls
    game.saveGameState = vi.fn();
  });

  describe('Core Concept: sheets (game state persistence)', () => {
    it('should initialize with default game state', () => {
      expect(game.gameState).toEqual({
        status: 'not_started',
        currentPlayer: null,
        turnCount: 0,
        winner: null,
        board: Array(9).fill(null),
        playerX: null,
        playerO: null,
      });
    });

    it('should save game state when starting game', async () => {
      await game.startGame('player-x-id', 'player-o-id');
      expect(game.saveGameState).toHaveBeenCalled();
    });

    it('should save game state after each move', async () => {
      await game.startGame('player-x-id', 'player-o-id');
      game.saveGameState.mockClear();

      await game.makeMove(0, 'X');
      expect(game.saveGameState).toHaveBeenCalled();
    });
  });

  describe('Core Concept: attributes (currentPlayer, turnCount, winner, status)', () => {
    it('should track currentPlayer attribute', async () => {
      await game.startGame('player-x-id', 'player-o-id');
      expect(game.gameState.currentPlayer).toBe('X');

      await game.makeMove(0, 'X');
      expect(game.gameState.currentPlayer).toBe('O');
    });

    it('should increment turnCount attribute', async () => {
      await game.startGame('player-x-id', 'player-o-id');
      expect(game.gameState.turnCount).toBe(1);

      await game.makeMove(0, 'X');
      expect(game.gameState.turnCount).toBe(2);

      await game.makeMove(1, 'O');
      expect(game.gameState.turnCount).toBe(3);
    });

    it('should update status attribute through game lifecycle', async () => {
      expect(game.gameState.status).toBe('not_started');

      await game.startGame('player-x-id', 'player-o-id');
      expect(game.gameState.status).toBe('in_progress');

      // Complete game with win
      await game.makeMove(0, 'X'); // X
      await game.makeMove(3, 'O'); // O
      await game.makeMove(1, 'X'); // X
      await game.makeMove(4, 'O'); // O
      await game.makeMove(2, 'X'); // X wins (0,1,2)

      expect(game.gameState.status).toBe('completed');
    });

    it('should set winner attribute on game completion', async () => {
      await game.startGame('player-x-id', 'player-o-id');

      // X wins horizontal
      await game.makeMove(0, 'X');
      await game.makeMove(3, 'O');
      await game.makeMove(1, 'X');
      await game.makeMove(4, 'O');
      await game.makeMove(2, 'X');

      expect(game.gameState.winner).toBe('X');
    });
  });

  describe('Core Concept: types (player roles X or O)', () => {
    it('should enforce type validation (must be X or O)', async () => {
      await game.startGame('player-x-id', 'player-o-id');

      // Try invalid type
      const result = await game.makeMove(0, 'Z');
      expect(result).toBe(false);
    });

    it('should allow only current player type to move', async () => {
      await game.startGame('player-x-id', 'player-o-id');

      // X should move first
      const xResult = await game.makeMove(0, 'X');
      expect(xResult).toBe(true);

      // X cannot move twice
      const xAgain = await game.makeMove(1, 'X');
      expect(xAgain).toBe(false);
    });
  });

  describe('Core Concept: boards (3×3 grid)', () => {
    it('should maintain 3×3 board structure (9 tiles)', () => {
      expect(game.gameState.board).toHaveLength(9);
    });

    it('should initialize board with null values', () => {
      expect(game.gameState.board.every(tile => tile === null)).toBe(true);
    });
  });

  describe('Core Concept: tiles (9 playable positions)', () => {
    it('should accept valid tile indices (0-8)', async () => {
      await game.startGame('player-x-id', 'player-o-id');

      for (let i = 0; i < 9; i++) {
        const result = await game.makeMove(i, game.gameState.currentPlayer);
        if (game.gameState.status === 'in_progress') {
          expect(result).toBe(true);
        }
      }
    });

    it('should reject moves on occupied tiles', async () => {
      await game.startGame('player-x-id', 'player-o-id');

      await game.makeMove(0, 'X');
      const result = await game.makeMove(0, 'O');

      expect(result).toBe(false);
      expect(global.ui.notifications.warn).toHaveBeenCalledWith(
        'That tile is already occupied!'
      );
    });
  });

  describe('Core Concept: objects (X and O markers)', () => {
    it('should place marker objects on tiles', async () => {
      await game.startGame('player-x-id', 'player-o-id');

      await game.makeMove(0, 'X');
      expect(game.gameState.board[0]).toBe('X');

      await game.makeMove(1, 'O');
      expect(game.gameState.board[1]).toBe('O');
    });

    it('should preserve placed markers', async () => {
      await game.startGame('player-x-id', 'player-o-id');

      await game.makeMove(4, 'X'); // Center
      await game.makeMove(0, 'O'); // Top-left

      expect(game.gameState.board[4]).toBe('X');
      expect(game.gameState.board[0]).toBe('O');
    });
  });

  describe('Core Concept: rules (win conditions, turn order, occupancy)', () => {
    it('should enforce turn order rule', async () => {
      await game.startGame('player-x-id', 'player-o-id');

      await game.makeMove(0, 'X');
      const result = await game.makeMove(1, 'X'); // X tries to move twice

      expect(result).toBe(false);
    });

    it('should enforce game-in-progress rule', async () => {
      const result = await game.makeMove(0, 'X');
      expect(result).toBe(false);
      expect(global.ui.notifications.warn).toHaveBeenCalledWith(
        'Game is not in progress!'
      );
    });

    it('should enforce tile occupancy rule', async () => {
      await game.startGame('player-x-id', 'player-o-id');

      await game.makeMove(0, 'X');
      const result = await game.makeMove(0, 'O');

      expect(result).toBe(false);
    });

    it('should detect horizontal win (rule)', async () => {
      await game.startGame('player-x-id', 'player-o-id');

      // X: 0, 1, 2 (top row)
      // O: 3, 4
      await game.makeMove(0, 'X');
      await game.makeMove(3, 'O');
      await game.makeMove(1, 'X');
      await game.makeMove(4, 'O');
      await game.makeMove(2, 'X');

      expect(game.gameState.winner).toBe('X');
    });

    it('should detect vertical win (rule)', async () => {
      await game.startGame('player-x-id', 'player-o-id');

      // O: 0, 3, 6 (left column)
      // X: 1, 2
      await game.makeMove(1, 'X');
      await game.makeMove(0, 'O');
      await game.makeMove(2, 'X');
      await game.makeMove(3, 'O');
      await game.makeMove(4, 'X');
      await game.makeMove(6, 'O');

      expect(game.gameState.winner).toBe('O');
    });

    it('should detect diagonal win (rule)', async () => {
      await game.startGame('player-x-id', 'player-o-id');

      // X: 0, 4, 8 (top-left to bottom-right)
      // O: 1, 2
      await game.makeMove(0, 'X');
      await game.makeMove(1, 'O');
      await game.makeMove(4, 'X');
      await game.makeMove(2, 'O');
      await game.makeMove(8, 'X');

      expect(game.gameState.winner).toBe('X');
    });

    it('should detect draw (rule)', async () => {
      await game.startGame('player-x-id', 'player-o-id');

      // Fill board with no winner
      // X X O
      // O O X
      // X O X
      await game.makeMove(0, 'X');
      await game.makeMove(3, 'O');
      await game.makeMove(1, 'X');
      await game.makeMove(4, 'O');
      await game.makeMove(5, 'X');
      await game.makeMove(2, 'O');
      await game.makeMove(6, 'X');
      await game.makeMove(7, 'O');
      await game.makeMove(8, 'X');

      expect(game.gameState.winner).toBe('draw');
      expect(game.gameState.status).toBe('completed');
    });
  });

  describe('Core Concept: events (gameStarted, moveMade, gameWon, gameDraw, gameReset)', () => {
    it('should emit gameStarted event', async () => {
      await game.startGame('player-x-id', 'player-o-id');

      expect(global.Hooks.callAll).toHaveBeenCalledWith(
        'tictactoe.gameStarted',
        game.gameState
      );
    });

    it('should emit moveMade event on each move', async () => {
      await game.startGame('player-x-id', 'player-o-id');
      global.Hooks.callAll.mockClear();

      await game.makeMove(0, 'X');

      expect(global.Hooks.callAll).toHaveBeenCalledWith(
        'tictactoe.moveMade',
        expect.objectContaining({
          tileIndex: 0,
          player: 'X',
          turnCount: 2,
        })
      );
    });

    it('should emit gameWon event on win', async () => {
      await game.startGame('player-x-id', 'player-o-id');

      // X wins
      await game.makeMove(0, 'X');
      await game.makeMove(3, 'O');
      await game.makeMove(1, 'X');
      await game.makeMove(4, 'O');
      await game.makeMove(2, 'X');

      expect(global.Hooks.callAll).toHaveBeenCalledWith(
        'tictactoe.gameWon',
        { winner: 'X' }
      );
    });

    it('should emit gameDraw event on draw', async () => {
      await game.startGame('player-x-id', 'player-o-id');

      // Draw game
      await game.makeMove(0, 'X');
      await game.makeMove(3, 'O');
      await game.makeMove(1, 'X');
      await game.makeMove(4, 'O');
      await game.makeMove(5, 'X');
      await game.makeMove(2, 'O');
      await game.makeMove(6, 'X');
      await game.makeMove(7, 'O');
      await game.makeMove(8, 'X');

      expect(global.Hooks.callAll).toHaveBeenCalledWith(
        'tictactoe.gameDraw',
        {}
      );
    });

    it('should emit gameReset event', async () => {
      await game.resetGame();

      expect(global.Hooks.callAll).toHaveBeenCalledWith(
        'tictactoe.gameReset',
        {}
      );
    });
  });

  describe('Core Concept: goals (get 3 in a row)', () => {
    it('should achieve goal with 3 in a row horizontally', async () => {
      await game.startGame('player-x-id', 'player-o-id');

      await game.makeMove(0, 'X');
      await game.makeMove(3, 'O');
      await game.makeMove(1, 'X');
      await game.makeMove(4, 'O');
      await game.makeMove(2, 'X'); // Goal achieved!

      expect(game.gameState.winner).toBe('X');
      expect(game.gameState.status).toBe('completed');
    });

    it('should achieve goal with 3 in a row vertically', async () => {
      await game.startGame('player-x-id', 'player-o-id');

      await game.makeMove(1, 'X');
      await game.makeMove(0, 'O');
      await game.makeMove(2, 'X');
      await game.makeMove(3, 'O');
      await game.makeMove(4, 'X');
      await game.makeMove(6, 'O'); // Goal achieved!

      expect(game.gameState.winner).toBe('O');
    });

    it('should achieve goal with 3 in a row diagonally', async () => {
      await game.startGame('player-x-id', 'player-o-id');

      await game.makeMove(0, 'X');
      await game.makeMove(1, 'O');
      await game.makeMove(4, 'X');
      await game.makeMove(2, 'O');
      await game.makeMove(8, 'X'); // Goal achieved!

      expect(game.gameState.winner).toBe('X');
    });
  });

  describe('Core Concept: sessions (game lifecycle)', () => {
    it('should manage session lifecycle: not_started → in_progress → completed', async () => {
      // Session: not_started
      expect(game.gameState.status).toBe('not_started');

      // Session: start
      await game.startGame('player-x-id', 'player-o-id');
      expect(game.gameState.status).toBe('in_progress');

      // Session: play to completion
      await game.makeMove(0, 'X');
      await game.makeMove(3, 'O');
      await game.makeMove(1, 'X');
      await game.makeMove(4, 'O');
      await game.makeMove(2, 'X');

      // Session: completed
      expect(game.gameState.status).toBe('completed');
    });

    it('should prevent moves after session completion', async () => {
      await game.startGame('player-x-id', 'player-o-id');

      // Complete game
      await game.makeMove(0, 'X');
      await game.makeMove(3, 'O');
      await game.makeMove(1, 'X');
      await game.makeMove(4, 'O');
      await game.makeMove(2, 'X');

      // Try to move after completion
      const result = await game.makeMove(5, 'O');
      expect(result).toBe(false);
    });

    it('should start new session with resetGame', async () => {
      await game.startGame('player-x-id', 'player-o-id');
      await game.makeMove(0, 'X');

      await game.resetGame();

      expect(game.gameState.status).toBe('not_started');
      expect(game.gameState.board).toEqual(Array(9).fill(null));
    });
  });

  describe('Core Concept: modes (play mode)', () => {
    it('should support play mode', async () => {
      await game.startGame('player-x-id', 'player-o-id');

      // Play mode: players alternate moves
      expect(game.gameState.status).toBe('in_progress');
      expect(game.gameState.currentPlayer).toBe('X');
    });
  });

  describe('Core Concept: systems (turn-based gameplay, win detection)', () => {
    it('should implement turn-based system', async () => {
      await game.startGame('player-x-id', 'player-o-id');

      expect(game.gameState.currentPlayer).toBe('X');
      await game.makeMove(0, 'X');

      expect(game.gameState.currentPlayer).toBe('O');
      await game.makeMove(1, 'O');

      expect(game.gameState.currentPlayer).toBe('X');
    });

    it('should implement win detection system', async () => {
      await game.startGame('player-x-id', 'player-o-id');

      // System checks for win after each move
      await game.makeMove(0, 'X');
      expect(game.checkWinner()).toBeNull();

      await game.makeMove(3, 'O');
      expect(game.checkWinner()).toBeNull();

      await game.makeMove(1, 'X');
      expect(game.checkWinner()).toBeNull();

      await game.makeMove(4, 'O');
      expect(game.checkWinner()).toBeNull();

      await game.makeMove(2, 'X');
      expect(game.checkWinner()).toBe('X'); // System detects win
    });

    it('should test all 8 win patterns', () => {
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
        [2, 4, 6],
      ];

      winPatterns.forEach((pattern) => {
        game.gameState.board = Array(9).fill(null);
        pattern.forEach(index => {
          game.gameState.board[index] = 'X';
        });

        expect(game.checkWinner()).toBe('X');
      });
    });
  });
});

describe('TicTacToeGame - Edge Cases', () => {
  let game;

  beforeEach(() => {
    vi.clearAllMocks();
    game = new TicTacToeGame();
    game.saveGameState = vi.fn();
  });

  it('should handle rapid consecutive moves correctly', async () => {
    await game.startGame('player-x-id', 'player-o-id');

    // Try to make multiple moves rapidly
    const promises = [
      game.makeMove(0, 'X'),
      game.makeMove(1, 'X'), // Should fail (wrong turn)
      game.makeMove(2, 'X'), // Should fail (wrong turn)
    ];

    const results = await Promise.all(promises);
    expect(results[0]).toBe(true);
    expect(results[1]).toBe(false);
    expect(results[2]).toBe(false);
  });

  it('should handle out-of-bounds tile indices gracefully', async () => {
    await game.startGame('player-x-id', 'player-o-id');

    // These shouldn't crash, just return false or do nothing
    await game.makeMove(-1, 'X');
    await game.makeMove(9, 'X');
    await game.makeMove(100, 'X');

    // Board should be unchanged
    expect(game.gameState.board.every(tile => tile === null)).toBe(true);
  });

  it('should handle null/undefined player gracefully', async () => {
    await game.startGame('player-x-id', 'player-o-id');

    const result = await game.makeMove(0, null);
    expect(result).toBe(false);
  });
});
