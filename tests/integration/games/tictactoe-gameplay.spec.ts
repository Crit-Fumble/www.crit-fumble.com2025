/**
 * Tic-Tac-Toe Game Integration Tests
 *
 * Tests the foundry-game-tictactoe module gameplay in a FoundryVTT environment.
 * Screenshots saved to: tests/screenshots/game/tic-tac-toe/mode/*
 * Videos saved to: tests/videos/game/tic-tac-toe/mode/*
 */

import { test, expect } from '../../utils/fixtures';

// Test configuration
const MODULE_ID = 'foundry-game-tictactoe';
const GAME_TITLE = 'Tic-Tac-Toe';
const BASE_SCREENSHOT_PATH = 'game/tic-tac-toe/mode';

/**
 * NOTE: These tests assume a FoundryVTT test environment is available.
 * For now, these are placeholder tests that demonstrate the structure.
 *
 * To run these tests against actual FoundryVTT:
 * 1. Set up FoundryVTT test server on localhost
 * 2. Install foundry-core-concepts and foundry-game-tictactoe modules
 * 3. Configure PLAYWRIGHT_FOUNDRY_URL environment variable
 * 4. Update page navigation to FoundryVTT world URL
 */

test.describe('Tic-Tac-Toe: Module Initialization', () => {
  test.skip('should load module without errors', async ({ page, screenshotHelper }) => {
    // Navigate to FoundryVTT world with module enabled
    await page.goto(process.env.PLAYWRIGHT_FOUNDRY_URL || 'http://localhost:30000/game');
    await page.waitForLoadState('networkidle');

    // Wait for Foundry to fully initialize
    await page.waitForFunction(() => {
      return typeof (window as any).game !== 'undefined' &&
             (window as any).game.ready;
    }, { timeout: 30000 });

    // Capture initial state
    await screenshotHelper.capture(`${BASE_SCREENSHOT_PATH}/initialization/foundry-loaded`);

    // Verify module is loaded
    const moduleLoaded = await page.evaluate((moduleId) => {
      return (window as any).game.modules.get(moduleId)?.active === true;
    }, MODULE_ID);

    expect(moduleLoaded).toBe(true);

    // Check console for initialization logs
    const logs = await page.evaluate(() => {
      return (window as any).console._logs || [];
    });

    await screenshotHelper.capture(`${BASE_SCREENSHOT_PATH}/initialization/console-logs`);
  });

  test.skip('should show hashtag button in scene controls', async ({ page, screenshotHelper }) => {
    await page.goto(process.env.PLAYWRIGHT_FOUNDRY_URL || 'http://localhost:30000/game');
    await page.waitForLoadState('networkidle');

    // Wait for scene controls to render
    await page.waitForSelector('#controls', { timeout: 10000 });

    // Capture scene controls
    await screenshotHelper.captureElement(
      '#controls',
      `${BASE_SCREENSHOT_PATH}/initialization/scene-controls`
    );

    // Verify hashtag button exists
    const hashtagButton = page.locator('#controls [data-tool="tictactoe"]');
    await expect(hashtagButton).toBeVisible();

    // Capture button close-up
    await screenshotHelper.captureStates(
      `${BASE_SCREENSHOT_PATH}/initialization/hashtag-button`,
      [
        {
          name: 'default',
          action: async () => {
            await hashtagButton.waitFor({ state: 'visible' });
          }
        },
        {
          name: 'hover',
          action: async () => {
            await hashtagButton.hover();
            await page.waitForTimeout(200);
          }
        }
      ]
    );
  });
});

