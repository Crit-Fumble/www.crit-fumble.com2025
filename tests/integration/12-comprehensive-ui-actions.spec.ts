/**
 * Comprehensive UI Actions Test
 * Tests all interactive elements using test IDs - no OAuth, mocked authentication
 */

import { test, expect } from '../utils/fixtures';

test.describe('Header Navigation - Authenticated User', () => {
  test('should display dashboard link in navigation', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');

    // Test Dashboard link is visible
    const dashboardLink = authenticatedPage.getByTestId('nav-dashboard');
    await expect(dashboardLink).toBeVisible();
    await dashboardLink.click();
    await authenticatedPage.waitForURL('/dashboard');

    // Verify we're on the dashboard
    const welcomeMessage = authenticatedPage.getByTestId('welcome-message');
    await expect(welcomeMessage).toBeVisible();
  });

  test('should toggle theme using theme toggle button', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');

    // Get theme toggle button
    const themeToggle = authenticatedPage.getByTestId('theme-toggle');
    await expect(themeToggle).toBeVisible();

    // Check initial theme (should be dark by default)
    const htmlElement = authenticatedPage.locator('html');
    const initialClass = await htmlElement.getAttribute('class');

    // Click theme toggle
    await themeToggle.click();
    await authenticatedPage.waitForTimeout(500); // Wait for theme change

    // Verify theme changed
    const newClass = await htmlElement.getAttribute('class');
    expect(newClass).not.toEqual(initialClass);
  });

  test('should navigate to home using logo link', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');

    const logoLink = authenticatedPage.getByTestId('logo-link');
    await expect(logoLink).toBeVisible();
    await logoLink.click();
    await authenticatedPage.waitForURL('/');
  });

  test('should sign out using sign out button', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');

    const signOutButton = authenticatedPage.getByTestId('sign-out-button');
    await expect(signOutButton).toBeVisible();
    await signOutButton.click();

    // Should redirect to login after sign out
    await authenticatedPage.waitForURL('/login');
    expect(authenticatedPage.url()).toContain('/login');
  });
});

test.describe('Header Navigation - Admin User', () => {
  test('should show and navigate to admin dashboard', async ({ adminAuthenticatedPage }) => {
    await adminAuthenticatedPage.goto('/dashboard');

    // Admin link should be visible
    const adminLink = adminAuthenticatedPage.getByTestId('nav-admin');
    await expect(adminLink).toBeVisible();
    await expect(adminLink).toHaveText('Admin');

    // Click admin link
    await adminLink.click();
    await adminAuthenticatedPage.waitForURL('/admin');

    // Verify we're on admin page
    const adminTitle = adminAuthenticatedPage.getByTestId('admin-title');
    await expect(adminTitle).toHaveText('Admin Dashboard');
  });

  test('should navigate between dashboard and admin pages multiple times', async ({ adminAuthenticatedPage }) => {
    await adminAuthenticatedPage.goto('/dashboard');

    // Navigate to admin
    await adminAuthenticatedPage.getByTestId('nav-admin').click();
    await adminAuthenticatedPage.waitForURL('/admin');
    await expect(adminAuthenticatedPage.getByTestId('admin-title')).toBeVisible();

    // Navigate back to dashboard
    await adminAuthenticatedPage.getByTestId('nav-dashboard').click();
    await adminAuthenticatedPage.waitForURL('/dashboard');
    await expect(adminAuthenticatedPage.getByTestId('welcome-message')).toBeVisible();

    // Navigate to admin again
    await adminAuthenticatedPage.getByTestId('nav-admin').click();
    await adminAuthenticatedPage.waitForURL('/admin');
    await expect(adminAuthenticatedPage.getByTestId('admin-title')).toBeVisible();
  });
});

