/**
 * View Capture CLI Tool
 *
 * Captures screenshots and videos of all views in the application.
 * Can be run directly or called via MCP server.
 *
 * Usage:
 *   npm run capture:screenshots     - Capture screenshots of all views
 *   npm run capture:videos          - Capture videos of all views
 *   npm run capture:all             - Capture both screenshots and videos
 *
 *   tsx scripts/capture-views.ts --mode=screenshots --view=login
 *   tsx scripts/capture-views.ts --mode=videos --view=dashboard --auth
 */

import { chromium, Browser, Page, BrowserContext } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const SCREENSHOTS_DIR = 'tests/screenshots';
const VIDEOS_DIR = 'tests/videos';

// View definitions with routes and capture instructions
interface ViewDefinition {
  name: string;
  route: string;
  requiresAuth: boolean;
  viewports?: Array<{ width: number; height: number; name: string }>;
  interactions?: Array<{
    name: string;
    action: (page: Page) => Promise<void>;
  }>;
  dismissModal?: boolean; // Whether to dismiss any modal overlays before capture
}

const VIEWS: ViewDefinition[] = [
  {
    name: 'login',
    route: '/login',
    requiresAuth: false,
    dismissModal: true,
    viewports: [
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1920, height: 1080, name: 'desktop' },
    ],
    interactions: [
      {
        name: 'default',
        action: async (page) => {
          await page.waitForLoadState('networkidle');
        },
      },
      {
        name: 'discord-button-hover',
        action: async (page) => {
          const btn = page.locator('button[type="submit"]').filter({ hasText: 'Sign in with Discord' });
          await btn.hover();
          await page.waitForTimeout(200);
        },
      },
      {
        name: 'github-button-hover',
        action: async (page) => {
          const btn = page.locator('button[type="submit"]').filter({ hasText: 'Sign in with GitHub' });
          await btn.hover();
          await page.waitForTimeout(200);
        },
      },
    ],
  },
  {
    name: 'homepage',
    route: '/',
    requiresAuth: false,
    dismissModal: true,
  },
  {
    name: 'dashboard',
    route: '/dashboard',
    requiresAuth: true,
    dismissModal: true,
    viewports: [
      { width: 375, height: 667, name: 'mobile' },
      { width: 1920, height: 1080, name: 'desktop' },
    ],
    interactions: [
      {
        name: 'default',
        action: async (page) => {
          await page.waitForLoadState('networkidle');
        },
      },
      {
        name: 'scrolled',
        action: async (page) => {
          await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
          await page.waitForTimeout(500);
        },
      },
    ],
  },
  {
    name: 'linked-accounts',
    route: '/linked-accounts',
    requiresAuth: true,
    dismissModal: true,
  },
];

// CLI Arguments
interface CliArgs {
  mode: 'screenshots' | 'videos' | 'all';
  view?: string;
  auth?: boolean;
  viewport?: string;
}

function parseArgs(): CliArgs {
  const args: CliArgs = {
    mode: 'screenshots',
  };

  process.argv.forEach((arg) => {
    if (arg.startsWith('--mode=')) {
      args.mode = arg.split('=')[1] as 'screenshots' | 'videos' | 'all';
    }
    if (arg.startsWith('--view=')) {
      args.view = arg.split('=')[1];
    }
    if (arg === '--auth') {
      args.auth = true;
    }
    if (arg.startsWith('--viewport=')) {
      args.viewport = arg.split('=')[1];
    }
  });

  return args;
}

