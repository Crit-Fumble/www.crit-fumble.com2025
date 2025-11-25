#!/usr/bin/env node
/**
 * Organize Items by Rarity within Each Category
 * Creates rarity subdirectories: mundane, common, uncommon, rare, very-rare, legendary, artifact
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const itemsDir = path.join(__dirname, '../packs/items');

// Rarity mapping
const rarityMap = {
  'common': 'common',
  'uncommon': 'uncommon',
  'rare': 'rare',
  'very rare': 'very-rare',
  'veryrare': 'very-rare',
  'legendary': 'legendary',
  'artifact': 'artifact'
};

console.log('Organizing items by rarity...\n');

// Recursively process all subdirectories
function processDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  let organized = 0;

  // Collect all JSON files in this directory
  const jsonFiles = entries.filter(e => e.isFile() && e.name.endsWith('.json'));

  if (jsonFiles.length > 0) {
    // Process each JSON file
    for (const file of jsonFiles) {
      try {
        const filePath = path.join(dirPath, file.name);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        // Get rarity (default to 'common' if not specified)
        let rarity = data.system?.rarity || 'common';
        rarity = rarity.toLowerCase().replace(/\s+/g, '');

        // Map to standardized rarity name
        const rarityDir = rarityMap[rarity] || 'common';

        // Create rarity subdirectory if needed
        const rarityPath = path.join(dirPath, rarityDir);
        if (!fs.existsSync(rarityPath)) {
          fs.mkdirSync(rarityPath, { recursive: true });
        }

        // Move file to rarity subdirectory
        const newPath = path.join(rarityPath, file.name);
        fs.renameSync(filePath, newPath);

        organized++;
        console.log(`✓ ${path.relative(itemsDir, filePath)} → ${path.relative(itemsDir, newPath)}`);

      } catch (error) {
        console.error(`✗ Error processing ${file.name}:`, error.message);
      }
    }
  }

  // Recursively process subdirectories (but not the newly created rarity dirs)
  const subdirs = entries.filter(e => e.isDirectory() && !rarityMap[e.name]);
  for (const subdir of subdirs) {
    organized += processDirectory(path.join(dirPath, subdir.name));
  }

  return organized;
}

const totalOrganized = processDirectory(itemsDir);

console.log(`\nOrganized ${totalOrganized} items by rarity`);
