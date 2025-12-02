import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Crit-Fumble
 *
 * Features:
 * - Screenshot capture for all tests
 * - Video recording for all tests
 * - Flat artifact structure for easy iteration
 * - MP4 video conversion via global teardown
 * - Multiple browser testing
 * - Mobile viewport testing
 */

export default defineConfig({
  testDir: './tests',

  // Test file patterns
  testMatch: '**/*.spec.ts',

  // Global setup - runs before all tests
  globalSetup: './tests/global-setup.ts',

  // Global teardown - runs after all tests (converts videos to MP4)
  globalTeardown: './tests/global-teardown.ts',

  // Timeout settings
  timeout: 30000,              // 30 seconds per test
  expect: {
    timeout: 10000,            // 10 seconds for assertions (increased for slow loads)
  },

  // Run tests in files in parallel
  fullyParallel: false,        // Set to false to avoid auth token conflicts

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI (helps with auth)
  workers: process.env.CI ? 1 : 1,  // Force 1 worker to maintain auth state

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'tests/results/html-report' }],
    ['json', { outputFile: 'tests/results/results.json' }],
    ['list'],
  ],

  // Shared settings for all projects
  use: {
    // Base URL for tests
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    // Screenshot settings - only on failure by default
    // UI capture tests will explicitly capture with screenshotHelper
    screenshot: 'only-on-failure',

    // Video settings - only on failure by default
    // UI capture tests will be recorded separately
    video: 'retain-on-failure',

    // Trace settings (detailed debugging)
    trace: 'retain-on-failure',

    // Browser context options
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true,

    // Context options for auth state persistence
    storageState: undefined, // Will be set by fixtures for authenticated tests
  },

  // Output directory for test artifacts (screenshots on failure)
  outputDir: 'tests/artifacts',

  // Configure projects for major browsers
  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile browsers
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },

    // Tablet
    {
      name: 'tablet',
      use: { ...devices['iPad Pro'] },
    },
  ],

  // Run local dev server before starting tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 minutes to start
    env: {
      // Enable mock auth for tests - no Core API dependency
      USE_MOCK_AUTH: 'true',
    },
  },

  // Snapshot path template
  snapshotPathTemplate: 'tests/__screenshots__/{testFilePath}/{arg}{ext}',
});
