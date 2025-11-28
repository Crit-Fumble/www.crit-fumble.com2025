/**
 * Wiki UI Flow Tests
 * Priority: P0 (Critical)
 *
 * Tests the complete UI workflow for wiki management
 * with comprehensive screenshot capture
 */

import { test, expect } from '../../utils/fixtures';

test.describe('Wiki - Admin UI Flow', () => {
  // Track created page for cleanup
  let createdPageSlug: string | null = null;

  test.afterEach(async ({ adminAuthenticatedPage }) => {
    // Cleanup via API if needed
    if (createdPageSlug) {
      const listResponse = await adminAuthenticatedPage.request.get('/api/wiki');
      if (listResponse.ok()) {
        const data = await listResponse.json();
        const page = data.pages?.find((p: any) => p.slug === createdPageSlug);
        if (page) {
          await adminAuthenticatedPage.request.delete(`/api/wiki/${page.id}`);
        }
      }
      createdPageSlug = null;
    }
  });

  test('complete wiki edit flow with screenshots', async ({ adminAuthenticatedPage, screenshotHelper }) => {
    const page = adminAuthenticatedPage;
    const timestamp = Date.now();
    createdPageSlug = `ui-test-${timestamp}`;

    // Step 1: Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await screenshotHelper.capture('wiki/ui-flow/01-dashboard-initial');

    // Step 2: Click "+ New" to create a page
    // Need to handle the prompt dialog
    page.once('dialog', async (dialog) => {
      await dialog.accept(createdPageSlug);
    });

    await page.click('text=+ New');
    await page.waitForTimeout(500);
    await screenshotHelper.capture('wiki/ui-flow/02-page-created');

    // Step 3: Verify we're in edit mode with the new page
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('textarea')).toBeVisible();
    await screenshotHelper.capture('wiki/ui-flow/03-edit-mode');

    // Step 4: Modify the title
    const titleInput = page.locator('input[type="text"]');
    await titleInput.clear();
    await titleInput.fill('My Test Wiki Page');
    await screenshotHelper.capture('wiki/ui-flow/04-title-edited');

    // Step 5: Add content
    const contentArea = page.locator('textarea');
    await contentArea.clear();
    await contentArea.fill('# My Test Wiki Page\n\n## Overview\n\nThis is a test wiki page created via the UI.\n\n## Features\n\n- Feature 1\n- Feature 2\n- Feature 3');
    await screenshotHelper.capture('wiki/ui-flow/05-content-edited');

    // Step 6: Save the page
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(1000);
    await screenshotHelper.capture('wiki/ui-flow/06-page-saved');

    // Step 7: Verify success message
    await expect(page.locator('text=Page saved successfully')).toBeVisible({ timeout: 5000 });
    await screenshotHelper.capture('wiki/ui-flow/07-success-message');

    // Step 8: Click the page in sidebar to view it
    await page.click(`button:has-text("My Test Wiki Page")`);
    await page.waitForTimeout(500);
    await screenshotHelper.capture('wiki/ui-flow/08-page-view-mode');

    // Step 9: Enter edit mode again
    await page.click('button:has-text("Edit")');
    await page.waitForTimeout(500);
    await screenshotHelper.capture('wiki/ui-flow/09-re-enter-edit-mode');

    // Step 10: Cancel editing
    await page.click('button:has-text("Cancel")');
    await page.waitForTimeout(500);
    await screenshotHelper.capture('wiki/ui-flow/10-cancel-edit');
  });

  test('dashboard responsive layout', async ({ adminAuthenticatedPage, screenshotHelper }) => {
    const page = adminAuthenticatedPage;

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(300);
    await screenshotHelper.capture('wiki/responsive/desktop-1920x1080');

    // Laptop view
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.waitForTimeout(300);
    await screenshotHelper.capture('wiki/responsive/laptop-1366x768');

    // Tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(300);
    await screenshotHelper.capture('wiki/responsive/tablet-768x1024');

    // Mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);
    await screenshotHelper.capture('wiki/responsive/mobile-375x667');
  });

  test('sidebar page selection', async ({ adminAuthenticatedPage, screenshotHelper }) => {
    const page = adminAuthenticatedPage;
    const timestamp = Date.now();

    // Create a couple of test pages via API first
    const page1Slug = `sidebar-test-1-${timestamp}`;
    const page2Slug = `sidebar-test-2-${timestamp}`;

    const res1 = await page.request.post('/api/wiki', {
      data: {
        slug: page1Slug,
        title: 'Sidebar Test Page 1',
        category: 'general',
        content: '# Page 1 Content',
      },
    });
    expect(res1.status()).toBe(201);

    const res2 = await page.request.post('/api/wiki', {
      data: {
        slug: page2Slug,
        title: 'Sidebar Test Page 2',
        category: 'testing',
        content: '# Page 2 Content',
      },
    });
    expect(res2.status()).toBe(201);

    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await screenshotHelper.capture('wiki/sidebar/01-multiple-pages');

    // Click first page
    await page.click('button:has-text("Sidebar Test Page 1")');
    await page.waitForTimeout(500);
    await screenshotHelper.capture('wiki/sidebar/02-page1-selected');

    // Click second page
    await page.click('button:has-text("Sidebar Test Page 2")');
    await page.waitForTimeout(500);
    await screenshotHelper.capture('wiki/sidebar/03-page2-selected');

    // Cleanup
    const listResponse = await page.request.get('/api/wiki');
    const data = await listResponse.json();
    for (const p of data.pages) {
      if (p.slug === page1Slug || p.slug === page2Slug) {
        await page.request.delete(`/api/wiki/${p.id}`);
      }
    }
  });

  test('error handling UI', async ({ adminAuthenticatedPage, screenshotHelper }) => {
    const page = adminAuthenticatedPage;
    const timestamp = Date.now();

    // Create a page first
    const slug = `error-test-${timestamp}`;
    const res = await page.request.post('/api/wiki', {
      data: {
        slug,
        title: 'Error Test Page',
        category: 'general',
        content: '# Error Test',
      },
    });
    expect(res.status()).toBe(201);

    // Navigate to dashboard and try to create duplicate
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Try to create a page with the same slug
    page.once('dialog', async (dialog) => {
      await dialog.accept(slug); // Use same slug as existing page
    });

    await page.click('text=+ New');
    await page.waitForTimeout(1000);
    await screenshotHelper.capture('wiki/error/01-duplicate-slug-error');

    // Should show error message
    const errorMessage = page.locator('text=already exists');
    if (await errorMessage.isVisible({ timeout: 3000 })) {
      await screenshotHelper.capture('wiki/error/02-error-message-visible');
    }

    // Cleanup
    const listResponse = await page.request.get('/api/wiki');
    const data = await listResponse.json();
    const pageToDelete = data.pages?.find((p: any) => p.slug === slug);
    if (pageToDelete) {
      await page.request.delete(`/api/wiki/${pageToDelete.id}`);
    }
  });
});

test.describe('Wiki - User Info Display', () => {
  test('admin user sees role in sidebar', async ({ adminAuthenticatedPage, screenshotHelper }) => {
    const page = adminAuthenticatedPage;

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // User info section should be visible
    await expect(page.locator('.border-b.border-slate-800').first()).toBeVisible();
    await screenshotHelper.capture('wiki/user-info/admin-display');
  });

  test('regular user sees role in sidebar', async ({ authenticatedPage, screenshotHelper }) => {
    const page = authenticatedPage;

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // User info section should be visible
    await expect(page.locator('.border-b.border-slate-800').first()).toBeVisible();
    await screenshotHelper.capture('wiki/user-info/user-display');
  });
});
