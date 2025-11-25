/**
 * Simple UI Capture Test
 * Captures one screenshot per page per device size for quick iteration
 *
 * Output: tests/screenshots/ (flat structure, named by device)
 * Example: login-mobile.png, dashboard-tablet.png, etc.
 */

import { test, expect } from '../utils/fixtures';

// Key device sizes to capture
const DEVICES = [
  // Mobile devices (3 different resolutions)
  { name: 'mobile-small', width: 320, height: 568 },   // iPhone SE
  { name: 'mobile-medium', width: 375, height: 667 },  // iPhone 8
  { name: 'mobile-large', width: 414, height: 896 },   // iPhone 11 Pro Max

  // Desktop sizes (2 common resolutions)
  { name: 'desktop-hd', width: 1366, height: 768 },    // Most common laptop
  { name: 'desktop-fhd', width: 1920, height: 1080 },  // Full HD
];

test.describe('Simple UI Capture - One Screenshot Per View Per Device', () => {
  // Public pages
  for (const device of DEVICES) {
    test(`should capture login page - ${device.name}`, async ({ page, screenshotHelper }) => {
      await page.setViewportSize({ width: device.width, height: device.height });
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await screenshotHelper.capture(`login-${device.name}`);
    });
  }

  // Authenticated pages
  for (const device of DEVICES) {
    test(`should capture dashboard - ${device.name}`, async ({ authenticatedPage }) => {
      await authenticatedPage.setViewportSize({ width: device.width, height: device.height });
      await authenticatedPage.emulateMedia({ reducedMotion: 'reduce' });
      await authenticatedPage.goto('/dashboard', { waitUntil: 'networkidle' });

      // Wait for content to be visible
      const purpleHeader = authenticatedPage.locator('.bg-crit-purple-600').first();
      await purpleHeader.waitFor({ state: 'visible', timeout: 10000 });

      // Force repaint for React 19 hydration
      await authenticatedPage.evaluate(() => {
        document.body.style.display = 'none';
        document.body.offsetHeight;
        document.body.style.display = '';
      });

      await authenticatedPage.waitForTimeout(1000);
      await authenticatedPage.screenshot({
        path: `tests/screenshots/dashboard-${device.name}.png`,
        fullPage: true
      });
    });

    test(`should capture linked accounts - ${device.name}`, async ({ authenticatedPage }) => {
      await authenticatedPage.setViewportSize({ width: device.width, height: device.height });
      await authenticatedPage.emulateMedia({ reducedMotion: 'reduce' });
      await authenticatedPage.goto('/linked-accounts', { waitUntil: 'networkidle' });

      // Force repaint for React 19 hydration
      await authenticatedPage.evaluate(() => {
        document.body.style.display = 'none';
        document.body.offsetHeight;
        document.body.style.display = '';
      });

      await authenticatedPage.waitForTimeout(1000);
      await authenticatedPage.screenshot({
        path: `tests/screenshots/linked-accounts-${device.name}.png`,
        fullPage: true
      });
    });
  }
});