test.describe('Tic-Tac-Toe: Opening Game Window', () => {
  test.skip('should open game window when clicking hashtag button', async ({ page, screenshotHelper }) => {
    await page.goto(process.env.PLAYWRIGHT_FOUNDRY_URL || 'http://localhost:30000/game');
    await page.waitForLoadState('networkidle');

    // Click hashtag button
    const hashtagButton = page.locator('#controls [data-tool="tictactoe"]');
    await hashtagButton.click();

    // Wait for game window to appear
    const gameWindow = page.locator('#tictactoe-app');
    await gameWindow.waitFor({ state: 'visible', timeout: 5000 });

    // Capture opened window
    await screenshotHelper.capture(`${BASE_SCREENSHOT_PATH}/window/opened`);

    // Verify window elements
    await expect(gameWindow).toBeVisible();
    await expect(gameWindow.locator('.tictactoe-status')).toContainText('Game Not Started');

    // Capture window details
    await screenshotHelper.captureElement(
      '#tictactoe-app',
      `${BASE_SCREENSHOT_PATH}/window/initial-state`
    );

    // Verify all UI elements present
    await expect(gameWindow.locator('.tictactoe-board')).toBeVisible();
    await expect(gameWindow.locator('.tictactoe-controls')).toBeVisible();
    await expect(gameWindow.locator('button:has-text("New Game")')).toBeVisible();
    await expect(gameWindow.locator('button:has-text("Reset Game")')).toBeVisible();

    // Verify 9 tiles
    const tiles = gameWindow.locator('.tictactoe-tile');
    await expect(tiles).toHaveCount(9);
  });

  test.skip('should have correct window dimensions', async ({ page, screenshotHelper }) => {
    await page.goto(process.env.PLAYWRIGHT_FOUNDRY_URL || 'http://localhost:30000/game');
    await page.waitForLoadState('networkidle');

    // Open window
    await page.click('#controls [data-tool="tictactoe"]');
    const gameWindow = page.locator('#tictactoe-app');
    await gameWindow.waitFor({ state: 'visible' });

    // Check dimensions (should be 400x500)
    const box = await gameWindow.boundingBox();
    expect(box?.width).toBeCloseTo(400, -1); // Within 10px
    expect(box?.height).toBeCloseTo(500, -1);

    await screenshotHelper.capture(`${BASE_SCREENSHOT_PATH}/window/dimensions`);
  });
});

test.describe('Tic-Tac-Toe: New Game Flow', () => {
  test.skip('should start new game and update status', async ({ page, screenshotHelper, videoHelper }) => {
    await page.goto(process.env.PLAYWRIGHT_FOUNDRY_URL || 'http://localhost:30000/game');
    await page.waitForLoadState('networkidle');

    // Start video recording
    await videoHelper.startRecording();

    // Open window
    await page.click('#controls [data-tool="tictactoe"]');
    const gameWindow = page.locator('#tictactoe-app');
    await gameWindow.waitFor({ state: 'visible' });

    // Capture before starting
    await screenshotHelper.capture(`${BASE_SCREENSHOT_PATH}/new-game/before-start`);

    // Click New Game button
    await gameWindow.locator('button:has-text("New Game")').click();

    // Wait for status update
    await page.waitForTimeout(500);

    // Capture after starting
    await screenshotHelper.capture(`${BASE_SCREENSHOT_PATH}/new-game/after-start`);

    // Verify status changed to "Player X's Turn"
    const status = gameWindow.locator('.tictactoe-status');
    await expect(status).toContainText("Player X's Turn");

    // Stop video
    await videoHelper.stopRecording(`${BASE_SCREENSHOT_PATH}/new-game-flow`);
  });

  test.skip('should show notification when game starts', async ({ page, screenshotHelper }) => {
    await page.goto(process.env.PLAYWRIGHT_FOUNDRY_URL || 'http://localhost:30000/game');
    await page.waitForLoadState('networkidle');

    // Open window and start game
    await page.click('#controls [data-tool="tictactoe"]');
    const gameWindow = page.locator('#tictactoe-app');
    await gameWindow.waitFor({ state: 'visible' });

    await gameWindow.locator('button:has-text("New Game")').click();

    // Wait for notification
    const notification = page.locator('#notifications .notification');
    await notification.waitFor({ state: 'visible', timeout: 2000 });

    await screenshotHelper.capture(`${BASE_SCREENSHOT_PATH}/new-game/notification`);

    // Verify notification text
    await expect(notification).toContainText("Game started");
  });
});

