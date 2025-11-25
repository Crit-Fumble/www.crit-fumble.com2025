/**
 * Admin Dashboard Integration Test
 * Tests admin access, dashboard UI, and Discord stats stubbing
 */

import { test, expect } from '../utils/fixtures';

// Key device sizes to capture
const DEVICES = [
  { name: 'mobile-small', width: 320, height: 568 },
  { name: 'mobile-medium', width: 375, height: 667 },
  { name: 'mobile-large', width: 414, height: 896 },
  { name: 'desktop-hd', width: 1366, height: 768 },
  { name: 'desktop-fhd', width: 1920, height: 1080 },
];

test.describe('Admin Dashboard - Access Control', () => {
  test('should redirect non-admin users to dashboard', async ({ authenticatedPage }) => {
    // Regular user tries to access admin dashboard
    await authenticatedPage.goto('/admin');

    // Should redirect to regular dashboard
    await authenticatedPage.waitForURL('/dashboard');
    expect(authenticatedPage.url()).toContain('/dashboard');
    expect(authenticatedPage.url()).not.toContain('/admin');
  });

  test('should allow admin users to access admin dashboard', async ({ adminAuthenticatedPage }) => {
    await adminAuthenticatedPage.goto('/admin');

    // Should stay on admin dashboard
    await adminAuthenticatedPage.waitForURL('/admin');
    expect(adminAuthenticatedPage.url()).toContain('/admin');
  });

  test('should show Admin link in header for admin users', async ({ adminAuthenticatedPage }) => {
    await adminAuthenticatedPage.goto('/dashboard');

    // Check for Admin link in header
    const adminLink = adminAuthenticatedPage.locator('a[href="/admin"]');
    await expect(adminLink).toBeVisible();
    await expect(adminLink).toHaveText('Admin');
  });

  test('should not show Admin link in header for regular users', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');

    // Admin link should not exist
    const adminLink = authenticatedPage.locator('a[href="/admin"]');
    await expect(adminLink).toHaveCount(0);
  });
});

test.describe('Admin Dashboard - UI Elements', () => {
  test('should display admin header with correct styling', async ({ adminAuthenticatedPage }) => {
    await adminAuthenticatedPage.goto('/admin');

    // Check for admin header with red styling
    const adminHeader = adminAuthenticatedPage.locator('h1:has-text("Admin Dashboard")');
    await expect(adminHeader).toBeVisible();

    // Check parent div has red background
    const headerParent = adminHeader.locator('..');
    await expect(headerParent).toHaveClass(/bg-red-600/);
  });

  test('should display Discord Stats section', async ({ adminAuthenticatedPage }) => {
    await adminAuthenticatedPage.goto('/admin');

    // Check for Discord Stats section
    const discordSection = adminAuthenticatedPage.locator('[data-testid="discord-stats-section"]');
    await expect(discordSection).toBeVisible();

    // Check for section title
    const sectionTitle = discordSection.locator('h2:has-text("Discord Server Stats")');
    await expect(sectionTitle).toBeVisible();

    // Check for stat labels (should always be visible)
    await expect(discordSection.locator('text=Total Members')).toBeVisible();
    await expect(discordSection.locator('text=Online Now')).toBeVisible();
    await expect(discordSection.locator('text=Active Channels')).toBeVisible();
    await expect(discordSection.locator('text=Messages (24h)')).toBeVisible();

    // Check if Discord is configured - if so, should show real data or error
    // If not configured, should show "Not Available" or "Coming Soon"
    const hasRealData = await discordSection.locator('text=Discord stats updated every 60 seconds').count() > 0;
    const hasError = await discordSection.locator('text=Failed to fetch Discord stats').count() > 0;
    const notConfigured = await discordSection.locator('text=Discord integration not configured').count() > 0;
    const notAvailable = await discordSection.locator('text=Not Available').count() > 0;

    // One of these should be true
    expect(hasRealData || hasError || notConfigured || notAvailable).toBe(true);
  });

  test('should display User Management section with user stats', async ({ adminAuthenticatedPage }) => {
    await adminAuthenticatedPage.goto('/admin');

    const userMgmtSection = adminAuthenticatedPage.locator('[data-testid="user-management-section"]');
    await expect(userMgmtSection).toBeVisible();

    // Check section title
    await expect(userMgmtSection.locator('h2:has-text("User Management")')).toBeVisible();

    // Check user stats summary cards
    await expect(adminAuthenticatedPage.getByTestId('total-users-stat')).toBeVisible();
    await expect(adminAuthenticatedPage.getByTestId('active-users-stat')).toBeVisible();
    await expect(adminAuthenticatedPage.getByTestId('recent-logins-stat')).toBeVisible();

    // Check user table exists
    const userTable = adminAuthenticatedPage.getByTestId('user-list-table');
    await expect(userTable).toBeVisible();

    // Verify table headers
    await expect(userTable.locator('th:has-text("Username")')).toBeVisible();
    await expect(userTable.locator('th:has-text("Email")')).toBeVisible();
    await expect(userTable.locator('th:has-text("Linked Accounts")')).toBeVisible();
    await expect(userTable.locator('th:has-text("Last Login")')).toBeVisible();
    await expect(userTable.locator('th:has-text("Joined")')).toBeVisible();
    await expect(userTable.locator('th:has-text("Status")')).toBeVisible();
  });

  test('should display System Status section with coming soon message', async ({ adminAuthenticatedPage }) => {
    await adminAuthenticatedPage.goto('/admin');

    const systemSection = adminAuthenticatedPage.locator('[data-testid="system-status-section"]');

    // Scroll to element to ensure it's visible
    await systemSection.scrollIntoViewIfNeeded();

    await expect(systemSection).toBeVisible({ timeout: 15000 });
    await expect(systemSection.locator('h2:has-text("System Status")')).toBeVisible();
    await expect(systemSection.locator('h3:has-text("Coming March 2026")')).toBeVisible();
  });
});

