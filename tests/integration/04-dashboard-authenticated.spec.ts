/**
 * Dashboard Integration Tests - Authenticated
 * Priority: P0 (Critical)
 *
 * Tests authenticated user flows in the dashboard
 */

import { test, expect } from '../utils/fixtures';

test.describe('Dashboard - Authenticated Player', () => {
  test('should access dashboard when authenticated', async ({
    authenticatedPage,
    screenshotHelper,
    testUser,
  }) => {
    // Navigate to dashboard - should be accessible
    await authenticatedPage.goto('/dashboard');
    await authenticatedPage.waitForLoadState('networkidle');

    // Capture dashboard
    await screenshotHelper.capture('authenticated/dashboard/overview');

    // Verify we're on dashboard
    await expect(authenticatedPage).toHaveURL('/dashboard');

    // Verify user is logged in
    console.log(`✅ Authenticated as: ${testUser.username} (${testUser.email})`);
  });

  test('should display user information', async ({
    authenticatedPage,
    screenshotHelper,
    testUser,
  }) => {
    await authenticatedPage.goto('/dashboard');
    await authenticatedPage.waitForLoadState('networkidle');

    // Capture initial state
    await screenshotHelper.capture('authenticated/dashboard/user-info');

    // Check for user-specific content
    // Note: Update these selectors based on your actual dashboard UI
    await expect(authenticatedPage.getByText(/Dashboard/i)).toBeVisible();

    console.log(`✅ Dashboard loaded for user: ${testUser.username}`);
  });

  test('should navigate through dashboard sections', async ({
    authenticatedPage,
    screenshotHelper,
  }) => {
    await authenticatedPage.goto('/dashboard');
    await authenticatedPage.waitForLoadState('networkidle');

    // Capture main dashboard
    await screenshotHelper.capture('authenticated/dashboard/main');

    // TODO: Add navigation tests once dashboard sections are implemented
    // For example:
    // - Characters list
    // - Campaigns list
    // - Settings
    // - Profile
  });

  test('should redirect unauthenticated users', async ({ page, screenshotHelper }) => {
    // Use regular page (not authenticatedPage) - no auth
    await page.goto('/dashboard');

    // Should redirect to login
    await page.waitForURL('/login', { timeout: 10000 });
    await screenshotHelper.capture('unauthenticated/dashboard/redirect-to-login');

    await expect(page).toHaveURL('/login');
  });
});

test.describe('Dashboard - Different User Roles', () => {
  test('should create player role session', async ({ page }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

    // Create test user with specific role
    const response = await page.request.post(`${baseURL}/api/_dev/test-auth`, {
      data: {
        role: 'player',
        username: 'test_player',
        email: 'player@crit-fumble.test',
      },
    });

    expect(response.ok()).toBeTruthy();

    const testUser = await response.json();
    expect(testUser.role).toBe('player');
    expect(testUser.sessionToken).toBeTruthy();

    console.log(`✅ Created test player: ${testUser.username}`);

    // Cleanup
    await page.request.delete(`${baseURL}/api/_dev/test-auth`, {
      data: { userId: testUser.userId },
    });
  });

  test.skip('should create admin role session', async ({ page }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

    // Create test admin user
    const response = await page.request.post(`${baseURL}/api/_dev/test-auth`, {
      data: {
        role: 'admin',
        username: 'test_admin',
        email: 'admin@crit-fumble.test',
      },
    });

    expect(response.ok()).toBeTruthy();

    const testUser = await response.json();
    expect(testUser.role).toBe('admin');

    console.log(`✅ Created test admin: ${testUser.username}`);

    // Cleanup
    await page.request.delete(`${baseURL}/api/_dev/test-auth`, {
      data: { userId: testUser.userId },
    });
  });
});
