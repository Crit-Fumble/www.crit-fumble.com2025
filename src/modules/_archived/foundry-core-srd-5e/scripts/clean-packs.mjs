/**
 * Clean Compendium Packs
 *
 * Removes all generated compendium pack files
 *
 * Usage: node scripts/clean-packs.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODULE_ROOT = path.resolve(__dirname, '..');
const PACKS_DIR = path.join(MODULE_ROOT, 'packs');

console.log('=== Cleaning Compendium Packs ===\n');
console.log(`Packs directory: ${PACKS_DIR}\n`);

const packDirs = [
  'species',
  'classes',
  'subclasses',
  'monsters',
  'items',
  'spells',
  'rules'
];

for (const packDir of packDirs) {
  const fullPath = path.join(PACKS_DIR, packDir);

  if (fs.existsSync(fullPath)) {
    const files = fs.readdirSync(fullPath);

    for (const file of files) {
      if (file.endsWith('.json')) {
        fs.unlinkSync(path.join(fullPath, file));
      }
    }

    console.log(`✓ Cleaned ${packDir}/ (removed ${files.length} files)`);
  } else {
    console.log(`⏭ Skipped ${packDir}/ (directory doesn't exist)`);
  }
}

console.log('\n=== Clean Complete ===');
