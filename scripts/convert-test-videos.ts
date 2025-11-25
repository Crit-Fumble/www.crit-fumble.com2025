/**
 * Convert WebM test videos to MP4 format
 * Uses bundled ffmpeg-static for reliable cross-platform support
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import ffmpegPath from 'ffmpeg-static';

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
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

function convertVideos() {
  console.log('\n🎬 Converting test videos from WebM to MP4...\n');

  const artifactsDir = path.join(__dirname, '..', 'tests', 'artifacts');

  if (!fs.existsSync(artifactsDir)) {
    console.log('❌ No artifacts directory found');
    return;
  }

  const files = getAllFiles(artifactsDir);
  const webmFiles = files.filter(file => file.endsWith('.webm'));

  if (webmFiles.length === 0) {
    console.log('ℹ️  No WebM files found to convert');
    return;
  }

  console.log(`Found ${webmFiles.length} WebM files to convert\n`);

  let converted = 0;
  let failed = 0;

  webmFiles.forEach(webmFile => {
    const mp4File = webmFile.replace('.webm', '.mp4');

    // Skip if MP4 already exists and is newer than WebM
    if (fs.existsSync(mp4File)) {
      const webmStats = fs.statSync(webmFile);
      const mp4Stats = fs.statSync(mp4File);
      if (mp4Stats.mtime > webmStats.mtime) {
        console.log(`⏭️  Skipping ${path.basename(webmFile)} (MP4 already exists)`);
        return;
      }
    }

    try {
      console.log(`🔄 Converting ${path.basename(webmFile)}...`);

      if (!ffmpegPath) {
        throw new Error('ffmpeg-static path not found');
      }

      // Convert using bundled ffmpeg with good quality settings
      execSync(
        `"${ffmpegPath}" -i "${webmFile}" -c:v libx264 -preset fast -crf 22 -c:a aac -b:a 128k -y "${mp4File}"`,
        { stdio: 'ignore' }
      );

      console.log(`✅ Created ${path.basename(mp4File)}`);
      converted++;

      // Optionally delete the WebM file to save space
      // fs.unlinkSync(webmFile);
    } catch (error) {
      console.error(`❌ Failed to convert ${path.basename(webmFile)}:`, String(error));
      failed++;
    }
  });

  console.log(`\n✨ Conversion complete: ${converted} successful, ${failed} failed`);
}

// Check if ffmpeg-static is available
if (!ffmpegPath) {
  console.error('\n❌ Error: ffmpeg-static package not properly installed');
  console.error('Please run: npm install ffmpeg-static');
  process.exit(1);
}

console.log(`📦 Using bundled ffmpeg from: ${ffmpegPath}\n`);
convertVideos();
