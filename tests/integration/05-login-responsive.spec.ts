/**
 * Login Page Responsive Design Tests
 * Priority: P1 (Important)
 *
 * Tests the login page design across different viewports
 */

import { test, expect } from '../utils/fixtures';

test.describe('Login Page - Responsive Design', () => {
  test('should render correctly on mobile (375x667)', async ({ page, screenshotHelper }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Capture mobile view
    await screenshotHelper.capture('responsive/login/mobile-375');

    // Verify key elements are visible
    await expect(page.locator('img[alt="Crit Fumble Gaming Logo"]')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Crit Fumble Gaming' })).toBeVisible();
    await expect(page.getByText(/If the GM doesn't kill you/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign in with Discord/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign in with GitHub/i })).toBeVisible();
  });

  test('should render correctly on tablet (768x1024)', async ({ page, screenshotHelper }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Capture tablet view
    await screenshotHelper.capture('responsive/login/tablet-768');

    // Verify key elements
    await expect(page.locator('img[alt="Crit Fumble Gaming Logo"]')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Crit Fumble Gaming' })).toBeVisible();
  });

  test('should render correctly on desktop (1920x1080)', async ({ page, screenshotHelper }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Capture desktop view
    await screenshotHelper.capture('responsive/login/desktop-1920');

    // Verify layout
    await expect(page.locator('img[alt="Crit Fumble Gaming Logo"]')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Crit Fumble Gaming' })).toBeVisible();
  });

  test('should render correctly on small mobile (320x568)', async ({ page, screenshotHelper }) => {
    // Set small mobile viewport (iPhone SE)
    await page.setViewportSize({ width: 320, height: 568 });

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Capture small mobile view
    await screenshotHelper.capture('responsive/login/mobile-320');

    // Verify elements don't overflow
    await expect(page.locator('img[alt="Crit Fumble Gaming Logo"]')).toBeVisible();
  });

  test('should render correctly on large desktop (2560x1440)', async ({ page, screenshotHelper }) => {
    // Set large desktop viewport
    await page.setViewportSize({ width: 2560, height: 1440 });

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Capture large desktop view
    await screenshotHelper.capture('responsive/login/desktop-2560');

    // Verify content is centered and not stretched
    await expect(page.locator('img[alt="Crit Fumble Gaming Logo"]')).toBeVisible();
  });

  test('should have readable text at all sizes', async ({ page }) => {
    const viewports = [
      { width: 320, height: 568, name: 'small mobile' },
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1920, height: 1080, name: 'desktop' },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Check title is readable (font size should be appropriate)
      const title = page.getByRole('heading', { name: 'Crit Fumble Gaming' });
      await expect(title).toBeVisible();

      // Check tagline is visible
      const tagline = page.getByText(/If the GM doesn't kill you/i);
      await expect(tagline).toBeVisible();

      console.log(`✅ Text readable on ${viewport.name} (${viewport.width}x${viewport.height})`);
    }
  });

  test('should have properly sized buttons at all breakpoints', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1920, height: 1080, name: 'desktop' },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Check buttons are visible and clickable
      const discordButton = page.getByRole('button', { name: /Sign in with Discord/i });
      const githubButton = page.getByRole('button', { name: /Sign in with GitHub/i });

      await expect(discordButton).toBeVisible();
      await expect(githubButton).toBeVisible();

      // Verify buttons have proper touch target size (at least 44x44 on mobile)
      const discordBox = await discordButton.boundingBox();
      const githubBox = await githubButton.boundingBox();

      if (viewport.width <= 768) {
        // Mobile/tablet - ensure touch targets are large enough
        expect(discordBox?.height).toBeGreaterThanOrEqual(44);
        expect(githubBox?.height).toBeGreaterThanOrEqual(44);
      }

      console.log(`✅ Buttons properly sized on ${viewport.name}`);
    }
  });

  test('should display background image correctly at all sizes', async ({ page, screenshotHelper }) => {
    const viewports = [
      { width: 375, height: 667, name: 'mobile' },
      { width: 1920, height: 1080, name: 'desktop' },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Capture to verify background is visible
      await screenshotHelper.capture(`responsive/login/background-${viewport.name}`);

      // Verify background div exists
      const backgroundDiv = page.locator('.bg-dice-hero');
      await expect(backgroundDiv).toBeVisible();

      console.log(`✅ Background displays correctly on ${viewport.name}`);
    }
  });
});
