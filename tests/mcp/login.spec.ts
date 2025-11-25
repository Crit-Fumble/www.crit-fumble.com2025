/**
 * MCP Login Test
 *
 * This test is used by the MCP server to perform login operations.
 * Configuration is passed via environment variables.
 *
 * Captures multiple screenshots throughout the login flow and records video.
 */

import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync, copyFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

test.use({
  video: 'on',
  screenshot: 'on',
});

test('MCP Login', async ({ page }, testInfo) => {
  const viewport = process.env.MCP_VIEWPORT || 'desktop';
  const theme = process.env.MCP_THEME || 'dark';
  const timestamp = Date.now();

  // Use proper output directories that won't be cleaned up
  const resultsDir = process.env.MCP_OUTPUT_DIR || `tests/results/mcp-login-${timestamp}`;
  const screenshotsDir = `tests/screenshots/mcp-login-${timestamp}`;
  const videosDir = `tests/videos/mcp-login-${timestamp}`;

  // Create output directories
  mkdirSync(resultsDir, { recursive: true });
  mkdirSync(screenshotsDir, { recursive: true });
  mkdirSync(videosDir, { recursive: true });

  // Set viewport
  const viewportSize = viewport === 'mobile'
    ? { width: 375, height: 667 }
    : { width: 1920, height: 1080 };

  await page.setViewportSize(viewportSize);

  // Navigate to login page
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  // Set theme
  if (theme === 'light') {
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
    });
  } else {
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
  }

  await page.waitForTimeout(500);

  // Screenshot 1: Initial login page
  await page.screenshot({
    path: path.join(screenshotsDir, '01-login-page.png'),
    fullPage: true,
  });

  // Verify page loaded
  await expect(page.getByRole('heading', { name: /Crit Fumble Gaming/i })).toBeVisible();

  // Authenticate
  const testEmail = `mcp-login-${timestamp}@crit-fumble.test`;
  const testUsername = `mcp_user_${timestamp}`;

  const authData = await page.evaluate(async ({ email, username }) => {
    const res = await fetch('/api/_dev/test-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        email,
        username,
        critCoins: Math.floor(Math.random() * 300) + 1
      }),
    });
    return res.json();
  }, { email: testEmail, username: testUsername });

  // Save auth data to results directory
  writeFileSync(
    path.join(resultsDir, 'auth-data.json'),
    JSON.stringify(authData, null, 2)
  );

  expect(authData.success).toBe(true);
  console.log('Authentication successful:', authData);

  // Reload the page - the auth cookie is now set, so middleware will redirect to dashboard
  await page.reload();
  await page.waitForLoadState('networkidle');

  // Wait for redirect to complete and dashboard to fully load
  await page.waitForTimeout(1000);

  // Extract interactive elements from the dashboard
  const elements = await page.evaluate(() => {
    const interactiveElements: any[] = [];
    const testIdElements = document.querySelectorAll('[data-testid]');

    testIdElements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const styles = window.getComputedStyle(el);

      if (rect.width > 0 && rect.height > 0 && styles.display !== 'none' && styles.visibility !== 'hidden') {
        interactiveElements.push({
          testId: el.getAttribute('data-testid'),
          tagName: el.tagName.toLowerCase(),
          type: (el as any).type || null,
          text: el.textContent?.trim().substring(0, 100) || '',
          placeholder: (el as any).placeholder || null,
          value: (el as any).value || null,
          ariaLabel: el.getAttribute('aria-label') || null,
          role: el.getAttribute('role') || null,
          position: {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          },
          isInteractive: ['button', 'a', 'input', 'textarea', 'select'].includes(el.tagName.toLowerCase()) ||
                        (el as any).onclick !== null ||
                        el.getAttribute('role') === 'button'
        });
      }
    });

    return interactiveElements;
  });

  // Save elements to results directory (dashboard elements)
  writeFileSync(
    path.join(resultsDir, 'elements.json'),
    JSON.stringify({ elements, count: elements.length, timestamp }, null, 2)
  );

  // Screenshot 2: Final state (dashboard after redirect)
  await page.screenshot({
    path: path.join(screenshotsDir, '02-dashboard.png'),
    fullPage: true,
  });

  // Close page to finalize video
  await page.close();

  // Copy video to videos directory and convert to MP4
  const videoPath = await page.video()?.path();
  if (videoPath) {
    const destVideoPathWebm = path.join(videosDir, 'login-flow.webm');
    const destVideoPathMp4 = path.join(videosDir, 'login-flow.mp4');

    // Wait a bit for video to be written
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      // Copy webm file
      copyFileSync(videoPath, destVideoPathWebm);
      console.log(`✓ Video saved to: ${destVideoPathWebm}`);

      // Convert to MP4 using ffmpeg
      const ffmpegPath = path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');
      if (existsSync(ffmpegPath)) {
        try {
          execSync(`"${ffmpegPath}" -i "${destVideoPathWebm}" -c:v libx264 -crf 23 -preset fast -c:a aac -b:a 128k "${destVideoPathMp4}" -y`, {
            stdio: 'ignore'
          });
          console.log(`✓ Video converted to MP4: ${destVideoPathMp4}`);
        } catch (convertErr) {
          console.error(`✗ Failed to convert video to MP4: ${convertErr}`);
        }
      } else {
        console.log(`⚠ ffmpeg not found, skipping MP4 conversion`);
      }
    } catch (err) {
      console.error(`✗ Failed to copy video: ${err}`);
    }

    testInfo.attach('video', {
      path: videoPath,
      contentType: 'video/webm'
    });
  }

  // Create summary for MCP response
  const summary = {
    success: true,
    timestamp,
    viewport,
    theme,
    paths: {
      results: resultsDir,
      screenshots: screenshotsDir,
      videos: videosDir,
      loginScreenshot: path.join(screenshotsDir, '01-login-page.png'),
      dashboardScreenshot: path.join(screenshotsDir, '02-dashboard.png'),
      elementsData: path.join(resultsDir, 'elements.json'),
      authData: path.join(resultsDir, 'auth-data.json'),
      videoWebm: path.join(videosDir, 'login-flow.webm'),
      videoMp4: path.join(videosDir, 'login-flow.mp4'),
    },
    elementCount: elements.length,
    authStatus: authData.success,
    user: {
      username: authData.username,
      email: authData.email,
      userId: authData.userId
    }
  };

  writeFileSync(
    path.join(resultsDir, 'summary.json'),
    JSON.stringify(summary, null, 2)
  );
});
