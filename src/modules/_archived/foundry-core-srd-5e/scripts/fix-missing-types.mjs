#!/usr/bin/env node
/**
 * Fix Missing _srdData.type Properties
 * Adds the 'type' field to items that are missing it in _srdData
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const itemsDir = path.join(__dirname, '../packs/items');

console.log('Fixing missing _srdData.type properties...\n');

let fixedCount = 0;

// Scan all directories recursively
function scanDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.name.endsWith('.json')) {
      fixItem(fullPath);
    }
  }
}

function fixItem(filePath) {
  const relativePath = path.relative(itemsDir, filePath);

  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const srdData = data.flags?.['foundry-core-srd-5e']?._srdData;

    if (!srdData) {
      console.log(`⚠ No _srdData found: ${relativePath}`);
      return;
    }

    // Skip if type already exists
    if (srdData.type) {
      return;
    }

    // Determine the type based on category and properties
    let typeCode = null;
    const source = srdData.source || 'XDMG';

    // Check if it's a wondrous item
    if (srdData.wondrous || relativePath.includes('magic/wondrous')) {
      typeCode = `WON|${source}`;
    }
    // Check if it's gear/other (like bead of nourishment)
    else if (relativePath.includes('gear/other')) {
      typeCode = `G|${source}`;
    }

    if (typeCode) {
      // Add the type field
      data.flags['foundry-core-srd-5e']._srdData.type = typeCode;

      // Write back to file
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');

      console.log(`✓ Fixed: ${relativePath} -> ${typeCode}`);
      fixedCount++;
    } else {
      console.log(`? Could not determine type for: ${relativePath}`);
    }

  } catch (error) {
    console.error(`✗ Error processing ${relativePath}: ${error.message}`);
  }
}

// Run the fix
scanDirectory(itemsDir);

console.log(`\n${'='.repeat(70)}`);
console.log(`Fixed ${fixedCount} items with missing _srdData.type properties`);
console.log(`${'='.repeat(70)}\n`);
