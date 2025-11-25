/**
 * Integration tests for World Anvil account linking
 */

import { test, expect } from '@playwright/test';

test.describe('World Anvil Account Linking', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page and authenticate
    await page.goto('/login');

    // Check if already logged in
    const isLoggedIn = await page.locator('[data-testid="user-menu"]').count() > 0;

    if (!isLoggedIn) {
      // Perform login (adjust based on your auth method)
      // This assumes Discord login is available
      await page.click('[data-testid="discord-login-button"]');
      await page.waitForURL('**/linked-accounts', { timeout: 10000 });
    } else {
      await page.goto('/linked-accounts');
    }
  });

  test('should display linked accounts page', async ({ page }) => {
    await page.goto('/linked-accounts');

    // Verify page loads
    await expect(page.locator('[data-testid="linked-accounts-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="page-title"]')).toContainText('Linked Accounts');
  });

  test('should show World Anvil linking form when not linked', async ({ page }) => {
    await page.goto('/linked-accounts');

    // Check if World Anvil is not already linked
    const isLinked = await page.locator('[data-testid="worldanvil-linked"]').count() > 0;

    if (!isLinked) {
      // Verify form is displayed
      await expect(page.locator('[data-testid="worldanvil-link-form"]')).toBeVisible();
      await expect(page.locator('[data-testid="worldanvil-token-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="link-worldanvil-button"]')).toBeVisible();

      // Verify link to World Anvil API settings
      const apiLink = page.locator('a[href*="worldanvil.com/api/auth/key"]');
      await expect(apiLink).toBeVisible();
    }
  });

  test('should show Discord account status', async ({ page }) => {
    await page.goto('/linked-accounts');

    const discordSection = page.locator('[data-testid="discord-account"]');
    await expect(discordSection).toBeVisible();
    await expect(discordSection).toContainText('Discord');
  });

  test('should show GitHub account status', async ({ page }) => {
    await page.goto('/linked-accounts');

    const githubSection = page.locator('[data-testid="github-account"]');
    await expect(githubSection).toBeVisible();
    await expect(githubSection).toContainText('GitHub');
  });

  test('should validate empty World Anvil token', async ({ page }) => {
    await page.goto('/linked-accounts');

    // Check if form is present (not already linked)
    const formExists = await page.locator('[data-testid="worldanvil-link-form"]').count() > 0;

    if (formExists) {
      const submitButton = page.locator('[data-testid="link-worldanvil-button"]');

      // Button should be disabled when input is empty
      await expect(submitButton).toBeDisabled();
    }
  });

  test('should enable submit button when token is entered', async ({ page }) => {
    await page.goto('/linked-accounts');

    const formExists = await page.locator('[data-testid="worldanvil-link-form"]').count() > 0;

    if (formExists) {
      const tokenInput = page.locator('[data-testid="worldanvil-token-input"]');
      const submitButton = page.locator('[data-testid="link-worldanvil-button"]');

      // Enter a token (invalid for test purposes)
      await tokenInput.fill('test-token-123');

      // Button should now be enabled
      await expect(submitButton).toBeEnabled();
    }
  });

  test('should toggle token visibility', async ({ page }) => {
    await page.goto('/linked-accounts');

    const formExists = await page.locator('[data-testid="worldanvil-link-form"]').count() > 0;

    if (formExists) {
      const tokenInput = page.locator('[data-testid="worldanvil-token-input"]');

      // Fill in a test token
      await tokenInput.fill('test-token-123');

      // Initially should be password type (hidden)
      await expect(tokenInput).toHaveAttribute('type', 'password');

      // Click the eye icon to show
      const eyeButton = page.locator('button[tabindex="-1"]').first();
      await eyeButton.click();

      // Should now be text type (visible)
      await expect(tokenInput).toHaveAttribute('type', 'text');

      // Click again to hide
      await eyeButton.click();
      await expect(tokenInput).toHaveAttribute('type', 'password');
    }
  });

  test('should handle invalid World Anvil token', async ({ page }) => {
    await page.goto('/linked-accounts');

    const formExists = await page.locator('[data-testid="worldanvil-link-form"]').count() > 0;

    if (formExists) {
      const tokenInput = page.locator('[data-testid="worldanvil-token-input"]');
      const submitButton = page.locator('[data-testid="link-worldanvil-button"]');

      // Enter an invalid token
      await tokenInput.fill('invalid-token-xyz');
      await submitButton.click();

      // Should show loading state
      await expect(submitButton).toContainText('Verifying...');

      // Wait for error message (should appear within 10 seconds)
      const errorMessage = page.locator('.bg-red-50, .bg-red-900\\/20').first();
      await expect(errorMessage).toBeVisible({ timeout: 10000 });
      await expect(errorMessage).toContainText(/invalid|error|failed/i);

      // Button should return to normal state
      await expect(submitButton).toContainText('Link Account');
    }
  });

  test('should show info box about linked accounts', async ({ page }) => {
    await page.goto('/linked-accounts');

    const infoBox = page.locator('.bg-blue-50, .bg-blue-900\\/20').filter({ hasText: 'About Linked Accounts' });
    await expect(infoBox).toBeVisible();
    await expect(infoBox).toContainText('Linking your accounts');
  });

  test('should display World Anvil icon', async ({ page }) => {
    await page.goto('/linked-accounts');

    const worldAnvilSection = page.locator('[data-testid="worldanvil-link-form"], [data-testid="worldanvil-linked"]');
    await expect(worldAnvilSection).toBeVisible();

    // Check for SVG icon presence
    const icon = worldAnvilSection.locator('svg').first();
    await expect(icon).toBeVisible();
  });

  test.describe('When World Anvil is linked', () => {
    test.skip('should show linked status with username', async ({ page }) => {
      // This test will run only if account is already linked
      await page.goto('/linked-accounts');

      const linkedSection = page.locator('[data-testid="worldanvil-linked"]');
      const isLinked = await linkedSection.count() > 0;

      if (isLinked) {
        await expect(linkedSection).toBeVisible();
        await expect(linkedSection).toContainText('World Anvil');
        await expect(linkedSection).toContainText('Connected as');

        // Should have unlink button
        const unlinkButton = page.locator('[data-testid="unlink-worldanvil-button"]');
        await expect(unlinkButton).toBeVisible();
        await expect(unlinkButton).toContainText('Unlink');
      }
    });

    test.skip('should unlink World Anvil account', async ({ page }) => {
      await page.goto('/linked-accounts');

      const linkedSection = page.locator('[data-testid="worldanvil-linked"]');
      const isLinked = await linkedSection.count() > 0;

      if (isLinked) {
        // Click unlink button
        const unlinkButton = page.locator('[data-testid="unlink-worldanvil-button"]');

        // Set up dialog handler for confirmation
        page.on('dialog', dialog => dialog.accept());

        await unlinkButton.click();

        // Should show loading state
        await expect(unlinkButton).toContainText('Unlinking...');

        // Wait for page to refresh and show form again
        await expect(page.locator('[data-testid="worldanvil-link-form"]')).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test('should maintain responsive design on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/linked-accounts');

    // Page should still be usable
    await expect(page.locator('[data-testid="linked-accounts-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="page-title"]')).toBeVisible();

    // Check if World Anvil section is visible
    const worldAnvilSection = page.locator('[data-testid="worldanvil-link-form"], [data-testid="worldanvil-linked"]');
    await expect(worldAnvilSection).toBeVisible();
  });
});
