# Building Foundry Core SRD 5e

This document explains how to build the compendium packs for the Foundry Core SRD 5e module.

---

## Overview

The Foundry Core SRD 5e module is distributed with **pre-built compendium packs** containing all SRD 5.2.1 content. Game Masters don't need to run any import process - all content is ready to use immediately upon installation.

### Build vs Runtime

**Build Time (Developers):**
- Run once during development/packaging
- Processes SRD JSON data → Generates Foundry compendium packs
- Output is committed to repository and distributed with module

**Runtime (Game Masters):**
- No build process required
- All content available in compendium packs
- Simply drag and drop from compendia into world

---

## Prerequisites

- Node.js 18+ installed
- Access to SRD 5.2.1 JSON data at:
  ```
  c:/Users/hobda/Projects/Crit-Fumble/www.crit-fumble.com/data/5e/5etools-srd521/
  ```

---

## Build Commands

### Build All Compendia

```bash
npm run build
```

This generates all compendium packs from SRD JSON data:
- Species (7 humanoid subtypes)
- Classes (12 core classes)
- Monsters (300+ creatures)
- Items (weapons, armor, magic items)
- Spells (200+ spells)
- Rules (conditions, systems)

### Clean Generated Files

```bash
npm run clean
```

Removes all generated `.json` files from `packs/` directories.

### Rebuild Everything

```bash
npm run rebuild
```

Cleans and rebuilds all compendia (equivalent to `clean` + `build`).

---

## Build Process Details

### 1. Source Data

The build process reads SRD 5.2.1 data from:

```
data/5e/5etools-srd521/data/
├── races.json              → Species compendium
├── class/
│   ├── class-barbarian.json
│   ├── class-bard.json
│   └── ...                 → Classes compendium
├── bestiary/
│   ├── bestiary-mm.json
│   └── ...                 → Monsters compendium
├── items.json              → Items compendium
├── spells/
│   ├── spells-phb.json
│   └── ...                 → Spells compendium
└── conditionsdiseases.json → Rules compendium
```

### 2. Filtering

Only content with `srd52: true` is included:

```javascript
const srdSpecies = racesData.race.filter(r => r.srd52 === true);
```

This ensures we only distribute OGL 1.0a licensed content.

### 3. Document Creation

SRD data is converted to Foundry document format:

```javascript
const item = {
  name: species.name,
  type: 'race',
  img: 'modules/foundry-core-srd-5e/assets/species/dragonborn.png',
  system: {
    description: { value: cleanSRDText(extractEntryText(species.entries)) },
    source: 'SRD 5.2.1',
    // ... additional properties
  },
  flags: {
    'foundry-core-srd-5e': {
      srdSource: species.source,
      srd52: true,
      _srdData: species  // Preserve original data
    }
  }
};
```

### 4. Pack Generation

Each document is written as a JSON file to the appropriate pack directory:

```
packs/
├── species/
│   ├── dragonborn.json
│   ├── dwarf.json
│   └── ...
├── classes/
│   ├── barbarian.json
│   ├── wizard.json
│   └── ...
└── ...
```

---

## Build Script Architecture

### Main Build Script

**File:** `scripts/build-compendia.mjs`

**Functions:**
- `buildSpeciesCompendium()` - ✅ Implemented
- `buildClassesCompendium()` - ✅ Implemented
- `buildMonstersCompendium()` - ⏳ TODO
- `buildItemsCompendium()` - ⏳ TODO
- `buildSpellsCompendium()` - ⏳ TODO
- `buildRulesCompendium()` - ⏳ TODO

### Helper Utilities

**File:** `scripts/importers/base-importer.mjs`

Provides utility functions:
- `slugify()` - Convert text to URL-safe slug
- `cleanSRDText()` - Remove 5etools formatting tags
- `extractEntryText()` - Parse nested entry structures
- `filterSRDContent()` - Filter for `srd52: true`
- `getArtAssetPath()` - Generate asset paths

---

## Compendium Pack Structure

### Foundry VTT Format

Each compendium pack is a directory containing:

```
packs/species/
├── dragonborn.json
├── dwarf.json
├── elf.json
└── ...
```

Each `.json` file is a Foundry document:

```json
{
  "name": "Dragonborn",
  "type": "race",
  "img": "modules/foundry-core-srd-5e/assets/species/dragonborn.png",
  "system": { ... },
  "flags": { ... }
}
```

### Document Types

