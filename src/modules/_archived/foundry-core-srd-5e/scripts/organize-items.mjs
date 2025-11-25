#!/usr/bin/env node
/**
 * Organize Foundry Items into Subdirectories
 * Categorizes items by type and relevant subtypes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const itemsDir = path.join(__dirname, '../packs/items');

// Category mapping based on item analysis
// Using nested directories: 'type/subtype' instead of 'type-subtype'
// Order matters: more specific checks should come before general ones
const categories = {
  // Magic Items - Wands (equipment type, wand in name)
  'magic/wand': { type: 'equipment', check: (d) => d.type === 'equipment' && d.name?.toLowerCase().includes('wand') },

  // Magic Items - Rings (equipment type, ring in name)
  'magic/ring': { type: 'equipment', check: (d) => d.type === 'equipment' && d.name?.toLowerCase().includes('ring') },

  // Magic Items - Rods (equipment type, rod in name)
  'magic/rod': { type: 'equipment', check: (d) => d.type === 'equipment' && d.name?.toLowerCase().includes('rod') },

  // Magic Items - Staffs (weapon type, staff in name, not mundane)
  'magic/staff': { type: 'weapon', check: (d) => d.type === 'weapon' && d.name?.toLowerCase().includes('staff') && !d.name?.toLowerCase().includes('wooden') && !d.name?.toLowerCase().includes('quarterstaff') },

  // Armor by subtype (non-magic armor)
  'equipment/light': { type: 'equipment', check: (d) => d.type === 'equipment' && d.system?.armor?.type === 'light' && !d.name?.toLowerCase().match(/\+\d/) },
  'equipment/medium': { type: 'equipment', check: (d) => d.type === 'equipment' && d.system?.armor?.type === 'medium' && !d.name?.toLowerCase().match(/\+\d/) },
  'equipment/heavy': { type: 'equipment', check: (d) => d.type === 'equipment' && d.system?.armor?.type === 'heavy' && !d.name?.toLowerCase().match(/\+\d/) },
  'equipment/shield': { type: 'equipment', check: (d) => d.type === 'equipment' && d.system?.armor?.type === 'shield' && !d.name?.toLowerCase().includes('animated') && !d.name?.toLowerCase().match(/\+\d/) },

  // Magic Armor and Shields (check baseItem first, then fallback to other checks)
  'magic/armor': { type: 'any', check: (d) => {
    const baseItem = d.flags?.['foundry-core-srd-5e']?._srdData?.baseItem;
    if (baseItem && baseItem.match(/(armor|shield)/i)) return true;
    return d.type === 'equipment' && d.system?.armor?.type && (d.name?.toLowerCase().match(/\+\d/) || d.name?.toLowerCase().includes('animated') || d.system?.rarity !== 'common');
  } },

  // Weapons by properties (non-magic weapons)
  'weapon/melee': { type: 'weapon', check: (d) => d.type === 'weapon' && !d.system?.properties?.amm && !d.name?.toLowerCase().match(/\+\d/) && d.system?.rarity === 'common' },
  'weapon/ranged': { type: 'weapon', check: (d) => d.type === 'weapon' && d.system?.properties?.amm && !d.name?.toLowerCase().match(/\+\d/) && d.system?.rarity === 'common' },

  // Magic Weapons
  'magic/weapon': { type: 'weapon', check: (d) => d.type === 'weapon' && (d.name?.toLowerCase().match(/\+\d/) || d.system?.rarity !== 'common') },

  // Consumables by subtype (includes food and lodging)
  'consumable/potion': { type: 'consumable', check: (d) => d.name?.toLowerCase().includes('potion') },
  'consumable/poison': { type: 'consumable', check: (d) => d.name?.toLowerCase().includes('poison') && !d.name?.toLowerCase().includes('potion') },
  'consumable/scroll': { type: 'consumable', check: (d) => d.name?.toLowerCase().includes('scroll') },
  'consumable/food': { type: 'consumable', check: (d) => d.system?.consumableType === 'food' },
  'consumable/drink': { type: 'consumable', check: (d) => d.system?.consumableType === 'drink' },
  'consumable/lodging': { type: 'consumable', check: (d) => d.flags?.['foundry-core-srd-5e']?.itemType === 'lodging' },

  // Other consumables (ale, alchemist's fire, etc)
  'consumable/other': { type: 'consumable', check: (d) => d.type === 'consumable' },

  // Tools by subtype
  'tool/artisan': { type: 'tool', check: (d) => d.name?.toLowerCase().includes('tools') || d.name?.toLowerCase().includes('supplies') },
  'tool/gaming': { type: 'tool', check: (d) => d.name?.toLowerCase().includes('dice') || d.name?.toLowerCase().includes('cards') },
  'tool/musical': { type: 'tool', check: (d) => d.name?.toLowerCase().includes('lute') || d.name?.toLowerCase().includes('drum') || d.name?.toLowerCase().includes('flute') || d.name?.toLowerCase().includes('bagpipes') || d.name?.toLowerCase().includes('horn') },
  'tool/kit': { type: 'tool', check: (d) => d.name?.toLowerCase().includes('kit') },

  // Other tools
  'tool/other': { type: 'tool', check: (d) => d.type === 'tool' },

  // Adventuring Gear (loot type, non-magic mundane items)
  'gear/adventuring': { type: 'loot', check: (d) => d.type === 'loot' && d.system?.rarity === 'common' && d.name?.toLowerCase().match(/(backpack|rope|torch|lantern|bedroll|tent|waterskin|rations|arrow|bolt|ammunition|ball bearings|chain|crowbar|hammer|ladder|lock|manacles|mirror|oil|paper|parchment|perfume|pick|piton|pole|pot|pouch|quiver|sack|signal whistle|signet ring|soap|spike|spyglass|string|tinderbox|vial|whetstone)/i) },

  // Trade Goods
  'gear/trade': { type: 'loot', check: (d) => d.type === 'loot' && d.system?.rarity === 'common' && (d.name?.toLowerCase().includes('cloth') || d.name?.toLowerCase().includes('spice')) },

  // Vehicles/Mounts
  'gear/vehicle': { type: 'loot', check: (d) => d.type === 'loot' && d.name?.toLowerCase().match(/(ship|boat|cart|chariot|carriage)/i) },
  'gear/mount': { type: 'loot', check: (d) => d.type === 'loot' && d.name?.toLowerCase().match(/(horse|pony|camel|elephant|ox|mule)/i) },

  // Wondrous Items (magic loot items, bags, figurines, etc)
  'magic/wondrous': { type: 'loot', check: (d) => d.type === 'loot' && (d.system?.rarity !== 'common' || d.name?.toLowerCase().match(/(bag of|figurine|amulet|cloak|boots|gloves|bracers|belt|helm|ioun|deck of|tome|manual|stone of|pearl of|dust of|efreeti|instrument of)/i)) },

  // Other Gear (catch-all for remaining loot)
  'gear/other': { type: 'loot', check: (d) => d.type === 'loot' },
};

console.log('Organizing items...\n');

// First, flatten all existing subdirectories back to root
console.log('Step 1: Flattening existing subdirectories...\n');
const subdirs = fs.readdirSync(itemsDir).filter(f => {
  const fullPath = path.join(itemsDir, f);
  return fs.statSync(fullPath).isDirectory();
});

// Recursive function to flatten nested directories
function flattenDirectory(dirPath, rootPath) {
  let count = 0;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      // Recursively flatten subdirectories
      count += flattenDirectory(fullPath, rootPath);
    } else if (entry.name.endsWith('.json')) {
      // Move JSON file to root
      const newPath = path.join(rootPath, entry.name);
      fs.renameSync(fullPath, newPath);
      count++;
    }
  }

  return count;
}

let flattened = 0;
for (const subdir of subdirs) {
  const subdirPath = path.join(itemsDir, subdir);
  const itemCount = flattenDirectory(subdirPath, itemsDir);
  flattened += itemCount;

  // Remove directory recursively
  fs.rmSync(subdirPath, { recursive: true, force: true });
  console.log(`✓ Flattened ${subdir}/ (${itemCount} items)`);
}

console.log(`\nFlattened ${flattened} items from ${subdirs.length} subdirectories\n`);

// Step 2: Organize into nested structure
console.log('Step 2: Organizing into nested directories...\n');

// Read all JSON files from root
const files = fs.readdirSync(itemsDir).filter(f => f.endsWith('.json') && !f.startsWith('.'));

let organized = 0;
let errors = 0;

for (const file of files) {
  try {
    const filePath = path.join(itemsDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Find matching category
    let targetDir = null;
    for (const [catName, catDef] of Object.entries(categories)) {
      if (catDef.check(data)) {
        targetDir = catName;
        break;
      }
    }

    // If no category found, skip (leave in root)
    if (!targetDir) {
      continue;
    }

    // Create target directory if needed
    const targetPath = path.join(itemsDir, targetDir);
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }

    // Move file
    const newPath = path.join(targetPath, file);
    fs.renameSync(filePath, newPath);

    organized++;
    console.log(`✓ ${file} → ${targetDir}/`);

  } catch (error) {
    console.error(`✗ Error processing ${file}:`, error.message);
    errors++;
  }
}

console.log(`\nOrganized ${organized} items into subdirectories`);
if (errors > 0) {
  console.log(`Errors: ${errors}`);
}
