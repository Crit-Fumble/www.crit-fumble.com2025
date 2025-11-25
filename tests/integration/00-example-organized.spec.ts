/**
 * EXAMPLE: Organized Screenshot Structure
 *
 * This test demonstrates the new role/route/page screenshot organization.
 * Screenshots will be saved to: tests/screenshots/unauthenticated/login/...
 * Videos will be saved to: tests/videos/unauthenticated/login/...
 */

import { test, expect } from '../utils/fixtures';

test.describe('Example: Organized Screenshots', () => {
  test('should save screenshots in organized structure', async ({ page, screenshotHelper }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Screenshots will be organized by role/route/page
    await screenshotHelper.capture('unauthenticated/login/page');

    // Or with more specific actions
    await screenshotHelper.capture('unauthenticated/login/button-discord-default');

    // You can also use simple names (backwards compatible)
    await screenshotHelper.capture('simple-name');
  });

  test('should capture button states in organized structure', async ({ page, screenshotHelper }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const discordButton = page.getByRole('button', { name: /Sign in with Discord/i });

    // Use captureStates for multiple states of the same element
    await screenshotHelper.captureStates(
      'unauthenticated/login/discord-button',
      [
        {
          name: 'default',
          action: async () => {
            // Just wait for element to be visible
            await discordButton.waitFor({ state: 'visible' });
          }
        },
        {
          name: 'hover',
          action: async () => {
            await discordButton.hover();
            await page.waitForTimeout(200); // Wait for animation
          }
        },
        {
          name: 'focus',
          action: async () => {
            await discordButton.focus();
          }
        }
      ]
    );

    // This creates:
    // - tests/screenshots/unauthenticated/login/discord-button-default.png
    // - tests/screenshots/unauthenticated/login/discord-button-hover.png
    // - tests/screenshots/unauthenticated/login/discord-button-focus.png
  });

  test.skip('example: video recording', async ({ page, videoHelper, screenshotHelper }) => {
    // Videos are automatically recorded by Playwright
    // You can organize them when stopping recording

    await videoHelper.startRecording();

    await page.goto('/login');
    await screenshotHelper.capture('unauthenticated/login/video-start');

    // Perform actions...
    await page.click('button:has-text("Sign in with Discord")');

    // Stop and save video with organized path
    await videoHelper.stopRecording('unauthenticated/login/oauth-flow');

    // This saves to: tests/videos/unauthenticated/login/oauth-flow.webm
  });
});
