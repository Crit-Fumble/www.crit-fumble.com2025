# @crit-fumble/foundryvtt-client

Client-side automation and testing utilities for Foundry VTT.

## Purpose

This package provides browser automation utilities for Foundry VTT using Playwright and Puppeteer:

- Automated UI testing
- Screenshot generation
- Session recording
- Performance monitoring
- Bot players for testing
- Headless mode support

## Why Separate from Modules?

Foundry modules run **inside** the Foundry browser. This package runs **outside**, allowing:

- ✅ Test Foundry UI from external perspective
- ✅ Automate browser interactions
- ✅ Generate screenshots/videos
- ✅ Performance benchmarking
- ✅ Integration testing

## Features

### Browser Automation
- Playwright and Puppeteer support
- Headless and headed modes
- Multi-browser testing (Chrome, Firefox, Safari)

### UI Testing
- Automated click/type actions
- Form filling
- Navigation testing
- Error detection

### Media Capture
- Screenshots of scenes/characters
- Session recording
- Performance profiling

## Installation

```bash
cd src/packages/foundryvtt-client
npm install
npm run build
```

## Usage

### Screenshot Capture

```typescript
import { FoundryBrowser } from '@crit-fumble/foundryvtt-client';

const browser = new FoundryBrowser();

// Connect to Foundry instance
await browser.connect('http://localhost:30000', {
  username: 'GM',
  password: 'admin-password'
});

// Navigate to scene
await browser.navigateToScene('scene-id');

// Capture screenshot
await browser.screenshot('/screenshots/scene.png');

// Close
await browser.close();
```

### Automated Testing

```typescript
import { FoundryTester } from '@crit-fumble/foundryvtt-client';

const tester = new FoundryTester();

// Test actor creation
await tester.test('Create Actor', async (page) => {
  await page.click('[data-action="create-actor"]');
  await page.fill('input[name="name"]', 'Test Character');
  await page.click('button[type="submit"]');

  // Verify actor was created
  const actor = await page.textContent('.actor-name');
  expect(actor).toBe('Test Character');
});
```

### Session Recording

```typescript
import { FoundryRecorder } from '@crit-fumble/foundryvtt-client';

const recorder = new FoundryRecorder();

// Start recording
await recorder.startRecording('http://localhost:30000');

// Play session...
await new Promise(resolve => setTimeout(resolve, 60000));  // 1 minute

// Stop and save
await recorder.stopRecording('/videos/session.mp4');
```

## API Reference

See [API.md](./API.md) for complete API documentation.

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev

# Test
npm test
```

## License

MIT