test.describe('Mobile Navigation', () => {
  test('should open and close mobile menu', async ({ authenticatedPage }) => {
    // Set mobile viewport
    await authenticatedPage.setViewportSize({ width: 375, height: 667 });
    await authenticatedPage.goto('/dashboard');

    // Mobile menu should not be visible initially
    const mobileMenu = authenticatedPage.getByTestId('mobile-menu');
    await expect(mobileMenu).toHaveCount(0);

    // Click mobile menu toggle
    const menuToggle = authenticatedPage.getByTestId('mobile-menu-toggle');
    await expect(menuToggle).toBeVisible();
    await menuToggle.click();

    // Mobile menu should now be visible
    await expect(mobileMenu).toBeVisible();

    // Click toggle again to close
    await menuToggle.click();
    await expect(mobileMenu).toHaveCount(0);
  });

  test('should navigate using mobile menu', async ({ authenticatedPage }) => {
    await authenticatedPage.setViewportSize({ width: 375, height: 667 });
    await authenticatedPage.goto('/dashboard');

    // Open mobile menu
    await authenticatedPage.getByTestId('mobile-menu-toggle').click();

    // Click dashboard in mobile menu
    const mobileDashboardLink = authenticatedPage.getByTestId('mobile-nav-dashboard');
    await expect(mobileDashboardLink).toBeVisible();
    await mobileDashboardLink.click();

    // Should stay on dashboard and close menu
    await authenticatedPage.waitForURL('/dashboard');
    const mobileMenu = authenticatedPage.getByTestId('mobile-menu');
    await expect(mobileMenu).toHaveCount(0);
  });

  test('should toggle theme from mobile menu', async ({ authenticatedPage }) => {
    await authenticatedPage.setViewportSize({ width: 375, height: 667 });
    await authenticatedPage.goto('/dashboard');

    // Open mobile menu
    await authenticatedPage.getByTestId('mobile-menu-toggle').click();

    // Get mobile theme toggle
    const mobileThemeToggle = authenticatedPage.getByTestId('mobile-theme-toggle');
    await expect(mobileThemeToggle).toBeVisible();

    // Check initial theme
    const htmlElement = authenticatedPage.locator('html');
    const initialClass = await htmlElement.getAttribute('class');

    // Click theme toggle
    await mobileThemeToggle.click();
    await authenticatedPage.waitForTimeout(500);

    // Verify theme changed
    const newClass = await htmlElement.getAttribute('class');
    expect(newClass).not.toEqual(initialClass);
  });
});

test.describe('Dashboard Page Elements', () => {
  test('should display welcome message with username', async ({ authenticatedPage, testUser }) => {
    await authenticatedPage.goto('/dashboard');

    const welcomeMessage = authenticatedPage.getByTestId('welcome-message');
    await expect(welcomeMessage).toBeVisible();
    await expect(welcomeMessage).toContainText(testUser.username);
  });

  test('should display player email', async ({ authenticatedPage, testUser }) => {
    await authenticatedPage.goto('/dashboard');

    const playerEmail = authenticatedPage.getByTestId('player-email');
    await expect(playerEmail).toBeVisible();
    await expect(playerEmail).toHaveText(testUser.email);
  });

  test('should display coming soon section', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');

    const comingSoonSection = authenticatedPage.getByTestId('coming-soon-section');
    await expect(comingSoonSection).toBeVisible();
    await expect(comingSoonSection).toContainText('Coming March 2026');
  });
});

test.describe('Admin Dashboard Elements', () => {
  test('should display admin welcome message', async ({ adminAuthenticatedPage, adminTestUser }) => {
    await adminAuthenticatedPage.goto('/admin');

    const adminWelcome = adminAuthenticatedPage.getByTestId('admin-welcome');
    await expect(adminWelcome).toBeVisible();
    await expect(adminWelcome).toContainText(adminTestUser.username);
    await expect(adminWelcome).toContainText('administrative access');
  });

  test('should display all Discord stats cards', async ({ adminAuthenticatedPage }) => {
    await adminAuthenticatedPage.goto('/admin');

    // Check all stat cards are visible
    await expect(adminAuthenticatedPage.getByTestId('stat-total-members')).toBeVisible();
    await expect(adminAuthenticatedPage.getByTestId('stat-online-members')).toBeVisible();
    await expect(adminAuthenticatedPage.getByTestId('stat-active-channels')).toBeVisible();
    await expect(adminAuthenticatedPage.getByTestId('stat-recent-messages')).toBeVisible();

    // Messages (24h) should always show "Coming Soon" since it's not implemented yet
    const recentMessagesCard = adminAuthenticatedPage.getByTestId('stat-recent-messages');
    await expect(recentMessagesCard.getByText('Coming Soon')).toBeVisible();
  });

  test('should display all admin sections', async ({ adminAuthenticatedPage }) => {
    await adminAuthenticatedPage.goto('/admin');

    // Verify all sections are present
    await expect(adminAuthenticatedPage.getByTestId('discord-stats-section')).toBeVisible();
    await expect(adminAuthenticatedPage.getByTestId('user-management-section')).toBeVisible();

    // System status might need scrolling
    const systemSection = adminAuthenticatedPage.getByTestId('system-status-section');
    await systemSection.scrollIntoViewIfNeeded();
    await expect(systemSection).toBeVisible();
  });

  test('should display user management with test user', async ({ adminAuthenticatedPage, adminTestUser }) => {
    await adminAuthenticatedPage.goto('/admin');

    // Scroll to user management section
    const userMgmtSection = adminAuthenticatedPage.getByTestId('user-management-section');
    await userMgmtSection.scrollIntoViewIfNeeded();

    // Verify user table shows the admin test user
    const userTable = adminAuthenticatedPage.getByTestId('user-list-table');
    await expect(userTable).toBeVisible();

    // Find the admin user's row
    const adminUserRow = adminAuthenticatedPage.getByTestId(`user-row-${adminTestUser.username}`);
    await expect(adminUserRow).toBeVisible();
  });
});

