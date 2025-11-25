# How to Run Integration Tests

Step-by-step guide for running E2E tests and capturing screenshots.

## Prerequisites

✅ Playwright browsers installed:
```bash
npm run playwright:install:chromium
```

## Running Tests - Two Options

### Option 1: Automatic Server Check (Recommended)

```bash
npm run test:with-server
```

This script will:
- ✅ Check if dev server is running on http://localhost:3000
- ✅ Run tests if server is up
- ❌ Show instructions if server is not running

### Option 2: Manual (Two Terminals)

**Terminal 1 - Start Dev Server:**
```bash
npm run dev
```
Wait until you see: `✓ Ready on http://localhost:3000`

**Terminal 2 - Run Tests:**
```bash
npm run test:chromium
```

## What Tests Do

When you run tests, they will:
1. 📸 Capture screenshots of every page state
2. 🎥 Record videos (on failure or when explicitly requested)
3. 📊 Generate HTML report with all captures
4. ✅ Verify page elements and functionality

## Viewing Results

### Screenshots
```
tests/screenshots/
├── homepage-redirect-to-login.png
├── 01-login-initial-load.png
├── 02-login-fully-loaded.png
├── 03-login-discord-button-hover.png
├── discord-button-default.png
├── discord-button-hover.png
├── discord-button-focus.png
├── login-desktop-1920x1080.png
├── login-laptop-1366x768.png
├── login-tablet-768x1024.png
└── login-mobile-375x667.png
```

**Open any screenshot to review the captured state.**

### HTML Report (Interactive)
```bash
npm run test:report
```

Opens in browser with:
- All test results
- Screenshots embedded
- Videos embedded
- Filter by test/status
- Click to enlarge images

## Quick Commands

```bash
# Install Playwright browsers (first time)
npm run playwright:install:chromium

# Start dev server (Terminal 1)
npm run dev

# Run tests (Terminal 2, after server is ready)
npm run test:chromium

# View HTML report
npm run test:report

# Run specific test file
npx playwright test tests/integration/02-login-page.spec.ts

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run in debug mode (step through)
npm run test:e2e:debug

# Run in UI mode (interactive)
npm run test:e2e:ui
```

## Typical Workflow

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Wait for server to be ready:**
   ```
   ✓ Ready on http://localhost:3000
   ```

3. **Run tests in another terminal:**
   ```bash
   npm run test:chromium
   ```

4. **Review screenshots:**
   - Open `tests/screenshots/` folder
   - Look at captured images
   - Compare before/after changes

5. **View full report:**
   ```bash
   npm run test:report
   ```

## Troubleshooting

### Tests timeout or fail to connect

**Problem:** `net::ERR_ABORTED` or connection refused

**Solution:** Dev server is not running
```bash
# Terminal 1
npm run dev

# Wait for "Ready on http://localhost:3000"

# Terminal 2
npm run test:chromium
```

### Port 3000 already in use

**Problem:** Dev server can't start

**Solution:** Kill existing process
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

### Playwright browsers not found

**Problem:** Missing browser binaries

**Solution:** Install browsers
```bash
npm run playwright:install:chromium
```

### Screenshots not being saved

**Problem:** Directory doesn't exist

**Solution:** Create directory
```bash
mkdir -p tests/screenshots
```

The tests will create it automatically, but you can create it manually if needed.

### Tests pass but no screenshots

**Problem:** Screenshots only saved on explicit capture

**Solution:** Tests use `screenshotHelper.capture()` to save screenshots. Check test code has these calls.

## Test Configuration

Tests are configured in `playwright.config.ts`:
- **Base URL:** http://localhost:3000
- **Timeout:** 30 seconds per test
- **Browsers:** Chromium, Firefox, WebKit
- **Video:** On failure only
- **Screenshots:** On failure + explicit captures

## CI/CD Note

In CI/CD, you'll need to:
1. Build the application
2. Start the server
3. Wait for server to be ready
4. Run tests
5. Upload screenshots/videos as artifacts

Example GitHub Actions:
```yaml
- name: Build
  run: npm run build

- name: Start server
  run: npm start &

- name: Wait for server
  run: npx wait-on http://localhost:3000

- name: Run tests
  run: npm run test:e2e

- name: Upload screenshots
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: test-screenshots
    path: tests/screenshots/
```

## Next Steps

- Review [tests/REVIEW_WORKFLOW.md](./REVIEW_WORKFLOW.md) for visual review workflow
- Review [tests/README.md](./README.md) for comprehensive testing guide
- Review [docs/PLAYWRIGHT_SETUP.md](../docs/PLAYWRIGHT_SETUP.md) for Playwright setup

## Support

If you encounter issues:
1. Check dev server is running on http://localhost:3000
2. Check Playwright browsers are installed
3. Review test output for specific errors
4. Check [tests/README.md](./README.md) for troubleshooting
