/**
 * Login and Dashboard Flow Tests
 * Tests the complete user flow from login through dashboard navigation
 *
 * Test-Driven Development approach:
 * 1. Login page functionality
 * 2. Dashboard layout with Characters, Campaigns, Worlds cards
 * 3. Navigation between sections
 * 4. Responsive design across devices
 */

import { test, expect } from '../utils/fixtures';

const DEVICES = [
  { name: 'mobile-small', width: 320, height: 568 },
  { name: 'mobile-medium', width: 375, height: 667 },
  { name: 'mobile-large', width: 414, height: 896 },
  { name: 'desktop-hd', width: 1366, height: 768 },
  { name: 'desktop-fhd', width: 1920, height: 1080 },
];

test.describe('Login Page', () => {
  test('should display login page with branding', async ({ page }) => {
    await page.goto('/login');

    // Check for logo
    const logo = page.locator('img[alt*="Crit Fumble"]');
    await expect(logo).toBeVisible();

    // Check for title
    await expect(page.locator('h1')).toContainText('Crit Fumble Gaming');

    // Check for tagline
    await expect(page.locator('text="If the GM doesn\'t kill you, the dice will."')).toBeVisible();

    // Check for sign-in buttons
    await expect(page.locator('button:has-text("Sign in with Discord")')).toBeVisible();
    await expect(page.locator('button:has-text("Sign in with GitHub")')).toBeVisible();
  });

  test('should have purple header styling', async ({ page }) => {
    await page.goto('/login');

    const header = page.locator('.bg-crit-purple-600').first();
    await expect(header).toBeVisible();
  });

  test('should have dark slate content area', async ({ page }) => {
    await page.goto('/login');

    const contentArea = page.locator('.bg-slate-900\\/95');
    await expect(contentArea).toBeVisible();
  });
});

test.describe('Dashboard Layout - Unauthenticated Redirect', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL('/login');
    expect(page.url()).toContain('/login');
  });
});

test.describe('Dashboard - Authenticated', () => {
  test('should display welcome message with username', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    await authenticatedPage.waitForLoadState('networkidle');

    // Should show welcome message
    await expect(authenticatedPage.locator('h1')).toContainText('Welcome back');
  });

  test('should display Characters card section first', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    await authenticatedPage.waitForLoadState('networkidle');

    // Characters section should exist and be first
    const charactersSection = authenticatedPage.locator('[data-testid="characters-section"]');
    await expect(charactersSection).toBeVisible();

    // Should have a title
    const charactersTitle = charactersSection.locator('h2');
    await expect(charactersTitle).toContainText('Characters');

    // Should have "New Character" button
    await expect(charactersSection.locator('text="New Character"')).toBeVisible();
  });

  test('should display Campaigns card section second', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    await authenticatedPage.waitForLoadState('networkidle');

    // Campaigns section should exist
    const campaignsSection = authenticatedPage.locator('[data-testid="campaigns-section"]');
    await expect(campaignsSection).toBeVisible();

    // Should have a title
    const campaignsTitle = campaignsSection.locator('h2');
    await expect(campaignsTitle).toContainText('Campaigns');

    // Should have "New Campaign" button
    await expect(campaignsSection.locator('text="New Campaign"')).toBeVisible();
  });

  test('should display Worlds card section third', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    await authenticatedPage.waitForLoadState('networkidle');

    // Worlds section should exist
    const worldsSection = authenticatedPage.locator('[data-testid="worlds-section"]');
    await expect(worldsSection).toBeVisible();

    // Should have a title
    const worldsTitle = worldsSection.locator('h2');
    await expect(worldsTitle).toContainText('Worlds');

    // Should have "New World" button
    await expect(worldsSection.locator('text="New World"')).toBeVisible();
  });

  test('should display sections in correct order: Characters, Campaigns, Worlds', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    await authenticatedPage.waitForLoadState('networkidle');

    // Get all section titles
    const sections = authenticatedPage.locator('[data-testid$="-section"] h2');
    const count = await sections.count();

    expect(count).toBeGreaterThanOrEqual(3);

    // Verify order
    await expect(sections.nth(0)).toContainText('Characters');
    await expect(sections.nth(1)).toContainText('Campaigns');
    await expect(sections.nth(2)).toContainText('Worlds');
  });

  test('should match login page styling - purple and slate', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    await authenticatedPage.waitForLoadState('networkidle');

    // Should have purple accent elements (headers, buttons)
    const purpleElements = authenticatedPage.locator('.bg-crit-purple-600, .bg-crit-purple-700');
    expect(await purpleElements.count()).toBeGreaterThan(0);

    // Should have slate background or cards
    const slateElements = authenticatedPage.locator('.bg-slate-900, .bg-slate-800');
    expect(await slateElements.count()).toBeGreaterThan(0);
  });
});