test.describe('Tic-Tac-Toe: Gameplay - Move Placement', () => {
  test.skip('should place X marker on first click', async ({ page, screenshotHelper }) => {
    await page.goto(process.env.PLAYWRIGHT_FOUNDRY_URL || 'http://localhost:30000/game');
    await page.waitForLoadState('networkidle');

    // Setup: Open window and start game
    await page.click('#controls [data-tool="tictactoe"]');
    const gameWindow = page.locator('#tictactoe-app');
    await gameWindow.waitFor({ state: 'visible' });
    await gameWindow.locator('button:has-text("New Game")').click();
    await page.waitForTimeout(500);

    // Click first tile (top-left, index 0)
    const firstTile = gameWindow.locator('.tictactoe-tile').nth(0);
    await firstTile.click();
    await page.waitForTimeout(300);

    // Capture move
    await screenshotHelper.capture(`${BASE_SCREENSHOT_PATH}/gameplay/move-01-x-topleft`);

    // Verify X appears
    await expect(firstTile).toHaveClass(/x/);
    await expect(firstTile).toContainText('X');

    // Verify turn changed
    const status = gameWindow.locator('.tictactoe-status');
    await expect(status).toContainText("Player O's Turn");
  });

  test.skip('should place O marker on second click', async ({ page, screenshotHelper }) => {
    await page.goto(process.env.PLAYWRIGHT_FOUNDRY_URL || 'http://localhost:30000/game');
    await page.waitForLoadState('networkidle');

    // Setup: Open window, start game, make first move
    await page.click('#controls [data-tool="tictactoe"]');
    const gameWindow = page.locator('#tictactoe-app');
    await gameWindow.waitFor({ state: 'visible' });
    await gameWindow.locator('button:has-text("New Game")').click();
    await page.waitForTimeout(500);

    // X moves to top-left
    await gameWindow.locator('.tictactoe-tile').nth(0).click();
    await page.waitForTimeout(300);

    // O moves to center
    const centerTile = gameWindow.locator('.tictactoe-tile').nth(4);
    await centerTile.click();
    await page.waitForTimeout(300);

    // Capture state
    await screenshotHelper.capture(`${BASE_SCREENSHOT_PATH}/gameplay/move-02-o-center`);

    // Verify O appears
    await expect(centerTile).toHaveClass(/o/);
    await expect(centerTile).toContainText('O');

    // Verify turn changed back to X
    const status = gameWindow.locator('.tictactoe-status');
    await expect(status).toContainText("Player X's Turn");
  });

  test.skip('should complete a move sequence with video', async ({ page, screenshotHelper, videoHelper }) => {
    await page.goto(process.env.PLAYWRIGHT_FOUNDRY_URL || 'http://localhost:30000/game');
    await page.waitForLoadState('networkidle');

    await videoHelper.startRecording();

    // Setup
    await page.click('#controls [data-tool="tictactoe"]');
    const gameWindow = page.locator('#tictactoe-app');
    await gameWindow.waitFor({ state: 'visible' });
    await gameWindow.locator('button:has-text("New Game")').click();
    await page.waitForTimeout(500);

    // Play sequence: X(0), O(4), X(1), O(3), X(5)
    const moves = [
      { index: 0, player: 'X', name: 'move-01-x-0' },
      { index: 4, player: 'O', name: 'move-02-o-4' },
      { index: 1, player: 'X', name: 'move-03-x-1' },
      { index: 3, player: 'O', name: 'move-04-o-3' },
      { index: 5, player: 'X', name: 'move-05-x-5' }
    ];

    for (const move of moves) {
      await gameWindow.locator('.tictactoe-tile').nth(move.index).click();
      await page.waitForTimeout(500);
      await screenshotHelper.capture(`${BASE_SCREENSHOT_PATH}/gameplay/${move.name}`);
    }

    await screenshotHelper.capture(`${BASE_SCREENSHOT_PATH}/gameplay/sequence-complete`);
    await videoHelper.stopRecording(`${BASE_SCREENSHOT_PATH}/move-sequence`);
  });
});

