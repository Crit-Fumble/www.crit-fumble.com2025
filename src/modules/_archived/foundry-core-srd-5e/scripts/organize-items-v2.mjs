#!/usr/bin/env node
/**
 * Organize Foundry Items - SRD 5e 2024 Edition
 * Comprehensive categorization based on:
 * - Official SRD structure (Equipment p89-103, Magic Items p204-254)
 * - 5etools canonical 22 item types
 * - 9 official magic item categories
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const itemsDir = path.join(__dirname, '../packs/items');

// ========== HELPER FUNCTIONS ==========

// Get 5etools type code (e.g., "M|XPHB" -> "M")
function getTypeCode(data) {
  return data.flags?.['foundry-core-srd-5e']?._srdData?.type?.split('|')[0];
}

// Get baseItem reference (e.g., "shield|xphb")
function getBaseItem(data) {
  return data.flags?.['foundry-core-srd-5e']?._srdData?.baseItem;
}

// Check if item is magic (rarity is not "common" or "none")
function isMagic(data) {
  const rarity = data.system?.rarity;
  return rarity && rarity !== 'common' && rarity !== 'none';
}

// ========== CATEGORIZATION RULES ==========
/**
 * Priority-based categorization (check in order):
 * 1. baseItem field (magic items referencing base items)
 * 2. 5etools type code from _srdData.type
 * 3. Rarity (magic vs mundane)
 * 4. Foundry type + system properties
 * 5. Name patterns (fallback)
 */

