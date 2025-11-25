/**
 * Current Implementation Showcase Tests
 * Priority: P2 (Documentation)
 *
 * Captures comprehensive screenshots and videos of the current implementation
 * for documentation and stakeholder review.
 */

import { test, expect } from '../utils/fixtures';

test.describe('Current Implementation - Login & Landing', () => {
  test('should capture full login page experience', async ({ page, screenshotHelper }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Full page screenshot
    await screenshotHelper.capture('showcase/01-login/full-page');

    // Capture individual sections
    // Logo section (correct alt text)
    const logo = page.locator('img[alt="Crit Fumble Gaming Logo"]').first();
    await expect(logo).toBeVisible();
    await screenshotHelper.capture('showcase/01-login/logo-section');

    // Content box
    const contentBox = page.locator('.bg-crit-purple-600');
    await expect(contentBox).toBeVisible();

    // Sign-in buttons
    const discordButton = page.locator('button[type="submit"]').filter({ hasText: 'Sign in with Discord' });
    const githubButton = page.locator('button[type="submit"]').filter({ hasText: 'Sign in with GitHub' });
    await expect(discordButton).toBeVisible();
    await expect(githubButton).toBeVisible();
    await screenshotHelper.capture('showcase/01-login/signin-buttons');

    // Footer Discord icon
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await screenshotHelper.capture('showcase/01-login/footer-discord-icon');

    console.log('✅ Login page showcase captured');
  });

  test('should capture login page at different viewport sizes', async ({ page, screenshotHelper }) => {
    const viewports = [
      { width: 320, height: 568, name: 'mobile-small' },
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1280, height: 800, name: 'laptop' },
      { width: 1920, height: 1080, name: 'desktop' },
      { width: 2560, height: 1440, name: 'desktop-large' },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      await screenshotHelper.capture(`showcase/01-login/responsive-${viewport.name}`);
      console.log(`✅ Captured ${viewport.name} (${viewport.width}x${viewport.height})`);
    }
  });
});

test.describe('Current Implementation - Dashboard', () => {
  test('should capture authenticated dashboard experience', async ({
    authenticatedPage,
    screenshotHelper,
    testUser,
  }) => {
    await authenticatedPage.goto('/dashboard');
    await authenticatedPage.waitForLoadState('networkidle');

    // Full dashboard screenshot
    await screenshotHelper.capture('showcase/02-dashboard/full-page');

    // Header navigation
    await screenshotHelper.capture('showcase/02-dashboard/header-navigation');

    // Balance cards section
    await screenshotHelper.capture('showcase/02-dashboard/balance-cards');

    // Account information section
    await authenticatedPage.evaluate(() => {
      const accountSection = document.querySelector('.bg-white.dark\\:bg-gray-800');
      accountSection?.scrollIntoView({ behavior: 'smooth' });
    });
    await authenticatedPage.waitForTimeout(500);
    await screenshotHelper.capture('showcase/02-dashboard/account-information');

    // Coming soon notice
    await authenticatedPage.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await authenticatedPage.waitForTimeout(500);
    await screenshotHelper.capture('showcase/02-dashboard/coming-soon-notice');

    console.log(`✅ Dashboard showcase captured for user: ${testUser.username}`);
  });

  test('should capture dashboard responsive views', async ({
    authenticatedPage,
    screenshotHelper,
  }) => {
    const viewports = [
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1920, height: 1080, name: 'desktop' },
    ];

    for (const viewport of viewports) {
      await authenticatedPage.setViewportSize(viewport);
      await authenticatedPage.goto('/dashboard');
      await authenticatedPage.waitForLoadState('networkidle');

      await screenshotHelper.capture(`showcase/02-dashboard/responsive-${viewport.name}`);
      console.log(`✅ Captured dashboard ${viewport.name}`);
    }
  });
});

