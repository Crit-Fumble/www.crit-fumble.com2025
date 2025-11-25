/**
 * Artifact Processor
 * Post-processes test artifacts:
 * - Converts .webm videos to .mp4
 * - Renames files to match test names
 * - Cleans up verbose directory structure
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import ffmpegPath from 'ffmpeg-static';

export async function processArtifacts(artifactsDir: string) {
  console.log('\n🎬 Processing test artifacts...\n');

  if (!fs.existsSync(artifactsDir)) {
    console.log('No artifacts directory found');
    return;
  }

  // Check if ffmpeg is available
  if (!ffmpegPath) {
    console.log('⚠️  ffmpeg-static not found - skipping video conversion');
    console.log('   Run: npm install to ensure ffmpeg-static is installed\n');
    return;
  }

  console.log(`Using ffmpeg: ${ffmpegPath}`);

  const files = getAllFiles(artifactsDir);
  let convertedCount = 0;
  let renamedCount = 0;

  for (const file of files) {
    const ext = path.extname(file);
    const dir = path.dirname(file);
    const basename = path.basename(file, ext);

    // Convert .webm to .mp4
    if (ext === '.webm') {
      const mp4Path = path.join(dir, `${basename}.mp4`);

      try {
        console.log(`Converting: ${path.basename(file)} → ${path.basename(mp4Path)}`);

        execSync(
          `"${ffmpegPath}" -i "${file}" -c:v libx264 -crf 23 -preset fast -c:a aac -b:a 128k "${mp4Path}" -y`,
          { stdio: 'ignore' }
        );

        // Delete original .webm
        fs.unlinkSync(file);
        convertedCount++;
      } catch (error) {
        console.error(`Failed to convert ${file}:`, error);
      }
    }

    // Simplify file names (remove verbose path components)
    if (ext === '.png' || ext === '.mp4' || ext === '.webm') {
      const newName = simplifyFileName(file, artifactsDir);
      if (newName !== file && !fs.existsSync(newName)) {
        fs.renameSync(file, newName);
        renamedCount++;
      }
    }
  }

  // Clean up empty directories
  cleanEmptyDirectories(artifactsDir);

  console.log(`\n✅ Processed artifacts:`);
  if (convertedCount > 0) {
    console.log(`   - Converted ${convertedCount} videos to MP4`);
  }
  if (renamedCount > 0) {
    console.log(`   - Simplified ${renamedCount} file names`);
  }
  console.log('');
}

function simplifyFileName(filePath: string, artifactsDir: string): string {
  const ext = path.extname(filePath);
  const relative = path.relative(artifactsDir, filePath);

  // Parse directory structure
  // Example: integration-02-login-page--42996-isplay-login-page-correctly-chromium/test-failed-1.png
  // Extract: test name, browser, type, index

  const parts = relative.split(path.sep);
  const dirName = parts[0];
  const fileName = parts[parts.length - 1];

  // Extract test info from directory name
  const match = dirName.match(/^(.*?)-(\w+)$/);
  if (!match) return filePath;

  const testName = match[1];
  const browser = match[2];

  // Extract type and index from filename
  const fileMatch = fileName.match(/^(test-failed|video)-(\d+)\.(png|webm|mp4)$/);
  if (!fileMatch) return filePath;

  const type = fileMatch[1] === 'video' ? 'video' : 'screenshot';
  const index = fileMatch[2];
  const fileExt = fileMatch[3] === 'webm' ? 'mp4' : fileMatch[3];

  // New simplified name: testName-browser-type-index.ext
  // Example: login-page-chromium-screenshot-1.png
  //          login-page-chromium-video.mp4
  const simpleName = type === 'video'
    ? `${testName}-${browser}-video.${fileExt}`
    : `${testName}-${browser}-screenshot-${index}.${fileExt}`;

  return path.join(artifactsDir, simpleName);
}

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
