/**
 * Playwright Test Fixtures
 * Includes test authentication for authenticated flows
 */

import { test as base, expect } from '@playwright/test';
import type { Page, BrowserContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Test user types
export type TestUser = {
  userId: string;
  username: string;
  email: string;
  sessionToken: string;
  role: 'player' | 'admin' | 'moderator';
};

// Extend basic test with custom fixtures
type CustomFixtures = {
  screenshotHelper: ScreenshotHelper;
  videoHelper: VideoHelper;
  authenticatedPage: Page;
  authenticatedContext: BrowserContext;
  testUser: TestUser;
  adminTestUser: TestUser;
  adminAuthenticatedContext: BrowserContext;
  adminAuthenticatedPage: Page;
};

export const test = base.extend<CustomFixtures>({
  // Screenshot helper
  screenshotHelper: async ({ page }, use, testInfo) => {
    const helper = new ScreenshotHelper(page, testInfo);
    await use(helper);
  },

  // Video helper
  videoHelper: async ({ page }, use, testInfo) => {
    const helper = new VideoHelper(page, testInfo);
    await use(helper);
  },

  // Test user - creates test auth session
  testUser: async ({ page }, use, testInfo) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

    // Create test user via API
    const response = await page.request.post(`${baseURL}/api/test-auth`, {
      data: {
        role: 'player',
        username: `test_user_${Date.now()}`,
        email: `test-${Date.now()}@crit-fumble.test`,
      },
    });

    if (!response.ok()) {
      throw new Error(`Failed to create test user: ${await response.text()}`);
    }

    const testUser = await response.json();

    // Use the test user
    await use(testUser);

    // Cleanup: Delete test user after test
    await page.request.delete(`${baseURL}/api/test-auth`, {
      data: { playerId: testUser.userId }, // userId maps to playerId in the API
    });
  },

  // Admin test user - creates admin test auth session with developer privileges
  adminTestUser: async ({ page }, use, testInfo) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

    // Create admin user via API (will have verification fields set to match DEV_ env vars)
    const response = await page.request.post(`${baseURL}/api/test-auth`, {
      data: {
        role: 'admin',
        username: `test_admin_${Date.now()}`,
        email: `test-admin-${Date.now()}@crit-fumble.test`,
      },
    });

    if (!response.ok()) {
      throw new Error(`Failed to create admin test user: ${await response.text()}`);
    }

    const adminUser = await response.json();

    // Use the admin user
    await use(adminUser);

    // Cleanup: Delete admin user after test
    await page.request.delete(`${baseURL}/api/test-auth`, {
      data: { playerId: adminUser.userId },
    });
  },

  // Authenticated context - context with auth cookies
  authenticatedContext: async ({ browser, testUser }, use) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
    const context = await browser.newContext({
      baseURL,
    });

    // Parse the URL to get the correct domain for cookies
    const url = new URL(baseURL);
    const domain = url.hostname;

    // Set session cookie with correct domain
    await context.addCookies([
      {
        name: 'next-auth.session-token',
        value: testUser.sessionToken,
        // Use the actual hostname from baseURL (e.g., 'localhost' or '127.0.0.1')
        domain: domain,
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
        expires: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
      },
    ]);

    await use(context);
    await context.close();
  },

  // Authenticated page - page with auth session
  authenticatedPage: async ({ authenticatedContext }, use) => {
    const page = await authenticatedContext.newPage();
    await use(page);
    await page.close();
  },

  // Admin authenticated context - context with admin auth cookies
  adminAuthenticatedContext: async ({ browser, adminTestUser }, use) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
    const context = await browser.newContext({
      baseURL,
    });

    // Parse the URL to get the correct domain for cookies
    const url = new URL(baseURL);
    const domain = url.hostname;

    // Set session cookie with correct domain
    await context.addCookies([
      {
        name: 'next-auth.session-token',
        value: adminTestUser.sessionToken,
        domain: domain,
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
        expires: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
      },
    ]);

    await use(context);
    await context.close();
  },

  // Admin authenticated page - page with admin auth session
  adminAuthenticatedPage: async ({ adminAuthenticatedContext }, use) => {
    const page = await adminAuthenticatedContext.newPage();
    await use(page);
    await page.close();
  },
});

export { expect };

/**
 * Screenshot Helper - Organized by route structure
 *
 * Follows the application's route structure:
 * - core/ - Core Concepts content
 * - game/ - SRD game content
 * - crit/ - CFG (Crit-Fumble Gaming) content
 */
class ScreenshotHelper {
  private baseDir = 'tests/screenshots';

  constructor(private page: Page, private testInfo: any) {}

  /**
   * Take a screenshot with simple flat naming
   * @param pathOrName - Simple filename (e.g., "login" or "dashboard") or path with slashes for organization
   * @param options - Screenshot options
   */
  async capture(pathOrName: string, options?: { fullPage?: boolean }) {
    // Wait for network to be idle before capturing
    await this.page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {
      // Continue even if timeout - page might already be loaded
    });

    // Wait a bit for any animations/transitions to complete
    await this.page.waitForTimeout(500);

    // Wait for main content to be visible
    await this.page.waitForSelector('body', { state: 'visible', timeout: 5000 }).catch(() => {
      // Continue even if selector not found
    });

    // Ensure base directory exists
    this.ensureDir(this.baseDir);

    // Simple flat structure: tests/screenshots/name.png
    const screenshotPath = `${this.baseDir}/${pathOrName}.png`;

    // Ensure subdirectories exist if path contains slashes
    const dirPath = path.dirname(screenshotPath);
    this.ensureDir(dirPath);