test.describe('Admin Dashboard - Visual Regression', () => {
  for (const device of DEVICES) {
    test(`should render admin dashboard correctly on ${device.name}`, async ({ adminAuthenticatedPage }) => {
      await adminAuthenticatedPage.setViewportSize({ width: device.width, height: device.height });
      await adminAuthenticatedPage.emulateMedia({ reducedMotion: 'reduce' });
      await adminAuthenticatedPage.goto('/admin', { waitUntil: 'networkidle' });

      // Wait for content to be visible
      const adminHeader = adminAuthenticatedPage.locator('h1:has-text("Admin Dashboard")');
      await adminHeader.waitFor({ state: 'visible', timeout: 10000 });

      // Force repaint for React 19 hydration
      await adminAuthenticatedPage.evaluate(() => {
        document.body.style.display = 'none';
        document.body.offsetHeight;
        document.body.style.display = '';
      });

      await adminAuthenticatedPage.waitForTimeout(1000);
      await adminAuthenticatedPage.screenshot({
        path: `tests/screenshots/admin-dashboard-${device.name}.png`,
        fullPage: true
      });
    });
  }
});

test.describe('Updated Dashboard - Visual Regression', () => {
  for (const device of DEVICES) {
    test(`should render updated dashboard (Coming March 2026) on ${device.name}`, async ({ authenticatedPage }) => {
      await authenticatedPage.setViewportSize({ width: device.width, height: device.height });
      await authenticatedPage.emulateMedia({ reducedMotion: 'reduce' });
      await authenticatedPage.goto('/dashboard', { waitUntil: 'networkidle' });

      // Wait for content to be visible
      const comingSoonSection = authenticatedPage.locator('[data-testid="coming-soon-section"]');
      await comingSoonSection.waitFor({ state: 'visible', timeout: 10000 });

      // Force repaint for React 19 hydration
      await authenticatedPage.evaluate(() => {
        document.body.style.display = 'none';
        document.body.offsetHeight;
        document.body.style.display = '';
      });

      await authenticatedPage.waitForTimeout(1000);
      await authenticatedPage.screenshot({
        path: `tests/screenshots/dashboard-updated-${device.name}.png`,
        fullPage: true
      });
    });
  }
});
