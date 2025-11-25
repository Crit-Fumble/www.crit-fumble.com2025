#!/usr/bin/env node
/**
 * Analyze All Items from 5etools Data
 * Maps 5etools canonical types to Foundry directory structure
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '../../../data/5e/5etools-srd521/data');

// 22 Canonical Item Types from 5etools
const itemTypes = {
  // Weapons
  'M': 'Melee Weapon',
  'R': 'Ranged Weapon',
  'A': 'Ammunition',

  // Armor
  'LA': 'Light Armor',
  'MA': 'Medium Armor',
  'HA': 'Heavy Armor',
  'S': 'Shield',

  // Tools
  'AT': "Artisan's Tools",
  'GS': 'Gaming Set',
  'T': 'Tool',
  'INS': 'Instrument',

  // Gear
  'G': 'Adventuring Gear',
  'SCF': 'Spellcasting Focus',
  'TAH': 'Tack and Harness',

  // Consumables
  'P': 'Potion',
  'SC': 'Scroll',
  'FD': 'Food and Drink',

  // Vehicles/Mounts
  'MNT': 'Mount',
  'VEH': 'Vehicle (Land)',
  'SHP': 'Vehicle (Water)',
  'AIR': 'Vehicle (Air)',

  // Treasure
  '$C': 'Treasure (Coinage)'
};

// Map 5etools types to Foundry directory structure
const typeToDirectory = {
  // Weapons
  'M': 'weapon/melee',
  'R': 'weapon/ranged',
  'A': 'weapon/ammunition',

  // Armor
  'LA': 'equipment/light',
  'MA': 'equipment/medium',
  'HA': 'equipment/heavy',
  'S': 'equipment/shield',

  // Tools
  'AT': 'tool/artisan',
  'GS': 'tool/gaming',
  'T': 'tool/other',
  'INS': 'tool/musical',

  // Gear
  'G': 'gear/adventuring',
  'SCF': 'gear/spellcasting',
  'TAH': 'gear/tack',

  // Consumables
  'P': 'consumable/potion',
  'SC': 'consumable/scroll',
  'FD': 'consumable/food',

  // Vehicles/Mounts
  'MNT': 'gear/mount',
  'VEH': 'gear/vehicle',
  'SHP': 'gear/vehicle',
  'AIR': 'gear/vehicle',

  // Treasure
  '$C': 'gear/treasure'
};

console.log('Analyzing 5etools item data...\\n');

// Read items-base.json for base items
const itemsBasePath = path.join(dataDir, 'items-base.json');
const itemsBase = JSON.parse(fs.readFileSync(itemsBasePath, 'utf8'));

console.log(`Found ${itemsBase.baseitem.length} base items\\n`);

// Analyze item types
const typeStats = new Map();
const rarityStats = new Map();
const sourceStats = new Map();
const magicItemsWithBase = [];
const mountItems = [];

for (const item of itemsBase.baseitem) {
  const typeCode = item.type?.split('|')[0];

  // Count by type
  if (typeCode) {
    if (!typeStats.has(typeCode)) {
      typeStats.set(typeCode, {
        count: 0,
        name: itemTypes[typeCode] || typeCode,
        examples: []
      });
    }
    const stat = typeStats.get(typeCode);
    stat.count++;
    if (stat.examples.length < 3) {
      stat.examples.push(item.name);
    }
  }

  // Count by rarity
  const rarity = item.rarity || 'common';
  rarityStats.set(rarity, (rarityStats.get(rarity) || 0) + 1);

  // Count by source
  const source = item.source || 'unknown';
  sourceStats.set(source, (sourceStats.get(source) || 0) + 1);

  // Track mounts (they need creature references)
  if (typeCode === 'MNT') {
    mountItems.push({
      name: item.name,
      value: item.value,
      speed: item.speed,
      carryingCapacity: item.carryingCapacity
    });
  }
}

// Read items.json for magic items
const itemsPath = path.join(dataDir, 'items.json');
const items = JSON.parse(fs.readFileSync(itemsPath, 'utf8'));

console.log(`Found ${items.item.length} items (including magic items)\\n`);

let magicItemCount = 0;
let itemsWithBaseItem = 0;

for (const item of items.item) {
  const rarity = item.rarity || 'common';

  // Magic items are typically uncommon or higher rarity
  if (rarity !== 'common' && rarity !== 'none') {
    magicItemCount++;

    if (item.baseItem) {
      itemsWithBaseItem++;
      magicItemsWithBase.push({
        name: item.name,
        rarity: rarity,
        baseItem: item.baseItem,
        type: item.type
      });
    }
  }
}

// Print analysis
console.log('=== ITEM TYPE DISTRIBUTION ===\\n');

const sortedTypes = Array.from(typeStats.entries()).sort((a, b) => b[1].count - a[1].count);

for (const [typeCode, stat] of sortedTypes) {
  const dir = typeToDirectory[typeCode] || 'uncategorized';
  console.log(`${typeCode.padEnd(4)} - ${stat.name.padEnd(25)} (${stat.count.toString().padStart(3)} items) → ${dir}`);
  console.log(`       Examples: ${stat.examples.join(', ')}`);
  console.log();
}

console.log('\\n=== RARITY DISTRIBUTION ===\\n');
for (const [rarity, count] of Array.from(rarityStats.entries()).sort((a, b) => b[1] - a[1])) {
  console.log(`${rarity.padEnd(15)} ${count.toString().padStart(3)} items`);
}

console.log('\\n=== SOURCE DISTRIBUTION ===\\n');
for (const [source, count] of Array.from(sourceStats.entries()).sort((a, b) => b[1] - a[1])) {
  console.log(`${source.padEnd(15)} ${count.toString().padStart(3)} items`);
}

console.log('\\n=== MAGIC ITEMS ===\\n');
console.log(`Total magic items: ${magicItemCount}`);
console.log(`Magic items with baseItem: ${itemsWithBaseItem}`);
console.log(`Magic items WITHOUT baseItem: ${magicItemCount - itemsWithBaseItem}`);

if (magicItemsWithBase.length > 0) {
  console.log('\\nSample magic items with base items:');
  for (const item of magicItemsWithBase.slice(0, 5)) {
    console.log(`  ${item.name} (${item.rarity}) → baseItem: ${item.baseItem}`);
  }
}

console.log('\\n=== MOUNTS ===\\n');
console.log(`Total mounts: ${mountItems.length}`);
console.log('\\nMount details (need creature stat block references):');
for (const mount of mountItems) {
  console.log(`  ${mount.name}`);
  console.log(`    Price: ${mount.value} cp, Speed: ${mount.speed}, Capacity: ${mount.carryingCapacity} lbs`);
}

console.log('\\n=== RECOMMENDED DIRECTORY STRUCTURE ===\\n');
console.log('equipment/');
console.log('  light/       - Light armor');
console.log('  medium/      - Medium armor');
console.log('  heavy/       - Heavy armor');
console.log('  shield/      - Shields');
console.log('\\nweapon/');
console.log('  melee/       - Melee weapons');
console.log('  ranged/      - Ranged weapons');
console.log('  ammunition/  - Arrows, bolts, etc');
console.log('\\ntool/');
console.log('  artisan/     - Artisan tools');
console.log('  gaming/      - Gaming sets');
console.log('  musical/     - Instruments');
console.log('  other/       - Other tools');
console.log('\\ngear/');
console.log('  adventuring/ - Adventuring gear');
console.log('  spellcasting/- Spellcasting foci');
console.log('  tack/        - Tack and harness');
console.log('  mount/       - Mounts (with creature references)');
console.log('  vehicle/     - Vehicles (land, water, air)');
console.log('  treasure/    - Coinage');
console.log('\\nconsumable/');
console.log('  potion/      - Potions');
console.log('  scroll/      - Scrolls');
console.log('  food/        - Food and drink');
console.log('\\nmagic/');
console.log('  weapon/      - Magic weapons (+1, +2, etc)');
console.log('  armor/       - Magic armor and shields');
console.log('  wand/        - Wands');
console.log('  ring/        - Rings');
console.log('  rod/         - Rods');
console.log('  staff/       - Staffs');
console.log('  wondrous/    - Wondrous items (bags, belts, boots, etc)');
