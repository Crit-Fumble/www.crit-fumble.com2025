# Crit-Fumble Testing Guide

Comprehensive testing suite for the Crit-Fumble platform including unit tests, integration tests, and complete UI capture.

## Table of Contents

- [Overview](#overview)
- [Test Types](#test-types)
- [Running Tests](#running-tests)
- [UI Capture](#ui-capture)
- [Test Organization](#test-organization)
- [Writing Tests](#writing-tests)
- [CI/CD Integration](#cicd-integration)

## Overview

Our testing strategy includes:

- **Unit Tests**: Fast, isolated tests for individual functions and components
- **Integration Tests**: End-to-end tests using Playwright to verify user workflows
- **UI Capture**: Comprehensive screenshot and video capture of the entire application

### Test Statistics

- **80+ unit tests** covering lib functions, hooks, and components
- **10+ integration test suites** covering critical user journeys
- **100+ UI capture scenarios** across all viewports and browsers

## Test Types

### Unit Tests (`tests/unit/`)

Fast, isolated tests using Vitest with mocked dependencies.

**Coverage:**
- API route handlers
- Authentication and authorization (admin-auth, permissions, core-adapter)
- Utility functions (utils, rate-limit, storybook-token)
- React hooks (useApiMutation, useToggle, useFormState, useSearch, useClickOutside, useTabState, useTheme)
- React components (FloatingFumbleBot)
- Business logic
- Data transformations

**Example:**
```typescript
import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/crit/coins/balance/route';
import { prismaMock } from '../setup';

describe('GET /api/crit/coins/balance', () => {
  it('should return balance for user', async () => {
    prismaMock.critCoinTransaction.findFirst.mockResolvedValue({
      balanceAfter: 5000,
      createdAt: new Date(),
    });

    const request = new NextRequest('http://localhost/api/crit/coins/balance?userId=123');
    const response = await GET(request);
    const data = await response.json();

    expect(data.balance).toBe(5000);
    expect(data.balanceUsd).toBe('5.00');
  });
});
```

### Integration Tests (`tests/integration/`)

End-to-end tests using Playwright to verify complete user workflows.

**Coverage:**
- Authentication flows
- Page navigation
- Form submissions
- User interactions
- Responsive layouts

**Example:**
```typescript
import { test, expect } from '../utils/fixtures';

test('user can navigate to dashboard', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/dashboard');
  await expect(authenticatedPage).toHaveURL('/dashboard');
  await expect(authenticatedPage.locator('h1')).toContainText('Dashboard');
});
```

### UI Capture Tests (`tests/integration/10-comprehensive-ui-capture.spec.ts`)

Systematic capture of the entire application UI for documentation and visual review.

**Coverage:**
- All pages (public and authenticated)
- All viewport sizes (mobile, tablet, desktop)
- All interactive states (hover, focus, active)
- Complete user journeys with video
- Design system components

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm run test:unit

# Run unit tests in watch mode
npm test

# Run unit tests with UI
npm run test:ui
```

**Note on React Hook Testing:**
Current hook tests verify imports and exports. For full React hook behavior testing with `@testing-library/react`, you would need to:
1. Install testing utilities: `npm install --save-dev @testing-library/react @testing-library/jest-dom happy-dom`
2. Update `vitest.config.ts` to use `happy-dom` environment for hook tests
3. Full integration testing for hooks is covered by E2E Playwright tests

### Integration Tests

```bash
# Run all integration tests (all browsers)
npm run test:e2e

# Run tests in Chromium only
npm run test:chromium

# Run tests in Firefox
npm run test:firefox

# Run tests in WebKit (Safari)
npm run test:webkit

# Run tests with browser UI (debugging)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug a specific test
npm run test:e2e:debug
```

### UI Capture

```bash
# Capture full UI (Chrome only, fastest)
npm run capture:ui

# Capture UI across all browsers
npm run capture:ui:all-browsers

# Capture mobile viewports only
npm run capture:ui:mobile

# Capture tablet viewports only
npm run capture:ui:tablet

# Run comprehensive capture test directly
npm run capture:all
```

## UI Capture

The UI capture system creates comprehensive documentation of your application's visual state.

### What Gets Captured

#### Screenshots
- **Full page screenshots** of every page
- **Component screenshots** of individual UI elements
- **Interactive states**: default, hover, focus, active
- **Responsive layouts**: mobile, tablet, desktop (15+ viewports)
- **Design system**: colors, typography, spacing

#### Videos
- **Complete user journeys** showing full navigation flows
- **Responsive transitions** showing layout changes
- **Interactive demonstrations** of all features

### Output Location

All artifacts are saved to `tests/artifacts/`:

```
tests/artifacts/
├── chromium-login-page-<test-name>/
│   ├── screenshot.png
│   └── video.webm
├── firefox-dashboard-<test-name>/
│   ├── screenshot.png
│   └── video.webm
└── ...
```

Screenshots are organized by:
- Browser/device
- Test name
- Component/section

### Viewing Results

After running UI capture:

1. **HTML Report**: Opens automatically with test results
2. **Screenshots**: Browse `tests/artifacts/` directory
3. **Videos**: Watch full user journeys in `tests/artifacts/`
4. **Summary**: Check `tests/results/ui-capture-summary.md`

## Test Organization

```
tests/
├── unit/                              # Unit tests
│   ├── setup.ts                       # Test configuration & mocks
│   ├── api/                           # API route tests
│   │   ├── discord-activity-auth.test.ts
│   │   └── fumblebot-proxy.test.ts
│   ├── components/                    # Component tests
│   │   └── FloatingFumbleBot.test.ts
│   ├── config/                        # Configuration tests
│   │   └── next-config.test.ts
│   ├── hooks/                         # React hooks tests
│   │   ├── index.test.ts              # All hooks smoke tests
│   │   └── useToggle.test.ts
│   ├── lib/                           # Library/utility tests
│   │   ├── admin-auth.test.ts
│   │   ├── bot-auth.test.ts
│   │   ├── core-adapter.test.ts
│   │   ├── core-adapter-mock.test.ts
│   │   ├── permissions.test.ts
│   │   ├── storybook-token.test.ts
│   │   └── utils.test.ts
│   ├── packages/                      # Package tests
│   │   └── cfg-lib/
│   │       ├── rate-limit.test.ts
│   │       └── utils.test.ts
│   ├── proxy/                         # Proxy tests
│   │   └── proxy.test.ts
│   └── security/                      # Security tests
│       └── no-server-code-in-client.test.ts
│
├── integration/                       # E2E tests
│   ├── 01-homepage.spec.ts
│   ├── 02-login-page.spec.ts
│   ├── 04-dashboard-authenticated.spec.ts
│   ├── 07-current-implementation-showcase.spec.ts
│   └── 10-comprehensive-ui-capture.spec.ts  # NEW!
│
├── utils/                             # Test utilities
│   ├── fixtures.ts                    # Playwright fixtures
│   ├── screenshot-helper.ts           # Screenshot utilities
│   └── artifact-processor.ts          # Artifact processing
│
├── artifacts/                         # Test output (gitignored)
├── results/                           # Test results (gitignored)
└── README.md                          # This file
```

## Writing Tests

### Unit Test Best Practices

1. **Use descriptive test names**
   ```typescript
   it('should return 400 if userId is not provided', async () => {
     // Test implementation
   });
   ```

2. **Mock external dependencies**
   ```typescript
   prismaMock.critCoinTransaction.findFirst.mockResolvedValue(mockData);
   ```

3. **Test edge cases**
   - Empty inputs
   - Invalid data
   - Database errors
   - Boundary values

4. **Keep tests isolated**
   - Each test should be independent
   - Use `beforeEach` to reset state
   - Don't rely on test execution order

### Integration Test Best Practices

1. **Use page object pattern**
   ```typescript
   const loginButton = page.locator('button[type="submit"]').filter({ hasText: 'Sign in' });
   await loginButton.click();
   ```

2. **Wait for states**
   ```typescript
   await page.waitForLoadState('networkidle');
   await expect(element).toBeVisible();
   ```

3. **Capture screenshots for debugging**
   ```typescript
   await screenshotHelper.capture('test-name/step-description');
   ```

4. **Test user journeys, not implementation details**
   - Focus on what users do
   - Don't test internal state
   - Verify visible outcomes

### UI Capture Best Practices

1. **Organize screenshots logically**
   ```typescript
   await screenshotHelper.capture('ui-capture/login/mobile-iphone-13/full-page');
   ```

2. **Capture interactive states**
   ```typescript
   await button.hover();
   await page.waitForTimeout(300);
   await screenshotHelper.capture('ui-capture/buttons/discord-hover');
   ```

3. **Add delays for animations**
   ```typescript
   await page.waitForTimeout(500); // Wait for transition
   ```

4. **Test all viewports**
   - Mobile: 320px - 393px
   - Tablet: 768px - 1024px
   - Desktop: 1280px - 3840px

## CI/CD Integration

### GitHub Actions (Recommended)

```yaml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:unit

  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: tests/results/
```

### Test Database Setup

For integration tests, ensure test database is configured:

```bash
# .env.test
DATABASE_URL="postgresql://user:pass@localhost:5432/test_db"
```

### Pre-commit Hooks

Add to `.husky/pre-commit`:

```bash
#!/bin/sh
npm run test:unit
```

## Troubleshooting

### Unit Tests

**Issue**: Prisma mock not working
```bash
# Solution: Ensure mock is defined in setup.ts
# Check that prismaMock is imported correctly
```

**Issue**: Tests fail with "module not found"
```bash
# Solution: Check path aliases in vitest.config.ts
```

### Integration Tests

**Issue**: Playwright can't find browsers
```bash
# Solution: Install browsers
npx playwright install --with-deps
```

**Issue**: Tests timeout
```bash
# Solution: Increase timeout in playwright.config.ts
# Or use await page.waitForLoadState('networkidle')
```

**Issue**: Screenshots not captured
```bash
# Solution: Check playwright.config.ts screenshot settings
# Ensure outputDir exists
```

### UI Capture

**Issue**: No artifacts generated
```bash
# Solution: Check tests/artifacts/ directory permissions
# Ensure playwright.config.ts has correct outputDir
```

**Issue**: Videos are missing
```bash
# Solution: Ensure video mode is 'on' in playwright.config.ts
# Check disk space
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Testing Library](https://testing-library.com/)

## Contributing

When adding new features, please:

1. Write unit tests for new functions
2. Add integration tests for new user workflows
3. Update UI capture tests if UI changes
4. Run all tests before submitting PR

```bash
# Before committing
npm run test:unit
npm run test:e2e
```

---

**Need Help?** Check the troubleshooting section or open an issue on GitHub.