test.describe('Linked Accounts Page', () => {
  test('should display page title and description', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/linked-accounts');

    const pageTitle = authenticatedPage.getByTestId('page-title');
    await expect(pageTitle).toBeVisible();
    await expect(pageTitle).toHaveText('Linked Accounts');

    const pageDescription = authenticatedPage.getByTestId('page-description');
    await expect(pageDescription).toBeVisible();
    await expect(pageDescription).toHaveText('Manage your connected accounts');
  });

  test('should display coming soon notice', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/linked-accounts');

    const comingSoonNotice = authenticatedPage.getByTestId('coming-soon-notice');
    await expect(comingSoonNotice).toBeVisible();
    await expect(comingSoonNotice).toContainText('Coming Soon');
  });
});

test.describe('Unauthenticated User - Login Page', () => {
  test('should display login page elements', async ({ page }) => {
    await page.goto('/login');

    // Check logo
    const logo = page.getByTestId('login-logo');
    await expect(logo).toBeVisible();

    // Check Discord sign-in button (primary auth method)
    const discordButton = page.getByTestId('signin-discord');
    await expect(discordButton).toBeVisible();
    await expect(discordButton).toContainText('Sign in with Discord');

    // Verify GitHub and Twitch buttons are no longer present
    // Users can link these accounts after signing in
    const githubButton = page.getByTestId('signin-github');
    await expect(githubButton).toHaveCount(0);

    const twitchButton = page.getByTestId('signin-twitch');
    await expect(twitchButton).toHaveCount(0);
  });

  test('should show sign in button in header when unauthenticated', async ({ page }) => {
    await page.goto('/login');

    const signInButton = page.getByTestId('sign-in-button');
    await expect(signInButton).toBeVisible();
    await expect(signInButton).toHaveText('Sign In');
  });

  test('should show theme toggle when unauthenticated', async ({ page }) => {
    await page.goto('/login');

    const themeToggle = page.getByTestId('theme-toggle-unauthenticated');
    await expect(themeToggle).toBeVisible();

    // Test theme toggle works
    const htmlElement = page.locator('html');
    const initialClass = await htmlElement.getAttribute('class');

    await themeToggle.click();
    await page.waitForTimeout(500);

    const newClass = await htmlElement.getAttribute('class');
    expect(newClass).not.toEqual(initialClass);
  });
});

test.describe('Access Control', () => {
  test('should redirect unauthenticated users from dashboard to login', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL('/login');
    expect(page.url()).toContain('/login');
  });

  test('should redirect unauthenticated users from admin to login', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForURL('/login');
    expect(page.url()).toContain('/login');
  });

  test('should redirect non-admin users from admin to dashboard', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin');
    await authenticatedPage.waitForURL('/dashboard');
    expect(authenticatedPage.url()).toContain('/dashboard');
    expect(authenticatedPage.url()).not.toContain('/admin');
  });

  test('should allow admin users to access admin dashboard', async ({ adminAuthenticatedPage }) => {
    await adminAuthenticatedPage.goto('/admin');
    await adminAuthenticatedPage.waitForURL('/admin');
    expect(adminAuthenticatedPage.url()).toContain('/admin');

    // Verify admin content is visible
    await expect(adminAuthenticatedPage.getByTestId('admin-title')).toBeVisible();
  });
});