test.describe('Tic-Tac-Toe: Tile Interaction States', () => {
  test.skip('should show hover state on empty tiles', async ({ page, screenshotHelper }) => {
    await page.goto(process.env.PLAYWRIGHT_FOUNDRY_URL || 'http://localhost:30000/game');
    await page.waitForLoadState('networkidle');

    // Setup
    await page.click('#controls [data-tool="tictactoe"]');
    const gameWindow = page.locator('#tictactoe-app');
    await gameWindow.waitFor({ state: 'visible' });
    await gameWindow.locator('button:has-text("New Game")').click();
    await page.waitForTimeout(500);

    const emptyTile = gameWindow.locator('.tictactoe-tile').nth(4);

    await screenshotHelper.captureStates(
      `${BASE_SCREENSHOT_PATH}/interactions/empty-tile`,
      [
        {
          name: 'default',
          action: async () => {
            await emptyTile.waitFor({ state: 'visible' });
          }
        },
        {
          name: 'hover',
          action: async () => {
            await emptyTile.hover();
            await page.waitForTimeout(200);
          }
        }
      ]
    );
  });

  test.skip('should show not-allowed cursor on occupied tiles', async ({ page, screenshotHelper }) => {
    await page.goto(process.env.PLAYWRIGHT_FOUNDRY_URL || 'http://localhost:30000/game');
    await page.waitForLoadState('networkidle');

    // Setup and place marker
    await page.click('#controls [data-tool="tictactoe"]');
    const gameWindow = page.locator('#tictactoe-app');
    await gameWindow.waitFor({ state: 'visible' });
    await gameWindow.locator('button:has-text("New Game")').click();
    await page.waitForTimeout(500);

    // Place X
    await gameWindow.locator('.tictactoe-tile').nth(0).click();
    await page.waitForTimeout(300);

    const occupiedTile = gameWindow.locator('.tictactoe-tile').nth(0);

    // Try to click occupied tile
    await occupiedTile.click();
    await page.waitForTimeout(200);

    await screenshotHelper.capture(`${BASE_SCREENSHOT_PATH}/interactions/occupied-tile-error`);

    // Verify error notification
    const notification = page.locator('#notifications .notification.warning');
    await expect(notification).toContainText('already occupied');
  });
});