    // Take the screenshot with proper options
    await this.page.screenshot({
      path: screenshotPath,
      fullPage: options?.fullPage ?? true,
      timeout: 10000, // 10 second timeout for screenshot
    });

    console.log(`📸 Screenshot saved: ${screenshotPath}`);
    return screenshotPath;
  }

  /**
   * Categorize screenshot by URL path
   * Returns 'core', 'game', 'crit', or 'other'
   */
  private categorizeByUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      // Core Concepts routes
      if (
        pathname.startsWith('/core') ||
        pathname.includes('/concepts') ||
        pathname.includes('/docs')
      ) {
        return 'core';
      }

      // Game/SRD routes
      if (
        pathname.startsWith('/game') ||
        pathname.startsWith('/srd') ||
        pathname.includes('/classes') ||
        pathname.includes('/spells') ||
        pathname.includes('/monsters')
      ) {
        return 'game';
      }

      // CFG routes (dashboard, profile, etc.)
      if (
        pathname.startsWith('/crit') ||
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/profile') ||
        pathname.startsWith('/settings')
      ) {
        return 'crit';
      }

      // Authentication and public pages
      if (pathname.startsWith('/login') || pathname.startsWith('/auth')) {
        return 'crit/auth';
      }

      // Default category
      return 'other';
    } catch {
      return 'other';
    }
  }

  /**
   * Take a screenshot of a specific element
   */
  async captureElement(selector: string, pathOrName: string) {
    this.ensureDir(this.baseDir);

    const element = this.page.locator(selector);

    // Wait for element to be visible
    await element.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {
      console.warn(`⚠️  Element ${selector} not found or not visible`);
    });

    // Wait a bit for element to stabilize
    await this.page.waitForTimeout(200);

    // Simple flat structure: tests/screenshots/name.png
    const screenshotPath = `${this.baseDir}/${pathOrName}.png`;

    const dirPath = path.dirname(screenshotPath);
    this.ensureDir(dirPath);

    await element.screenshot({
      path: screenshotPath,
      timeout: 10000,
    });

    console.log(`📸 Element screenshot saved: ${screenshotPath}`);
    return screenshotPath;
  }

  /**
   * Capture multiple states (useful for animations, hover states, etc.)
   */
  async captureStates(
    pathOrName: string,
    states: Array<{ name: string; action: () => Promise<void> }>
  ) {
    const screenshots: string[] = [];

    for (const state of states) {
      await state.action();
      await this.page.waitForTimeout(100); // Small delay for state to settle

      const basePath = pathOrName.includes('/') ? pathOrName : pathOrName;
      const screenshot = await this.capture(`${basePath}-${state.name}`);
      screenshots.push(screenshot);
    }

    return screenshots;
  }

  /**
   * Ensure directory exists
   */
  private ensureDir(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
}

/**
 * Video Helper - Flat structure for easy iteration
 *
 * Saves videos to tests/videos/ with simple naming:
 * - test-name-browser.mp4
 * - No nested folders for easy browsing
 */
class VideoHelper {
  private baseDir = 'tests/videos';

  constructor(private page: Page, private testInfo: any) {}

  /**
   * Start video recording (uses Playwright's built-in video)
   * Note: Video path is set in playwright.config.ts
   */
  async startRecording() {
    // Playwright automatically records video if configured in playwright.config.ts
    console.log('🎥 Video recording started (automatic via Playwright config)');
  }

  /**
   * Stop and save video with custom name
   * @param pathOrName - Path following app structure (e.g., "core/concepts/action" or "crit/dashboard/login")
   */
  async stopRecording(pathOrName: string) {
    // Ensure base directory exists
    this.ensureDir(this.baseDir);

    // Auto-categorize based on current URL if no path separator provided
    let videoPath: string;
    if (!pathOrName.includes('/')) {
      const url = this.page.url();
      const category = this.categorizeByUrl(url);
      videoPath = `${this.baseDir}/${category}/${pathOrName}.webm`;
    } else {
      videoPath = `${this.baseDir}/${pathOrName}.webm`;
    }

    const dirPath = path.dirname(videoPath);
    this.ensureDir(dirPath);

    // Close page to finalize video
    const video = this.page.video();
    if (video) {
      const originalPath = await video.path();

      // Move video to organized location
      if (fs.existsSync(originalPath)) {
        fs.renameSync(originalPath, videoPath);
        console.log(`🎥 Video saved: ${videoPath}`);
      }
    }

    return videoPath;
  }

  /**
   * Categorize video by URL path
   * Returns 'core', 'game', 'crit', or 'other'
   */
  private categorizeByUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      // Core Concepts routes
      if (
        pathname.startsWith('/core') ||
        pathname.includes('/concepts') ||
        pathname.includes('/docs')
      ) {
        return 'core';
      }

      // Game/SRD routes
      if (
        pathname.startsWith('/game') ||
        pathname.startsWith('/srd') ||
        pathname.includes('/classes') ||
        pathname.includes('/spells') ||
        pathname.includes('/monsters')
      ) {
        return 'game';
      }

      // CFG routes (dashboard, profile, etc.)
      if (
        pathname.startsWith('/crit') ||
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/profile') ||
        pathname.startsWith('/settings')
      ) {
        return 'crit';
      }

      // Authentication and public pages
      if (pathname.startsWith('/login') || pathname.startsWith('/auth')) {
        return 'crit/auth';
      }

      // Default category
      return 'other';
    } catch {
      return 'other';
    }
  }

  /**
   * Ensure directory exists
   */
  private ensureDir(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
}