test.describe('Current Implementation - Navigation Flow', () => {
  test('should capture complete navigation flow', async ({
    authenticatedPage,
    screenshotHelper,
  }) => {
    // Start at dashboard
    await authenticatedPage.goto('/dashboard');
    await authenticatedPage.waitForLoadState('networkidle');
    await screenshotHelper.capture('showcase/03-navigation/step-1-dashboard');

    // Navigate to Linked Accounts
    const linkedAccountsLink = authenticatedPage.locator('header').getByRole('link', { name: 'Linked Accounts' });
    await linkedAccountsLink.click();
    await authenticatedPage.waitForURL('/linked-accounts');
    await authenticatedPage.waitForLoadState('networkidle');
    await screenshotHelper.capture('showcase/03-navigation/step-2-linked-accounts');

    // Navigate back to Dashboard
    const dashboardLink = authenticatedPage.locator('header').getByRole('link', { name: 'Dashboard' });
    await dashboardLink.click();
    await authenticatedPage.waitForURL('/dashboard');
    await authenticatedPage.waitForLoadState('networkidle');
    await screenshotHelper.capture('showcase/03-navigation/step-3-back-to-dashboard');

    console.log('✅ Navigation flow captured');
  });

  test('should capture header at different states', async ({
    authenticatedPage,
    screenshotHelper,
  }) => {
    await authenticatedPage.goto('/dashboard');
    await authenticatedPage.waitForLoadState('networkidle');

    // Default header state
    const header = authenticatedPage.locator('header');
    await expect(header).toBeVisible();
    await screenshotHelper.capture('showcase/03-navigation/header-default');

    // Header on different pages
    await authenticatedPage.goto('/linked-accounts');
    await authenticatedPage.waitForLoadState('networkidle');
    await screenshotHelper.capture('showcase/03-navigation/header-linked-accounts');

    console.log('✅ Header states captured');
  });
});

test.describe('Current Implementation - Brand & Styling', () => {
  test('should capture brand colors and components', async ({ page, screenshotHelper }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Purple branding
    await screenshotHelper.capture('showcase/04-branding/purple-header');

    // Discord blue buttons
    const discordButton = page.locator('button[type="submit"]').filter({ hasText: 'Sign in with Discord' });
    await discordButton.hover();
    await page.waitForTimeout(200);
    await screenshotHelper.capture('showcase/04-branding/discord-button-hover');

    // GitHub dark button
    const githubButton = page.locator('button[type="submit"]').filter({ hasText: 'Sign in with GitHub' });
    await githubButton.hover();
    await page.waitForTimeout(200);
    await screenshotHelper.capture('showcase/04-branding/github-button-hover');

    console.log('✅ Branding showcase captured');
  });

  test('should capture dark mode elements', async ({ page, screenshotHelper }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Dark content box with backdrop blur
    await screenshotHelper.capture('showcase/04-branding/dark-content-box');

    // Background image with overlay
    await screenshotHelper.capture('showcase/04-branding/background-with-overlay');

    console.log('✅ Dark mode elements captured');
  });
});

test.describe('Current Implementation - Typography & Content', () => {
  test('should capture text rendering at different sizes', async ({ page, screenshotHelper }) => {
    const viewports = [
      { width: 375, height: 667, name: 'mobile' },
      { width: 1920, height: 1080, name: 'desktop' },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Title text (in purple header)
      const title = page.locator('.bg-crit-purple-600 h1');
      await expect(title).toBeVisible();
      await screenshotHelper.capture(`showcase/05-typography/title-${viewport.name}`);

      // Tagline text
      const tagline = page.locator('text=/If the GM doesn.*t kill you/i');
      await expect(tagline).toBeVisible();
      await screenshotHelper.capture(`showcase/05-typography/tagline-${viewport.name}`);

      // Body text
      await screenshotHelper.capture(`showcase/05-typography/body-text-${viewport.name}`);

      console.log(`✅ Typography captured for ${viewport.name}`);
    }
  });
});