test.describe('Tic-Tac-Toe: Win Conditions', () => {
  test.skip('should detect horizontal win (top row)', async ({ page, screenshotHelper, videoHelper }) => {
    await page.goto(process.env.PLAYWRIGHT_FOUNDRY_URL || 'http://localhost:30000/game');
    await page.waitForLoadState('networkidle');

    await videoHelper.startRecording();

    // Setup
    await page.click('#controls [data-tool="tictactoe"]');
    const gameWindow = page.locator('#tictactoe-app');
    await gameWindow.waitFor({ state: 'visible' });
    await gameWindow.locator('button:has-text("New Game")').click();
    await page.waitForTimeout(500);

    // Play winning sequence: X(0), O(3), X(1), O(4), X(2) - X wins top row
    await gameWindow.locator('.tictactoe-tile').nth(0).click();
    await page.waitForTimeout(500);
    await gameWindow.locator('.tictactoe-tile').nth(3).click();
    await page.waitForTimeout(500);
    await gameWindow.locator('.tictactoe-tile').nth(1).click();
    await page.waitForTimeout(500);
    await gameWindow.locator('.tictactoe-tile').nth(4).click();
    await page.waitForTimeout(500);
    await gameWindow.locator('.tictactoe-tile').nth(2).click();
    await page.waitForTimeout(500);

    await screenshotHelper.capture(`${BASE_SCREENSHOT_PATH}/win-conditions/horizontal-top-row`);

    // Verify win status
    const status = gameWindow.locator('.tictactoe-status');
    await expect(status).toContainText('Player X Wins');

    await videoHelper.stopRecording(`${BASE_SCREENSHOT_PATH}/win-horizontal-top`);
  });

  test.skip('should detect vertical win (left column)', async ({ page, screenshotHelper }) => {
    await page.goto(process.env.PLAYWRIGHT_FOUNDRY_URL || 'http://localhost:30000/game');
    await page.waitForLoadState('networkidle');

    // Setup
    await page.click('#controls [data-tool="tictactoe"]');
    const gameWindow = page.locator('#tictactoe-app');
    await gameWindow.waitFor({ state: 'visible' });
    await gameWindow.locator('button:has-text("New Game")').click();
    await page.waitForTimeout(500);

    // Play: X(1), O(0), X(2), O(3), X(4), O(6) - O wins left column
    await gameWindow.locator('.tictactoe-tile').nth(1).click();
    await page.waitForTimeout(500);
    await gameWindow.locator('.tictactoe-tile').nth(0).click();
    await page.waitForTimeout(500);
    await gameWindow.locator('.tictactoe-tile').nth(2).click();
    await page.waitForTimeout(500);
    await gameWindow.locator('.tictactoe-tile').nth(3).click();
    await page.waitForTimeout(500);
    await gameWindow.locator('.tictactoe-tile').nth(4).click();
    await page.waitForTimeout(500);
    await gameWindow.locator('.tictactoe-tile').nth(6).click();
    await page.waitForTimeout(500);

    await screenshotHelper.capture(`${BASE_SCREENSHOT_PATH}/win-conditions/vertical-left-column`);

    const status = gameWindow.locator('.tictactoe-status');
    await expect(status).toContainText('Player O Wins');
  });

  test.skip('should detect diagonal win (top-left to bottom-right)', async ({ page, screenshotHelper }) => {
    await page.goto(process.env.PLAYWRIGHT_FOUNDRY_URL || 'http://localhost:30000/game');
    await page.waitForLoadState('networkidle');

    // Setup
    await page.click('#controls [data-tool="tictactoe"]');
    const gameWindow = page.locator('#tictactoe-app');
    await gameWindow.waitFor({ state: 'visible' });
    await gameWindow.locator('button:has-text("New Game")').click();
    await page.waitForTimeout(500);

    // Play: X(0), O(1), X(4), O(2), X(8) - X wins diagonal
    await gameWindow.locator('.tictactoe-tile').nth(0).click();
    await page.waitForTimeout(500);
    await gameWindow.locator('.tictactoe-tile').nth(1).click();
    await page.waitForTimeout(500);
    await gameWindow.locator('.tictactoe-tile').nth(4).click();
    await page.waitForTimeout(500);
    await gameWindow.locator('.tictactoe-tile').nth(2).click();
    await page.waitForTimeout(500);
    await gameWindow.locator('.tictactoe-tile').nth(8).click();
    await page.waitForTimeout(500);

    await screenshotHelper.capture(`${BASE_SCREENSHOT_PATH}/win-conditions/diagonal-tlbr`);

    const status = gameWindow.locator('.tictactoe-status');
    await expect(status).toContainText('Player X Wins');
  });
});

