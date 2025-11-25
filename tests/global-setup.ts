/**
 * Global Setup for Playwright Tests
 * Runs once before all tests
 */

import * as fs from 'fs';
import * as path from 'path';

async function globalSetup() {
  console.log('\n🧹 Cleaning up previous test captures...\n');

  // Directories to clean
  const dirsToClean = [
    path.join(__dirname, 'artifacts'),
    path.join(__dirname, 'screenshots'),
    path.join(__dirname, 'videos'),
    path.join(__dirname, 'results'),
  ];

  let totalScreenshots = 0;
  let totalVideos = 0;
  let totalOther = 0;

  // Clear all test output directories
  dirsToClean.forEach(dir => {
    if (fs.existsSync(dir)) {
      // Remove entire directory and recreate it (simplest way to ensure clean state)
      const files = getAllFiles(dir);
      files.forEach(file => {
        if (file.endsWith('.png')) {
          totalScreenshots++;
        } else if (file.endsWith('.webm') || file.endsWith('.mp4')) {
          totalVideos++;
        } else {
          totalOther++;
        }
        fs.unlinkSync(file);
      });

      // Remove empty directories
      cleanEmptyDirectories(dir);
    }

    // Ensure directory exists for new test run
    fs.mkdirSync(dir, { recursive: true });
  });

  if (totalScreenshots > 0 || totalVideos > 0 || totalOther > 0) {
    console.log(`✅ Cleared previous artifacts:`);
    if (totalScreenshots > 0) console.log(`   - ${totalScreenshots} screenshots`);
    if (totalVideos > 0) console.log(`   - ${totalVideos} videos`);
    if (totalOther > 0) console.log(`   - ${totalOther} other files`);
  } else {
    console.log('✅ Test directories ready (no previous artifacts)');
  }

  console.log('\n✨ Ready to run tests!\n');
}

/**
 * Recursively get all files in a directory
 */
function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;

  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

/**
 * Remove empty directories recursively
 */
function cleanEmptyDirectories(dirPath: string) {
  if (!fs.existsSync(dirPath)) return;

  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      cleanEmptyDirectories(filePath);

      // Check if directory is now empty
      const remainingFiles = fs.readdirSync(filePath);
      if (remainingFiles.length === 0) {
        fs.rmdirSync(filePath);
      }
    }
  }
}

export default globalSetup;