// Ensure directory exists
function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Create test auth session
async function createTestSession(page: Page): Promise<string> {
  const response = await page.request.post(`${BASE_URL}/api/_dev/test-auth`, {
    data: {
      username: `capture_user_${Date.now()}`,
      email: `capture-${Date.now()}@crit-fumble.test`,
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to create test user: ${await response.text()}`);
  }

  const data = await response.json();
  return data.sessionToken;
}

// Create authenticated context
async function createAuthContext(browser: Browser, withVideo: boolean = false): Promise<BrowserContext> {
  const contextOptions: any = { baseURL: BASE_URL };

  if (withVideo) {
    contextOptions.recordVideo = {
      dir: VIDEOS_DIR,
      size: { width: 1920, height: 1080 },
    };
  }

  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();

  try {
    const sessionToken = await createTestSession(page);

    const url = new URL(BASE_URL);
    const domain = url.hostname;

    await context.addCookies([
      {
        name: 'next-auth.session-token',
        value: sessionToken,
        domain: domain,
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
        expires: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      },
    ]);

    await page.close();
    return context;
  } catch (error) {
    await page.close();
    throw error;
  }
}

// Capture screenshot of a view
async function captureScreenshot(
  page: Page,
  view: ViewDefinition,
  interaction: string,
  viewport?: string
) {
  const viewportSuffix = viewport ? `-${viewport}` : '';
  const filename = `${view.name}/${interaction}${viewportSuffix}.png`;
  const filepath = path.join(SCREENSHOTS_DIR, filename);

  ensureDir(path.dirname(filepath));

  await page.screenshot({
    path: filepath,
    fullPage: true,
  });

  console.log(`📸 Screenshot saved: ${filepath}`);
}

// Capture video of a view journey
async function captureVideo(
  page: Page,
  view: ViewDefinition,
  viewport?: string
) {
  // Video recording is configured at context level in Playwright
  // This function performs the journey that will be recorded

  await page.goto(view.route);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Perform all interactions
  if (view.interactions) {
    for (const interaction of view.interactions) {
      await interaction.action(page);
      await page.waitForTimeout(500);
    }
  }

  // Scroll journey
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1000);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1000);

  console.log(`🎥 Video journey completed for: ${view.name}`);
}

// Main capture function
async function captureViews(args: CliArgs) {
  console.log('🚀 Starting view capture...');
  console.log(`Mode: ${args.mode}`);
  console.log(`Base URL: ${BASE_URL}`);

  const browser = await chromium.launch({ headless: true });

  try {
    // Filter views
    let viewsToCapture = VIEWS;
    if (args.view) {
      viewsToCapture = VIEWS.filter((v) => v.name === args.view);
      if (viewsToCapture.length === 0) {
        console.error(`❌ View "${args.view}" not found`);
        return;
      }
    }

    // Filter by auth requirement
    if (args.auth !== undefined) {
      viewsToCapture = viewsToCapture.filter((v) => v.requiresAuth === args.auth);
    }

    for (const view of viewsToCapture) {
      console.log(`\n📍 Capturing view: ${view.name} (${view.route})`);

      // Create context (auth or non-auth)
      const needsVideo = args.mode === 'videos' || args.mode === 'all';
      const context = view.requiresAuth
        ? await createAuthContext(browser, needsVideo)
        : await browser.newContext({
            baseURL: BASE_URL,
            ...(needsVideo
              ? {
                  recordVideo: {
                    dir: VIDEOS_DIR,
                    size: { width: 1920, height: 1080 },
                  },
                }
              : {}),
          });

      try {
        const viewports = view.viewports || [{ width: 1920, height: 1080, name: 'desktop' }];

        for (const viewport of viewports) {
          if (args.viewport && viewport.name !== args.viewport) {
            continue;
          }

          console.log(`  📐 Viewport: ${viewport.name} (${viewport.width}x${viewport.height})`);

          const page = await context.newPage();
          await page.setViewportSize({ width: viewport.width, height: viewport.height });

          try {
            await page.goto(view.route);
            await page.waitForLoadState('networkidle');

            // Dismiss modal if needed
            if (view.dismissModal) {
              try {
                // Try to find and close any modal dialogs
                const closeButton = page.locator('button[aria-label="Close"], button:has-text("×"), [data-dismiss="modal"]').first();
                if (await closeButton.isVisible({ timeout: 2000 })) {
                  await closeButton.click();
                  await page.waitForTimeout(500);
                }
              } catch (e) {
                // Modal might not exist, continue
              }

              // Also try pressing Escape key to close modals
              try {
                await page.keyboard.press('Escape');
                await page.waitForTimeout(500);
              } catch (e) {
                // Ignore if doesn't work
              }
            }

            // Capture screenshots
            if (args.mode === 'screenshots' || args.mode === 'all') {
              const interactions = view.interactions || [
                { name: 'default', action: async (p: Page) => {} },
              ];

              for (const interaction of interactions) {
                await page.goto(view.route);
                await page.waitForLoadState('networkidle');
                await interaction.action(page);
                await captureScreenshot(page, view, interaction.name, viewport.name);
              }
            }

            // Capture video
            if (args.mode === 'videos' || args.mode === 'all') {
              await captureVideo(page, view, viewport.name);
            }

            // Get video and rename it properly
            if (args.mode === 'videos' || args.mode === 'all') {
              const video = page.video();
              if (video) {
                await page.close();
                const videoPath = await video.path();
                // Wait a bit for the video to finish writing
                await new Promise(resolve => setTimeout(resolve, 500));
                const newPath = path.join(VIDEOS_DIR, `${view.name}-${viewport.name}.webm`);
                if (fs.existsSync(videoPath)) {
                  try {
                    fs.renameSync(videoPath, newPath);
                    console.log(`  🎥 Video saved: ${newPath}`);
                  } catch (err) {
                    // If rename fails, just log the original path
                    console.log(`  🎥 Video saved: ${videoPath}`);
                  }
                }
              } else {
                await page.close();
              }
            } else {
              await page.close();
            }
          } catch (error) {
            if (page && !page.isClosed()) {
              await page.close();
            }
            throw error;
          }
        }

        // Close context after all videos are processed
        if (args.mode === 'videos' || args.mode === 'all') {
          await context.close();
        }
      } finally {
        if (context) {
          try {
            await context.close();
          } catch (e) {
            // Context may already be closed
          }
        }
      }
    }

    console.log('\n✨ Capture complete!');
  } catch (error) {
    console.error('❌ Capture failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run
const args = parseArgs();
captureViews(args).catch((error) => {
  console.error(error);
  process.exit(1);
});
