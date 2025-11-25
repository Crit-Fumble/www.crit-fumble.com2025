/**
 * User Login Flow - Comprehensive Integration Test with Captures
 *
 * This test captures the complete user login experience with screenshots
 * and videos for review.
 *
 * Test Flow:
 * 1. User lands on homepage (unauthenticated)
 * 2. Gets redirected to login page
 * 3. Views login page with OAuth options
 * 4. Authenticates using test helper
 * 5. Gets redirected to dashboard
 * 6. Views authenticated dashboard
 */

import { test, expect } from '@playwright/test';

test.describe('User Login Flow - Complete Journey', () => {

  test('should capture complete user login journey', async ({ page }) => {
    const timestamp = Date.now();
    const screenshotPath = `user-login-flow/${timestamp}`;

    // ==================================================================
    // STEP 1: User arrives at homepage (unauthenticated)
    // ==================================================================
    await test.step('Step 1: Homepage - Unauthenticated', async () => {
      await page.goto('/');

      // Capture initial homepage visit
      await page.screenshot({
        path: `tests/screenshots/${screenshotPath}/01-homepage-initial.png`,
        fullPage: true,
      });

      // Should redirect to login
      await page.waitForURL('/login', { timeout: 10000 });

      // Capture after redirect
      await page.screenshot({
        path: `tests/screenshots/${screenshotPath}/02-redirected-to-login.png`,
        fullPage: true,
      });
    });

    // ==================================================================
    // STEP 2: Login Page - Initial Load
    // ==================================================================
    await test.step('Step 2: Login Page - Initial View', async () => {
      await page.waitForLoadState('networkidle');

      // Verify login page elements are visible
      await expect(page.getByRole('heading', { name: /Crit Fumble Gaming/i })).toBeVisible();

      // Capture full login page
      await page.screenshot({
        path: `tests/screenshots/${screenshotPath}/03-login-page-full.png`,
        fullPage: true,
      });

      // Verify OAuth buttons are present
      const discordButton = page.getByRole('button', { name: /Sign in with Discord/i });
      const githubButton = page.getByRole('button', { name: /Sign in with GitHub/i });

      await expect(discordButton).toBeVisible();
      await expect(githubButton).toBeVisible();

      // Capture OAuth buttons section (just take a full page screenshot instead of clipping)
      await page.screenshot({
        path: `tests/screenshots/${screenshotPath}/04-login-oauth-buttons.png`,
        fullPage: true,
      });
    });

    // ==================================================================
    // STEP 3: Login Page - Button Interactions
    // ==================================================================
    await test.step('Step 3: Login Page - Button States', async () => {
      const discordButton = page.getByRole('button', { name: /Sign in with Discord/i });

      // Capture default state
      await page.screenshot({
        path: `tests/screenshots/${screenshotPath}/05-discord-button-default.png`,
      });

      // Hover over Discord button
      await discordButton.hover();
      await page.waitForTimeout(500); // Wait for hover animation

      await page.screenshot({
        path: `tests/screenshots/${screenshotPath}/06-discord-button-hover.png`,
      });

      // Move away to reset state
      await page.mouse.move(0, 0);
      await page.waitForTimeout(300);

      const githubButton = page.getByRole('button', { name: /Sign in with GitHub/i });

      // Hover over GitHub button
      await githubButton.hover();
      await page.waitForTimeout(500);

      await page.screenshot({
        path: `tests/screenshots/${screenshotPath}/07-github-button-hover.png`,
      });
    });

    // ==================================================================
    // STEP 4: Authentication - Using Test Helper
    // ==================================================================
    await test.step('Step 4: Test Authentication', async () => {
      const testEmail = `user-login-test-${timestamp}@crit-fumble.test`;
      const testUsername = `login_user_${timestamp}`;

      // Navigate to test-auth page (which will set the cookie in the browser context)
      const response = await page.goto('/api/_dev/test-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail,
          username: testUsername,
        }),
      });

      // Alternative approach: Use page.evaluate to call fetch with credentials
      const authData = await page.evaluate(async ({ email, username }) => {
        const res = await fetch('/api/_dev/test-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include', // Important: include cookies
          body: JSON.stringify({ email, username }),
        });
        return res.json();
      }, { email: testEmail, username: testUsername });

      expect(authData.success).toBe(true);
      expect(authData.email).toBe(testEmail);
      expect(authData.username).toBe(testUsername);

      // Capture response data (for debugging)
      console.log('Authentication successful:', {
        playerId: authData.playerId,
        username: authData.username,
        email: authData.email,
        sessionToken: authData.sessionToken,
      });

      // Wait a moment for cookie to be set
      await page.waitForTimeout(500);
    });

    // ==================================================================
    // STEP 5: Post-Login Redirect
    // ==================================================================
    await test.step('Step 5: Redirect to Dashboard', async () => {
      // Navigate to homepage which should now redirect to dashboard
      await page.goto('/');

      // Should redirect to dashboard
      await page.waitForURL('/dashboard', { timeout: 10000 });

      await page.screenshot({
        path: `tests/screenshots/${screenshotPath}/08-redirected-to-dashboard.png`,
        fullPage: true,
      });
    });

    // ==================================================================
    // STEP 6: Authenticated Dashboard View
    // ==================================================================
    await test.step('Step 6: Dashboard - Authenticated User', async () => {
      await page.waitForLoadState('networkidle');

      // Verify dashboard elements
      await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible();

      // Capture full dashboard
      await page.screenshot({
        path: `tests/screenshots/${screenshotPath}/09-dashboard-full-view.png`,
        fullPage: true,
      });

      // Check for navigation header
      const header = page.locator('header, nav').first();
      if (await header.isVisible()) {
        await page.screenshot({
          path: `tests/screenshots/${screenshotPath}/10-dashboard-header.png`,
          clip: await header.boundingBox().then(box => box || undefined),
        });
      }
    });

    // ==================================================================
    // STEP 7: User Information Display
    // ==================================================================
    await test.step('Step 7: User Information', async () => {
      // Look for username or email display
      const usernamePattern = /login_user_\d+/i;

      // Check if username is visible anywhere on the page
      const pageContent = await page.content();
      expect(pageContent).toMatch(usernamePattern);

      // Capture current user section if it exists
      await page.screenshot({
        path: `tests/screenshots/${screenshotPath}/11-user-info-section.png`,
        fullPage: true,
      });
    });

    // ==================================================================
    // STEP 8: Navigation Test
    // ==================================================================
    await test.step('Step 8: Dashboard Navigation', async () => {
      // Try to find navigation links
      const linkedAccountsLink = page.getByRole('link', { name: /Linked Accounts/i });

      if (await linkedAccountsLink.isVisible()) {
        await linkedAccountsLink.click();
        await page.waitForURL('/linked-accounts', { timeout: 10000 });

        await page.screenshot({
          path: `tests/screenshots/${screenshotPath}/12-linked-accounts-page.png`,
          fullPage: true,
        });

        // Navigate back to dashboard
        const dashboardLink = page.getByRole('link', { name: /Dashboard/i });
        if (await dashboardLink.isVisible()) {
          await dashboardLink.click();
          await page.waitForURL('/dashboard', { timeout: 10000 });

          await page.screenshot({
            path: `tests/screenshots/${screenshotPath}/13-back-to-dashboard.png`,
            fullPage: true,
          });
        }
      }
    });

    // ==================================================================
    // STEP 9: Session Persistence
    // ==================================================================
    await test.step('Step 9: Session Persistence', async () => {
      // Reload the page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should still be on dashboard (session persisted)
      expect(page.url()).toContain('/dashboard');

      await page.screenshot({
        path: `tests/screenshots/${screenshotPath}/14-after-page-reload.png`,
        fullPage: true,
      });
    });
  });

  test('should capture login flow on mobile viewport', async ({ page }) => {
    const timestamp = Date.now();
    const screenshotPath = `user-login-flow-mobile/${timestamp}`;

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await test.step('Mobile: Homepage → Login', async () => {
      await page.goto('/');
      await page.waitForURL('/login', { timeout: 10000 });

      await page.screenshot({
        path: `tests/screenshots/${screenshotPath}/01-mobile-login-page.png`,
        fullPage: true,
      });
    });

    await test.step('Mobile: Login Page Elements', async () => {
      await page.waitForLoadState('networkidle');

      // Verify elements are visible on mobile
      await expect(page.getByRole('heading', { name: /Crit Fumble Gaming/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Sign in with Discord/i })).toBeVisible();

      await page.screenshot({
        path: `tests/screenshots/${screenshotPath}/02-mobile-oauth-buttons.png`,
        fullPage: true,
      });
    });

    await test.step('Mobile: Authenticate and Dashboard', async () => {
      const testEmail = `mobile-test-${timestamp}@crit-fumble.test`;
      const testUsername = `mobile_user_${timestamp}`;

      // Authenticate using page.evaluate to ensure cookie is set in browser context
      const authData = await page.evaluate(async ({ email, username }) => {
        const res = await fetch('/api/_dev/test-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, username }),
        });
        return res.json();
      }, { email: testEmail, username: testUsername });

      expect(authData.success).toBe(true);
      await page.waitForTimeout(500);

      await page.goto('/');
      await page.waitForURL('/dashboard', { timeout: 10000 });

      await page.screenshot({
        path: `tests/screenshots/${screenshotPath}/03-mobile-dashboard.png`,
        fullPage: true,
      });
    });
  });

  test('should record complete login flow as video', async ({ page }) => {
    const timestamp = Date.now();

    // Note: Video is automatically recorded by Playwright config
    // This test performs the complete flow for video capture

    await test.step('Video: Complete User Journey', async () => {
      // 1. Homepage
      await page.goto('/');
      await page.waitForTimeout(1000);

      // 2. Login page
      await page.waitForURL('/login', { timeout: 10000 });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // 3. Show button interactions
      const discordButton = page.getByRole('button', { name: /Sign in with Discord/i });
      await discordButton.hover();
      await page.waitForTimeout(1000);

      const githubButton = page.getByRole('button', { name: /Sign in with GitHub/i });
      await githubButton.hover();
      await page.waitForTimeout(1000);

      // 4. Authenticate
      const testEmail = `video-test-${timestamp}@crit-fumble.test`;
      const testUsername = `video_user_${timestamp}`;

      const authData = await page.evaluate(async ({ email, username }) => {
        const res = await fetch('/api/_dev/test-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, username }),
        });
        return res.json();
      }, { email: testEmail, username: testUsername });

      expect(authData.success).toBe(true);
      await page.waitForTimeout(1000);

      // 5. Navigate to dashboard
      await page.goto('/');
      await page.waitForURL('/dashboard', { timeout: 10000 });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // 6. Show dashboard sections
      const linkedAccountsLink = page.getByRole('link', { name: /Linked Accounts/i });
      if (await linkedAccountsLink.isVisible()) {
        await linkedAccountsLink.click();
        await page.waitForURL('/linked-accounts', { timeout: 10000 });
        await page.waitForTimeout(2000);

        const dashboardLink = page.getByRole('link', { name: /Dashboard/i });
        if (await dashboardLink.isVisible()) {
          await dashboardLink.click();
          await page.waitForURL('/dashboard', { timeout: 10000 });
          await page.waitForTimeout(2000);
        }
      }

      // Video will be saved automatically in tests/videos/
      console.log('Video capture complete - check tests/videos/ directory');
    });
  });
});
