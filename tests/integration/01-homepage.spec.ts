/**
 * Home Page Integration Tests
 * Priority: P0 (Critical)
 *
 * Tests the public landing page and navigation
 */

import { test, expect } from '../utils/fixtures';

test.describe('Home Page - Public Landing', () => {
  test('should display landing page content', async ({ page, screenshotHelper }) => {
    // Navigate to home page
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Verify landing page content is visible
    await expect(page.getByRole('heading', { name: /Crit Fumble Gaming/i })).toBeVisible();
    await expect(page.getByText(/If the GM doesn't kill you/i)).toBeVisible();

    await screenshotHelper.capture('public/home/landing');
  });

  test('should have Discord link', async ({ page, screenshotHelper }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for Discord link
    const discordLink = page.getByRole('link', { name: /Discord/i });
    await expect(discordLink).toBeVisible();

    await screenshotHelper.capture('public/home/discord-link');
  });

  test('should display coming soon message', async ({ page, screenshotHelper }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify "under construction" message specifically
    await expect(page.getByText('Our platform is under construction')).toBeVisible();

    await screenshotHelper.capture('public/home/coming-soon');
  });
});

test.describe('Navigation - Auth', () => {
  // Skip auth tests locally when AUTH_SECRET isn't configured
  test.skip(
    !process.env.AUTH_SECRET && !process.env.CI,
    'Auth tests require AUTH_SECRET - skipping in local dev'
  );

  test('should have auth API endpoint', async ({ page }) => {
    // NextAuth handles /api/auth routes - verify the API responds
    const response = await page.request.get('/api/auth/providers');
    expect(response.ok()).toBeTruthy();

    const providers = await response.json();
    expect(providers).toHaveProperty('discord');
  });
});
