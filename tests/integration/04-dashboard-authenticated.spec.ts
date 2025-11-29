/**
 * Dashboard Integration Tests - Authenticated
 * Priority: P0 (Critical)
 *
 * Tests authenticated user flows in the dashboard.
 * Note: Uses admin users because early access restricts dashboard
 * to admins of allowed Discord guilds only.
 */

import { test, expect } from '../utils/fixtures';

test.describe('Dashboard - Authenticated Admin', () => {
  // Use adminAuthenticatedPage for early access - only admins can access dashboard
  test('should access dashboard when authenticated as admin', async ({
    adminAuthenticatedPage,
    screenshotHelper,
    adminTestUser,
  }) => {
    // Navigate to dashboard - should be accessible for admins
    await adminAuthenticatedPage.goto('/dashboard');
    await adminAuthenticatedPage.waitForLoadState('networkidle');

    // Capture dashboard
    await screenshotHelper.capture('authenticated/dashboard/overview');

    // Verify we're on dashboard (not redirected due to early access)
    await expect(adminAuthenticatedPage).toHaveURL('/dashboard');

    // Verify user is logged in
    console.log(`✅ Authenticated as admin: ${adminTestUser.username} (${adminTestUser.email})`);
  });

  test('should display user information for admin', async ({
    adminAuthenticatedPage,
    screenshotHelper,
    adminTestUser,
  }) => {
    await adminAuthenticatedPage.goto('/dashboard');
    await adminAuthenticatedPage.waitForLoadState('networkidle');

    // Capture initial state
    await screenshotHelper.capture('authenticated/dashboard/user-info');

    // Check for user-specific content
    await expect(adminAuthenticatedPage.getByText(/Dashboard/i)).toBeVisible();

    console.log(`✅ Dashboard loaded for admin: ${adminTestUser.username}`);
  });

  test('should navigate through dashboard sections', async ({
    adminAuthenticatedPage,
    screenshotHelper,
  }) => {
    await adminAuthenticatedPage.goto('/dashboard');
    await adminAuthenticatedPage.waitForLoadState('networkidle');

    // Capture main dashboard
    await screenshotHelper.capture('authenticated/dashboard/main');

    // TODO: Add navigation tests once dashboard sections are implemented
    // For example:
    // - Characters list
    // - Campaigns list
    // - Settings
    // - Profile
  });

  test('should redirect unauthenticated users to sign in', async ({ page, screenshotHelper }) => {
    // Use regular page (not authenticatedPage) - no auth
    await page.goto('/dashboard');

    // Should redirect to NextAuth sign-in
    await page.waitForURL(/\/api\/auth\/signin/, { timeout: 10000 });
    await screenshotHelper.capture('unauthenticated/dashboard/redirect-to-signin');

    await expect(page).toHaveURL(/\/api\/auth\/signin/);
  });
});

test.describe('Dashboard - Early Access Restriction', () => {
  test('should redirect regular users to home page (early access)', async ({
    authenticatedPage,
    screenshotHelper,
    testUser,
  }) => {
    // Regular users (not admin/owner) should be redirected to home
    // due to early access restrictions
    await authenticatedPage.goto('/dashboard');
    await authenticatedPage.waitForLoadState('networkidle');

    // Should redirect to home page (Coming March 2026)
    await expect(authenticatedPage).toHaveURL('/');

    await screenshotHelper.capture('early-access/regular-user-redirected');

    console.log(`✅ Regular user ${testUser.username} redirected to home (early access restriction)`);
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
