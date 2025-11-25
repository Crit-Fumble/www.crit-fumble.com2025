#!/usr/bin/env node
/**
 * Catalog all available tiles from Dungeon Crawl Stone Soup
 * Creates a JSON inventory for tile import into database
 */

const fs = require('fs');
const path = require('path');

const SOURCE_DIR = path.join(__dirname, '..', 'public', 'img', 'game', 'opengameart', 'crawl-tiles_Oct-5-2010');
const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'tile-inventory.json');

const categories = {
  'dc-dngn/floor': 'floor',
  'dc-dngn/wall': 'wall',
  'dc-dngn/altars': 'decoration',
  'dc-dngn/gateways': 'decoration',
  'dc-dngn/water': 'terrain',
  'item': 'object',
  'effect': 'effect',
};

function scanDirectory(dir, category) {
  const tiles = [];
  const fullPath = path.join(SOURCE_DIR, dir);

  if (!fs.existsSync(fullPath)) {
    console.warn(`Warning: Directory not found: ${fullPath}`);
    return tiles;
  }

  const files = fs.readdirSync(fullPath);

  for (const file of files) {
    const filePath = path.join(fullPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isFile() && file.endsWith('.png')) {
      const basename = file.replace('.png', '');

      // Parse tile name for tags
      const tags = [];
      if (basename.includes('brick')) tags.push('brick');
      if (basename.includes('stone')) tags.push('stone');
      if (basename.includes('dirt')) tags.push('dirt');
      if (basename.includes('grass')) tags.push('grass');
      if (basename.includes('wood')) tags.push('wood');
      if (basename.includes('crystal')) tags.push('crystal');
      if (basename.includes('floor')) tags.push('floor');
      if (basename.includes('wall')) tags.push('wall');
      if (basename.match(/\d+$/)) tags.push('variant');

      tiles.push({
        name: basename,
        originalFile: `opengameart/crawl-tiles_Oct-5-2010/${dir}/${file}`,
        category: category,
        tags: tags,
        type: 'square',
        originalSize: 32,
        targetBaseSize: 60,
        targetDetailSize: 600,
        sourceLicense: 'CC0-1.0',
        sourceAttribution: 'Dungeon Crawl Stone Soup Team',
      });
    }
  }

  return tiles;
}

console.log('Cataloging Dungeon Crawl Stone Soup tiles...');
console.log('');

const inventory = {
  metadata: {
    generatedAt: new Date().toISOString(),
    source: 'Dungeon Crawl Stone Soup (CC0)',
    originalTileSize: 32,
    targetBaseTileSize: 60,
    targetDetailTileSize: 600,
    totalTiles: 0,
  },
  categories: {},
  tiles: [],
};

for (const [dir, category] of Object.entries(categories)) {
  console.log(`Scanning: ${dir}...`);
  const tiles = scanDirectory(dir, category);

  if (!inventory.categories[category]) {
    inventory.categories[category] = {
      count: 0,
      directories: [],
    };
  }

  inventory.categories[category].count += tiles.length;
  inventory.categories[category].directories.push(dir);
  inventory.tiles.push(...tiles);

  console.log(`  Found: ${tiles.length} tiles`);
}

inventory.metadata.totalTiles = inventory.tiles.length;

// Ensure data directory exists
const dataDir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Write inventory
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(inventory, null, 2));

console.log('');
console.log('====================================');
console.log('Tile Catalog Complete!');
console.log('====================================');
console.log('');
console.log('Summary:');
Object.entries(inventory.categories).forEach(([category, data]) => {
  console.log(`  ${category}: ${data.count} tiles`);
});
console.log(`  Total: ${inventory.metadata.totalTiles} tiles`);
console.log('');
console.log(`Output: ${OUTPUT_FILE}`);
console.log('');
console.log('Next steps:');
console.log('  1. Run: npm run tiles:process (process 32px -> 60px)');
console.log('  2. Run: npm run tiles:import (import to database)');
console.log('');
