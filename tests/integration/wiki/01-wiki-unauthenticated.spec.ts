/**
 * Wiki Unauthenticated Tests
 * Priority: P0 (Critical)
 *
 * Tests unauthenticated access to wiki and dashboard
 */

import { test, expect } from '../../utils/fixtures';

test.describe('Wiki - Unauthenticated Access', () => {
  test('homepage shows Coming 2026 placeholder', async ({ page, screenshotHelper }) => {
    await page.goto('/');

    // Should show the placeholder page
    await expect(page.locator('body')).toContainText('Coming');
    await screenshotHelper.capture('wiki/unauthenticated/homepage');
  });

  test('dashboard redirects to signin when not authenticated', async ({ page, screenshotHelper }) => {
    await page.goto('/dashboard');

    // Should redirect to auth signin
    await page.waitForURL(/api\/auth\/signin/, { timeout: 10000 });
    await screenshotHelper.capture('wiki/unauthenticated/dashboard-redirect-to-signin');

    // Verify we're on signin page
    await expect(page.url()).toContain('/api/auth/signin');
  });

  test('wiki API returns 401 when not authenticated', async ({ page }) => {
    // Try to fetch wiki pages without auth
    const response = await page.request.get('/api/core/wiki');

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  test('wiki page API returns 401 when not authenticated', async ({ page }) => {
    // Try to get a specific wiki page without auth
    const response = await page.request.get('/api/core/wiki/some-id');

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  test('wiki create API returns 401 when not authenticated', async ({ page }) => {
    // Try to create a wiki page without auth
    const response = await page.request.post('/api/core/wiki', {
      data: {
        slug: 'test-page',
        title: 'Test Page',
        category: 'general',
        content: 'Test content',
      },
    });

    expect(response.status()).toBe(401);
  });
});