test.describe('Current Implementation - Interactive Elements', () => {
  test('should capture button states', async ({ page, screenshotHelper }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Discord button - default
    const discordButton = page.locator('button[type="submit"]').filter({ hasText: 'Sign in with Discord' });
    await screenshotHelper.capture('showcase/06-interactive/discord-button-default');

    // Discord button - hover
    await discordButton.hover();
    await page.waitForTimeout(200);
    await screenshotHelper.capture('showcase/06-interactive/discord-button-hover');

    // GitHub button - default
    const githubButton = page.locator('button[type="submit"]').filter({ hasText: 'Sign in with GitHub' });
    await screenshotHelper.capture('showcase/06-interactive/github-button-default');

    // GitHub button - hover
    await githubButton.hover();
    await page.waitForTimeout(200);
    await screenshotHelper.capture('showcase/06-interactive/github-button-hover');

    console.log('✅ Interactive elements captured');
  });

  test('should capture link hover states', async ({ authenticatedPage, screenshotHelper }) => {
    await authenticatedPage.goto('/dashboard');
    await authenticatedPage.waitForLoadState('networkidle');

    // Dashboard link
    const dashboardLink = authenticatedPage.locator('header').getByRole('link', { name: 'Dashboard' });
    await dashboardLink.hover();
    await authenticatedPage.waitForTimeout(200);
    await screenshotHelper.capture('showcase/06-interactive/nav-link-hover-dashboard');

    // Linked Accounts link
    const linkedAccountsLink = authenticatedPage.locator('header').getByRole('link', { name: 'Linked Accounts' });
    await linkedAccountsLink.hover();
    await authenticatedPage.waitForTimeout(200);
    await screenshotHelper.capture('showcase/06-interactive/nav-link-hover-linked-accounts');

    console.log('✅ Link hover states captured');
  });
});

test.describe('Current Implementation - Video Walkthrough', () => {
  test('should record full user journey', async ({ page, screenshotHelper }) => {
    // This test will generate a video showing the complete user flow
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should redirect to login
    await expect(page).toHaveURL('/login');
    await page.waitForTimeout(1000);

    // Scroll down to show footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);

    // Hover over Discord button
    const discordButton = page.locator('button[type="submit"]').filter({ hasText: 'Sign in with Discord' });
    await discordButton.hover();
    await page.waitForTimeout(500);

    // Hover over GitHub button
    const githubButton = page.locator('button[type="submit"]').filter({ hasText: 'Sign in with GitHub' });
    await githubButton.hover();
    await page.waitForTimeout(500);

    await screenshotHelper.capture('showcase/07-video/final-frame');

    console.log('✅ Video walkthrough recorded (check video output)');
  });

  test('should record authenticated user journey', async ({
    authenticatedPage,
    screenshotHelper,
  }) => {
    // Dashboard
    await authenticatedPage.goto('/dashboard');
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.waitForTimeout(1500);

    // Scroll to show all content
    await authenticatedPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await authenticatedPage.waitForTimeout(1000);
    await authenticatedPage.evaluate(() => window.scrollTo(0, 0));
    await authenticatedPage.waitForTimeout(1000);

    // Navigate to Linked Accounts
    const linkedAccountsLink = authenticatedPage.locator('header').getByRole('link', { name: 'Linked Accounts' });
    await linkedAccountsLink.click();
    await authenticatedPage.waitForURL('/linked-accounts');
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.waitForTimeout(1500);

    // Navigate back
    const dashboardLink = authenticatedPage.locator('header').getByRole('link', { name: 'Dashboard' });
    await dashboardLink.click();
    await authenticatedPage.waitForURL('/dashboard');
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.waitForTimeout(1000);

    await screenshotHelper.capture('showcase/07-video/authenticated-final-frame');

    console.log('✅ Authenticated user journey recorded (check video output)');
  });
});
