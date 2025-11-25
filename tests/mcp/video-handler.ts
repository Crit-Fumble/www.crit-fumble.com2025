/**
 * Video Handler for MCP Tests
 *
 * Copies video recordings from Playwright's temp directory to the proper videos directory
 */

import { FullConfig } from '@playwright/test';
import { copyFileSync, existsSync, readdirSync, statSync } from 'fs';
import path from 'path';

async function globalTeardown(config: FullConfig) {
  // Look for video files in the outputDir (Playwright's artifact directory)
  const outputDir = config.projects[0]?.outputDir || 'tests/artifacts';

  if (!existsSync(outputDir)) {
    return;
  }

  // Find all video files recursively
  const findVideos = (dir: string): string[] => {
    const files: string[] = [];
    const items = readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        files.push(...findVideos(fullPath));
      } else if (item.endsWith('.webm')) {
        files.push(fullPath);
      }
    }

    return files;
  };

  const videos = findVideos(outputDir);

  // Copy each video to the appropriate videos directory
  for (const videoPath of videos) {
    // Extract timestamp from parent directory or filename
    const parentDir = path.dirname(videoPath);
    const dirName = path.basename(parentDir);

    // Try to find corresponding video directory
    const videosBaseDir = 'tests/videos';
    const testDirs = existsSync(videosBaseDir) ? readdirSync(videosBaseDir) : [];

    for (const testDir of testDirs) {
      if (testDir.startsWith('mcp-login-')) {
        const destDir = path.join(videosBaseDir, testDir);
        const destPath = path.join(destDir, 'login-flow.webm');

        try {
          copyFileSync(videoPath, destPath);
          console.log(`✓ Copied video to: ${destPath}`);
        } catch (err) {
          console.error(`✗ Failed to copy video: ${err}`);
        }

        break;
      }
    }
  }
}

export default globalTeardown;