test.describe('Tic-Tac-Toe: Draw Condition', () => {
  test.skip('should detect draw when board is full', async ({ page, screenshotHelper, videoHelper }) => {
    await page.goto(process.env.PLAYWRIGHT_FOUNDRY_URL || 'http://localhost:30000/game');
    await page.waitForLoadState('networkidle');

    await videoHelper.startRecording();

    // Setup
    await page.click('#controls [data-tool="tictactoe"]');
    const gameWindow = page.locator('#tictactoe-app');
    await gameWindow.waitFor({ state: 'visible' });
    await gameWindow.locator('button:has-text("New Game")').click();
    await page.waitForTimeout(500);

    // Play draw sequence: X X O / O O X / X O X
    const drawSequence = [0, 3, 1, 4, 5, 2, 6, 7, 8];
    for (const index of drawSequence) {
      await gameWindow.locator('.tictactoe-tile').nth(index).click();
      await page.waitForTimeout(500);
    }

    await screenshotHelper.capture(`${BASE_SCREENSHOT_PATH}/draw/board-full`);

    // Verify draw status
    const status = gameWindow.locator('.tictactoe-status');
    await expect(status).toContainText("It's a Draw");

    await videoHelper.stopRecording(`${BASE_SCREENSHOT_PATH}/draw-game`);
  });
});

test.describe('Tic-Tac-Toe: Reset Game', () => {
  test.skip('should reset game during play', async ({ page, screenshotHelper }) => {
    await page.goto(process.env.PLAYWRIGHT_FOUNDRY_URL || 'http://localhost:30000/game');
    await page.waitForLoadState('networkidle');

    // Setup and make some moves
    await page.click('#controls [data-tool="tictactoe"]');
    const gameWindow = page.locator('#tictactoe-app');
    await gameWindow.waitFor({ state: 'visible' });
    await gameWindow.locator('button:has-text("New Game")').click();
    await page.waitForTimeout(500);

    await gameWindow.locator('.tictactoe-tile').nth(0).click();
    await page.waitForTimeout(300);
    await gameWindow.locator('.tictactoe-tile').nth(1).click();
    await page.waitForTimeout(300);

    await screenshotHelper.capture(`${BASE_SCREENSHOT_PATH}/reset/before-reset`);

    // Click Reset
    await gameWindow.locator('button:has-text("Reset Game")').click();
    await page.waitForTimeout(500);

    await screenshotHelper.capture(`${BASE_SCREENSHOT_PATH}/reset/after-reset`);

    // Verify reset
    const status = gameWindow.locator('.tictactoe-status');
    await expect(status).toContainText('Game Not Started');

    // Verify all tiles empty
    const tiles = gameWindow.locator('.tictactoe-tile');
    for (let i = 0; i < 9; i++) {
      const tile = tiles.nth(i);
      await expect(tile).not.toHaveClass(/x|o/);
    }
  });
});

test.describe('Tic-Tac-Toe: Button States', () => {
  test.skip('should capture button hover and focus states', async ({ page, screenshotHelper }) => {
    await page.goto(process.env.PLAYWRIGHT_FOUNDRY_URL || 'http://localhost:30000/game');
    await page.waitForLoadState('networkidle');

    // Setup
    await page.click('#controls [data-tool="tictactoe"]');
    const gameWindow = page.locator('#tictactoe-app');
    await gameWindow.waitFor({ state: 'visible' });

    const newGameButton = gameWindow.locator('button:has-text("New Game")');

    await screenshotHelper.captureStates(
      `${BASE_SCREENSHOT_PATH}/buttons/new-game`,
      [
        {
          name: 'default',
          action: async () => {
            await newGameButton.waitFor({ state: 'visible' });
          }
        },
        {
          name: 'hover',
          action: async () => {
            await newGameButton.hover();
            await page.waitForTimeout(200);
          }
        },
        {
          name: 'focus',
          action: async () => {
            await newGameButton.focus();
            await page.waitForTimeout(100);
          }
        }
      ]
    );

    const resetButton = gameWindow.locator('button:has-text("Reset Game")');

    await screenshotHelper.captureStates(
      `${BASE_SCREENSHOT_PATH}/buttons/reset-game`,
      [
        {
          name: 'default',
          action: async () => {
            await resetButton.waitFor({ state: 'visible' });
          }
        },
        {
          name: 'hover',
          action: async () => {
            await resetButton.hover();
            await page.waitForTimeout(200);
          }
        }
      ]
    );
  });
});
