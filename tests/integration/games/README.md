# FoundryVTT Game Module Integration Tests

Integration tests for FoundryVTT game modules (Tic-Tac-Toe, Checkers, Chess) using Playwright.

## Setup

### Prerequisites

1. **FoundryVTT Installation**
   - Install FoundryVTT v13.350+ locally
   - Create a test world
   - Install required modules:
     - `foundry-core-concepts`
     - Game modules to test (e.g., `foundry-game-tictactoe`)

2. **Playwright Installation**
   ```bash
   npm run playwright:install
   ```

### Configure Test Environment

Create `.env.test` file:

```bash
# FoundryVTT test server URL
PLAYWRIGHT_FOUNDRY_URL=http://localhost:30000/game

# FoundryVTT admin credentials (if needed)
FOUNDRY_ADMIN_KEY=your_admin_key_here

# Test world name
FOUNDRY_TEST_WORLD=test-world
```

### Start FoundryVTT Test Server

```bash
# Option 1: Manual start
# Launch FoundryVTT and load test world on port 30000

# Option 2: Automated start (if available)
npm run foundry:start:test
```

## Running Tests

### All Game Tests

```bash
npm run test:games
```

### Specific Game

```bash
# Tic-Tac-Toe
npm run test:tictactoe

# Or use Playwright directly
npx playwright test tests/integration/games/tictactoe-gameplay.spec.ts
```

### With UI (Visual Testing)

```bash
npx playwright test tests/integration/games/tictactoe-gameplay.spec.ts --ui
```

### Debug Mode

```bash
npx playwright test tests/integration/games/tictactoe-gameplay.spec.ts --debug
```

## Test Structure

### Screenshot Organization

All screenshots are saved to:
```
tests/screenshots/game/<game-name>/mode/<test-name>.png
```

Example:
```
tests/screenshots/game/tic-tac-toe/mode/
├── initialization/
│   ├── foundry-loaded.png
│   ├── console-logs.png
│   ├── scene-controls.png
│   └── hashtag-button-default.png
├── window/
│   ├── opened.png
│   ├── initial-state.png
│   └── dimensions.png
├── new-game/
│   ├── before-start.png
│   ├── after-start.png
│   └── notification.png
├── gameplay/
│   ├── move-01-x-topleft.png
│   ├── move-02-o-center.png
│   ├── move-03-x-topcenter.png
│   └── sequence-complete.png
├── interactions/
│   ├── empty-tile-default.png
│   ├── empty-tile-hover.png
│   └── occupied-tile-error.png
├── win-conditions/
│   ├── horizontal-top-row.png
│   ├── vertical-left-column.png
│   └── diagonal-tlbr.png
├── draw/
│   └── board-full.png
├── reset/
│   ├── before-reset.png
│   └── after-reset.png
└── buttons/
    ├── new-game-default.png
    ├── new-game-hover.png
    └── reset-game-default.png
```

### Video Organization

Videos are saved to:
```
tests/videos/game/<game-name>/mode/<test-name>.webm
```

Example:
```
tests/videos/game/tic-tac-toe/mode/
├── new-game-flow.webm
├── move-sequence.webm
├── win-horizontal-top.webm
└── draw-game.webm
```

## Test Scenarios

### Tic-Tac-Toe (`tictactoe-gameplay.spec.ts`)

1. **Module Initialization**
   - ✓ Module loads without errors
   - ✓ Hashtag button appears in scene controls

2. **Opening Game Window**
   - ✓ Window opens when clicking button
   - ✓ Window has correct dimensions (400×500)

3. **New Game Flow**
   - ✓ Game starts and status updates
   - ✓ Notification appears

4. **Gameplay - Move Placement**
   - ✓ First move places X
   - ✓ Second move places O
   - ✓ Complete move sequence

5. **Tile Interaction States**
   - ✓ Hover state on empty tiles
   - ✓ Not-allowed cursor on occupied tiles

6. **Win Conditions**
   - ✓ Horizontal win (top row)
   - ✓ Vertical win (left column)
   - ✓ Diagonal win (top-left to bottom-right)

7. **Draw Condition**
   - ✓ Detects draw when board is full

8. **Reset Game**
   - ✓ Reset during gameplay

9. **Button States**
   - ✓ Hover and focus states captured

## Current Status

⚠️ **Tests are marked as `.skip()` until FoundryVTT test environment is configured.**

To enable tests:
1. Set up FoundryVTT test server
2. Configure `PLAYWRIGHT_FOUNDRY_URL` environment variable
3. Remove `.skip()` from test descriptions
4. Run tests

## Troubleshooting

### FoundryVTT not loading

```bash
# Check if FoundryVTT is running
curl http://localhost:30000

# Check module installation
# Navigate to FoundryVTT UI → Setup → Modules
# Verify foundry-core-concepts and game modules are enabled
```

### Module not found

1. Verify module is installed in FoundryVTT Data folder
2. Check module.json is valid
3. Restart FoundryVTT server
4. Enable module in test world

### Screenshots not capturing

```bash
# Check screenshot directory exists
ls tests/screenshots/game/tic-tac-toe/mode

# Run with debug to see what's happening
npx playwright test --debug
```

### Timeouts

- Increase timeout in test:
  ```typescript
  test.setTimeout(60000); // 60 seconds
  ```

- Or globally in `playwright.config.ts`:
  ```typescript
  timeout: 60000
  ```

## Future Enhancements

### Docker Test Environment

Create Dockerfile for FoundryVTT test server:

```dockerfile
FROM node:20
RUN apt-get update && apt-get install -y foundryvtt
COPY test-world/ /data/worlds/test-world/
EXPOSE 30000
CMD ["node", "/foundryvtt/resources/app/main.js", "--dataPath=/data"]
```

### GitHub Actions Integration

```yaml
name: Game Module Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - name: Install dependencies
        run: npm ci
      - name: Start FoundryVTT test server
        run: docker-compose up -d foundry-test
      - name: Run tests
        run: npm run test:games
      - name: Upload screenshots
        uses: actions/upload-artifact@v3
        with:
          name: test-screenshots
          path: tests/screenshots/
```

### Visual Regression Testing

Use `@playwright/test` visual comparison:

```typescript
await expect(page).toHaveScreenshot('expected-state.png');
```

## Contributing

When adding new game tests:

1. Follow the screenshot organization pattern
2. Use descriptive test names
3. Capture key states with screenshots
4. Record full gameplay flows with video
5. Test all win/loss/draw conditions
6. Test error states and edge cases

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [FoundryVTT API](https://foundryvtt.com/api/)
- [Core Concepts Documentation](../../../src/modules/foundry-core-concepts/README.md)