| Compendium | Document Type | Count |
|------------|--------------|-------|
| Species | Item (race) | 7 |
| Classes | Item (class) | 12 |
| Monsters | Actor (npc) | 300+ |
| Items | Item (various) | 200+ |
| Spells | Item (spell) | 200+ |
| Rules | JournalEntry | 50+ |

---

## Adding New Content

To add a new compendium or expand existing ones:

### 1. Create Build Function

In `scripts/build-compendia.mjs`:

```javascript
async function buildMyCompendium() {
  console.log('Building My compendium...');

  // Load SRD data
  const dataFile = path.join(SRD_DATA_DIR, 'my-data.json');
  const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

  // Filter for SRD content
  const srdItems = data.items.filter(item => item.srd52 === true);

  const items = [];

  for (const itemData of srdItems) {
    const item = {
      name: itemData.name,
      type: 'my-type',
      img: `modules/foundry-core-srd-5e/assets/my-items/${slugify(itemData.name)}.png`,
      system: {
        // ... map SRD data to Foundry format
      },
      flags: {
        'foundry-core-srd-5e': {
          srdSource: itemData.source,
          srd52: true,
          _srdData: itemData
        }
      }
    };

    items.push(item);
  }

  // Write to compendium directory
  const outDir = path.join(PACKS_DIR, 'my-items');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  for (const item of items) {
    const filename = `${slugify(item.name)}.json`;
    const filepath = path.join(outDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(item, null, 2));
  }

  console.log(`✓ Built ${items.length} items\n`);
}
```

### 2. Register in module.json

Add pack definition to `module.json`:

```json
{
  "packs": [
    {
      "name": "srd-my-items",
      "label": "SRD 5e My Items",
      "path": "packs/my-items",
      "type": "Item",
      "system": "dnd5e",
      "private": false
    }
  ]
}
```

### 3. Call in main()

In `scripts/build-compendia.mjs`:

```javascript
async function main() {
  try {
    await buildSpeciesCompendium();
    await buildClassesCompendium();
    await buildMyCompendium();  // ← Add here
    // ...
  }
}
```

### 4. Update clean script

Add directory to `scripts/clean-packs.mjs`:

```javascript
const packDirs = [
  'species',
  'classes',
  'my-items',  // ← Add here
  // ...
];
```

---

## Distribution

### What to Include

When distributing the module, include:

- ✅ `module.json` - Module manifest
- ✅ `packs/` - **Pre-built compendium packs**
- ✅ `scripts/init.mjs` - Runtime initialization
- ✅ `scripts/systems/` - Game systems
- ✅ `styles/` - CSS
- ✅ `assets/` - Images (CC0)
- ✅ `README.md` - User documentation

### What NOT to Include

- ❌ `scripts/build-compendia.mjs` - Build script (dev only)
- ❌ `scripts/importers/` - Build helpers (dev only)
- ❌ `scripts/clean-packs.mjs` - Clean script (dev only)
- ❌ `package.json` - NPM config (dev only)
- ❌ Source SRD JSON data (already converted to packs)

### Packaging

```bash
# From module directory
zip -r foundry-core-srd-5e.zip \
  module.json \
  packs/ \
  scripts/init.mjs \
  scripts/systems/ \
  styles/ \
  assets/ \
  README.md \
  LICENSE.txt
```

---

## Testing

After building, test the compendia:

1. Copy module to Foundry's `modules/` directory
2. Launch Foundry VTT
3. Create/open a world with dnd5e system
4. Enable "Foundry Core SRD 5e" module
5. Check compendium packs appear in sidebar
6. Open each pack and verify content
7. Drag items/actors into world to test functionality

---

## Troubleshooting

### Build fails with "file not found"

**Problem:** SRD data path is incorrect

**Solution:** Update `SRD_DATA_DIR` in `build-compendia.mjs`:

```javascript
const SRD_DATA_DIR = 'path/to/your/srd/data';
```

### Compendia appear empty in Foundry

**Problem:** Pack files weren't generated

**Solution:**
1. Check `packs/` directories contain `.json` files
2. Run `npm run build` to regenerate
3. Restart Foundry

### Documents don't drag into world

**Problem:** Document type mismatch

**Solution:** Ensure `type` in document matches Foundry expectations:
- Species → `type: 'race'`
- Classes → `type: 'class'`
- Monsters → `type: 'npc'`
- Items → `type: 'weapon'`, `'armor'`, etc.
- Spells → `type: 'spell'`

---

## License

All SRD 5.2.1 content is licensed under **OGL 1.0a**.

See [LICENSE.txt](../LICENSE.txt) for full text.

---

**Last Updated:** 2025-01-19
