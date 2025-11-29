/**
 * Login Page Integration Tests
 * Priority: P0 (Critical)
 *
 * Tests OAuth flows, button states, and authentication
 *
 * NOTE: Skipped - This app doesn't have a /login page.
 * Authentication is handled by NextAuth at /api/auth/signin
 */

import { test, expect } from '../utils/fixtures';

test.describe.skip('Login Page - Initial Load', () => {
  test('should display login page correctly', async ({ page, screenshotHelper }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Capture initial state
    await screenshotHelper.capture('login-page-initial');

    // Verify page elements
    await expect(page.getByText('Crit-Fumble')).toBeVisible();
    await expect(page.getByText('TTRPG Platform')).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign in with Discord/i })).toBeVisible();
    await expect(page.getByText(/Terms of Service/i)).toBeVisible();
  });

  test('should capture all loading states', async ({ page, screenshotHelper }) => {
    await page.goto('/login');

    // Initial load
    await screenshotHelper.capture('01-login-initial-load');

    // Wait for network idle
    await page.waitForLoadState('networkidle');
    await screenshotHelper.capture('02-login-fully-loaded');

    // Discord button hover
    await page.hover('button:has-text("Sign in with Discord")');
    await page.waitForTimeout(200); // Wait for hover animation
    await screenshotHelper.capture('03-login-discord-button-hover');

    // Discord button focus
    await page.focus('button:has-text("Sign in with Discord")');
    await screenshotHelper.capture('04-login-discord-button-focus');
  });
});

test.describe.skip('Login Page - Button States', () => {
  test('should capture Discord button states', async ({ page, screenshotHelper }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await screenshotHelper.captureStates('discord-button', [
      {
        name: 'default',
        action: async () => {
          await page.waitForSelector('button:has-text("Sign in with Discord")');
        },
      },
      {
        name: 'hover',
        action: async () => {
          await page.hover('button:has-text("Sign in with Discord")');
          await page.waitForTimeout(200);
        },
      },
      {
        name: 'focus',
        action: async () => {
          await page.focus('button:has-text("Sign in with Discord")');
        },
      },
    ]);
  });

});

test.describe.skip('Login Page - Responsive Design', () => {
  test('should display correctly on desktop', async ({ page, screenshotHelper }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await screenshotHelper.capture('login-desktop-1920x1080');
  });

  test('should display correctly on laptop', async ({ page, screenshotHelper }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await screenshotHelper.capture('login-laptop-1366x768');
  });

  test('should display correctly on tablet', async ({ page, screenshotHelper }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await screenshotHelper.capture('login-tablet-768x1024');
  });

  test('should display correctly on mobile', async ({ page, screenshotHelper }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await screenshotHelper.capture('login-mobile-375x667');
  });
});