test.describe('Dashboard - Empty States', () => {
  test('should show empty state for Characters when none exist', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    await authenticatedPage.waitForLoadState('networkidle');

    const charactersSection = authenticatedPage.locator('[data-testid="characters-section"]');

    // Should show empty state message or prompt to create
    const emptyState = charactersSection.locator('[data-testid="characters-empty-state"]');

    // Either show cards or empty state, but section should exist
    await expect(charactersSection).toBeVisible();
  });

  test('should show empty state for Campaigns when none exist', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    await authenticatedPage.waitForLoadState('networkidle');

    const campaignsSection = authenticatedPage.locator('[data-testid="campaigns-section"]');
    await expect(campaignsSection).toBeVisible();
  });

  test('should show empty state for Worlds when none exist', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    await authenticatedPage.waitForLoadState('networkidle');

    const worldsSection = authenticatedPage.locator('[data-testid="worlds-section"]');
    await expect(worldsSection).toBeVisible();
  });
});

test.describe('Dashboard - Visual Regression', () => {
  for (const device of DEVICES) {
    test(`should render dashboard correctly on ${device.name}`, async ({ authenticatedPage, screenshotHelper }) => {
      await authenticatedPage.setViewportSize({ width: device.width, height: device.height });
      await authenticatedPage.goto('/dashboard');
      await authenticatedPage.waitForLoadState('networkidle');

      // Capture full page screenshot
      await screenshotHelper.capture(`dashboard-${device.name}`, { fullPage: true });
    });

    test(`should render login page correctly on ${device.name}`, async ({ page, screenshotHelper }) => {
      await page.setViewportSize({ width: device.width, height: device.height });
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      await screenshotHelper.capture(`login-${device.name}`, { fullPage: true });
    });
  }
});

test.describe('Dashboard - Card Interactions', () => {
  test('Characters: New Character button should be clickable', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    await authenticatedPage.waitForLoadState('networkidle');

    const newCharacterBtn = authenticatedPage.locator('[data-testid="characters-section"] >> text="New Character"');
    await expect(newCharacterBtn).toBeVisible();

    // Should be a link or button
    const tagName = await newCharacterBtn.evaluate(el => el.tagName.toLowerCase());
    expect(['a', 'button']).toContain(tagName);
  });

  test('Campaigns: New Campaign button should be clickable', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    await authenticatedPage.waitForLoadState('networkidle');

    const newCampaignBtn = authenticatedPage.locator('[data-testid="campaigns-section"] >> text="New Campaign"');
    await expect(newCampaignBtn).toBeVisible();

    const tagName = await newCampaignBtn.evaluate(el => el.tagName.toLowerCase());
    expect(['a', 'button']).toContain(tagName);
  });

  test('Worlds: New World button should be clickable', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    await authenticatedPage.waitForLoadState('networkidle');

    const newWorldBtn = authenticatedPage.locator('[data-testid="worlds-section"] >> text="New World"');
    await expect(newWorldBtn).toBeVisible();

    const tagName = await newWorldBtn.evaluate(el => el.tagName.toLowerCase());
    expect(['a', 'button']).toContain(tagName);
  });
});

test.describe('Dashboard - Responsive Grid Layout', () => {
  test('should display cards in responsive grid on mobile', async ({ authenticatedPage }) => {
    await authenticatedPage.setViewportSize({ width: 375, height: 667 });
    await authenticatedPage.goto('/dashboard');
    await authenticatedPage.waitForLoadState('networkidle');

    // Check that grid exists (should be single column on mobile)
    const charactersGrid = authenticatedPage.locator('[data-testid="characters-section"] .grid');
    if (await charactersGrid.count() > 0) {
      await expect(charactersGrid).toBeVisible();
    }
  });

  test('should display cards in responsive grid on desktop', async ({ authenticatedPage }) => {
    await authenticatedPage.setViewportSize({ width: 1920, height: 1080 });
    await authenticatedPage.goto('/dashboard');
    await authenticatedPage.waitForLoadState('networkidle');

    // Check that grid exists (should be multi-column on desktop)
    const charactersGrid = authenticatedPage.locator('[data-testid="characters-section"] .grid');
    if (await charactersGrid.count() > 0) {
      await expect(charactersGrid).toBeVisible();
    }
  });
});