const categories = {
  // ========== MAGIC ITEMS (9 Official Categories - Priority 1) ==========

  'magic/armor': {
    priority: 1,
    check: (d) => {
      const baseItem = getBaseItem(d);
      const typeCode = getTypeCode(d);
      // Has baseItem referencing armor/shield OR armor type with magic rarity
      return (baseItem && baseItem.match(/(leather|hide|chain|scale|breast|half|ring|splint|plate|shield)/i)) ||
             (typeCode && typeCode.match(/^(LA|MA|HA|S)$/) && isMagic(d)) ||
             (d.type === 'equipment' && d.system?.armor?.type && isMagic(d));
    }
  },

  'magic/weapon': {
    priority: 1,
    check: (d) => {
      const baseItem = getBaseItem(d);
      const typeCode = getTypeCode(d);
      // Has baseItem referencing weapon OR weapon type with magic rarity
      return (baseItem && baseItem.match(/(sword|axe|bow|mace|dagger|spear|hammer|staff|club|crossbow|flail|glaive|halberd|lance|maul|morningstar|pike|rapier|scimitar|shortsword|trident|warpick|warhammer|whip|blowgun|dart|javelin|sling)/i)) ||
             (typeCode && typeCode.match(/^(M|R|A)$/) && isMagic(d)) ||
             (d.type === 'weapon' && isMagic(d)) ||
             (d.name?.toLowerCase().match(/\+\d/) && d.type === 'weapon');
    }
  },

  'magic/potion': {
    priority: 1,
    check: (d) => {
      return (d.type === 'consumable' && d.name?.toLowerCase().includes('potion') && isMagic(d)) ||
             (d.name?.toLowerCase().match(/potion of (healing|greater healing|superior healing|supreme healing|invisibility|flying|speed|heroism)/i));
    }
  },

  'magic/scroll': {
    priority: 1,
    check: (d) => {
      return (d.type === 'consumable' && d.name?.toLowerCase().includes('scroll') && isMagic(d)) ||
             d.name?.toLowerCase().includes('spell scroll');
    }
  },

  'magic/ring': {
    priority: 1,
    check: (d) => {
      return d.name?.toLowerCase().match(/ring of/i) && isMagic(d);
    }
  },

  'magic/rod': {
    priority: 1,
    check: (d) => {
      return d.name?.toLowerCase().match(/rod of|immovable rod/i) && isMagic(d);
    }
  },

  'magic/staff': {
    priority: 1,
    check: (d) => {
      return d.name?.toLowerCase().match(/staff of/i) && isMagic(d);
    }
  },

  'magic/wand': {
    priority: 1,
    check: (d) => {
      return d.name?.toLowerCase().match(/wand of/i) && isMagic(d);
    }
  },

  'magic/wondrous': {
    priority: 1,
    check: (d) => {
      // Any other magic loot item
      return d.type === 'loot' && isMagic(d);
    }
  },

  // ========== BASE ARMOR (Priority 2) ==========

  'equipment/light': {
    priority: 2,
    check: (d) => {
      const typeCode = getTypeCode(d);
      return (typeCode === 'LA' && !isMagic(d)) ||
             (d.type === 'equipment' && d.system?.armor?.type === 'light' && !isMagic(d));
    }
  },

  'equipment/medium': {
    priority: 2,
    check: (d) => {
      const typeCode = getTypeCode(d);
      return (typeCode === 'MA' && !isMagic(d)) ||
             (d.type === 'equipment' && d.system?.armor?.type === 'medium' && !isMagic(d));
    }
  },

  'equipment/heavy': {
    priority: 2,
    check: (d) => {
      const typeCode = getTypeCode(d);
      return (typeCode === 'HA' && !isMagic(d)) ||
             (d.type === 'equipment' && d.system?.armor?.type === 'heavy' && !isMagic(d));
    }
  },

  'equipment/shield': {
    priority: 2,
    check: (d) => {
      const typeCode = getTypeCode(d);
      const name = d.name?.toLowerCase() || '';
      return (typeCode === 'S' && !isMagic(d)) ||
             (d.type === 'equipment' && d.system?.armor?.type === 'shield' && !isMagic(d)) ||
             (name === 'shield' || name === 'wooden shield');
    }
  },

  // ========== BASE WEAPONS (Priority 2) ==========

  'weapon/melee': {
    priority: 2,
    check: (d) => {
      const typeCode = getTypeCode(d);
      return (typeCode === 'M' && !isMagic(d)) ||
             (d.type === 'weapon' && !d.system?.properties?.amm && !isMagic(d));
    }
  },

  'weapon/ranged': {
    priority: 2,
    check: (d) => {
      const typeCode = getTypeCode(d);
      return (typeCode === 'R' && !isMagic(d)) ||
             (d.type === 'weapon' && d.system?.properties?.amm && !isMagic(d));
    }
  },

  'weapon/ammunition': {
    priority: 2,
    check: (d) => {
      const typeCode = getTypeCode(d);
      const name = d.name?.toLowerCase() || '';
      return typeCode === 'A' ||
             name.match(/^(arrow|bolt|sling bullet|blowgun needle)s?$/i);
    }
  },

  // ========== TOOLS (Priority 3) ==========

  'tool/artisan': {
    priority: 3,
    check: (d) => {
      const typeCode = getTypeCode(d);
      const name = d.name?.toLowerCase() || '';
      return typeCode === 'AT' ||
             name.match(/(alchemist|brewer|calligrapher|carpenter|cartographer|cobbler|cook|glassblower|jeweler|leatherworker|mason|painter|potter|smith|tinker|weaver|woodcarver).*(supplies|tools)/i);
    }
  },

  'tool/gaming': {
    priority: 3,
    check: (d) => {
      const typeCode = getTypeCode(d);
      const name = d.name?.toLowerCase() || '';
      return typeCode === 'GS' ||
             name.match(/(dice set|playing card|dragonchess|three-dragon ante)/i);
    }
  },

  'tool/musical': {
    priority: 3,
    check: (d) => {
      const typeCode = getTypeCode(d);
      const name = d.name?.toLowerCase() || '';
      return typeCode === 'INS' ||
             name.match(/(bagpipes|drum|dulcimer|flute|horn|lute|lyre|pan flute|shawm|viol)/i);
    }
  },

  'tool/other': {
    priority: 3,
    check: (d) => {
      const typeCode = getTypeCode(d);
      const name = d.name?.toLowerCase() || '';
      return typeCode === 'T' ||
             d.type === 'tool' ||
             name.match(/(disguise kit|forgery kit|herbalism kit|navigator|poisoner|thieves.?tools)/i);
    }
  },

  // ========== CONSUMABLES (Priority 4) ==========

  'consumable/potion': {
    priority: 4,
    check: (d) => {
      return (d.type === 'consumable' && !isMagic(d) && d.name?.toLowerCase().includes('potion')) ||
             d.name?.toLowerCase().match(/(alchemist.?s fire|acid|antitoxin|oil)/i);
    }
  },

  'consumable/scroll': {
    priority: 4,
    check: (d) => {
      return d.type === 'consumable' && !isMagic(d) && d.name?.toLowerCase().includes('scroll');
    }
  },

  'consumable/food': {
    priority: 4,
    check: (d) => {
      const typeCode = getTypeCode(d);
      const name = d.name?.toLowerCase() || '';
      return typeCode === 'FD' ||
             d.system?.consumableType === 'food' ||
             name.match(/(rations|bread|cheese|meat|ale|wine|banquet|feed|stabling)/i);
    }
  },

  'consumable/other': {
    priority: 4,
    check: (d) => d.type === 'consumable'
  },

  // ========== GEAR (Priority 5) ==========

  'gear/mount': {
    priority: 5,
    check: (d) => {
      const typeCode = getTypeCode(d);
      const name = d.name?.toLowerCase() || '';
      return typeCode === 'MNT' ||
             name.match(/^(camel|elephant|draft horse|riding horse|mastiff|mule|pony|warhorse)$/i);
    }
  },

  'gear/vehicle': {
    priority: 5,
    check: (d) => {
      const typeCode = getTypeCode(d);
      const name = d.name?.toLowerCase() || '';
      return (typeCode && typeCode.match(/^(VEH|SHP|AIR)$/)) ||
             name.match(/(airship|galley|keelboat|longship|rowboat|sailing ship|warship|carriage|cart|chariot|sled|wagon)/i);
    }
  },

  'gear/tack': {
    priority: 5,
    check: (d) => {
      const typeCode = getTypeCode(d);
      const name = d.name?.toLowerCase() || '';
      return typeCode === 'TAH' ||
             name.match(/(saddle|barding|bit|bridle|reins)/i);
    }
  },

  'gear/spellcasting': {
    priority: 5,
    check: (d) => {
      const typeCode = getTypeCode(d);
      const name = d.name?.toLowerCase() || '';
      return (typeCode === 'SCF' && !isMagic(d)) ||
             (name.match(/(arcane focus|druidic focus|holy symbol|component pouch|crystal|orb|staff|wand|sprig|totem|yew|amulet|emblem|reliquary)/i) && !isMagic(d));
    }
  },

  'gear/adventuring': {
    priority: 5,
    check: (d) => {
      const typeCode = getTypeCode(d);
      const name = d.name?.toLowerCase() || '';
      return typeCode === 'G' ||
             (d.type === 'loot' && !isMagic(d) && name.match(/(backpack|barrel|basket|bedroll|bell|blanket|block and tackle|book|bottle|bucket|caltrops|candle|case|chain|chalk|chest|climber|clothes|crowbar|fishing tackle|flask|grappling hook|hammer|hourglass|ink|jug|ladder|lamp|lantern|lock|magnifying glass|manacles|mess kit|mirror|oil|paper|parchment|perfume|pick|piton|pole|pot|pouch|quiver|ram|rope|sack|scale|sealing wax|shovel|signal whistle|signet ring|soap|spellbook|spikes|spyglass|tent|tinderbox|torch|vial|waterskin|whetstone)/i));
    }
  },

  'gear/treasure': {
    priority: 5,
    check: (d) => {
      const typeCode = getTypeCode(d);
      const name = d.name?.toLowerCase() || '';
      return typeCode === '$C' ||
             name.match(/(copper piece|silver piece|electrum piece|gold piece|platinum piece|gem|art object)/i);
    }
  },

  'gear/other': {
    priority: 6,
    check: (d) => d.type === 'loot'
  }
};

