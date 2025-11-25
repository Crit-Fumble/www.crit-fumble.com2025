#!/usr/bin/env node
/**
 * Ensure Base Items for Magic Items
 * Creates base item JSONs for magic items that reference them
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const itemsDir = path.join(__dirname, '../packs/items');

console.log('Analyzing magic items for base items...\n');

const baseItemsNeeded = new Map(); // baseItemName -> { category, examples: [itemNames] }
const existingBaseItems = new Set();

// First, collect all existing base items from gear directories
function collectExistingBaseItems(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      collectExistingBaseItems(fullPath);
    } else if (entry.name.endsWith('.json')) {
      try {
        const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        // Track common/mundane items
        if (data.system?.rarity === 'common') {
          existingBaseItems.add(data.name.toLowerCase());
        }
      } catch (error) {
        // Skip invalid files
      }
    }
  }
}

// Scan magic directories for items that need base items
function scanMagicItems(dirPath, category) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      scanMagicItems(fullPath, category);
    } else if (entry.name.endsWith('.json')) {
      try {
        const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));

        // Check for baseItem in SRD data
        let baseItemName = data.flags?.['foundry-core-srd-5e']?._srdData?.baseItem;

        if (baseItemName) {
          // Parse baseItem (format: "item|source")
          baseItemName = baseItemName.split('|')[0].trim();

          if (!existingBaseItems.has(baseItemName.toLowerCase())) {
            if (!baseItemsNeeded.has(baseItemName)) {
              baseItemsNeeded.set(baseItemName, {
                category: category,
                examples: []
              });
            }
            baseItemsNeeded.get(baseItemName).examples.push(data.name);
          }
        } else {
          // Try to infer base item from name
          const itemName = data.name.toLowerCase();

          // Common patterns
          const patterns = [
            { match: /^(.*?)\s+of\s+/, extract: (m) => m[1] },  // "Belt of Giant Strength" -> "Belt"
            { match: /^bag\s+of\s+/, extract: () => 'bag' },     // "Bag of Holding" -> "Bag"
            { match: /^boots\s+of\s+/, extract: () => 'boots' }, // "Boots of Speed" -> "Boots"
            { match: /^cloak\s+of\s+/, extract: () => 'cloak' }, // "Cloak of Protection" -> "Cloak"
            { match: /^gloves\s+of\s+/, extract: () => 'gloves' },
            { match: /^bracers\s+of\s+/, extract: () => 'bracers' },
            { match: /^helm\s+of\s+/, extract: () => 'helm' },
            { match: /^amulet\s+of\s+/, extract: () => 'amulet' },
            { match: /^(.*?)\s+\+\d/, extract: (m) => m[1] },   // "Longsword +1" -> "Longsword"
          ];

          for (const pattern of patterns) {
            const match = itemName.match(pattern.match);
            if (match) {
              let baseName = pattern.extract(match);
              baseName = baseName.charAt(0).toUpperCase() + baseName.slice(1);

              if (!existingBaseItems.has(baseName.toLowerCase())) {
                if (!baseItemsNeeded.has(baseName)) {
                  baseItemsNeeded.set(baseName, {
                    category: category,
                    examples: []
                  });
                }
                baseItemsNeeded.get(baseName).examples.push(data.name);
              }
              break;
            }
          }
        }
      } catch (error) {
        console.error(`Error reading ${entry.name}:`, error.message);
      }
    }
  }
}

// Collect existing base items
const gearPath = path.join(itemsDir, 'gear');
if (fs.existsSync(gearPath)) {
  collectExistingBaseItems(gearPath);
}

const equipmentPath = path.join(itemsDir, 'equipment');
if (fs.existsSync(equipmentPath)) {
  collectExistingBaseItems(equipmentPath);
}

const weaponPath = path.join(itemsDir, 'weapon');
if (fs.existsSync(weaponPath)) {
  collectExistingBaseItems(weaponPath);
}

console.log(`Found ${existingBaseItems.size} existing base items\n`);

// Scan magic directories
const magicPath = path.join(itemsDir, 'magic');
if (fs.existsSync(magicPath)) {
  const magicCategories = fs.readdirSync(magicPath);
  for (const category of magicCategories) {
    const categoryPath = path.join(magicPath, category);
    if (fs.statSync(categoryPath).isDirectory()) {
      scanMagicItems(categoryPath, category);
    }
  }
}

// Report findings
if (baseItemsNeeded.size > 0) {
  console.log('Base items needed:\n');

  const sortedItems = Array.from(baseItemsNeeded.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  for (const [baseItem, info] of sortedItems) {
    console.log(`${baseItem}`);
    console.log(`  Category: magic/${info.category}`);
    console.log(`  Used by: ${info.examples.slice(0, 3).join(', ')}${info.examples.length > 3 ? '...' : ''}`);
    console.log();
  }

  console.log(`\nTotal: ${baseItemsNeeded.size} base items needed`);
  console.log('\nTo create these base items, you can:');
  console.log('1. Create them manually in the appropriate gear/ or equipment/ directories');
  console.log('2. Update magic item JSONs to reference existing base items');
  console.log('3. Run this script again to verify');
} else {
  console.log('✓ All magic items have corresponding base items!');
}
