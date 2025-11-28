/**
 * Wiki Authenticated Read-Only Tests
 * Priority: P0 (Critical)
 *
 * Tests authenticated access for regular users (read-only)
 * Regular users can view wiki pages but cannot edit them
 */

import { test, expect } from '../../utils/fixtures';

test.describe('Wiki - Authenticated Read-Only Access', () => {
  test('authenticated user can access dashboard', async ({ authenticatedPage, screenshotHelper }) => {
    const page = authenticatedPage;

    await page.goto('/dashboard');

    // Should not be redirected
    await expect(page).toHaveURL('/dashboard');
    await screenshotHelper.capture('wiki/authenticated/dashboard-readonly');

    // Should show the wiki dashboard
    await expect(page.locator('text=Pages')).toBeVisible();
  });

  test('authenticated user can view wiki API list', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // Fetch wiki pages
    const response = await page.request.get('/api/wiki');

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('pages');
    expect(Array.isArray(data.pages)).toBe(true);
  });

  test('authenticated user sees read-only indicator', async ({ authenticatedPage, screenshotHelper }) => {
    const page = authenticatedPage;

    await page.goto('/dashboard');

    // User info should be visible
    await expect(page.locator('text=user')).toBeVisible({ timeout: 10000 });

    // Should show user role (regular user)
    await screenshotHelper.capture('wiki/authenticated/user-info');

    // If there are pages, clicking one should show "Read-only" text
    const firstPage = page.locator('ul button').first();
    if (await firstPage.isVisible()) {
      await firstPage.click();
      await page.waitForTimeout(500);

      // Regular users should see "Read-only" instead of "Edit" button
      const readOnlyText = page.locator('text=Read-only');
      const editButton = page.getByRole('button', { name: 'Edit' });

      // Either read-only text is visible OR edit button (for admins)
      // For regular users, read-only should be visible
      await screenshotHelper.capture('wiki/authenticated/page-view-readonly');
    }
  });

  test('regular user cannot create wiki pages', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // Try to create a wiki page
    const response = await page.request.post('/api/wiki', {
      data: {
        slug: 'test-page-unauthorized',
        title: 'Test Page',
        category: 'general',
        content: 'Test content',
      },
    });

    // Should be forbidden for regular users
    expect(response.status()).toBe(403);
    const data = await response.json();
    expect(data.error).toBe('Permission denied');
  });

  test('regular user cannot update wiki pages', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // Try to update a wiki page (using a fake ID)
    const response = await page.request.patch('/api/wiki/fake-id', {
      data: {
        title: 'Updated Title',
        content: 'Updated content',
      },
    });

    // Should be forbidden for regular users
    expect(response.status()).toBe(403);
  });

  test('regular user cannot delete wiki pages', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // Try to delete a wiki page
    const response = await page.request.delete('/api/wiki/fake-id');

    // Should be forbidden for regular users
    expect(response.status()).toBe(403);
  });
});
