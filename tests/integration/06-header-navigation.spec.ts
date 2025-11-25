/**
 * Header Navigation Tests
 * Priority: P1 (Important)
 *
 * Tests navigation header functionality including sign in/out
 */

import { test, expect } from '../utils/fixtures';

test.describe('Header Navigation - Unauthenticated', () => {
  test('should not display header on login page', async ({ page, screenshotHelper }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Login page should not have a header component
    // It's a standalone landing page with its own layout
    const header = page.locator('header');
    const headerExists = await header.count();
    expect(headerExists).toBe(0);

    // But should have the large logo in the page content
    const logo = page.locator('img[alt="Crit Fumble Gaming Logo"]');
    await expect(logo).toBeVisible();

    // Capture screenshot
    await screenshotHelper.capture('navigation/unauthenticated/login-page-no-header');

    console.log('✅ Login page correctly displays without header component');
  });
});

test.describe('Header Navigation - Authenticated', () => {
  test('should display navigation header on dashboard', async ({
    authenticatedPage,
    screenshotHelper
  }) => {
    await authenticatedPage.goto('/dashboard');
    await authenticatedPage.waitForLoadState('networkidle');

    // Check for logo in header
    const headerLogo = authenticatedPage.locator('header img[alt="Crit Fumble Gaming"]');
    await expect(headerLogo).toBeVisible();

    // Check for Dashboard link
    const dashboardLink = authenticatedPage.locator('header').getByRole('link', { name: 'Dashboard' });
    await expect(dashboardLink).toBeVisible();

    // Check for Linked Accounts link
    const linkedAccountsLink = authenticatedPage.locator('header').getByRole('link', { name: 'Linked Accounts' });
    await expect(linkedAccountsLink).toBeVisible();

    // Check for Sign Out button
    const signOutButton = authenticatedPage.locator('header').getByRole('button', { name: 'Sign Out' });
    await expect(signOutButton).toBeVisible();

    // Capture screenshot
    await screenshotHelper.capture('navigation/authenticated/dashboard-header');

    console.log('✅ All header navigation elements visible on dashboard');
  });

  test('should navigate to Linked Accounts page', async ({
    authenticatedPage,
    screenshotHelper,
  }) => {
    await authenticatedPage.goto('/dashboard');
    await authenticatedPage.waitForLoadState('networkidle');

    // Click Linked Accounts link
    const linkedAccountsLink = authenticatedPage.locator('header').getByRole('link', { name: 'Linked Accounts' });
    await linkedAccountsLink.click();

    // Wait for navigation
    await authenticatedPage.waitForURL('/linked-accounts');
    await authenticatedPage.waitForLoadState('networkidle');

    // Verify we're on the Linked Accounts page
    await expect(authenticatedPage).toHaveURL('/linked-accounts');
    await expect(authenticatedPage.getByRole('heading', { name: 'Linked Accounts' })).toBeVisible();

    // Capture screenshot
    await screenshotHelper.capture('navigation/authenticated/linked-accounts-page');

    console.log('✅ Successfully navigated to Linked Accounts page');
  });

  test('should navigate back to Dashboard from Linked Accounts', async ({
    authenticatedPage,
    screenshotHelper,
  }) => {
    await authenticatedPage.goto('/linked-accounts');
    await authenticatedPage.waitForLoadState('networkidle');

    // Click Dashboard link in header
    const dashboardLink = authenticatedPage.locator('header').getByRole('link', { name: 'Dashboard' });
    await dashboardLink.click();

    // Wait for navigation
    await authenticatedPage.waitForURL('/dashboard');
    await authenticatedPage.waitForLoadState('networkidle');

    // Verify we're on the Dashboard
    await expect(authenticatedPage).toHaveURL('/dashboard');
    await expect(authenticatedPage.getByText(/Welcome back/i)).toBeVisible();

    // Capture screenshot
    await screenshotHelper.capture('navigation/authenticated/back-to-dashboard');

    console.log('✅ Successfully navigated back to Dashboard');
  });

  test('should navigate to home page when clicking logo', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/dashboard');
    await authenticatedPage.waitForLoadState('networkidle');

    // Click logo in header
    const logoLink = authenticatedPage.locator('header a[href="/"]');
    await logoLink.click();

    // Wait for navigation - should redirect to dashboard if authenticated
    await authenticatedPage.waitForLoadState('networkidle');

    // Since authenticated users are redirected from / to /dashboard,
    // we should end up back at dashboard
    await expect(authenticatedPage).toHaveURL('/dashboard');

    console.log('✅ Logo click handled correctly for authenticated user');
  });

  test.skip('should sign out when clicking Sign Out button', async ({
    authenticatedPage,
    screenshotHelper,
  }) => {
    await authenticatedPage.goto('/dashboard');
    await authenticatedPage.waitForLoadState('networkidle');

    // Click Sign Out button
    const signOutButton = authenticatedPage.locator('header').getByRole('button', { name: 'Sign Out' });
    await signOutButton.click();

    // Wait for redirect to login page
    await authenticatedPage.waitForURL('/login', { timeout: 10000 });
    await authenticatedPage.waitForLoadState('networkidle');

    // Verify we're on login page
    await expect(authenticatedPage).toHaveURL('/login');
    await expect(authenticatedPage.getByRole('heading', { name: 'Crit Fumble Gaming' })).toBeVisible();

    // Capture screenshot
    await screenshotHelper.capture('navigation/authenticated/after-signout');

    console.log('✅ Successfully signed out and redirected to login');
  });
});

test.describe('Header Navigation - Responsive', () => {
  test('should display header correctly on mobile', async ({
    authenticatedPage,
    screenshotHelper,
  }) => {
    await authenticatedPage.setViewportSize({ width: 375, height: 667 });
    await authenticatedPage.goto('/dashboard');
    await authenticatedPage.waitForLoadState('networkidle');

    // Logo should be visible
    const logo = authenticatedPage.locator('header img[alt="Crit Fumble Gaming"]');
    await expect(logo).toBeVisible();

    // Check that header exists
    const header = authenticatedPage.locator('header');
    await expect(header).toBeVisible();

    // Capture screenshot
    await screenshotHelper.capture('navigation/responsive/header-mobile');

    console.log('✅ Header displays correctly on mobile');
  });

  test('should display header correctly on desktop', async ({
    authenticatedPage,
    screenshotHelper,
  }) => {
    await authenticatedPage.setViewportSize({ width: 1920, height: 1080 });
    await authenticatedPage.goto('/dashboard');
    await authenticatedPage.waitForLoadState('networkidle');

    // All navigation elements should be visible
    await expect(authenticatedPage.locator('header img[alt="Crit Fumble Gaming"]')).toBeVisible();
    await expect(authenticatedPage.locator('header').getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(authenticatedPage.locator('header').getByRole('link', { name: 'Linked Accounts' })).toBeVisible();
    await expect(authenticatedPage.locator('header').getByRole('button', { name: 'Sign Out' })).toBeVisible();

    // Capture screenshot
    await screenshotHelper.capture('navigation/responsive/header-desktop');

    console.log('✅ Header displays correctly on desktop with all elements');
  });
});