// Sort categories by priority (lower number = higher priority)
const sortedCategories = Object.entries(categories).sort((a, b) =>
  (a[1].priority || 99) - (b[1].priority || 99)
);

console.log('Organizing items with SRD 5e 2024 structure...\n');

// ========== STEP 1: FLATTEN ==========
console.log('Step 1: Flattening existing subdirectories...\n');

const subdirs = fs.readdirSync(itemsDir).filter(f => {
  const fullPath = path.join(itemsDir, f);
  try {
    return fs.statSync(fullPath).isDirectory();
  } catch {
    return false;
  }
});

function flattenDirectory(dirPath, rootPath) {
  let count = 0;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      count += flattenDirectory(fullPath, rootPath);
    } else if (entry.name.endsWith('.json')) {
      const newPath = path.join(rootPath, entry.name);
      if (fullPath !== newPath) {
        fs.renameSync(fullPath, newPath);
        count++;
      }
    }
  }

  return count;
}

let flattened = 0;
for (const subdir of subdirs) {
  const subdirPath = path.join(itemsDir, subdir);
  const itemCount = flattenDirectory(subdirPath, itemsDir);
  flattened += itemCount;

  fs.rmSync(subdirPath, { recursive: true, force: true });
  console.log(`✓ Flattened ${subdir}/ (${itemCount} items)`);
}

