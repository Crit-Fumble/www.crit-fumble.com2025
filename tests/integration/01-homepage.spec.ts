/**
 * Home Page Integration Tests
 * Priority: P0 (Critical)
 *
 * Tests the root page redirects based on authentication state
 */

import { test, expect } from '../utils/fixtures';

test.describe('Home Page - Unauthenticated', () => {
  test('should redirect to login page when not authenticated', async ({ page, screenshotHelper }) => {
    // Navigate to home page
    await page.goto('/');

    // Should redirect to /login
    await page.waitForURL('/login', { timeout: 10000 });
    await screenshotHelper.capture('unauthenticated/home/redirect-to-login');

    // Verify we're on login page
    await expect(page).toHaveURL('/login');
    // Fix strict mode violation - look for specific button
    await expect(page.getByRole('button', { name: /Sign in with Discord/i })).toBeVisible();
  });

  test('should capture complete unauthenticated flow', async ({ page, screenshotHelper }) => {
    // Start at homepage
    await page.goto('/');
    await screenshotHelper.capture('unauthenticated/home/initial');

    // Wait for redirect
    await page.waitForURL('/login', { timeout: 10000 });
    await screenshotHelper.capture('unauthenticated/home/redirected-to-login');
  });
});

test.describe.skip('Home Page - Authenticated', () => {
  // TODO: Implement once authentication is set up in deployed app
  test('should redirect to dashboard when authenticated', async ({ page }) => {
    // Placeholder - implement with real auth
  });
});
