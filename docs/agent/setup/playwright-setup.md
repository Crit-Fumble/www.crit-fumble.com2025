# Playwright Setup Guide

Playwright is used for browser automation, E2E testing, and image processing tasks.

## Local Development Setup

### Quick Install (Recommended)
```bash
# Install all browsers (Chromium, Firefox, WebKit)
npm run playwright:install

# OR install just Chromium (faster, smaller)
npm run playwright:install:chromium
```

### Manual Install
```bash
# All browsers with system dependencies
npx playwright install --with-deps

# Just Chromium
npx playwright install --with-deps chromium
```

### What Gets Installed
- **Chromium**: ~170MB (Chrome/Edge)
- **Firefox**: ~80MB
- **WebKit**: ~70MB (Safari)
- **Total**: ~400MB for all browsers

### Installation Location
- **Windows**: `%LOCALAPPDATA%\ms-playwright\`
- **Linux/Mac**: `~/.cache/ms-playwright/`

## Production Deployment

### Docker Setup

Use the provided `Dockerfile.playwright` for deployments that need browser automation:

```bash
# Build Docker image with Playwright
docker build -f Dockerfile.playwright -t crit-fumble:playwright .

# Run container
docker run -p 3000:3000 crit-fumble:playwright
```

### Dockerfile Features
- Based on `node:20-bookworm` (Debian with browser dependencies)
- Installs Chromium only (smaller image)
- Includes all required system libraries
- ~1.2GB total image size

### Alternative: Playwright Docker Image

For lighter deployments, use Playwright's official image:

```dockerfile
FROM mcr.microsoft.com/playwright:v1.56.1-jammy
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

## Usage

### Running Tests
```bash
# All tests
npm run test:e2e

# Interactive UI
npm run test:e2e:ui

# Specific browser
npm run test:chromium
npm run test:firefox
npm run test:webkit

# View results
npm run test:report
```

### Browser Automation (Non-Test)

```typescript
import { chromium } from 'playwright';

async function processImage() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Navigate and capture
  await page.goto('https://example.com');
  await page.screenshot({ path: 'screenshot.png' });

  await browser.close();
}
```

## Use Cases at Crit-Fumble

### 1. E2E Testing
- Test user flows with screenshots
- Visual regression testing
- Responsive design validation

### 2. Image Processing
- Generate map thumbnails
- Process dungeon tiles
- Create preview images

### 3. PDF Generation
- Campaign summaries
- Character sheets
- Export game content

### 4. Web Scraping (Authorized)
- World Anvil API testing
- SRD data validation
- External resource fetching

## Troubleshooting

### Browsers Not Found
```bash
# Reinstall browsers
npm run playwright:install
```

### System Dependencies Missing (Linux)
```bash
# Install dependencies manually
npx playwright install-deps
```

### Permission Errors (Linux/Mac)
```bash
# Fix permissions
chmod +x scripts/install-playwright.sh
./scripts/install-playwright.sh
```

### Windows Long Path Issues
Enable long paths in Windows:
```powershell
# Run as Administrator
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
```

## CI/CD Integration

### GitHub Actions
```yaml
- name: Install Playwright
  run: npx playwright install --with-deps chromium

- name: Run tests
  run: npm run test:e2e
```

### GitLab CI
```yaml
test:
  image: mcr.microsoft.com/playwright:v1.56.1-jammy
  script:
    - npm ci
    - npm run test:e2e
```

## Performance Optimization

### Use Chromium Only
For production automation tasks, only install Chromium:
```bash
npx playwright install chromium
```

### Reuse Browser Context
```typescript
// Good - reuse browser instance
const browser = await chromium.launch();
for (const url of urls) {
  const page = await browser.newPage();
  await page.goto(url);
  // Process page
  await page.close();
}
await browser.close();

// Bad - launch browser each time
for (const url of urls) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(url);
  await browser.close();
}
```

### Headless Mode
Always use headless mode in production:
```typescript
const browser = await chromium.launch({ headless: true });
```

## Security Considerations

### Sandboxing
Playwright runs browsers in sandboxed mode by default. For Docker:
```typescript
const browser = await chromium.launch({
  args: ['--no-sandbox', '--disable-setuid-sandbox'] // Only in trusted Docker environments
});
```

### Resource Limits
Set memory and CPU limits in production:
```dockerfile
# docker-compose.yml
services:
  app:
    mem_limit: 2g
    cpus: '2.0'
```

## Version Management

Playwright version is pinned in `package.json`:
```json
{
  "dependencies": {
    "@playwright/test": "^1.56.1"
  }
}
```

Update browsers when updating Playwright:
```bash
npm install @playwright/test@latest
npm run playwright:install
```

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [Docker Images](https://playwright.dev/docs/docker)
- [CI/CD Examples](https://playwright.dev/docs/ci)

## Support

For issues with Playwright setup:
1. Check [Playwright Troubleshooting](https://playwright.dev/docs/troubleshooting)
2. Review browser logs in `test-results/`
3. Run with debug mode: `DEBUG=pw:api npm run test:e2e`
