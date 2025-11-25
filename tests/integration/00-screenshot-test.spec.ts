/**
 * Screenshot System Test
 * Priority: P0 (Infrastructure)
 *
 * Verifies that the screenshot capture system is working correctly.
 * Run this test first to ensure screenshots are being captured properly.
 */

import { test, expect } from '../utils/fixtures';

test.describe('Screenshot System Verification', () => {
  test('should capture screenshot of login page', async ({ page, screenshotHelper }) => {
    await page.goto('/login');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Wait for key elements to be visible
    const logo = page.locator('img[alt="Crit Fumble Gaming Logo"]').first();
    await expect(logo).toBeVisible({ timeout: 10000 });

    const discordButton = page.locator('button[type="submit"]').filter({ hasText: 'Sign in with Discord' });
    await expect(discordButton).toBeVisible({ timeout: 10000 });

    // Capture full page screenshot
    const screenshotPath = await screenshotHelper.capture('test/login-page-verification');

    // Verify screenshot file exists
    const fs = require('fs');
    expect(fs.existsSync(screenshotPath)).toBe(true);

    // Check file size (should be > 0 bytes if image captured successfully)
    const stats = fs.statSync(screenshotPath);
    expect(stats.size).toBeGreaterThan(1000); // At least 1KB

    console.log(`✅ Screenshot captured successfully: ${screenshotPath}`);
    console.log(`   File size: ${(stats.size / 1024).toFixed(2)} KB`);
  });

  test('should capture element screenshot', async ({ page, screenshotHelper }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Wait for Discord button
    const discordButton = page.locator('button[type="submit"]').filter({ hasText: 'Sign in with Discord' });
    await expect(discordButton).toBeVisible({ timeout: 10000 });

    // Capture element screenshot
    const screenshotPath = await screenshotHelper.captureElement(
      'button[type="submit"]',
      'test/discord-button-verification'
    );

    // Verify screenshot file exists
    const fs = require('fs');
    expect(fs.existsSync(screenshotPath)).toBe(true);

    const stats = fs.statSync(screenshotPath);
    expect(stats.size).toBeGreaterThan(500); // At least 500 bytes for button

    console.log(`✅ Element screenshot captured successfully: ${screenshotPath}`);
    console.log(`   File size: ${(stats.size / 1024).toFixed(2)} KB`);
  });

  test('should capture authenticated dashboard', async ({
    authenticatedPage,
    screenshotHelper,
    testUser,
  }) => {
    await authenticatedPage.goto('/dashboard');
    await authenticatedPage.waitForLoadState('networkidle');

    // Wait for dashboard to be visible
    await authenticatedPage.waitForSelector('body', { state: 'visible', timeout: 10000 });

    // Give a moment for any dynamic content to load
    await authenticatedPage.waitForTimeout(1000);

    // Capture dashboard screenshot
    const screenshotPath = await screenshotHelper.capture('test/dashboard-verification');

    // Verify screenshot
    const fs = require('fs');
    expect(fs.existsSync(screenshotPath)).toBe(true);

    const stats = fs.statSync(screenshotPath);
    expect(stats.size).toBeGreaterThan(1000);

    console.log(`✅ Authenticated screenshot captured for user: ${testUser.username}`);
    console.log(`   Screenshot: ${screenshotPath}`);
    console.log(`   File size: ${(stats.size / 1024).toFixed(2)} KB`);
  });

  test('should wait for content before capturing', async ({ page, screenshotHelper }) => {
    await page.goto('/login');

    // Don't explicitly wait - let the screenshot helper handle it
    const screenshotPath = await screenshotHelper.capture('test/auto-wait-verification');

    // Verify screenshot captured valid content
    const fs = require('fs');
    const stats = fs.statSync(screenshotPath);

    // Screenshot should be substantial (not blank/minimal)
    expect(stats.size).toBeGreaterThan(5000); // At least 5KB for full page

    console.log(`✅ Auto-wait screenshot verification passed`);
    console.log(`   File size: ${(stats.size / 1024).toFixed(2)} KB`);
  });
});

test.describe('Screenshot Output Locations', () => {
  test('should organize screenshots by category', async ({ page, screenshotHelper }) => {
    const fs = require('fs');
    const path = require('path');

    // Login page (should go to crit/auth category)
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    const loginPath = await screenshotHelper.capture('test/category-login');

    expect(loginPath).toContain('crit');
    expect(fs.existsSync(loginPath)).toBe(true);

    console.log(`✅ Category-based organization working`);
    console.log(`   Login screenshot: ${loginPath}`);
  });

  test('should create nested directories for custom paths', async ({ page, screenshotHelper }) => {
    const fs = require('fs');

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Custom nested path
    const customPath = await screenshotHelper.capture('test/nested/folder/structure/verification');

    expect(fs.existsSync(customPath)).toBe(true);
    expect(customPath).toContain('test/nested/folder/structure');

    console.log(`✅ Nested directory creation working`);
    console.log(`   Custom path: ${customPath}`);
  });
});
