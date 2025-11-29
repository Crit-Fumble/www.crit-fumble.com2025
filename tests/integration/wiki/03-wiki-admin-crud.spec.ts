/**
 * Wiki Admin CRUD Tests
 * Priority: P0 (Critical)
 *
 * Tests admin/owner access for wiki management
 * Admins and owners can create, read, update, and delete wiki pages
 */

import { test, expect } from '../../utils/fixtures';

test.describe('Wiki - Admin CRUD Operations', () => {
  // Track created page for cleanup
  let createdPageId: string | null = null;

  test.afterEach(async ({ adminAuthenticatedPage }) => {
    // Cleanup: delete test page if created
    if (createdPageId) {
      await adminAuthenticatedPage.request.delete(`/api/core/wiki/${createdPageId}`);
      createdPageId = null;
    }
  });

  test('admin can access dashboard with edit capability', async ({ adminAuthenticatedPage, screenshotHelper }) => {
    const page = adminAuthenticatedPage;

    await page.goto('/dashboard');

    // Should not be redirected
    await expect(page).toHaveURL('/dashboard');
    await screenshotHelper.capture('wiki/admin/dashboard-with-edit');

    // Should show the wiki dashboard
    await expect(page.locator('text=Pages')).toBeVisible();

    // Should show "+ New" button for creating pages
    await expect(page.locator('text=+ New')).toBeVisible();
  });

  test('admin can create a wiki page via API', async ({ adminAuthenticatedPage }) => {
    const page = adminAuthenticatedPage;
    const timestamp = Date.now();

    // Create a wiki page
    const response = await page.request.post('/api/core/wiki', {
      data: {
        slug: `test-page-${timestamp}`,
        title: `Test Page ${timestamp}`,
        category: 'general',
        content: '# Test Content\n\nThis is a test page.',
      },
    });

    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data.slug).toBe(`test-page-${timestamp}`);
    expect(data.title).toBe(`Test Page ${timestamp}`);
    expect(data.category).toBe('general');
    expect(data.content).toContain('# Test Content');
    expect(data.id).toBeDefined();

    // Store for cleanup
    createdPageId = data.id;
  });

  test('admin can read a wiki page via API', async ({ adminAuthenticatedPage }) => {
    const page = adminAuthenticatedPage;
    const timestamp = Date.now();

    // First create a page
    const createResponse = await page.request.post('/api/core/wiki', {
      data: {
        slug: `test-read-${timestamp}`,
        title: `Test Read ${timestamp}`,
        category: 'general',
        content: '# Read Test',
      },
    });

    expect(createResponse.status()).toBe(201);
    const created = await createResponse.json();
    createdPageId = created.id;

    // Now read the page
    const readResponse = await page.request.get(`/api/core/wiki/${created.id}`);
    expect(readResponse.status()).toBe(200);

    const readData = await readResponse.json();
    expect(readData.id).toBe(created.id);
    expect(readData.slug).toBe(`test-read-${timestamp}`);
    expect(readData.title).toBe(`Test Read ${timestamp}`);
  });

  test('admin can update a wiki page via API', async ({ adminAuthenticatedPage }) => {
    const page = adminAuthenticatedPage;
    const timestamp = Date.now();

    // First create a page
    const createResponse = await page.request.post('/api/core/wiki', {
      data: {
        slug: `test-update-${timestamp}`,
        title: `Test Update ${timestamp}`,
        category: 'general',
        content: '# Original Content',
      },
    });

    expect(createResponse.status()).toBe(201);
    const created = await createResponse.json();
    createdPageId = created.id;

    // Now update the page
    const updateResponse = await page.request.patch(`/api/core/wiki/${created.id}`, {
      data: {
        title: 'Updated Title',
        content: '# Updated Content\n\nThis has been updated.',
        changeNote: 'Test update',
      },
    });

    expect(updateResponse.status()).toBe(200);
    const updated = await updateResponse.json();
    expect(updated.title).toBe('Updated Title');
  });

  test('admin can soft-delete a wiki page via API', async ({ adminAuthenticatedPage }) => {
    const page = adminAuthenticatedPage;
    const timestamp = Date.now();

    // First create a page
    const createResponse = await page.request.post('/api/core/wiki', {
      data: {
        slug: `test-delete-${timestamp}`,
        title: `Test Delete ${timestamp}`,
        category: 'general',
        content: '# To Be Deleted',
      },
    });

    expect(createResponse.status()).toBe(201);
    const created = await createResponse.json();

    // Delete the page
    const deleteResponse = await page.request.delete(`/api/core/wiki/${created.id}`);
    expect(deleteResponse.status()).toBe(200);

    const deleteData = await deleteResponse.json();
    expect(deleteData.success).toBe(true);

    // Verify page is no longer accessible (soft deleted)
    const getResponse = await page.request.get(`/api/core/wiki/${created.id}`);
    expect(getResponse.status()).toBe(404);

    // No need to cleanup - already deleted
    createdPageId = null;
  });

  test('admin can see created page in list', async ({ adminAuthenticatedPage }) => {
    const page = adminAuthenticatedPage;
    const timestamp = Date.now();

    // First create a page
    const createResponse = await page.request.post('/api/core/wiki', {
      data: {
        slug: `test-list-${timestamp}`,
        title: `Test List ${timestamp}`,
        category: 'general',
        content: '# List Test',
      },
    });

    expect(createResponse.status()).toBe(201);
    const created = await createResponse.json();
    createdPageId = created.id;

    // Fetch the list
    const listResponse = await page.request.get('/api/core/wiki');
    expect(listResponse.status()).toBe(200);

    const listData = await listResponse.json();
    expect(Array.isArray(listData.pages)).toBe(true);

    // Find our created page
    const foundPage = listData.pages.find((p: any) => p.id === created.id);
    expect(foundPage).toBeDefined();
    expect(foundPage.slug).toBe(`test-list-${timestamp}`);
  });

  test('duplicate slug returns 409 conflict', async ({ adminAuthenticatedPage }) => {
    const page = adminAuthenticatedPage;
    const timestamp = Date.now();

    // Create first page
    const response1 = await page.request.post('/api/core/wiki', {
      data: {
        slug: `duplicate-test-${timestamp}`,
        title: 'First Page',
        category: 'general',
        content: '# First',
      },
    });

    expect(response1.status()).toBe(201);
    const created = await response1.json();
    createdPageId = created.id;

    // Try to create second page with same slug
    const response2 = await page.request.post('/api/core/wiki', {
      data: {
        slug: `duplicate-test-${timestamp}`,
        title: 'Second Page',
        category: 'general',
        content: '# Second',
      },
    });

    expect(response2.status()).toBe(409);
    const errorData = await response2.json();
    expect(errorData.error).toBe('A page with this slug already exists');
  });

  test('missing required fields returns 400', async ({ adminAuthenticatedPage }) => {
    const page = adminAuthenticatedPage;

    // Missing slug
    const response1 = await page.request.post('/api/core/wiki', {
      data: {
        title: 'Missing Slug',
        category: 'general',
      },
    });

    expect(response1.status()).toBe(400);
    const error1 = await response1.json();
    expect(error1.error).toBe('Missing required fields');

    // Missing title
    const response2 = await page.request.post('/api/core/wiki', {
      data: {
        slug: 'missing-title',
        category: 'general',
      },
    });

    expect(response2.status()).toBe(400);

    // Missing category
    const response3 = await page.request.post('/api/core/wiki', {
      data: {
        slug: 'missing-category',
        title: 'Missing Category',
      },
    });

    expect(response3.status()).toBe(400);
  });
});
