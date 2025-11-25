#!/usr/bin/env node
/**
 * Validate Item Properties and Types
 * Ensures all items have proper SRD data and Foundry VTT properties
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const itemsDir = path.join(__dirname, '../packs/items');

console.log('Validating item properties and types...\n');

// Required properties for ALL items
const requiredCoreProperties = [
  'name',
  'type',
  'system',
  'flags'
];

// Required system properties for ALL items
const requiredSystemProperties = [
  'description',
  'source',
  'quantity',
  'weight',
  'price',
  'rarity',
  'identified'
];

// Required _srdData properties for ALL items
const requiredSrdDataProperties = [
  'name',
  'source',
  'page',
  'type'
];

// Type-specific validation rules
const typeValidation = {
  'weapon': {
    foundryType: 'weapon',
    requiredSystem: ['damage', 'weaponType', 'properties'],
    requiredSrdData: ['weaponCategory', 'dmg1', 'dmgType'],
    optionalSrdData: ['dmg2', 'property', 'mastery', 'range']
  },
  'equipment': {
    foundryType: 'equipment',
    requiredSystem: ['armor'],
    requiredSrdData: [],
    optionalSrdData: ['ac', 'armor', 'stealth']
  },
  'consumable': {
    foundryType: 'consumable',
    requiredSystem: ['uses', 'activation'],
    requiredSrdData: [],
    optionalSrdData: ['consumableType', 'entries']
  },
  'tool': {
    foundryType: 'tool',
    requiredSystem: [],
    requiredSrdData: [],
    optionalSrdData: ['toolType', 'ability']
  },
  'loot': {
    foundryType: 'loot',
    requiredSystem: [],
    requiredSrdData: [],
    optionalSrdData: ['carryingCapacity', 'speed'] // for mounts
  }
};

// Scan all directories recursively
function scanDirectory(dirPath, results = { total: 0, errors: [], warnings: [], stats: {} }) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      scanDirectory(fullPath, results);
    } else if (entry.name.endsWith('.json')) {
      results.total++;
      validateItem(fullPath, results);
    }
  }

  return results;
}

function validateItem(filePath, results) {
  const relativePath = path.relative(itemsDir, filePath);

  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const errors = [];
    const warnings = [];

    // Validate core properties
    for (const prop of requiredCoreProperties) {
      if (!data[prop]) {
        errors.push(`Missing core property: ${prop}`);
      }
    }

    // Validate system properties
    if (data.system) {
      for (const prop of requiredSystemProperties) {
        if (data.system[prop] === undefined) {
          errors.push(`Missing system property: ${prop}`);
        }
      }

      // Check weight value
      if (data.system.weight && typeof data.system.weight.value !== 'number') {
        warnings.push(`Weight value is not a number: ${data.system.weight.value}`);
      }

      // Check price value
      if (data.system.price && typeof data.system.price.value !== 'number') {
        warnings.push(`Price value is not a number: ${data.system.price.value}`);
      }

      // Check rarity
      const validRarities = ['common', 'uncommon', 'rare', 'very rare', 'legendary', 'artifact', 'none'];
      if (data.system.rarity && !validRarities.includes(data.system.rarity)) {
        warnings.push(`Invalid rarity: ${data.system.rarity}`);
      }
    }

    // Validate flags and _srdData
    const srdData = data.flags?.['foundry-core-srd-5e']?._srdData;
    if (!srdData) {
      errors.push('Missing _srdData in flags');
    } else {
      // Check required _srdData properties
      for (const prop of requiredSrdDataProperties) {
        if (!srdData[prop]) {
          errors.push(`Missing _srdData property: ${prop}`);
        }
      }

      // Validate type code format (should be like "M|XPHB", "LA|XPHB", etc.)
      if (srdData.type && !srdData.type.match(/^[A-Z$]+(\|[A-Z]+)?$/)) {
        warnings.push(`Unusual _srdData.type format: ${srdData.type}`);
      }

      // Check source/page consistency
      if (srdData.source && srdData.source !== data.system?.source?.book) {
        warnings.push(`Source mismatch: _srdData.source (${srdData.source}) vs system.source.book (${data.system?.source?.book})`);
      }

      if (srdData.page && srdData.page !== data.system?.source?.page) {
        warnings.push(`Page mismatch: _srdData.page (${srdData.page}) vs system.source.page (${data.system?.source?.page})`);
      }
    }

    // Type-specific validation
    const foundryType = data.type;
    if (typeValidation[foundryType]) {
      const rules = typeValidation[foundryType];

      // Check system properties for this type
      if (rules.requiredSystem) {
        for (const prop of rules.requiredSystem) {
          if (data.system[prop] === undefined) {
            errors.push(`Missing ${foundryType}-specific system property: ${prop}`);
          }
        }
      }

      // Check _srdData properties for this type
      if (rules.requiredSrdData && srdData) {
        for (const prop of rules.requiredSrdData) {
          if (srdData[prop] === undefined) {
            errors.push(`Missing ${foundryType}-specific _srdData property: ${prop}`);
          }
        }
      }

      // Validate weapon-specific properties
      if (foundryType === 'weapon') {
        if (data.system.damage && !data.system.damage.parts) {
          errors.push('Weapon missing damage.parts');
        }

        if (srdData?.dmg1 && !srdData.dmg1.match(/\d+d\d+/)) {
          warnings.push(`Invalid damage dice format: ${srdData.dmg1}`);
        }

        if (data.system.weaponType && !['simple', 'martial'].includes(data.system.weaponType)) {
          warnings.push(`Invalid weaponType: ${data.system.weaponType}`);
        }
      }

      // Validate equipment-specific properties (but not rings/rods/wands)
      if (foundryType === 'equipment') {
        const typeCode = srdData?.type?.split('|')[0];
        const isActualArmor = typeCode && typeCode.match(/^(LA|MA|HA|S)$/);

        // Only validate armor properties for actual armor items, not rings/rods/wands
        if (isActualArmor) {
          if (data.system.armor && !data.system.armor.type) {
            warnings.push('Equipment missing armor.type');
          }

          const validArmorTypes = ['light', 'medium', 'heavy', 'shield', 'natural', 'base'];
          if (data.system.armor?.type && !validArmorTypes.includes(data.system.armor.type)) {
            warnings.push(`Invalid armor type: ${data.system.armor.type}`);
          }

          if (srdData?.ac === undefined && data.system.armor?.value === undefined) {
            warnings.push('Equipment missing AC value');
          }
        }
      }

      // Validate mount-specific properties
      if (srdData?.type === 'MNT' || srdData?.type?.startsWith('MNT|')) {
        if (!srdData.carryingCapacity) {
          warnings.push('Mount missing carryingCapacity');
        }
        if (!srdData.speed) {
          warnings.push('Mount missing speed');
        }
        // Verify creature reference exists
        const creatureName = data.name;
        warnings.push(`Mount "${creatureName}" should reference creature stat block`);
      }
    }

    // Track stats
    const category = path.dirname(relativePath).replace(/\\/g, '/');
    if (!results.stats[category]) {
      results.stats[category] = { total: 0, errors: 0, warnings: 0 };
    }
    results.stats[category].total++;

    // Record results
    if (errors.length > 0) {
      results.stats[category].errors++;
      results.errors.push({
        file: relativePath,
        errors: errors
      });
    }

    if (warnings.length > 0) {
      results.stats[category].warnings++;
      results.warnings.push({
        file: relativePath,
        warnings: warnings
      });
    }

  } catch (error) {
    results.errors.push({
      file: relativePath,
      errors: [`Failed to parse JSON: ${error.message}`]
    });
  }
}

// Run validation
const results = scanDirectory(itemsDir);

// Print results
console.log('='.repeat(70));
console.log('VALIDATION RESULTS');
console.log('='.repeat(70));
console.log(`\nTotal items validated: ${results.total}`);
console.log(`Items with errors: ${results.errors.length}`);
console.log(`Items with warnings: ${results.warnings.length}`);
console.log(`Clean items: ${results.total - results.errors.length - results.warnings.length}`);

// Print errors
if (results.errors.length > 0) {
  console.log('\n' + '='.repeat(70));
  console.log('ERRORS');
  console.log('='.repeat(70));

  for (const item of results.errors) {
    console.log(`\n${item.file}`);
    for (const error of item.errors) {
      console.log(`  ✗ ${error}`);
    }
  }
}

// Print warnings (limit to first 50)
if (results.warnings.length > 0) {
  console.log('\n' + '='.repeat(70));
  console.log('WARNINGS');
  console.log('='.repeat(70));

  const warningsToShow = results.warnings.slice(0, 50);
  for (const item of warningsToShow) {
    console.log(`\n${item.file}`);
    for (const warning of item.warnings) {
      console.log(`  ⚠ ${warning}`);
    }
  }

  if (results.warnings.length > 50) {
    console.log(`\n... and ${results.warnings.length - 50} more items with warnings`);
  }
}

// Print stats by category
console.log('\n' + '='.repeat(70));
console.log('STATS BY CATEGORY');
console.log('='.repeat(70));

const sortedStats = Object.entries(results.stats).sort((a, b) =>
  a[0].localeCompare(b[0])
);

for (const [category, stats] of sortedStats) {
  const status = stats.errors > 0 ? '✗' :
                 stats.warnings > 0 ? '⚠' : '✓';
  console.log(`${status} ${category.padEnd(30)} ${stats.total.toString().padStart(3)} items (${stats.errors} errors, ${stats.warnings} warnings)`);
}

// Exit with error code if there are errors
if (results.errors.length > 0) {
  console.log('\n❌ Validation failed with errors');
  process.exit(1);
} else if (results.warnings.length > 0) {
  console.log('\n⚠️  Validation passed with warnings');
  process.exit(0);
} else {
  console.log('\n✅ All items validated successfully!');
  process.exit(0);
}