console.log(`\nFlattened ${flattened} items from ${subdirs.length} subdirectories\n`);

// ========== STEP 2: CATEGORIZE ==========
console.log('Step 2: Categorizing items by SRD structure...\n');

const files = fs.readdirSync(itemsDir).filter(f =>
  f.endsWith('.json') && !f.startsWith('.')
);

let organized = 0;
let uncategorized = 0;
let errors = 0;

const categoryStats = {};
const uncategorizedItems = [];

for (const file of files) {
  try {
    const filePath = path.join(itemsDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Find matching category (using priority order)
    let targetDir = null;
    for (const [catName, catDef] of sortedCategories) {
      if (catDef.check(data)) {
        targetDir = catName;
        break;
      }
    }

    if (!targetDir) {
      uncategorized++;
      uncategorizedItems.push({
        name: data.name,
        type: data.type,
        typeCode: getTypeCode(data),
        rarity: data.system?.rarity
      });
      continue;
    }

    // Track stats
    if (!categoryStats[targetDir]) {
      categoryStats[targetDir] = 0;
    }
    categoryStats[targetDir]++;

    // Create target directory
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

// ========== SUMMARY ==========
console.log('\n' + '='.repeat(60));
console.log('ORGANIZATION COMPLETE');
console.log('='.repeat(60));
console.log(`\nTotal items processed: ${files.length}`);
console.log(`✓ Organized: ${organized}`);
console.log(`⚠ Uncategorized: ${uncategorized}`);
console.log(`✗ Errors: ${errors}`);

console.log('\n--- Items per Category ---\n');
for (const [category, count] of Object.entries(categoryStats).sort((a, b) => b[1] - a[1])) {
  console.log(`${category.padEnd(25)} ${count.toString().padStart(4)} items`);
}

if (uncategorizedItems.length > 0) {
  console.log('\n--- Uncategorized Items ---\n');
  for (const item of uncategorizedItems.slice(0, 20)) {
    console.log(`  ${item.name} (type: ${item.type}, code: ${item.typeCode || 'none'}, rarity: ${item.rarity || 'none'})`);
  }
  if (uncategorizedItems.length > 20) {
    console.log(`  ... and ${uncategorizedItems.length - 20} more`);
  }
}

console.log('\n' + '='.repeat(60));
