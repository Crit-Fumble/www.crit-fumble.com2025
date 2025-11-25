/**
 * Build Compendium Packs
 *
 * This is a BUILD-TIME script that generates Foundry compendium packs
 * from SRD 5.2.1 JSON data. Run this during development/packaging, NOT at runtime.
 *
 * Usage: node scripts/build-compendia.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const MODULE_ROOT = path.resolve(__dirname, '..');
const SRD_DATA_DIR = 'c:/Users/hobda/Projects/Crit-Fumble/www.crit-fumble.com/data/5e/5etools-srd521/data';
const PACKS_DIR = path.join(MODULE_ROOT, 'packs');

console.log('=== SRD 5e Compendium Builder ===\n');
console.log(`Module root: ${MODULE_ROOT}`);
console.log(`SRD data: ${SRD_DATA_DIR}`);
console.log(`Output: ${PACKS_DIR}\n`);

/**
 * Create slug from text
 */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

/**
 * Clean SRD text (remove formatting tags)
 */
function cleanSRDText(text) {
  if (!text) return '';

  return text
    .replace(/\{@dice ([^}]+)\}/g, '$1')
    .replace(/\{@damage ([^}]+)\}/g, '$1')
    .replace(/\{@hit ([^}]+)\}/g, '+$1')
    .replace(/\{@dc (\d+)\}/g, 'DC $1')
    .replace(/\{@action ([^}]+)\}/g, '$1')
    .replace(/\{@condition ([^}]+)\}/g, '$1')
    .replace(/\{@spell ([^}]+)\}/g, '$1')
    .replace(/\{@creature ([^}]+)\}/g, '$1')
    .replace(/\{@item ([^}]+)\}/g, '$1')
    .replace(/\{@[a-z]+ ([^}]+)\}/g, '$1')
    .trim();
}

/**
 * Extract text from SRD entries
 */
function extractEntryText(entries) {
  if (!entries) return '';
  if (typeof entries === 'string') return entries;

  let text = '';
  for (const entry of Array.isArray(entries) ? entries : [entries]) {
    if (typeof entry === 'string') {
      text += entry + ' ';
    } else if (entry.type === 'list' && entry.items) {
      for (const item of entry.items) {
        text += '• ' + (typeof item === 'string' ? item : extractEntryText([item])) + '\n';
      }
    } else if (entry.type === 'entries' && entry.entries) {
      text += extractEntryText(entry.entries);
    } else if (entry.entries) {
      text += extractEntryText(entry.entries);
    }
  }

  return text.trim();
}

/**
 * Build Species Compendium
 */
async function buildSpeciesCompendium() {
  console.log('Building Species compendium...');

  const racesFile = path.join(SRD_DATA_DIR, 'races.json');
  const racesData = JSON.parse(fs.readFileSync(racesFile, 'utf8'));

  const srdSpecies = racesData.race.filter(r => r.srd52 === true);
  console.log(`Found ${srdSpecies.length} SRD species`);

  const items = [];

  for (const species of srdSpecies) {
    const item = {
      name: species.name,
      type: 'race',
      img: `modules/foundry-core-srd-5e/assets/species/${slugify(species.name)}.png`,
      system: {
        description: {
          value: cleanSRDText(extractEntryText(species.entries)),
          chat: '',
          unidentified: ''
        },
        source: 'SRD 5.2.1',
        advancement: [],
        identifier: slugify(species.name)
      },
      flags: {
        'foundry-core-srd-5e': {
          srdSource: species.source,
          srd52: true,
          _srdData: species
        }
      }
    };

    items.push(item);
  }

  // Write to compendium directory
  const outDir = path.join(PACKS_DIR, 'species');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Write each item as a JSON file
  for (const item of items) {
    const filename = `${slugify(item.name)}.json`;
    const filepath = path.join(outDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(item, null, 2));
  }

  console.log(`✓ Built ${items.length} species\n`);
}

/**
 * Build Classes Compendium
 */
async function buildClassesCompendium() {
  console.log('Building Classes compendium...');

  const classFiles = [
    'class-barbarian.json',
    'class-bard.json',
    'class-cleric.json',
    'class-druid.json',
    'class-fighter.json',
    'class-monk.json',
    'class-paladin.json',
    'class-ranger.json',
    'class-rogue.json',
    'class-sorcerer.json',
    'class-warlock.json',
    'class-wizard.json'
  ];

  const items = [];

  for (const classFile of classFiles) {
    const filePath = path.join(SRD_DATA_DIR, 'class', classFile);
    const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const srdClasses = fileData.class.filter(c => c.srd52 === true);

    for (const classData of srdClasses) {
      const item = {
        name: classData.name,
        type: 'class',
        img: `modules/foundry-core-srd-5e/assets/classes/${slugify(classData.name)}.png`,
        system: {
          description: {
            value: '',
            chat: '',
            unidentified: ''
          },
          source: 'SRD 5.2.1',
          identifier: slugify(classData.name),
          levels: 1,
          hitDice: `d${classData.hd?.faces || 8}`,
          hitDiceUsed: 0,
          advancement: [],
          spellcasting: {
            progression: classData.casterProgression || 'none',
            ability: classData.spellcastingAbility || ''
          },
          saves: classData.proficiency || []
        },
        flags: {
          'foundry-core-srd-5e': {
            srdSource: classData.source,
            srd52: true,
            _srdData: classData
          }
        }
      };

      items.push(item);
    }
  }

  // Write to compendium directory
  const outDir = path.join(PACKS_DIR, 'classes');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  for (const item of items) {
    const filename = `${slugify(item.name)}.json`;
    const filepath = path.join(outDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(item, null, 2));
  }

  console.log(`✓ Built ${items.length} classes\n`);
}

/**
 * Build Subclasses Compendium
 */
async function buildSubclassesCompendium() {
  console.log('Building Subclasses compendium...');

  const classFiles = [
    'class-barbarian.json',
    'class-bard.json',
    'class-cleric.json',
    'class-druid.json',
    'class-fighter.json',
    'class-monk.json',
    'class-paladin.json',
    'class-ranger.json',
    'class-rogue.json',
    'class-sorcerer.json',
    'class-warlock.json',
    'class-wizard.json'
  ];

  const items = [];

  for (const classFile of classFiles) {
    const filePath = path.join(SRD_DATA_DIR, 'class', classFile);
    const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const srdSubclasses = fileData.subclass.filter(sc => sc.srd52 === true);

    for (const subclassData of srdSubclasses) {
      const item = {
        name: subclassData.name,
        type: 'subclass',
        img: `modules/foundry-core-srd-5e/assets/subclasses/${slugify(subclassData.className)}-${slugify(subclassData.name)}.png`,
        system: {
          description: {
            value: '',
            chat: '',
            unidentified: ''
          },
          source: 'SRD 5.2.1',
          identifier: slugify(subclassData.shortName),
          classIdentifier: slugify(subclassData.className),
          advancement: [],
          spellcasting: {
            progression: 'none',
            ability: ''
          }
        },
        flags: {
          'foundry-core-srd-5e': {
            srdSource: subclassData.source,
            srd52: true,
            className: subclassData.className,
            classSource: subclassData.classSource,
            _srdData: subclassData
          }
        }
      };

      items.push(item);
    }
  }

  // Write to compendium directory
  const outDir = path.join(PACKS_DIR, 'subclasses');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  for (const item of items) {
    const filename = `${slugify(item.flags['foundry-core-srd-5e'].className)}-${slugify(item.name)}.json`;
    const filepath = path.join(outDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(item, null, 2));
  }

  console.log(`✓ Built ${items.length} subclasses\n`);
}

/**
 * Build Monsters Compendium
 */
async function buildMonstersCompendium() {
  console.log('Building Monsters compendium...');

  // TODO: Implement bestiary import
  // Read from bestiary/*.json files
  // Filter for srd52: true
  // Create Actor documents

  console.log('⏳ Monsters compendium not yet implemented\n');
}

/**
 * Build Items Compendium
 */
async function buildItemsCompendium() {
  console.log('Building Items compendium...');

  const items = [];

  // Load base items (weapons, armor, ammunition)
  const baseItemsFile = path.join(SRD_DATA_DIR, 'items-base.json');
  const baseItemsData = JSON.parse(fs.readFileSync(baseItemsFile, 'utf8'));
  const srdBaseItems = baseItemsData.baseitem.filter(i => i.srd52 === true);
  console.log(`  Found ${srdBaseItems.length} SRD base items`);

  // Load magic items and gear
  const itemsFile = path.join(SRD_DATA_DIR, 'items.json');
  const itemsData = JSON.parse(fs.readFileSync(itemsFile, 'utf8'));
  const srdItems = itemsData.item.filter(i => i.srd52 === true);
  console.log(`  Found ${srdItems.length} SRD items`);

  // Process base items (weapons, armor, ammunition)
  for (const baseItem of srdBaseItems) {
    const item = buildBaseItem(baseItem);
    if (item) {
      items.push(item);
    }
  }

  // Process magic items and gear
  for (const itemData of srdItems) {
    const item = buildMagicItem(itemData);
    if (item) {
      items.push(item);
    }
  }

  // Write to compendium directory
  const outDir = path.join(PACKS_DIR, 'items');
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

/**
 * Build base item (weapon, armor, ammunition, tool, gear)
 */
function buildBaseItem(itemData) {
  const type = determineItemType(itemData);
  if (!type) return null;

  const item = {
    name: itemData.name,
    type: type,
    img: getItemAssetPath(itemData),
    system: {
      description: {
        value: cleanSRDText(extractEntryText(itemData.entries || [])),
        chat: '',
        unidentified: ''
      },
      source: {
        custom: '',
        book: itemData.source || 'XPHB',
        page: itemData.page || 0,
        license: 'OGL 1.0a'
      },
      quantity: 1,
      weight: {
        value: itemData.weight || 0,
        units: 'lb'
      },
      price: {
        value: (itemData.value || 0) / 100,  // Convert copper to gold
        denomination: 'gp'
      },
      rarity: mapRarity(itemData.rarity),
      identified: true,
      activation: buildActivation(itemData),
      duration: {},
      cover: null,
      target: {},
      range: {},
      uses: buildUses(itemData),
      consume: {},
      ability: null,
      actionType: null,
      attackBonus: null,
      chatFlavor: '',
      critical: null,
      damage: buildDamage(itemData),
      formula: '',
      save: buildSave(itemData),
      armor: buildArmor(itemData),
      hp: buildHP(itemData),
      properties: buildProperties(itemData)
    },
    flags: {
      'foundry-core-srd-5e': {
        srdSource: itemData.source,
        srd52: true,
        page: itemData.page,
        itemType: type,
        _srdData: itemData
      }
    }
  };

  // Add weapon-specific data
  if (type === 'weapon') {
    item.system.weaponType = itemData.weaponCategory || 'simpleM';
    item.system.proficient = 0;
    item.system.mastery = mapMastery(itemData.mastery?.[0]);
  }

  // Add attunement if required
  if (itemData.reqAttune) {
    item.system.attunement = 1;  // Required
  }

  return item;
}

/**
 * Build magic item
 */
function buildMagicItem(itemData) {
  const type = determineMagicItemType(itemData);
  if (!type) return null;

  const item = {
    name: itemData.name,
    type: type,
    img: getItemAssetPath(itemData),
    system: {
      description: {
        value: cleanSRDText(extractEntryText(itemData.entries || [])),
        chat: '',
        unidentified: ''
      },
      source: {
        custom: '',
        book: itemData.source || 'XDMG',
        page: itemData.page || 0,
        license: 'OGL 1.0a'
      },
      quantity: 1,
      weight: {
        value: itemData.weight || 0,
        units: 'lb'
      },
      price: {
        value: (itemData.value || 0) / 100,  // Convert copper to gold
        denomination: 'gp'
      },
      rarity: mapRarity(itemData.rarity),
      identified: true,
      activation: {},
      duration: {},
      cover: null,
      target: {},
      range: {},
      uses: {},
      consume: {},
      ability: null,
      actionType: null,
      attackBonus: itemData.bonusWeapon || itemData.bonusSpellAttack || null,
      chatFlavor: '',
      critical: null,
      damage: {},
      formula: '',
      save: {},
      armor: {},
      hp: {},
      properties: []
    },
    flags: {
      'foundry-core-srd-5e': {
        srdSource: itemData.source,
        srd52: true,
        page: itemData.page,
        itemType: type,
        _srdData: itemData
      }
    }
  };

  // Add attunement if required
  if (itemData.reqAttune) {
    item.system.attunement = 1;  // Required
    item.system.description.value += `\n\n<p><strong>Attunement:</strong> ${itemData.reqAttune}</p>`;
  }

  return item;
}

/**
 * Determine Foundry item type from SRD base item
 */
function determineItemType(itemData) {
  const type = itemData.type?.split('|')[0];

  if (itemData.weapon || itemData.weaponCategory) {
    return 'weapon';
  }

  if (itemData.armor || type === 'LA' || type === 'MA' || type === 'HA' || type === 'S') {
    return 'equipment';
  }

  if (type === 'A' || itemData.arrow) {
    return 'consumable';
  }

  if (type === 'INS' || type === 'T' || type === 'AT' || type === 'GS') {
    return 'tool';
  }

  if (type === 'G' || type === '$') {
    return 'loot';
  }

  return 'loot';  // Default
}

/**
 * Determine Foundry item type from SRD magic item
 */
function determineMagicItemType(itemData) {
  const type = itemData.type?.split('|')[0];

  if (type === 'P') return 'consumable';  // Potion
  if (type === 'SC') return 'consumable';  // Scroll
  if (type === 'RG' || type === 'RN') return 'equipment';  // Ring
  if (type === 'WD') return 'equipment';  // Wand
  if (type === 'RD') return 'equipment';  // Rod
  if (type === 'ST') return 'equipment';  // Staff
  if (type === 'W') return 'loot';  // Wondrous item
  if (type === 'G') return 'loot';  // Gear

  return 'loot';  // Default
}

/**
 * Build weapon damage
 */
function buildDamage(itemData) {
  if (!itemData.dmg1 && !itemData.dmg2) {
    return { parts: [], versatile: '' };
  }

  const parts = [];

  if (itemData.dmg1) {
    const damageType = mapDamageType(itemData.dmgType);
    parts.push([itemData.dmg1, damageType]);
  }

  const versatile = itemData.dmg2 || '';

  return { parts, versatile };
}

/**
 * Build armor properties
 */
function buildArmor(itemData) {
  if (!itemData.armor && !itemData.ac) {
    return { value: 10, type: 'base', dex: null };
  }

  const type = itemData.type?.split('|')[0];
  let armorType = 'light';
  let dex = null;

  if (type === 'LA') {
    armorType = 'light';
    dex = null;  // Full DEX bonus
  } else if (type === 'MA') {
    armorType = 'medium';
    dex = 2;  // Max +2 DEX
  } else if (type === 'HA') {
    armorType = 'heavy';
    dex = 0;  // No DEX bonus
  } else if (type === 'S') {
    armorType = 'shield';
    dex = null;
  }

  return {
    value: itemData.ac || 10,
    type: armorType,
    dex: dex
  };
}

/**
 * Build item HP
 */
function buildHP(itemData) {
  return {
    value: 0,
    max: 0,
    dt: null,
    conditions: ''
  };
}

/**
 * Build weapon properties
 */
function buildProperties(itemData) {
  if (!itemData.property) return [];
  if (!Array.isArray(itemData.property)) return [];

  const props = [];
  for (const prop of itemData.property) {
    if (typeof prop !== 'string') continue;

    const code = prop.split('|')[0];
    const mapped = mapWeaponProperty(code);
    if (mapped) {
      props.push(mapped);
    }
  }

  return props;
}

/**
 * Build activation
 */
function buildActivation(itemData) {
  if (!itemData.weapon) {
    return { type: '', cost: null, condition: '' };
  }

  return {
    type: 'action',
    cost: 1,
    condition: ''
  };
}

/**
 * Build uses
 */
function buildUses(itemData) {
  return {
    value: null,
    max: '',
    per: null,
    recovery: ''
  };
}

/**
 * Build save
 */
function buildSave(itemData) {
  return {
    ability: '',
    dc: null,
    scaling: 'spell'
  };
}

/**
 * Map weapon property code to Foundry property
 */
function mapWeaponProperty(code) {
  const map = {
    'A': 'amm',      // Ammunition
    'F': 'fin',      // Finesse
    'H': 'hvy',      // Heavy
    'L': 'lgt',      // Light
    'LD': 'lod',     // Loading
    'R': 'rng',      // Range
    'RCH': 'rch',    // Reach
    'T': 'thr',      // Thrown
    '2H': 'two',     // Two-Handed
    'V': 'ver'       // Versatile
  };
  return map[code] || null;
}

/**
 * Map mastery to Foundry mastery
 */
function mapMastery(mastery) {
  if (!mastery) return null;

  const name = mastery.split('|')[0].toLowerCase();
  return name;
}

/**
 * Map damage type code to full name
 */
function mapDamageType(code) {
  const map = {
    'B': 'bludgeoning',
    'P': 'piercing',
    'S': 'slashing',
    'A': 'acid',
    'C': 'cold',
    'F': 'fire',
    'L': 'lightning',
    'N': 'necrotic',
    'O': 'force',
    'R': 'radiant',
    'T': 'thunder',
    'Y': 'poison',
    'PS': 'psychic'
  };
  return map[code] || 'bludgeoning';
}

/**
 * Map rarity
 */
function mapRarity(rarity) {
  if (!rarity || rarity === 'none') return 'common';
  return rarity.toLowerCase();
}

/**
 * Get item asset path
 */
function getItemAssetPath(itemData) {
  const name = slugify(itemData.name);

  if (itemData.weapon) {
    return `modules/foundry-core-srd-5e/assets/items/weapons/${name}.png`;
  }

  if (itemData.armor) {
    return `modules/foundry-core-srd-5e/assets/items/armor/${name}.png`;
  }

  if (itemData.type?.startsWith('P|')) {
    return `modules/foundry-core-srd-5e/assets/items/potions/${name}.png`;
  }

  if (itemData.type?.startsWith('SC|')) {
    return `modules/foundry-core-srd-5e/assets/items/scrolls/${name}.png`;
  }

  return `modules/foundry-core-srd-5e/assets/items/gear/${name}.png`;
}

/**
 * Build Spells Compendium
 */
async function buildSpellsCompendium() {
  console.log('Building Spells compendium...');

  const spellsFile = path.join(SRD_DATA_DIR, 'spells', 'spells-xphb.json');
  const spellsData = JSON.parse(fs.readFileSync(spellsFile, 'utf8'));

  const srdSpells = spellsData.spell.filter(s => s.srd52 === true);
  console.log(`Found ${srdSpells.length} SRD spells`);

  const items = [];

  for (const spell of srdSpells) {
    const item = {
      name: spell.name,
      type: 'spell',
      img: `modules/foundry-core-srd-5e/assets/spells/${slugify(spell.name)}.png`,
      system: {
        description: {
          value: buildSpellDescription(spell),
          chat: '',
          unidentified: ''
        },
        source: 'SRD 5.2.1',
        activation: {
          type: mapActivationType(spell.time),
          cost: spell.time[0]?.number || 1,
          condition: ''
        },
        duration: {
          value: mapDurationValue(spell.duration),
          units: mapDurationUnits(spell.duration)
        },
        target: {
          value: null,
          width: null,
          units: '',
          type: mapTargetType(spell)
        },
        range: {
          value: spell.range?.distance?.amount || null,
          long: null,
          units: mapRangeUnits(spell.range)
        },
        uses: {
          value: null,
          max: '',
          per: null,
          recovery: ''
        },
        consume: {
          type: '',
          target: null,
          amount: null
        },
        ability: '',
        actionType: mapActionType(spell),
        attackBonus: '',
        chatFlavor: '',
        critical: {
          threshold: null,
          damage: ''
        },
        damage: {
          parts: mapDamageParts(spell),
          versatile: ''
        },
        formula: '',
        save: {
          ability: mapSaveAbility(spell),
          dc: null,
          scaling: 'spell'
        },
        level: spell.level,
        school: mapSchool(spell.school),
        components: {
          value: '',
          vocal: spell.components?.v === true,
          somatic: spell.components?.s === true,
          material: spell.components?.m !== undefined,
          ritual: spell.meta?.ritual === true,
          concentration: spell.duration?.[0]?.concentration === true
        },
        materials: {
          value: typeof spell.components?.m === 'string' ? spell.components.m : '',
          consumed: false,
          cost: 0,
          supply: 0
        },
        preparation: {
          mode: 'prepared',
          prepared: false
        },
        scaling: {
          mode: spell.entriesHigherLevel ? 'level' : 'none',
          formula: ''
        }
      },
      flags: {
        'foundry-core-srd-5e': {
          srdSource: spell.source,
          srd52: true,
          page: spell.page,
          school: spell.school,
          classes: spell.classes?.fromClassList || [],
          _srdData: spell
        }
      }
    };

    items.push(item);
  }

  // Write to compendium directory
  const outDir = path.join(PACKS_DIR, 'spells');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  for (const item of items) {
    const filename = `${slugify(item.name)}.json`;
    const filepath = path.join(outDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(item, null, 2));
  }

  console.log(`✓ Built ${items.length} spells\n`);
}

/**
 * Build spell description HTML
 */
function buildSpellDescription(spell) {
  let html = `<p><strong>Level ${spell.level}</strong> ${getSchoolName(spell.school)}</p>\n`;
  html += `<p><strong>Casting Time:</strong> ${formatTime(spell.time)}</p>\n`;
  html += `<p><strong>Range:</strong> ${formatRange(spell.range)}</p>\n`;
  html += `<p><strong>Components:</strong> ${formatComponents(spell.components)}</p>\n`;
  html += `<p><strong>Duration:</strong> ${formatDuration(spell.duration)}</p>\n\n`;

  html += cleanSRDText(extractEntryText(spell.entries));

  if (spell.entriesHigherLevel) {
    html += '\n\n<p><strong>At Higher Levels:</strong> ';
    html += cleanSRDText(extractEntryText(spell.entriesHigherLevel));
    html += '</p>';
  }

  return html;
}

/**
 * Map spell school code to full name
 */
function getSchoolName(code) {
  const schools = {
    'A': 'Abjuration',
    'C': 'Conjuration',
    'D': 'Divination',
    'E': 'Enchantment',
    'V': 'Evocation',
    'I': 'Illusion',
    'N': 'Necromancy',
    'T': 'Transmutation'
  };
  return schools[code] || code;
}

/**
 * Map school code to Foundry format
 */
function mapSchool(code) {
  const schoolMap = {
    'A': 'abj',
    'C': 'con',
    'D': 'div',
    'E': 'enc',
    'V': 'evo',
    'I': 'ill',
    'N': 'nec',
    'T': 'trs'
  };
  return schoolMap[code] || 'evo';
}

/**
 * Format casting time
 */
function formatTime(time) {
  if (!time || !time[0]) return '1 action';
  const t = time[0];
  return `${t.number} ${t.unit}${t.number > 1 ? 's' : ''}`;
}

/**
 * Format range
 */
function formatRange(range) {
  if (!range) return 'Self';
  if (range.type === 'point') {
    return `${range.distance.amount} ${range.distance.type}`;
  }
  return range.type;
}

/**
 * Format components
 */
function formatComponents(components) {
  if (!components) return 'None';
  const parts = [];
  if (components.v) parts.push('V');
  if (components.s) parts.push('S');
  if (components.m) {
    const material = typeof components.m === 'string' ? ` (${components.m})` : '';
    parts.push(`M${material}`);
  }
  return parts.join(', ');
}

/**
 * Format duration
 */
function formatDuration(duration) {
  if (!duration || !duration[0]) return 'Instantaneous';
  const d = duration[0];
  if (d.type === 'instant') return 'Instantaneous';
  if (d.type === 'permanent') return 'Permanent';
  if (d.type === 'timed') {
    const conc = d.concentration ? 'Concentration, up to ' : '';
    return `${conc}${d.duration.amount} ${d.duration.type}${d.duration.amount > 1 ? 's' : ''}`;
  }
  return 'Special';
}

/**
 * Map activation type
 */
function mapActivationType(time) {
  if (!time || !time[0]) return 'action';
  const unit = time[0].unit.toLowerCase();
  if (unit.includes('action')) return 'action';
  if (unit.includes('bonus')) return 'bonus';
  if (unit.includes('reaction')) return 'reaction';
  if (unit.includes('minute')) return 'minute';
  if (unit.includes('hour')) return 'hour';
  return 'action';
}

/**
 * Map duration value
 */
function mapDurationValue(duration) {
  if (!duration || !duration[0]) return null;
  const d = duration[0];
  if (d.type === 'timed' && d.duration) {
    return d.duration.amount;
  }
  return null;
}

/**
 * Map duration units
 */
function mapDurationUnits(duration) {
  if (!duration || !duration[0]) return 'inst';
  const d = duration[0];
  if (d.type === 'instant') return 'inst';
  if (d.type === 'permanent') return 'perm';
  if (d.type === 'timed' && d.duration) {
    const type = d.duration.type.toLowerCase();
    if (type.includes('round')) return 'round';
    if (type.includes('minute')) return 'minute';
    if (type.includes('hour')) return 'hour';
    if (type.includes('day')) return 'day';
  }
  return 'inst';
}

/**
 * Map range units
 */
function mapRangeUnits(range) {
  if (!range) return 'self';
  if (range.type === 'point') {
    const unit = range.distance.type.toLowerCase();
    if (unit.includes('feet')) return 'ft';
    if (unit.includes('mile')) return 'mi';
    return 'ft';
  }
  if (range.type === 'self') return 'self';
  if (range.type === 'touch') return 'touch';
  return 'ft';
}

/**
 * Map target type
 */
function mapTargetType(spell) {
  if (spell.areaTags) {
    const area = spell.areaTags[0];
    if (area === 'ST') return 'creature';
    if (area === 'MT') return 'creature';
    if (area === 'C') return 'cone';
    if (area === 'R') return 'rect';
    if (area === 'S') return 'sphere';
    if (area === 'L') return 'line';
  }
  return '';
}

/**
 * Map action type
 */
function mapActionType(spell) {
  if (spell.spellAttack) {
    return spell.spellAttack[0] === 'M' ? 'msak' : 'rsak';
  }
  if (spell.savingThrow) {
    return 'save';
  }
  if (spell.damageInflict) {
    return 'other';
  }
  return 'util';
}

/**
 * Map save ability
 */
function mapSaveAbility(spell) {
  if (!spell.savingThrow) return '';
  const save = spell.savingThrow[0].toLowerCase();
  const abilityMap = {
    'strength': 'str',
    'dexterity': 'dex',
    'constitution': 'con',
    'intelligence': 'int',
    'wisdom': 'wis',
    'charisma': 'cha'
  };
  return abilityMap[save] || save.substring(0, 3);
}

/**
 * Map damage parts
 */
function mapDamageParts(spell) {
  const parts = [];

  if (spell.scalingLevelDice?.scaling) {
    const scaling = spell.scalingLevelDice.scaling;
    const firstLevel = Object.keys(scaling)[0];
    const damageType = spell.damageInflict ? spell.damageInflict[0].toLowerCase() : '';
    parts.push([scaling[firstLevel], damageType]);
  }

  return parts;
}

/**
 * Build Rules Compendium
 */
async function buildRulesCompendium() {
  console.log('Building Rules compendium...');

  const entries = [];

  // 1. Build Conditions
  await buildConditions(entries);

  // 2. Build Core Systems (Resting, etc.)
  await buildCoreSystems(entries);

  // 3. Build Variant Rules (Advantage, Disadvantage, etc.)
  await buildVariantRules(entries);

  // Write to compendium directory
  const outDir = path.join(PACKS_DIR, 'rules');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  for (const entry of entries) {
    const filename = `${slugify(entry.name)}.json`;
    const filepath = path.join(outDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(entry, null, 2));
  }

  console.log(`✓ Built ${entries.length} rules entries\n`);
}

/**
 * Build Conditions as Journal Entries
 */
async function buildConditions(entries) {
  const conditionsFile = path.join(SRD_DATA_DIR, 'conditionsdiseases.json');
  const conditionsData = JSON.parse(fs.readFileSync(conditionsFile, 'utf8'));

  const srdConditions = conditionsData.condition.filter(c => c.srd52 === true);
  console.log(`  Found ${srdConditions.length} SRD conditions`);

  for (const condition of srdConditions) {
    const entry = {
      name: condition.name,
      type: 'base',
      img: `modules/foundry-core-srd-5e/assets/conditions/${slugify(condition.name)}.svg`,
      pages: [
        {
          name: condition.name,
          type: 'text',
          title: {
            show: true,
            level: 1
          },
          text: {
            format: 1,
            content: buildConditionHTML(condition)
          }
        }
      ],
      flags: {
        'foundry-core-srd-5e': {
          type: 'condition',
          srdSource: condition.source,
          srd52: true,
          page: condition.page,
          activeEffects: buildConditionEffects(condition),
          _srdData: condition
        }
      }
    };

    entries.push(entry);
  }
}

/**
 * Build HTML content for condition
 */
function buildConditionHTML(condition) {
  let html = `<h2>${condition.name}</h2>\n\n`;
  html += `<p><em>Source: ${condition.source}, page ${condition.page}</em></p>\n\n`;

  html += cleanSRDText(extractEntryText(condition.entries));

  return html;
}

/**
 * Build active effects for condition
 */
function buildConditionEffects(condition) {
  const effects = [];
  const name = condition.name.toLowerCase();

  // Map common conditions to active effects
  switch (name) {
    case 'blinded':
      effects.push({
        key: 'system.attributes.vision.blindness',
        mode: 5,
        value: '1'
      });
      break;

    case 'deafened':
      effects.push({
        key: 'system.attributes.senses.special',
        mode: 2,
        value: 'Deafened'
      });
      break;

    case 'exhaustion':
      // Exhaustion is level-based, handled by system
      effects.push({
        key: 'flags.dnd5e.exhaustion',
        mode: 2,
        value: '1'
      });
      break;

    case 'frightened':
      // Disadvantage on ability checks and attack rolls
      effects.push({
        key: 'flags.dnd5e.frightened',
        mode: 5,
        value: '1'
      });
      break;

    case 'grappled':
      effects.push({
        key: 'system.attributes.movement.all',
        mode: 5,
        value: '0'
      });
      break;

    case 'incapacitated':
      effects.push({
        key: 'flags.dnd5e.incapacitated',
        mode: 5,
        value: '1'
      });
      break;

    case 'invisible':
      effects.push({
        key: 'flags.dnd5e.invisible',
        mode: 5,
        value: '1'
      });
      break;

    case 'paralyzed':
      effects.push({
        key: 'flags.dnd5e.paralyzed',
        mode: 5,
        value: '1'
      });
      break;

    case 'petrified':
      effects.push({
        key: 'flags.dnd5e.petrified',
        mode: 5,
        value: '1'
      });
      break;

    case 'poisoned':
      effects.push({
        key: 'flags.dnd5e.poisoned',
        mode: 5,
        value: '1'
      });
      break;

    case 'prone':
      effects.push({
        key: 'flags.dnd5e.prone',
        mode: 5,
        value: '1'
      });
      break;

    case 'restrained':
      effects.push({
        key: 'system.attributes.movement.all',
        mode: 5,
        value: '0'
      });
      break;

    case 'stunned':
      effects.push({
        key: 'flags.dnd5e.stunned',
        mode: 5,
        value: '1'
      });
      break;

    case 'unconscious':
      effects.push({
        key: 'flags.dnd5e.unconscious',
        mode: 5,
        value: '1'
      });
      break;
  }

  return effects;
}

/**
 * Build Core Game Systems
 */
async function buildCoreSystems(entries) {
  console.log('  Building core game systems...');

  // The Six Abilities - Most fundamental system
  entries.push({
    name: 'The Six Abilities',
    type: 'base',
    img: 'modules/foundry-core-srd-5e/assets/systems/abilities.svg',
    pages: [
      {
        name: 'The Six Abilities',
        type: 'text',
        title: { show: true, level: 1 },
        text: {
          format: 1,
          content: `<h2>The Six Abilities</h2>

<p><em>The fundamental attributes that define all creatures</em></p>

<p>All creatures—characters and monsters—have six abilities that measure physical and mental characteristics.</p>

<h3>Ability Descriptions</h3>
<table>
  <tr><th>Ability</th><th>Score Measures…</th></tr>
  <tr><td>Strength</td><td>Physical might</td></tr>
  <tr><td>Dexterity</td><td>Agility, reflexes, and balance</td></tr>
  <tr><td>Constitution</td><td>Health and stamina</td></tr>
  <tr><td>Intelligence</td><td>Reasoning and memory</td></tr>
  <tr><td>Wisdom</td><td>Perceptiveness and mental fortitude</td></tr>
  <tr><td>Charisma</td><td>Confidence, poise, and charm</td></tr>
</table>

<h3>Ability Scores</h3>
<p>Each ability has a score from 1 to 20, although some monsters have a score as high as 30.</p>

<table>
  <tr><th>Score</th><th>Meaning</th></tr>
  <tr><td>1</td><td>This is the lowest a score can normally go. If an effect reduces a score to 0, that effect explains what happens.</td></tr>
  <tr><td>2–9</td><td>This represents a weak capability.</td></tr>
  <tr><td>10–11</td><td>This represents the human average.</td></tr>
  <tr><td>12–19</td><td>This represents a strong capability.</td></tr>
  <tr><td>20</td><td>This is the highest an adventurer's score can go unless a feature says otherwise.</td></tr>
  <tr><td>21–29</td><td>This represents an extraordinary capability.</td></tr>
  <tr><td>30</td><td>This is the highest a score can go.</td></tr>
</table>

<h3>Ability Modifiers</h3>
<p>Each ability has a modifier that you apply whenever you make a D20 Test with that ability. An ability modifier is derived from its score.</p>

<p><strong>Round Down:</strong> Whenever you divide or multiply a number in the game, round down if you end up with a fraction, even if the fraction is one-half or greater. Some rules make an exception and tell you to round up.</p>

<table>
  <tr><th>Score</th><th>Modifier</th></tr>
  <tr><td>1</td><td>−5</td></tr>
  <tr><td>2–3</td><td>−4</td></tr>
  <tr><td>4–5</td><td>−3</td></tr>
  <tr><td>6–7</td><td>−2</td></tr>
  <tr><td>8–9</td><td>−1</td></tr>
  <tr><td>10–11</td><td>+0</td></tr>
  <tr><td>12–13</td><td>+1</td></tr>
  <tr><td>14–15</td><td>+2</td></tr>
  <tr><td>16–17</td><td>+3</td></tr>
  <tr><td>18–19</td><td>+4</td></tr>
  <tr><td>20–21</td><td>+5</td></tr>
  <tr><td>22–23</td><td>+6</td></tr>
  <tr><td>24–25</td><td>+7</td></tr>
  <tr><td>26–27</td><td>+8</td></tr>
  <tr><td>28–29</td><td>+9</td></tr>
  <tr><td>30</td><td>+10</td></tr>
</table>`
        }
      }
    ],
    flags: {
      'foundry-core-srd-5e': {
        type: 'system',
        systemId: 'srd-abilities',
        srd52: true
      }
    }
  });

  // D20 Tests - Core mechanic
  entries.push({
    name: 'D20 Tests',
    type: 'base',
    img: 'modules/foundry-core-srd-5e/assets/systems/d20-tests.svg',
    pages: [
      {
        name: 'D20 Tests',
        type: 'text',
        title: { show: true, level: 1 },
        text: {
          format: 1,
          content: `<h2>D20 Tests</h2>

<p><em>The core mechanic for resolving uncertain outcomes</em></p>

<p>When the outcome of an action is uncertain, the game uses a d20 roll to determine success or failure. These rolls are called D20 Tests, and they come in three kinds: ability checks, saving throws, and attack rolls.</p>

<h3>D20 Test Steps</h3>
<ol>
  <li><strong>Roll 1d20.</strong> You always want to roll high. If the roll has Advantage or Disadvantage, you roll two d20s, but you use the number from only one of them—the higher one if you have Advantage or the lower one if you have Disadvantage.</li>
  <li><strong>Add Modifiers.</strong> Add these modifiers to the number rolled on the d20:
    <ul>
      <li><strong>The Relevant Ability Modifier.</strong></li>
      <li><strong>Your Proficiency Bonus If Relevant.</strong></li>
      <li><strong>Circumstantial Bonuses and Penalties.</strong> A class feature, a spell, or another rule might give a bonus or penalty.</li>
    </ul>
  </li>
  <li><strong>Compare the Total to a Target Number.</strong> If the total equals or exceeds the target number, the D20 Test succeeds. Otherwise, it fails. The target number for an ability check or saving throw is called a Difficulty Class (DC). The target number for an attack roll is called an Armor Class (AC).</li>
</ol>

<h3>Ability Checks</h3>
<p>An ability check represents a creature using talent and training to try to overcome a challenge. The GM calls for an ability check when a creature attempts something other than an attack that has a chance of meaningful failure.</p>

<h4>Ability Check Examples</h4>
<table>
  <tr><th>Ability</th><th>Make a Check To…</th></tr>
  <tr><td>Strength</td><td>Lift, push, pull, or break something</td></tr>
  <tr><td>Dexterity</td><td>Move nimbly, quickly, or quietly</td></tr>
  <tr><td>Constitution</td><td>Push your body beyond normal limits</td></tr>
  <tr><td>Intelligence</td><td>Reason or remember</td></tr>
  <tr><td>Wisdom</td><td>Notice things in the environment or in creatures' behavior</td></tr>
  <tr><td>Charisma</td><td>Influence, entertain, or deceive</td></tr>
</table>

<h4>Difficulty Class</h4>
<p>The Difficulty Class represents the task's difficulty. The more difficult the task, the higher its DC.</p>

<table>
  <tr><th>Task Difficulty</th><th>DC</th></tr>
  <tr><td>Very easy</td><td>5</td></tr>
  <tr><td>Easy</td><td>10</td></tr>
  <tr><td>Medium</td><td>15</td></tr>
  <tr><td>Hard</td><td>20</td></tr>
  <tr><td>Very hard</td><td>25</td></tr>
  <tr><td>Nearly impossible</td><td>30</td></tr>
</table>

<h3>Saving Throws</h3>
<p>A saving throw—also called a save—represents an attempt to evade or resist a threat. You don't normally choose to make a save; you must make one because your character or a monster is at risk.</p>

<p><strong>Note:</strong> If you don't want to resist the effect, you can choose to fail the save without rolling.</p>

<h4>Saving Throw Examples</h4>
<table>
  <tr><th>Ability</th><th>Make a Save To…</th></tr>
  <tr><td>Strength</td><td>Physically resist direct force</td></tr>
  <tr><td>Dexterity</td><td>Dodge out of harm's way</td></tr>
  <tr><td>Constitution</td><td>Endure a toxic hazard</td></tr>
  <tr><td>Intelligence</td><td>Recognize an illusion as fake</td></tr>
  <tr><td>Wisdom</td><td>Resist a mental assault</td></tr>
  <tr><td>Charisma</td><td>Assert your identity</td></tr>
</table>

<h3>Attack Rolls</h3>
<p>An attack roll determines whether an attack hits a target. An attack roll hits if the roll equals or exceeds the target's Armor Class.</p>

<h4>Attack Roll Abilities</h4>
<table>
  <tr><th>Ability</th><th>Attack Type</th></tr>
  <tr><td>Strength</td><td>Melee attack with a weapon or an Unarmed Strike</td></tr>
  <tr><td>Dexterity</td><td>Ranged attack with a weapon</td></tr>
  <tr><td>Varies</td><td>Spell attack (the ability used is determined by the spellcaster's spellcasting feature)</td></tr>
</table>

<h4>Proficiency Bonus</h4>
<p>Add your Proficiency Bonus to attack rolls you make with weapons you're proficient with and to spell attack rolls.</p>

<h4>Armor Class</h4>
<p>The target's Armor Class is the number an attack roll must equal or exceed to hit. AC represents how well a creature avoids being wounded in combat.</p>`
        }
      }
    ],
    flags: {
      'foundry-core-srd-5e': {
        type: 'system',
        systemId: 'srd-d20-tests',
        srd52: true
      }
    }
  });

  // Proficiency System
  entries.push({
    name: 'Proficiency',
    type: 'base',
    img: 'modules/foundry-core-srd-5e/assets/systems/proficiency.svg',
    pages: [
      {
        name: 'Proficiency',
        type: 'text',
        title: { show: true, level: 1 },
        text: {
          format: 1,
          content: `<h2>Proficiency</h2>

<p><em>System for expertise and training</em></p>

<p>Characters and monsters are good at various things. All creatures have a Proficiency Bonus, which reflects the impact that training has on the creature's capabilities.</p>

<p>A character's Proficiency Bonus increases as the character gains levels. A monster's Proficiency Bonus is based on its Challenge Rating.</p>

<h3>Proficiency Bonus Table</h3>
<table>
  <tr><th>Level or CR</th><th>Bonus</th></tr>
  <tr><td>Up to 4</td><td>+2</td></tr>
  <tr><td>5–8</td><td>+3</td></tr>
  <tr><td>9–12</td><td>+4</td></tr>
  <tr><td>13–16</td><td>+5</td></tr>
  <tr><td>17–20</td><td>+6</td></tr>
  <tr><td>21–24</td><td>+7</td></tr>
  <tr><td>25–28</td><td>+8</td></tr>
  <tr><td>29–30</td><td>+9</td></tr>
</table>

<p>This bonus is applied to a D20 Test when the creature has proficiency in a skill, in a saving throw, or with an item that the creature uses to make the D20 Test. The bonus is also used for spell attacks and for calculating the DC of saving throws for spells.</p>

<h3>The Bonus Doesn't Stack</h3>
<p>Your Proficiency Bonus can't be added to a die roll or another number more than once. For example, if a rule allows you to make a Charisma (Deception or Persuasion) check, you add your Proficiency Bonus if you're proficient in either skill, but you don't add it twice if you're proficient in both skills.</p>

<p>Occasionally, a Proficiency Bonus might be multiplied or divided (doubled or halved, for example) before being added. For example, the Expertise feature doubles the Proficiency Bonus for certain ability checks. Whenever the bonus is used, it can be multiplied only once and divided only once.</p>

<h3>Skill Proficiencies</h3>
<p>Most ability checks involve using a skill, which represents a category of things creatures try to do with an ability check. If a creature is proficient in a skill, the creature applies its Proficiency Bonus to ability checks involving that skill. Without proficiency in a skill, a creature can still make ability checks involving that skill but doesn't add its Proficiency Bonus.</p>

<p>The 18 skills are detailed in the Skills & Ability Checks system.</p>

<h3>Saving Throw Proficiencies</h3>
<p>Proficiency in a saving throw lets a character add their Proficiency Bonus to saves that use a particular ability. For example, proficiency in Wisdom saves lets you add your Proficiency Bonus to your Wisdom saves.</p>

<p>Each class gives proficiency in at least two saving throws, representing that class's training in evading or resisting certain threats. Wizards, for example, are proficient in Intelligence and Wisdom saves; they train to resist mental assault.</p>

<h3>Equipment Proficiencies</h3>
<p>A character gains proficiency with various weapons and tools from their class and background. There are two categories of equipment proficiency:</p>

<ul>
  <li><strong>Weapon Proficiency:</strong> Anyone can use any weapon, but if you use a weapon you're proficient with, you add your Proficiency Bonus to attack rolls you make with it.</li>
  <li><strong>Tool Proficiency:</strong> If you have proficiency with a tool, you add your Proficiency Bonus to any ability check you make that uses that tool.</li>
</ul>

<h3>Armor Proficiency</h3>
<p>Anyone can don armor or wield a shield, but only those proficient in its use know how to wear it effectively. If you wear armor or wield a shield that you lack proficiency with, you have Disadvantage on any ability check, saving throw, or attack roll that involves Strength or Dexterity, and you can't cast spells.</p>`
        }
      }
    ],
    flags: {
      'foundry-core-srd-5e': {
        type: 'system',
        systemId: 'srd-proficiency',
        srd52: true
      }
    }
  });

  // Resting System
  entries.push({
    name: 'Resting',
    type: 'base',
    img: 'modules/foundry-core-srd-5e/assets/systems/resting.svg',
    pages: [
      {
        name: 'Resting',
        type: 'text',
        title: { show: true, level: 1 },
        text: {
          format: 1,
          content: `<h2>Resting</h2>

<p><em>Core game system for short and long rests</em></p>

<h3>Short Rest</h3>
<p>A Short Rest is a 1-hour period of downtime, during which a character does nothing more strenuous than eating, drinking, reading, and tending to wounds.</p>

<p><strong>Benefits:</strong></p>
<ul>
  <li>Spend Hit Dice to regain hit points</li>
  <li>Some class features recharge (e.g., Fighter's Second Wind)</li>
  <li>Roll Hit Dice: 1d6, 1d8, 1d10, or 1d12 (based on class) + Constitution modifier</li>
</ul>

<h3>Long Rest</h3>
<p>A Long Rest is an extended period of downtime—at least 8 hours—during which a character sleeps or performs only light activity.</p>

<p><strong>Benefits:</strong></p>
<ul>
  <li>Regain all lost hit points</li>
  <li>Regain spent Hit Dice (up to half your maximum)</li>
  <li>Regain all spell slots</li>
  <li>Reduce Exhaustion level by 1</li>
  <li>All class features recharge</li>
</ul>

<p><strong>Limitations:</strong></p>
<ul>
  <li>You can't benefit from more than one Long Rest in a 24-hour period</li>
  <li>You must have at least 1 hit point at the start to gain benefits</li>
</ul>`
        }
      }
    ],
    flags: {
      'foundry-core-srd-5e': {
        type: 'system',
        systemId: 'srd-resting',
        srd52: true
      }
    }
  });

  // Exhaustion System
  entries.push({
    name: 'Exhaustion',
    type: 'base',
    img: 'modules/foundry-core-srd-5e/assets/systems/exhaustion.svg',
    pages: [
      {
        name: 'Exhaustion',
        type: 'text',
        title: { show: true, level: 1 },
        text: {
          format: 1,
          content: `<h2>Exhaustion</h2>

<p><em>Cumulative condition representing extreme fatigue</em></p>

<h3>Exhaustion Levels</h3>
<p>Exhaustion is measured in six levels. Each time you receive Exhaustion, you gain 1 level. You die if your Exhaustion level reaches 6.</p>

<h3>Effects by Level</h3>
<table>
  <tr><th>Level</th><th>Effect</th></tr>
  <tr><td>1</td><td>D20 Tests -2</td></tr>
  <tr><td>2</td><td>D20 Tests -4, Speed -5 ft</td></tr>
  <tr><td>3</td><td>D20 Tests -6, Speed -10 ft</td></tr>
  <tr><td>4</td><td>D20 Tests -8, Speed -15 ft</td></tr>
  <tr><td>5</td><td>D20 Tests -10, Speed -20 ft</td></tr>
  <tr><td>6</td><td>Death</td></tr>
</table>

<h3>Gaining Exhaustion</h3>
<ul>
  <li>Extreme environmental conditions</li>
  <li>Starvation or dehydration</li>
  <li>Spell effects (e.g., Sickening Radiance)</li>
  <li>Class features (e.g., Barbarian's Frenzy)</li>
</ul>

<h3>Removing Exhaustion</h3>
<p>Finishing a Long Rest removes 1 Exhaustion level. When your Exhaustion level reaches 0, the condition ends.</p>`
        }
      }
    ],
    flags: {
      'foundry-core-srd-5e': {
        type: 'system',
        systemId: 'srd-exhaustion',
        srd52: true
      }
    }
  });

  // Concentration System
  entries.push({
    name: 'Concentration',
    type: 'base',
    img: 'modules/foundry-core-srd-5e/assets/systems/concentration.svg',
    pages: [
      {
        name: 'Concentration',
        type: 'text',
        title: { show: true, level: 1 },
        text: {
          format: 1,
          content: `<h2>Concentration</h2>

<p><em>Maintaining focus on magical effects</em></p>

<h3>Concentration Spells</h3>
<p>Some spells require you to maintain concentration to keep their magic active. If you lose concentration, the spell ends.</p>

<h3>Maintaining Concentration</h3>
<ul>
  <li>You can concentrate on only one spell at a time</li>
  <li>Casting another concentration spell ends the first</li>
  <li>You must maintain concentration for the spell's duration</li>
</ul>

<h3>Breaking Concentration</h3>
<p>You lose concentration if:</p>
<ul>
  <li><strong>You cast another concentration spell</strong></li>
  <li><strong>You take damage:</strong> Make a Constitution saving throw (DC = 10 or half the damage taken, whichever is higher)</li>
  <li><strong>You're incapacitated or killed</strong></li>
  <li><strong>Environmental phenomenon:</strong> DM may require DC 10 Constitution save</li>
</ul>

<h3>Concentration Check</h3>
<p><strong>DC:</strong> 10 or half the damage taken (whichever is higher)</p>
<p><strong>Roll:</strong> Constitution saving throw</p>
<p><strong>Success:</strong> Maintain concentration</p>
<p><strong>Failure:</strong> Spell ends</p>`
        }
      }
    ],
    flags: {
      'foundry-core-srd-5e': {
        type: 'system',
        systemId: 'srd-concentration',
        srd52: true
      }
    }
  });

  // Death Saves System
  entries.push({
    name: 'Death Saving Throws',
    type: 'base',
    img: 'modules/foundry-core-srd-5e/assets/systems/death-saves.svg',
    pages: [
      {
        name: 'Death Saving Throws',
        type: 'text',
        title: { show: true, level: 1 },
        text: {
          format: 1,
          content: `<h2>Death Saving Throws</h2>

<p><em>Determining life or death at 0 hit points</em></p>

<h3>Falling Unconscious</h3>
<p>When you drop to 0 hit points, you either die outright or fall unconscious.</p>

<h3>Death Saves</h3>
<p>At the start of each of your turns while at 0 hit points, you make a special saving throw called a death saving throw:</p>

<ul>
  <li><strong>DC:</strong> 10 (no ability modifier)</li>
  <li><strong>Success:</strong> Mark one success (need 3 to stabilize)</li>
  <li><strong>Failure:</strong> Mark one failure (3 failures means death)</li>
  <li><strong>Natural 20:</strong> Regain 1 hit point</li>
  <li><strong>Natural 1:</strong> Counts as two failures</li>
</ul>

<h3>Stabilizing</h3>
<p>After three successful saves, you become stable:</p>
<ul>
  <li>You don't make more death saves</li>
  <li>You remain unconscious at 0 HP</li>
  <li>Regain 1 HP after 1d4 hours</li>
</ul>

<p>Alternatively, an ally can stabilize you with a DC 10 Wisdom (Medicine) check.</p>

<h3>Taking Damage at 0 HP</h3>
<ul>
  <li><strong>Regular damage:</strong> Counts as one death save failure</li>
  <li><strong>Critical hit:</strong> Counts as two death save failures</li>
  <li><strong>Massive damage:</strong> If damage equals or exceeds your HP maximum, you die instantly</li>
</ul>

<h3>Instant Death</h3>
<p>Massive damage can kill you instantly. When damage reduces you to 0 HP and damage remains, you die if the remaining damage equals or exceeds your HP maximum.</p>`
        }
      }
    ],
    flags: {
      'foundry-core-srd-5e': {
        type: 'system',
        systemId: 'srd-death-saves',
        srd52: true
      }
    }
  });

  // Equipment System
  entries.push({
    name: 'Equipment & Items',
    type: 'base',
    img: 'modules/foundry-core-srd-5e/assets/systems/equipment.svg',
    pages: [
      {
        name: 'Equipment & Items',
        type: 'text',
        title: { show: true, level: 1 },
        text: {
          format: 1,
          content: `<h2>Equipment & Items</h2>

<p><em>System for managing, equipping, and using items</em></p>

<h3>Weapon Properties</h3>
<table>
  <tr><th>Property</th><th>Description</th></tr>
  <tr><td>Ammunition</td><td>Can attack only if you have ammunition</td></tr>
  <tr><td>Finesse</td><td>Use STR or DEX for attack/damage</td></tr>
  <tr><td>Heavy</td><td>Small creatures have Disadvantage</td></tr>
  <tr><td>Light</td><td>Suitable for two-weapon fighting</td></tr>
  <tr><td>Loading</td><td>Fire only one piece of ammunition per action</td></tr>
  <tr><td>Range</td><td>Normal/long range in feet</td></tr>
  <tr><td>Reach</td><td>Adds 5 feet to reach</td></tr>
  <tr><td>Thrown</td><td>Can be thrown for ranged attack</td></tr>
  <tr><td>Two-Handed</td><td>Requires two hands to use</td></tr>
  <tr><td>Versatile</td><td>Can use with one or two hands (different damage)</td></tr>
</table>

<h3>Weapon Mastery</h3>
<table>
  <tr><th>Mastery</th><th>Benefit</th></tr>
  <tr><td>Cleave</td><td>Hit another creature within 5 ft on hit</td></tr>
  <tr><td>Graze</td><td>Deal damage equal to ability modifier on miss</td></tr>
  <tr><td>Nick</td><td>Make extra attack as part of Attack action</td></tr>
  <tr><td>Push</td><td>Push target 10 feet away on hit</td></tr>
  <tr><td>Sap</td><td>Give target Disadvantage on next attack</td></tr>
  <tr><td>Slow</td><td>Reduce target's Speed by 10 feet</td></tr>
  <tr><td>Topple</td><td>Knock target Prone on failed save</td></tr>
  <tr><td>Vex</td><td>Gain Advantage on next attack vs target</td></tr>
</table>

<h3>Armor Class</h3>
<p><strong>Unarmored:</strong> 10 + DEX</p>
<p><strong>Light:</strong> Armor AC + DEX</p>
<p><strong>Medium:</strong> Armor AC + DEX (max +2)</p>
<p><strong>Heavy:</strong> Armor AC only</p>
<p><strong>Shield:</strong> +2 AC</p>

<h3>Attunement</h3>
<ul>
  <li>Maximum 3 attuned items</li>
  <li>Requires Short Rest to attune</li>
  <li>Item must be within 100 feet</li>
</ul>

<h3>Carrying Capacity</h3>
<p><strong>Capacity:</strong> STR × 15 pounds</p>
<p><strong>Encumbered:</strong> Weight > 5 × STR (Speed -10)</p>
<p><strong>Heavily Encumbered:</strong> Weight > 10 × STR (Speed -20, Disadvantage)</p>`
        }
      }
    ],
    flags: {
      'foundry-core-srd-5e': {
        type: 'system',
        systemId: 'srd-equipment',
        srd52: true
      }
    }
  });

  // Magic System
  entries.push({
    name: 'Magic & Spellcasting',
    type: 'base',
    img: 'modules/foundry-core-srd-5e/assets/systems/magic.svg',
    pages: [
      {
        name: 'Magic & Spellcasting',
        type: 'text',
        title: { show: true, level: 1 },
        text: {
          format: 1,
          content: `<h2>Magic & Spellcasting</h2>

<p><em>Complete system for casting and managing spells</em></p>

<h3>Spell Levels</h3>
<p>Every spell has a level from 0 to 9:</p>
<ul>
  <li><strong>Cantrips (Level 0):</strong> Can be cast at will, no spell slot required</li>
  <li><strong>Levels 1-9:</strong> Require expending a spell slot of the spell's level or higher</li>
</ul>

<h3>Spell Schools</h3>
<table>
  <tr><th>School</th><th>Focus</th></tr>
  <tr><td>Abjuration</td><td>Protective magic, wards, barriers</td></tr>
  <tr><td>Conjuration</td><td>Summoning creatures and objects</td></tr>
  <tr><td>Divination</td><td>Revealing information, scrying</td></tr>
  <tr><td>Enchantment</td><td>Influencing minds and emotions</td></tr>
  <tr><td>Evocation</td><td>Elemental energy, damage</td></tr>
  <tr><td>Illusion</td><td>Deception, false images</td></tr>
  <tr><td>Necromancy</td><td>Life, death, undead</td></tr>
  <tr><td>Transmutation</td><td>Altering physical properties</td></tr>
</table>

<h3>Spell Components</h3>
<p><strong>V (Verbal):</strong> Spoken incantation required</p>
<p><strong>S (Somatic):</strong> Hand gestures required (need one free hand)</p>
<p><strong>M (Material):</strong> Physical components required. Listed materials can be replaced by a spellcasting focus unless they have a cost or are consumed.</p>

<h3>Casting a Spell</h3>
<ol>
  <li><strong>Choose spell</strong> from your prepared/known spells</li>
  <li><strong>Expend spell slot</strong> of appropriate level (or higher for upcasting)</li>
  <li><strong>Declare target(s)</strong> within range</li>
  <li><strong>Provide components</strong> (V, S, M as needed)</li>
  <li><strong>Resolve effects</strong> (saving throws, attack rolls, damage)</li>
</ol>

<h3>Spell Slots</h3>
<p>Spell slots represent your magical energy. Each slot has a level (1-9):</p>
<ul>
  <li>Casting a spell expends a slot of that spell's level or higher</li>
  <li>Regain all expended slots on a Long Rest</li>
  <li>Some classes regain slots on Short Rest</li>
</ul>

<h3>Upcasting</h3>
<p>Casting a spell using a higher-level slot often increases its power (see spell's "Using a Higher-Level Spell Slot" section).</p>

<h3>Spell Attack Rolls</h3>
<p><strong>Formula:</strong> 1d20 + spellcasting ability modifier + proficiency bonus</p>
<p>Compare to target's AC. Critical hits apply (natural 20).</p>

<h3>Spell Save DC</h3>
<p><strong>Formula:</strong> 8 + spellcasting ability modifier + proficiency bonus</p>
<p>Targets make saving throws against this DC.</p>

<h3>Spellcasting Ability</h3>
<table>
  <tr><th>Class</th><th>Ability</th></tr>
  <tr><td>Bard, Paladin, Sorcerer, Warlock</td><td>Charisma</td></tr>
  <tr><td>Cleric, Druid, Ranger</td><td>Wisdom</td></tr>
  <tr><td>Wizard</td><td>Intelligence</td></tr>
</table>

<h3>Concentration</h3>
<p>Some spells require concentration (see Concentration system):</p>
<ul>
  <li>Can only concentrate on one spell at a time</li>
  <li>Lasts up to spell's duration</li>
  <li>Ends if you cast another concentration spell</li>
  <li>Must make Constitution save if damaged (DC 10 or half damage)</li>
</ul>

<h3>Ritual Casting</h3>
<p>Spells with the "ritual" tag can be cast as rituals:</p>
<ul>
  <li>Takes 10 minutes longer to cast</li>
  <li>Doesn't expend a spell slot</li>
  <li>Must be prepared/known (class-dependent)</li>
</ul>

<h3>Spell Preparation</h3>
<p><strong>Prepared Casters</strong> (Cleric, Druid, Paladin, Wizard):</p>
<ul>
  <li>After Long Rest, choose spells from class list</li>
  <li>Number = spellcasting ability modifier + class level (minimum 1)</li>
  <li>Can only cast prepared spells</li>
</ul>

<p><strong>Known Casters</strong> (Bard, Ranger, Sorcerer, Warlock):</p>
<ul>
  <li>Learn limited number of spells (see class table)</li>
  <li>Can cast any known spell (no daily preparation)</li>
  <li>Can swap one spell per level up</li>
</ul>

<h3>Cantrips</h3>
<ul>
  <li>Level 0 spells</li>
  <li>Can be cast at will, unlimited times</li>
  <li>Don't require spell slots</li>
  <li>Scale in power at character levels 5, 11, and 17</li>
</ul>`
        }
      }
    ],
    flags: {
      'foundry-core-srd-5e': {
        type: 'system',
        systemId: 'srd-magic',
        srd52: true
      }
    }
  });

  // Combat Actions System
  entries.push({
    name: 'Combat Actions',
    type: 'base',
    img: 'modules/foundry-core-srd-5e/assets/systems/combat-actions.svg',
    pages: [
      {
        name: 'Combat Actions',
        type: 'text',
        title: { show: true, level: 1 },
        text: {
          format: 1,
          content: `<h2>Combat Actions</h2>

<p><em>Core actions available during your turn in combat</em></p>

<h3>Actions in Combat</h3>
<p>On your turn, you can move a distance up to your Speed and take one action. You can also take one Bonus Action and one Reaction per round.</p>

<h3>Main Actions</h3>

<h4>Attack</h4>
<p>Make one attack roll with a weapon or an Unarmed Strike. You can equip or unequip one weapon before or after the attack.</p>
<ul>
  <li><strong>Moving Between Attacks:</strong> If you have Extra Attack, you can move between attacks</li>
</ul>

<h4>Dash</h4>
<p>Gain extra movement equal to your Speed (after modifiers). You can choose which speed to use if you have multiple speeds (Fly, Swim, etc.).</p>

<h4>Disengage</h4>
<p>Your movement doesn't provoke Opportunity Attacks for the rest of your turn.</p>

<h4>Dodge</h4>
<p>Until the start of your next turn:</p>
<ul>
  <li>Attack rolls against you have Disadvantage (if you can see attacker)</li>
  <li>You make Dexterity saving throws with Advantage</li>
  <li>You lose these benefits if Incapacitated or Speed is 0</li>
</ul>

<h4>Help</h4>
<p>Aid an ally with a task, giving them Advantage on their next ability check, or assist in attacking a creature within 5 feet of you, giving an ally Advantage on their next attack against that creature.</p>

<h4>Hide</h4>
<p>Make a Dexterity (Stealth) check to hide. You can't hide from a creature that can see you clearly.</p>

<h4>Ready</h4>
<p>Prepare an action to take as a Reaction in response to a specified trigger. You decide on the trigger and the action when you Ready.</p>

<h4>Search</h4>
<p>Make a Wisdom (Perception) check or Intelligence (Investigation) check to find something.</p>

<h4>Utilize</h4>
<p>Use an object, such as a potion, magic item, or piece of adventuring gear. Some objects require an action to use.</p>

<h3>Bonus Actions</h3>
<p>Various class features, spells, and abilities grant the ability to take a Bonus Action. You can take only one Bonus Action per turn.</p>

<h4>Two-Weapon Fighting</h4>
<p>When you take the Attack action and attack with a Light weapon in one hand, you can make one Bonus Action attack with a different Light weapon in your other hand.</p>

<h3>Reactions</h3>
<p>You can take one Reaction per round. Common reactions include:</p>

<h4>Opportunity Attack</h4>
<p>When a creature you can see moves out of your reach, you can use your Reaction to make one melee attack against that creature. The attack occurs before the creature leaves your reach.</p>

<h3>Other Activities</h3>
<ul>
  <li><strong>Interact with Object:</strong> Once per turn as part of movement or action (open door, draw weapon, etc.)</li>
  <li><strong>Don or Doff Shield:</strong> Requires an action</li>
  <li><strong>End Concentration:</strong> No action required</li>
  <li><strong>Escape a Grapple:</strong> Make an ability check as an action</li>
</ul>`
        }
      }
    ],
    flags: {
      'foundry-core-srd-5e': {
        type: 'system',
        systemId: 'srd-combat-actions',
        srd52: true
      }
    }
  });

  // Skills System
  entries.push({
    name: 'Skills & Ability Checks',
    type: 'base',
    img: 'modules/foundry-core-srd-5e/assets/systems/skills.svg',
    pages: [
      {
        name: 'Skills & Ability Checks',
        type: 'text',
        title: { show: true, level: 1 },
        text: {
          format: 1,
          content: `<h2>Skills & Ability Checks</h2>

<p><em>Using your abilities to accomplish tasks</em></p>

<h3>Ability Checks</h3>
<p>Roll 1d20 + ability modifier + proficiency bonus (if proficient)</p>
<p><strong>DC (Difficulty Class):</strong> Typical DCs:</p>
<ul>
  <li><strong>Very Easy:</strong> DC 5</li>
  <li><strong>Easy:</strong> DC 10</li>
  <li><strong>Medium:</strong> DC 15</li>
  <li><strong>Hard:</strong> DC 20</li>
  <li><strong>Very Hard:</strong> DC 25</li>
  <li><strong>Nearly Impossible:</strong> DC 30</li>
</ul>

<h3>The 18 Core Skills</h3>

<h4>Strength Skills</h4>
<ul>
  <li><strong>Athletics:</strong> Climbing, jumping, swimming, grappling</li>
</ul>

<h4>Dexterity Skills</h4>
<ul>
  <li><strong>Acrobatics:</strong> Balance, tumbling, aerial maneuvers</li>
  <li><strong>Sleight of Hand:</strong> Pickpocketing, concealing objects, tricks</li>
  <li><strong>Stealth:</strong> Hiding, moving silently</li>
</ul>

<h4>Intelligence Skills</h4>
<ul>
  <li><strong>Arcana:</strong> Knowledge of magic, spells, magical items</li>
  <li><strong>History:</strong> Knowledge of historical events, legends</li>
  <li><strong>Investigation:</strong> Finding clues, deducing information</li>
  <li><strong>Nature:</strong> Knowledge of terrain, plants, animals, weather</li>
  <li><strong>Religion:</strong> Knowledge of deities, rituals, religious symbols</li>
</ul>

<h4>Wisdom Skills</h4>
<ul>
  <li><strong>Animal Handling:</strong> Calming, training, understanding animals</li>
  <li><strong>Insight:</strong> Reading emotions, detecting lies, predicting behavior</li>
  <li><strong>Medicine:</strong> Diagnosing illness, stabilizing dying creatures</li>
  <li><strong>Perception:</strong> Spotting, hearing, detecting things</li>
  <li><strong>Survival:</strong> Tracking, foraging, navigating wilderness</li>
</ul>

<h4>Charisma Skills</h4>
<ul>
  <li><strong>Deception:</strong> Lying convincingly, disguising intent</li>
  <li><strong>Intimidation:</strong> Influencing through threats or hostile actions</li>
  <li><strong>Performance:</strong> Entertaining through music, dance, acting</li>
  <li><strong>Persuasion:</strong> Influencing through tact, respect, good nature</li>
</ul>

<h3>Saving Throws</h3>
<p>Roll 1d20 + ability modifier + proficiency bonus (if proficient in that save)</p>
<p>Made to resist spells, traps, poisons, diseases, and other threats.</p>

<h4>The Six Saving Throws</h4>
<ul>
  <li><strong>Strength:</strong> Resisting being moved or physically forced</li>
  <li><strong>Dexterity:</strong> Dodging out of harm's way</li>
  <li><strong>Constitution:</strong> Enduring poison, disease, death</li>
  <li><strong>Intelligence:</strong> Resisting mental effects that confuse logic</li>
  <li><strong>Wisdom:</strong> Resisting effects that deceive senses</li>
  <li><strong>Charisma:</strong> Asserting your identity against magical transformation</li>
</ul>

<h3>Passive Checks</h3>
<p><strong>Formula:</strong> 10 + all modifiers that apply to the check</p>
<p>Used when the DM wants to determine if characters succeed without rolling (especially Perception and Insight).</p>`
        }
      }
    ],
    flags: {
      'foundry-core-srd-5e': {
        type: 'system',
        systemId: 'srd-skills',
        srd52: true
      }
    }
  });

  // Senses System
  entries.push({
    name: 'Senses & Vision',
    type: 'base',
    img: 'modules/foundry-core-srd-5e/assets/systems/senses.svg',
    pages: [
      {
        name: 'Senses & Vision',
        type: 'text',
        title: { show: true, level: 1 },
        text: {
          format: 1,
          content: `<h2>Senses & Vision</h2>

<p><em>Perception abilities beyond normal human senses</em></p>

<h3>Standard Vision</h3>
<p>Most creatures can see in bright light and dim light within a normal range.</p>

<h3>Special Senses</h3>

<h4>Blindsight</h4>
<p>Perceive your surroundings without relying on sight, within a specific radius. Creatures with Blindsight can perceive their environment even in darkness or when blinded.</p>
<ul>
  <li>Detects creatures that are invisible or hidden</li>
  <li>Not fooled by illusions</li>
  <li>Range typically 10-60 feet</li>
</ul>

<h4>Darkvision</h4>
<p>See in darkness (both magical and nonmagical) as if it were dim light, within a specific radius (usually 60 feet).</p>
<ul>
  <li>You can see in dim light as if it were bright light</li>
  <li>You can see in darkness as if it were dim light</li>
  <li>Can't discern color in darkness, only shades of gray</li>
  <li>Range typically 60 or 120 feet</li>
</ul>

<h4>Tremorsense</h4>
<p>Detect and pinpoint the origin of vibrations within a specific radius, provided you and the source are in contact with the same ground or substance.</p>
<ul>
  <li>Perceive creatures touching the ground</li>
  <li>Can detect burrowing creatures</li>
  <li>Doesn't work through the air</li>
  <li>Range typically 10-60 feet</li>
</ul>

<h4>Truesight</h4>
<p>The ultimate form of perception within a specific radius:</p>
<ul>
  <li>See in normal and magical darkness</li>
  <li>See invisible creatures and objects</li>
  <li>Automatically detect visual illusions and succeed on saves against them</li>
  <li>Perceive the original form of shapechangers and creatures transformed by magic</li>
  <li>See into the Ethereal Plane</li>
  <li>Range typically 10-120 feet</li>
</ul>

<h3>Light and Visibility</h3>

<h4>Bright Light</h4>
<p>Normal vision. Most creatures can see normally.</p>

<h4>Dim Light (Lightly Obscured)</h4>
<p>Creates a lightly obscured area:</p>
<ul>
  <li>Disadvantage on Perception checks that rely on sight</li>
  <li>Examples: patchy fog, moderate foliage</li>
</ul>

<h4>Darkness (Heavily Obscured)</h4>
<p>Creates a heavily obscured area:</p>
<ul>
  <li>Blocks vision entirely</li>
  <li>Creatures are effectively Blinded when trying to see through it</li>
  <li>Examples: complete darkness, opaque fog, dense foliage</li>
</ul>`
        }
      }
    ],
    flags: {
      'foundry-core-srd-5e': {
        type: 'system',
        systemId: 'srd-senses',
        srd52: true
      }
    }
  });

  // Languages System
  entries.push({
    name: 'Languages',
    type: 'base',
    img: 'modules/foundry-core-srd-5e/assets/systems/languages.svg',
    pages: [
      {
        name: 'Languages',
        type: 'text',
        title: { show: true, level: 1 },
        text: {
          format: 1,
          content: `<h2>Languages</h2>

<p><em>Communication systems in the D&D multiverse</em></p>

<h3>Standard Languages</h3>
<p>Commonly spoken across civilized lands:</p>

<table>
  <tr><th>Language</th><th>Typical Speakers</th><th>Script</th></tr>
  <tr><td>Common</td><td>Humans, most civilized peoples</td><td>Common</td></tr>
  <tr><td>Common Sign Language</td><td>Anyone (signed)</td><td>—</td></tr>
  <tr><td>Dwarvish</td><td>Dwarves</td><td>Dwarvish</td></tr>
  <tr><td>Elvish</td><td>Elves</td><td>Elvish</td></tr>
  <tr><td>Giant</td><td>Giants, ogres</td><td>Dwarvish</td></tr>
  <tr><td>Gnomish</td><td>Gnomes</td><td>Dwarvish</td></tr>
  <tr><td>Goblin</td><td>Goblinoids</td><td>Dwarvish</td></tr>
  <tr><td>Halfling</td><td>Halflings</td><td>Common</td></tr>
  <tr><td>Orc</td><td>Orcs</td><td>Dwarvish</td></tr>
</table>

<h3>Exotic Languages</h3>
<p>Rare languages from other planes or specific contexts:</p>

<table>
  <tr><th>Language</th><th>Typical Speakers</th><th>Script</th></tr>
  <tr><td>Abyssal</td><td>Demons</td><td>Infernal</td></tr>
  <tr><td>Celestial</td><td>Celestials</td><td>Celestial</td></tr>
  <tr><td>Deep Speech</td><td>Aberrations, mind flayers</td><td>—</td></tr>
  <tr><td>Draconic</td><td>Dragons, dragonborn</td><td>Draconic</td></tr>
  <tr><td>Infernal</td><td>Devils</td><td>Infernal</td></tr>
  <tr><td>Primordial</td><td>Elementals</td><td>Dwarvish</td></tr>
  <tr><td>Sylvan</td><td>Fey creatures</td><td>Elvish</td></tr>
  <tr><td>Undercommon</td><td>Underdark traders</td><td>Elvish</td></tr>
</table>

<h3>Secret Languages</h3>

<h4>Druidic</h4>
<p>Known only to druids. Druids are forbidden from teaching it to non-druids. Contains hidden messages in natural settings.</p>

<h4>Thieves' Cant</h4>
<p>A secret mix of dialect, jargon, and code used by rogues and criminals. Allows you to hide messages in seemingly normal conversation. Others must succeed on a Wisdom (Insight) check (DC equal to your Charisma (Deception) check) to understand.</p>

<h3>Learning Languages</h3>
<p>You can learn a new language by spending downtime studying under a tutor or through self-study (typically 250 days of training).</p>`
        }
      }
    ],
    flags: {
      'foundry-core-srd-5e': {
        type: 'system',
        systemId: 'srd-languages',
        srd52: true
      }
    }
  });

  // Movement System
  entries.push({
    name: 'Movement & Travel',
    type: 'base',
    img: 'modules/foundry-core-srd-5e/assets/systems/movement.svg',
    pages: [
      {
        name: 'Movement & Travel',
        type: 'text',
        title: { show: true, level: 1 },
        text: {
          format: 1,
          content: `<h2>Movement & Travel</h2>

<p><em>Rules for moving and traveling in D&D</em></p>

<h3>Speed</h3>
<p>Every creature has a Speed, which is the distance in feet you can walk in 1 round (6 seconds). Your Speed can be modified by:</p>
<ul>
  <li>Armor (heavy armor may reduce Speed)</li>
  <li>Terrain (difficult terrain costs extra movement)</li>
  <li>Conditions (Grappled, Prone, etc.)</li>
  <li>Spells and magic items</li>
</ul>

<h3>Types of Movement</h3>

<h4>Walk Speed</h4>
<p>Your basic Speed. Standard for most humanoids is 30 feet.</p>

<h4>Climb Speed</h4>
<p>Allows you to climb without extra movement cost. Without a Climb Speed, climbing costs 2 feet of movement per 1 foot climbed.</p>

<h4>Swim Speed</h4>
<p>Allows you to swim without extra movement cost. Without a Swim Speed, swimming costs 2 feet of movement per 1 foot swam.</p>

<h4>Fly Speed</h4>
<p>Allows you to fly. If you have a Fly Speed and are knocked Prone, you fall unless you can hover.</p>

<h4>Burrow Speed</h4>
<p>Allows you to burrow through sand, earth, mud, or ice, leaving no tunnel behind unless specified.</p>

<h3>Moving in Combat</h3>
<ul>
  <li>On your turn, you can move up to your Speed</li>
  <li>You can split your movement before, during, and after actions</li>
  <li>Moving through a hostile creature's space requires Athletics or Acrobatics check</li>
  <li>Moving out of an enemy's reach provokes Opportunity Attacks (unless you Disengage)</li>
</ul>

<h3>Difficult Terrain</h3>
<p>Every 1 foot of movement in difficult terrain costs 2 feet of Speed.</p>
<p><strong>Examples:</strong> Rubble, undergrowth, steep stairs, snow, shallow bogs</p>

<h3>Being Prone</h3>
<ul>
  <li><strong>Standing up:</strong> Costs half your Speed (minimum 5 feet)</li>
  <li><strong>Crawling:</strong> Every foot of movement costs 1 extra foot (total 2 feet per foot)</li>
  <li><strong>In combat:</strong> Attack rolls against you have Advantage; your attacks have Disadvantage</li>
</ul>

<h3>Jumping</h3>

<h4>Long Jump</h4>
<ul>
  <li><strong>With 10-foot running start:</strong> Jump a number of feet up to your Strength score</li>
  <li><strong>From standing:</strong> Jump half that distance</li>
  <li>Each foot you jump costs 1 foot of movement</li>
</ul>

<h4>High Jump</h4>
<ul>
  <li><strong>With 10-foot running start:</strong> Jump 3 + Strength modifier feet high</li>
  <li><strong>From standing:</strong> Jump half that distance</li>
  <li>Can reach above jump height by half your height</li>
</ul>

<h3>Travel Pace</h3>
<p>For long-distance travel:</p>

<table>
  <tr><th>Pace</th><th>Minute</th><th>Hour</th><th>Day</th><th>Effect</th></tr>
  <tr><td>Fast</td><td>400 ft</td><td>4 miles</td><td>30 miles</td><td>-5 to passive Perception</td></tr>
  <tr><td>Normal</td><td>300 ft</td><td>3 miles</td><td>24 miles</td><td>—</td></tr>
  <tr><td>Slow</td><td>200 ft</td><td>2 miles</td><td>18 miles</td><td>Can use Stealth</td></tr>
</table>

<p><strong>Forced March:</strong> After 8 hours of travel, make DC 10 + 1 per hour beyond 8 Constitution save or gain 1 Exhaustion.</p>

<h3>Mounts and Vehicles</h3>
<ul>
  <li><strong>Controlled Mount:</strong> Acts on your turn, can only Dash, Disengage, or Dodge</li>
  <li><strong>Independent Mount:</strong> Acts on its own turn, retains all actions</li>
  <li><strong>Mounted Combat:</strong> Special rules for attacks and damage</li>
</ul>`
        }
      }
    ],
    flags: {
      'foundry-core-srd-5e': {
        type: 'system',
        systemId: 'srd-movement',
        srd52: true
      }
    }
  });

  // Exploration Activities System
  entries.push({
    name: 'Exploration Activities',
    type: 'base',
    img: 'modules/foundry-core-srd-5e/assets/systems/exploration.svg',
    pages: [
      {
        name: 'Exploration Activities',
        type: 'text',
        title: { show: true, level: 1 },
        text: {
          format: 1,
          content: `<h2>Exploration Activities</h2>

<p><em>Activities while exploring dungeons, wilderness, and settlements</em></p>

<h3>Common Exploration Activities</h3>
<p>While traveling or exploring, characters can perform various activities. The party can have different members doing different activities.</p>

<h4>Drawing a Map</h4>
<p>Make an Intelligence (Investigation) or Wisdom (Survival) check to create an accurate map of the area.</p>
<ul>
  <li>Provides bonuses for future navigation</li>
  <li>Can be shared with other parties</li>
  <li>Requires cartographer's tools for best results</li>
</ul>

<h4>Foraging</h4>
<p>Make a Wisdom (Survival) check to find food and water:</p>
<ul>
  <li><strong>DC 10:</strong> Find enough food and water for one person</li>
  <li><strong>DC 15:</strong> Find enough for 2-5 people</li>
  <li><strong>DC 20:</strong> Find enough for 6+ people</li>
  <li>Abundant areas: Advantage on check</li>
  <li>Barren areas: Disadvantage on check</li>
</ul>

<h4>Navigating</h4>
<p>Make a Wisdom (Survival) check to avoid getting lost:</p>
<ul>
  <li>Required in wilderness without clear paths</li>
  <li>DC varies by terrain and weather</li>
  <li>One check per day of travel</li>
  <li>Maps and navigation tools provide Advantage</li>
</ul>

<h4>Tracking</h4>
<p>Make a Wisdom (Survival) check to follow tracks:</p>
<ul>
  <li>DC based on how long ago tracks were made</li>
  <li>Fresh tracks (1 hour): DC 10</li>
  <li>Recent tracks (1 day): DC 15</li>
  <li>Old tracks (1 week): DC 20</li>
  <li>Rain or heavy traffic: Increase DC by 5</li>
</ul>

<h4>Keeping Watch</h4>
<p>Make a Wisdom (Perception) check to notice threats:</p>
<ul>
  <li>Passive Perception for routine watch</li>
  <li>Active check if specifically searching</li>
  <li>Disadvantage if distracted or doing another activity</li>
</ul>

<h4>Sneaking</h4>
<p>Group Dexterity (Stealth) check to move quietly:</p>
<ul>
  <li>All party members make checks</li>
  <li>Success if more than half succeed</li>
  <li>Slow travel pace required</li>
  <li>Heavy armor imposes Disadvantage</li>
</ul>

<h3>Splitting the Party</h3>
<p>Party members can split up to perform different activities:</p>
<ul>
  <li>One character navigates</li>
  <li>One or two keep watch (front/rear)</li>
  <li>One draws a map</li>
  <li>Others forage or track</li>
</ul>

<h3>Vision and Light</h3>
<p>Exploration is affected by lighting conditions:</p>
<ul>
  <li><strong>Bright Light:</strong> Normal Perception</li>
  <li><strong>Dim Light:</strong> Disadvantage on Perception (sight)</li>
  <li><strong>Darkness:</strong> Blinded (unless special vision)</li>
  <li><strong>Light sources:</strong> Torches (20 ft bright, 20 ft dim), lanterns (30/30 ft), candles (5 ft bright)</li>
</ul>

<h3>Resting During Exploration</h3>
<ul>
  <li><strong>Short Rest:</strong> 1 hour of rest, can spend Hit Dice</li>
  <li><strong>Long Rest:</strong> 8 hours, regain HP and spell slots</li>
  <li>Interruptions can prevent rest benefits</li>
</ul>`
        }
      }
    ],
    flags: {
      'foundry-core-srd-5e': {
        type: 'system',
        systemId: 'srd-exploration',
        srd52: true
      }
    }
  });

  // Environmental Effects & Hazards System
  entries.push({
    name: 'Environmental Effects & Hazards',
    type: 'base',
    img: 'modules/foundry-core-srd-5e/assets/systems/environment.svg',
    pages: [
      {
        name: 'Environmental Effects & Hazards',
        type: 'text',
        title: { show: true, level: 1 },
        text: {
          format: 1,
          content: `<h2>Environmental Effects & Hazards</h2>

<p><em>Natural and supernatural dangers in the world</em></p>

<h3>Temperature Extremes</h3>

<h4>Extreme Cold</h4>
<p>When temperature drops below 0° Fahrenheit:</p>
<ul>
  <li>Every hour: DC 10 Constitution save</li>
  <li><strong>Failure:</strong> Gain 1 Exhaustion level</li>
  <li>Cold resistance or protective gear grants Advantage</li>
</ul>

<h4>Extreme Heat</h4>
<p>When temperature exceeds 100° Fahrenheit:</p>
<ul>
  <li>Every hour without water: DC 5 Constitution save (DC increases by 1 each hour)</li>
  <li><strong>Failure:</strong> Gain 1 Exhaustion level</li>
  <li>Protective clothing or heat resistance grants Advantage</li>
</ul>

<h3>Wilderness Hazards</h3>

<h4>Falling</h4>
<ul>
  <li>Take 1d6 bludgeoning damage per 10 feet fallen</li>
  <li>Maximum 20d6 damage (200 feet)</li>
  <li>Land Prone unless you avoid damage</li>
  <li>Falling onto a creature: Both make DC 15 Dexterity save</li>
</ul>

<h4>Suffocation</h4>
<ul>
  <li>Can hold breath for 1 + Constitution modifier minutes (minimum 30 seconds)</li>
  <li>When out of breath: Survive number of rounds equal to Constitution modifier (minimum 1)</li>
  <li>After that: Drop to 0 HP and dying</li>
</ul>

<h4>Drowning</h4>
<ul>
  <li>Same rules as suffocation</li>
  <li>Swimming in rough water may require Athletics checks</li>
  <li>Exhaustion makes swimming difficult</li>
</ul>

<h4>Starvation & Dehydration</h4>
<p><strong>Food:</strong></p>
<ul>
  <li>Need 1 pound of food per day</li>
  <li>Can go without food for 3 + Constitution modifier days (minimum 1)</li>
  <li>After that: Gain 1 Exhaustion per day</li>
</ul>

<p><strong>Water:</strong></p>
<ul>
  <li>Need 1 gallon of water per day (2 gallons in hot weather)</li>
  <li>Half ration counts as half a day without water</li>
  <li>After 1 day without water: Gain 1 Exhaustion</li>
  <li>Exhaustion from dehydration can't be removed until you drink sufficient water</li>
</ul>

<h3>Weather Effects</h3>

<h4>Heavy Precipitation</h4>
<p>Rain or snow:</p>
<ul>
  <li>Lightly obscures area (Disadvantage on Perception)</li>
  <li>Disadvantage on Wisdom (Perception) checks that rely on hearing</li>
  <li>Extinguishes open flames</li>
</ul>

<h4>Strong Wind</h4>
<ul>
  <li>Disadvantage on ranged weapon attacks</li>
  <li>Disadvantage on Perception checks that rely on hearing</li>
  <li>Extinguishes open flames</li>
  <li>Flying creatures must land or fall</li>
  <li>Disperses fog and mist</li>
</ul>

<h4>Fog</h4>
<ul>
  <li>Heavily obscures area</li>
  <li>Creatures are effectively Blinded</li>
  <li>Disadvantage on Perception checks</li>
</ul>

<h3>Dangerous Terrain</h3>

<h4>Difficult Terrain</h4>
<p>Costs 2 feet of movement per 1 foot traveled:</p>
<ul>
  <li>Rubble and undergrowth</li>
  <li>Steep stairs</li>
  <li>Snow and ice</li>
  <li>Shallow bogs</li>
</ul>

<h4>Slippery Ice</h4>
<ul>
  <li>Difficult terrain</li>
  <li>Dexterity (Acrobatics) DC 10 check to avoid falling Prone</li>
  <li>When running or charging: DC 10 Dexterity save or fall Prone</li>
</ul>

<h4>Thin Ice</h4>
<ul>
  <li>Weight of 300+ pounds breaks the ice</li>
  <li>Creature falls through and is submerged</li>
  <li>Must escape using Athletics (Swimming) or break through from below</li>
</ul>

<h4>Quicksand</h4>
<ul>
  <li>Deep quicksand: 1d6 × 5 feet deep</li>
  <li>Creature that enters sinks 1d4 + 1 feet</li>
  <li>Athletics or Acrobatics check to escape (DC 10 + feet sunk)</li>
  <li>Sinking continues each round without successful check</li>
</ul>

<h3>Fire</h3>
<ul>
  <li>Catching fire: Take 1d10 fire damage</li>
  <li>Each round: DC 10 Dexterity save or take 1d10 fire damage</li>
  <li>Can use action to put out fire on self or adjacent creature</li>
</ul>

<h3>Poison and Disease</h3>
<ul>
  <li>Constitution saving throw to resist</li>
  <li>Effects vary by poison/disease type</li>
  <li>Some require multiple saves over time</li>
  <li>Lesser Restoration can cure some diseases</li>
</ul>`
        }
      }
    ],
    flags: {
      'foundry-core-srd-5e': {
        type: 'system',
        systemId: 'srd-environment',
        srd52: true
      }
    }
  });

  // Social Interaction System
  entries.push({
    name: 'Social Interaction',
    type: 'base',
    img: 'modules/foundry-core-srd-5e/assets/systems/social.svg',
    pages: [
      {
        name: 'Social Interaction',
        type: 'text',
        title: { show: true, level: 1 },
        text: {
          format: 1,
          content: `<h2>Social Interaction</h2>

<p><em>Rules for interacting with NPCs and resolving social encounters</em></p>

<h3>NPC Attitudes</h3>
<p>NPCs have attitudes toward characters that affect interactions:</p>

<table>
  <tr><th>Attitude</th><th>Description</th></tr>
  <tr><td>Friendly</td><td>Helpful and willing to assist</td></tr>
  <tr><td>Indifferent</td><td>Neutral, requires persuasion</td></tr>
  <tr><td>Hostile</td><td>Unfriendly, may become violent</td></tr>
</table>

<h3>Social Interaction Skills</h3>

<h4>Persuasion</h4>
<p>Influence others through tact, respect, and good nature:</p>
<ul>
  <li>Convincing someone to help you</li>
  <li>Negotiating a deal</li>
  <li>Inspiring a crowd</li>
  <li>DC based on NPC attitude and request reasonableness</li>
</ul>

<h4>Deception</h4>
<p>Hide the truth through misdirection or lies:</p>
<ul>
  <li>Telling a convincing lie</li>
  <li>Disguising your intentions</li>
  <li>Bluffing in a game</li>
  <li>Contested by Insight check</li>
</ul>

<h4>Intimidation</h4>
<p>Influence through threats or hostile actions:</p>
<ul>
  <li>Extracting information through threats</li>
  <li>Forcing cooperation</li>
  <li>Bullying someone into compliance</li>
  <li>Can create lasting resentment</li>
</ul>

<h4>Insight</h4>
<p>Determine true intentions of a creature:</p>
<ul>
  <li>Detecting lies</li>
  <li>Reading body language</li>
  <li>Predicting someone's next move</li>
  <li>Contested against Deception check</li>
</ul>

<h3>Influence Rules</h3>

<h4>Changing Attitude</h4>
<p>Successful social checks can shift NPC attitude:</p>
<ul>
  <li><strong>Friendly to Indifferent:</strong> Major offense or betrayal</li>
  <li><strong>Indifferent to Friendly:</strong> DC 15 Persuasion + significant favor or gift</li>
  <li><strong>Hostile to Indifferent:</strong> DC 20 Persuasion + major concession</li>
  <li><strong>Indifferent to Hostile:</strong> Significant insult or threat</li>
</ul>

<h4>Roleplaying Influence</h4>
<ul>
  <li>Good roleplaying can grant Advantage on checks</li>
  <li>Poor approach can impose Disadvantage</li>
  <li>Some NPCs respond better to specific approaches</li>
  <li>Offering bribes or favors can adjust DC</li>
</ul>

<h3>Requests and Favors</h3>
<p>DC for persuading an NPC depends on the request:</p>
<ul>
  <li><strong>Trivial favor:</strong> DC 0-5</li>
  <li><strong>Simple request:</strong> DC 10</li>
  <li><strong>Significant favor:</strong> DC 15</li>
  <li><strong>Dangerous or costly:</strong> DC 20</li>
  <li><strong>Against character:</strong> DC 25+</li>
</ul>

<h3>Information Gathering</h3>
<ul>
  <li><strong>Common knowledge:</strong> No check required</li>
  <li><strong>Uncommon information:</strong> DC 10 Persuasion or Investigation</li>
  <li><strong>Rare secrets:</strong> DC 15-20, may require multiple checks or sources</li>
  <li><strong>Forbidden knowledge:</strong> DC 25+, NPCs may be unwilling</li>
</ul>`
        }
      }
    ],
    flags: {
      'foundry-core-srd-5e': {
        type: 'system',
        systemId: 'srd-social',
        srd52: true
      }
    }
  });

  // Combat System
  entries.push({
    name: 'Combat',
    type: 'base',
    img: 'modules/foundry-core-srd-5e/assets/systems/combat.svg',
    pages: [
      {
        name: 'Combat',
        type: 'text',
        title: { show: true, level: 1 },
        text: {
          format: 1,
          content: `<h2>Combat</h2>

<p><em>Turn-based tactical combat system</em></p>

<h3>Combat Structure</h3>

<h4>Initiative</h4>
<p>Determines turn order in combat:</p>
<ul>
  <li>Roll 1d20 + Dexterity modifier</li>
  <li>Order from highest to lowest</li>
  <li>Ties: Higher Dexterity wins, then coin flip</li>
  <li>Initiative order stays same for entire combat</li>
</ul>

<h4>Rounds and Turns</h4>
<ul>
  <li><strong>Round:</strong> 6 seconds of game time</li>
  <li><strong>Turn:</strong> Each creature gets one turn per round</li>
  <li>On your turn: Move + Action + Bonus Action (if available)</li>
  <li>Between turns: Can use Reaction</li>
</ul>

<h3>Your Turn</h3>
<p>On your turn, you can:</p>
<ul>
  <li><strong>Move</strong> up to your Speed</li>
  <li><strong>Take one Action</strong> (Attack, Dash, Disengage, Dodge, Help, Hide, Ready, Search, Utilize, Magic)</li>
  <li><strong>Take one Bonus Action</strong> (if you have an ability that grants it)</li>
  <li><strong>Interact with one object</strong> for free (draw weapon, open door, etc.)</li>
  <li><strong>Communicate</strong> briefly</li>
</ul>

<h3>Movement in Combat</h3>
<ul>
  <li>Can split movement before, during, and after actions</li>
  <li>Moving through hostile creature space requires check</li>
  <li>Moving out of reach provokes Opportunity Attack</li>
  <li>Difficult terrain costs extra movement</li>
  <li>Standing from Prone costs half your Speed</li>
</ul>

<h3>Attacks</h3>

<h4>Attack Rolls</h4>
<p><strong>Formula:</strong> 1d20 + ability modifier + proficiency bonus (if proficient)</p>
<ul>
  <li>Compare to target's AC</li>
  <li>Equal or higher = hit</li>
  <li>Natural 20 = Critical Hit (double damage dice)</li>
  <li>Natural 1 = automatic miss</li>
</ul>

<h4>Melee Attacks</h4>
<ul>
  <li>Range: 5 feet (or weapon's Reach)</li>
  <li>Use Strength (or Dexterity for Finesse weapons)</li>
  <li>Disadvantage if enemy within 5 feet of you uses ranged weapon</li>
</ul>

<h4>Ranged Attacks</h4>
<ul>
  <li>Range: Normal/Long (e.g., 80/320 ft)</li>
  <li>Use Dexterity (or Strength for thrown weapons)</li>
  <li>Disadvantage at long range</li>
  <li>Disadvantage if enemy within 5 feet</li>
</ul>

<h4>Spell Attacks</h4>
<ul>
  <li><strong>Melee Spell Attack:</strong> 1d20 + spellcasting modifier + proficiency</li>
  <li><strong>Ranged Spell Attack:</strong> Same, but ranged</li>
  <li>Spell Save DC: 8 + spellcasting modifier + proficiency</li>
</ul>

<h3>Damage</h3>
<ul>
  <li>Roll damage dice when you hit</li>
  <li>Add ability modifier to damage (usually same as attack)</li>
  <li>Critical hits: Roll damage dice twice</li>
  <li>Resistance: Take half damage</li>
  <li>Vulnerability: Take double damage</li>
  <li>Immunity: Take no damage</li>
</ul>

<h3>Cover</h3>
<table>
  <tr><th>Cover Type</th><th>AC Bonus</th><th>DEX Save Bonus</th></tr>
  <tr><td>Half Cover</td><td>+2</td><td>+2</td></tr>
  <tr><td>Three-Quarters Cover</td><td>+5</td><td>+5</td></tr>
  <tr><td>Total Cover</td><td>Can't be targeted</td><td>Can't be targeted</td></tr>
</table>

<h3>Conditions in Combat</h3>
<p>Common combat conditions:</p>
<ul>
  <li><strong>Prone:</strong> Disadvantage on attacks; melee attacks against you have Advantage</li>
  <li><strong>Grappled:</strong> Speed = 0</li>
  <li><strong>Restrained:</strong> Speed = 0, attacks have Disadvantage, attacks against you have Advantage</li>
  <li><strong>Invisible:</strong> Attack rolls have Advantage, attacks against you have Disadvantage</li>
  <li><strong>Blinded:</strong> Can't see, fail sight checks, attacks have Disadvantage, attacks against you have Advantage</li>
</ul>

<h3>Ending Combat</h3>
<p>Combat ends when:</p>
<ul>
  <li>All enemies defeated, dead, or fled</li>
  <li>Party surrenders or flees</li>
  <li>Peaceful resolution reached</li>
</ul>`
        }
      }
    ],
    flags: {
      'foundry-core-srd-5e': {
        type: 'system',
        systemId: 'srd-combat',
        srd52: true
      }
    }
  });

  // Damage & Healing System
  entries.push({
    name: 'Damage & Healing',
    type: 'base',
    img: 'modules/foundry-core-srd-5e/assets/systems/damage-healing.svg',
    pages: [
      {
        name: 'Damage & Healing',
        type: 'text',
        title: { show: true, level: 1 },
        text: {
          format: 1,
          content: `<h2>Damage & Healing</h2>

<p><em>Rules for taking and recovering from damage</em></p>

<h3>Hit Points</h3>
<ul>
  <li>Represent your ability to avoid or withstand injury</li>
  <li>Current HP can't exceed HP maximum</li>
  <li>Dropping to 0 HP makes you Unconscious and Dying</li>
  <li>HP can be negative (used for massive damage)</li>
</ul>

<h3>Damage Types</h3>
<p>13 types of damage with different sources:</p>

<h4>Physical Damage</h4>
<ul>
  <li><strong>Bludgeoning:</strong> Blunt force (hammers, falling)</li>
  <li><strong>Piercing:</strong> Puncturing (arrows, fangs)</li>
  <li><strong>Slashing:</strong> Cutting (swords, claws)</li>
</ul>

<h4>Elemental Damage</h4>
<ul>
  <li><strong>Acid:</strong> Corrosive substances</li>
  <li><strong>Cold:</strong> Freezing effects</li>
  <li><strong>Fire:</strong> Flames and heat</li>
  <li><strong>Lightning:</strong> Electrical energy</li>
  <li><strong>Thunder:</strong> Concussive sound</li>
</ul>

<h4>Magical Damage</h4>
<ul>
  <li><strong>Force:</strong> Pure magical energy</li>
  <li><strong>Necrotic:</strong> Life-draining energy</li>
  <li><strong>Poison:</strong> Toxic substances</li>
  <li><strong>Psychic:</strong> Mental attacks</li>
  <li><strong>Radiant:</strong> Holy or searing light</li>
</ul>

<h3>Damage Resistance, Vulnerability, and Immunity</h3>
<ul>
  <li><strong>Resistance:</strong> Take half damage (round down)</li>
  <li><strong>Vulnerability:</strong> Take double damage</li>
  <li><strong>Immunity:</strong> Take no damage</li>
  <li>Multiple resistances don't stack</li>
  <li>Resistance and vulnerability cancel out</li>
</ul>

<h3>Critical Hits</h3>
<ul>
  <li>Natural 20 on attack roll</li>
  <li>Roll all damage dice twice, then add modifiers</li>
  <li>Example: Critical with 1d8+3 → Roll 2d8+3</li>
</ul>

<h3>Healing</h3>

<h4>Regaining Hit Points</h4>
<ul>
  <li>Healing can't raise HP above maximum</li>
  <li>Creature at 0 HP regains consciousness when healed to 1+ HP</li>
  <li>Temporary HP doesn't count as healing</li>
</ul>

<h4>Sources of Healing</h4>
<ul>
  <li><strong>Spells:</strong> Cure Wounds, Healing Word, etc.</li>
  <li><strong>Potions:</strong> Potion of Healing (2d4+2 HP)</li>
  <li><strong>Rest:</strong> Short Rest (spend Hit Dice), Long Rest (recover all HP)</li>
  <li><strong>Class Features:</strong> Paladin's Lay on Hands, Cleric's Channel Divinity</li>
</ul>

<h4>Hit Dice</h4>
<ul>
  <li>Each class has a Hit Die type (d6, d8, d10, or d12)</li>
  <li>During Short Rest: Spend Hit Dice to regain HP</li>
  <li>Roll the die + Constitution modifier</li>
  <li>Regain spent Hit Dice on Long Rest (half your maximum, minimum 1)</li>
</ul>

<h3>Temporary Hit Points</h3>
<ul>
  <li>Buffer against damage that's lost first</li>
  <li>Can exceed HP maximum</li>
  <li>Don't stack (take the higher value)</li>
  <li>Lost when you take a Long Rest</li>
  <li>Can't be healed or regained</li>
</ul>

<h3>Dropping to 0 Hit Points</h3>

<h4>Instant Death</h4>
<p>Massive damage can kill you instantly:</p>
<ul>
  <li>Damage reduces you to 0 HP</li>
  <li>Remaining damage equals or exceeds your HP maximum</li>
  <li>Example: Max HP 12, take 24 damage → Instant death</li>
</ul>

<h4>Death Saving Throws</h4>
<p>When at 0 HP and not dead:</p>
<ul>
  <li>Roll 1d20 at start of your turn (no modifiers)</li>
  <li><strong>10+:</strong> Success (need 3 to stabilize)</li>
  <li><strong>9 or lower:</strong> Failure (3 failures = death)</li>
  <li><strong>Natural 20:</strong> Regain 1 HP</li>
  <li><strong>Natural 1:</strong> Counts as 2 failures</li>
</ul>

<h4>Stabilizing</h4>
<p>A creature at 0 HP can be stabilized:</p>
<ul>
  <li><strong>3 successful death saves:</strong> Stabilize but remain Unconscious at 0 HP</li>
  <li><strong>DC 10 Medicine check:</strong> Action to stabilize a creature</li>
  <li><strong>Any healing:</strong> Regains consciousness</li>
  <li>After 1d4 hours: Regain 1 HP naturally</li>
</ul>

<h4>Damage at 0 HP</h4>
<ul>
  <li><strong>Any damage:</strong> One failed death save</li>
  <li><strong>Critical hit:</strong> Two failed death saves</li>
  <li><strong>Massive damage:</strong> Instant death if remaining damage ≥ HP max</li>
</ul>

<h3>Nonlethal Damage</h3>
<ul>
  <li>Declare melee attack as nonlethal before rolling</li>
  <li>When reduced to 0 HP: Knocked Unconscious, not dying</li>
  <li>Stabilizes automatically</li>
  <li>Regains consciousness after 1d4 hours or when healed</li>
</ul>`
        }
      }
    ],
    flags: {
      'foundry-core-srd-5e': {
        type: 'system',
        systemId: 'srd-damage-healing',
        srd52: true
      }
    }
  });

  // Subclassing System
  entries.push({
    name: 'Subclassing & Multiclassing',
    type: 'base',
    img: 'modules/foundry-core-srd-5e/assets/systems/subclassing.svg',
    pages: [
      {
        name: 'Subclassing & Multiclassing',
        type: 'text',
        title: { show: true, level: 1 },
        text: {
          format: 1,
          content: `<h2>Subclassing & Multiclassing</h2>

<p><em>Character specialization and class combination systems</em></p>

<h3>Subclasses</h3>
<p>Every class has subclasses—specialized paths that define how you approach your class's core themes.</p>

<h4>Gaining a Subclass</h4>
<ul>
  <li>Choose a subclass at <strong>3rd level</strong> (or 1st level for Clerics and Sorcerers)</li>
  <li>Once chosen, you typically cannot change your subclass</li>
  <li>Gain subclass features at specific levels (varies by class)</li>
</ul>

<h4>Subclass Progression</h4>
<table>
  <tr><th>Class</th><th>Subclass Level</th><th>Feature Levels</th></tr>
  <tr><td>Cleric, Sorcerer</td><td>1</td><td>1, 6, 17</td></tr>
  <tr><td>Druid, Wizard</td><td>2</td><td>2, 6, 10, 14</td></tr>
  <tr><td>Most Others</td><td>3</td><td>3, 7, 10, 15, 18</td></tr>
</table>

<h3>Multiclassing</h3>
<p>Instead of gaining levels in a single class, you can take levels in multiple classes.</p>

<h4>Prerequisites</h4>
<p>To multiclass into or out of a class, you must have at least 13 in the class's primary ability:</p>
<table>
  <tr><th>Class</th><th>Ability Requirement</th></tr>
  <tr><td>Barbarian</td><td>Strength 13</td></tr>
  <tr><td>Bard</td><td>Charisma 13</td></tr>
  <tr><td>Cleric</td><td>Wisdom 13</td></tr>
  <tr><td>Druid</td><td>Wisdom 13</td></tr>
  <tr><td>Fighter</td><td>Strength 13 or Dexterity 13</td></tr>
  <tr><td>Monk</td><td>Dexterity 13 and Wisdom 13</td></tr>
  <tr><td>Paladin</td><td>Strength 13 and Charisma 13</td></tr>
  <tr><td>Ranger</td><td>Dexterity 13 and Wisdom 13</td></tr>
  <tr><td>Rogue</td><td>Dexterity 13</td></tr>
  <tr><td>Sorcerer</td><td>Charisma 13</td></tr>
  <tr><td>Warlock</td><td>Charisma 13</td></tr>
  <tr><td>Wizard</td><td>Intelligence 13</td></tr>
</table>

<h4>Experience Points</h4>
<ul>
  <li>Your <strong>character level</strong> is the total of all class levels</li>
  <li>XP requirements are based on character level, not individual class levels</li>
</ul>

<h4>Hit Points and Hit Dice</h4>
<ul>
  <li>Add together Hit Dice from all classes</li>
  <li>Hit points when gaining a level: Roll or take average of new class's Hit Die + CON</li>
</ul>

<h4>Proficiency Bonus</h4>
<ul>
  <li>Based on total character level (not individual class levels)</li>
  <li>You don't gain all proficiencies from multiclassing—see Multiclassing Proficiencies table</li>
</ul>

<h4>Proficiencies Gained</h4>
<p>When multiclassing, you gain only some of a class's starting proficiencies:</p>
<table>
  <tr><th>Class</th><th>Proficiencies Gained</th></tr>
  <tr><td>Barbarian</td><td>Shields, simple weapons, martial weapons</td></tr>
  <tr><td>Bard</td><td>Light armor, one skill, one musical instrument</td></tr>
  <tr><td>Cleric</td><td>Light armor, medium armor, shields</td></tr>
  <tr><td>Druid</td><td>Light armor, medium armor, shields</td></tr>
  <tr><td>Fighter</td><td>Light armor, medium armor, shields, simple weapons, martial weapons</td></tr>
  <tr><td>Monk</td><td>Simple weapons, shortswords</td></tr>
  <tr><td>Paladin</td><td>Light armor, medium armor, shields, simple weapons, martial weapons</td></tr>
  <tr><td>Ranger</td><td>Light armor, medium armor, shields, simple weapons, martial weapons, one skill</td></tr>
  <tr><td>Rogue</td><td>Light armor, one skill, thieves' tools</td></tr>
  <tr><td>Sorcerer</td><td>None</td></tr>
  <tr><td>Warlock</td><td>Light armor, simple weapons</td></tr>
  <tr><td>Wizard</td><td>None</td></tr>
</table>

<h4>Class Features</h4>
<ul>
  <li>You gain class features from all your classes</li>
  <li><strong>Channel Divinity:</strong> If multiclassing with Cleric/Paladin, uses combine</li>
  <li><strong>Extra Attack:</strong> Does not stack; having it from multiple classes doesn't give additional attacks</li>
  <li><strong>Unarmored Defense:</strong> Choose which version to use if you have multiple</li>
</ul>

<h4>Spellcasting (Multiclass)</h4>
<p><strong>Spell Slots:</strong> Combine levels from all spellcasting classes:</p>
<ul>
  <li><strong>Full casters</strong> (Bard, Cleric, Druid, Sorcerer, Wizard): Count full class level</li>
  <li><strong>Half casters</strong> (Paladin, Ranger): Count half class level (rounded down)</li>
  <li><strong>Third casters</strong> (Eldritch Knight, Arcane Trickster): Count one-third class level (rounded down)</li>
  <li><strong>Warlock:</strong> Uses Pact Magic separately; doesn't combine with other spellcasting</li>
</ul>

<p><strong>Spells Known and Prepared:</strong></p>
<ul>
  <li>Determined individually for each class</li>
  <li>Can cast any spell you know/prepare using any available spell slot of appropriate level</li>
</ul>

<h3>Important Notes</h3>
<ul>
  <li>Multiclassing is an <strong>optional rule</strong>—check with your DM</li>
  <li>Can be complex; understand each class's features before multiclassing</li>
  <li>May delay or prevent access to high-level class features</li>
</ul>`
        }
      }
    ],
    flags: {
      'foundry-core-srd-5e': {
        type: 'system',
        systemId: 'srd-subclassing',
        srd52: true
      }
    }
  });

  // Object Type Taxonomy - Categorization of game elements
  entries.push({
    name: 'Object Type Taxonomy',
    type: 'base',
    img: 'modules/foundry-core-srd-5e/assets/systems/object-taxonomy.svg',
    pages: [
      {
        name: 'Object Type Taxonomy',
        type: 'text',
        title: { show: true, level: 1 },
        text: {
          format: 1,
          content: `<h2>Object Type Taxonomy</h2>

<p><em>Categorization of all game elements by their representational forms</em></p>

<p>Every element in D&D can be represented as one or more object types. This taxonomy defines how game elements map to physical and digital representations.</p>

<h3>Sheets (Character Records)</h3>
<p>Persistent records that track attributes, resources, and state:</p>

<table>
  <tr><th>Sheet Type</th><th>Examples</th><th>SRD Count</th></tr>
  <tr><td>Character Sheets</td><td>Player characters with abilities, HP, inventory</td><td>—</td></tr>
  <tr><td>Creature Sheets</td><td>Monster stat blocks, NPCs</td><td>Monsters compendium</td></tr>
  <tr><td>Spell Sheets</td><td>Spell descriptions with components, duration</td><td>322 spells</td></tr>
  <tr><td>Item Sheets</td><td>Equipment with properties, weight, cost</td><td>550 items</td></tr>
  <tr><td>Class Sheets</td><td>Class features, progression tables</td><td>12 classes</td></tr>
  <tr><td>Species Sheets</td><td>Racial traits, abilities</td><td>6 species</td></tr>
</table>

<h3>Dice (Random Number Generation)</h3>
<p>Mechanisms for generating randomness and uncertainty:</p>

<table>
  <tr><th>Dice Type</th><th>Usage</th><th>Systems</th></tr>
  <tr><td>d4</td><td>Weapon damage, spell damage</td><td>Daggers, Magic Missile</td></tr>
  <tr><td>d6</td><td>Common damage die, Hit Dice</td><td>Shortswords, Rogues, Falling</td></tr>
  <tr><td>d8</td><td>Medium weapon damage, Hit Dice</td><td>Longswords, Clerics</td></tr>
  <tr><td>d10</td><td>Heavy weapon damage, Hit Dice</td><td>Glaives, Fighters</td></tr>
  <tr><td>d12</td><td>Great weapon damage, Hit Dice</td><td>Greataxe, Barbarians</td></tr>
  <tr><td>d20</td><td>All ability checks, saves, attacks</td><td>D20 Tests system</td></tr>
  <tr><td>d100</td><td>Percentile rolls, random tables</td><td>Wild Magic, Treasure</td></tr>
  <tr><td>Hit Dice</td><td>Recovery during Short Rest</td><td>1d6 to 1d12 based on class</td></tr>
</table>

<h3>Cards (Individual Game Elements)</h3>
<p>Discrete elements that can be drawn, revealed, or played:</p>

<table>
  <tr><th>Card Type</th><th>Examples</th><th>SRD Count</th></tr>
  <tr><td>Spell Cards</td><td>Individual spell descriptions for quick reference</td><td>322 spells</td></tr>
  <tr><td>Item Cards</td><td>Magic items, equipment</td><td>550 items</td></tr>
  <tr><td>Condition Cards</td><td>Status effects (Blinded, Charmed, etc.)</td><td>15 conditions</td></tr>
  <tr><td>Feature Cards</td><td>Class features, racial traits</td><td>Varies by class</td></tr>
  <tr><td>Magic Deck Cards</td><td>Deck of Illusions (34 cards), Deck of Many Things (22 cards)</td><td>2 decks</td></tr>
  <tr><td>Initiative Cards</td><td>Combat turn order tracking</td><td>Combat system</td></tr>
</table>

<h3>Hands (Collections Held by Players)</h3>
<p>Private collections of cards or elements controlled by a player:</p>

<table>
  <tr><th>Hand Type</th><th>Contains</th><th>System</th></tr>
  <tr><td>Prepared Spells</td><td>Spells a caster has prepared for the day</td><td>Spellcasting system</td></tr>
  <tr><td>Known Spells</td><td>Spells a caster knows (Bard, Sorcerer, Warlock)</td><td>Spellcasting system</td></tr>
  <tr><td>Drawn Cards</td><td>Cards drawn from Deck of Many Things</td><td>Magic items</td></tr>
  <tr><td>Active Features</td><td>Currently usable class/racial features</td><td>Varies by class</td></tr>
</table>

<h3>Decks (Ordered Collections)</h3>
<p>Organized collections that can be shuffled, drawn from, or searched:</p>

<table>
  <tr><th>Deck Type</th><th>Examples</th><th>SRD Count</th></tr>
  <tr><td>Magic Item Decks</td><td>Deck of Illusions, Deck of Many Things</td><td>2 decks</td></tr>
  <tr><td>Spell Deck</td><td>All spells available to a class</td><td>Varies by class</td></tr>
  <tr><td>Treasure Deck</td><td>Random loot generation</td><td>Items compendium</td></tr>
  <tr><td>Encounter Deck</td><td>Random monsters or events</td><td>DM tools</td></tr>
  <tr><td>Condition Deck</td><td>All possible status effects</td><td>15 conditions</td></tr>
</table>

<h3>Boards (Spatial Representations)</h3>
<p>Two-dimensional spaces for positioning and movement:</p>

<table>
  <tr><th>Board Type</th><th>Purpose</th><th>System</th></tr>
  <tr><td>Battle Map</td><td>Grid for tactical combat (5-foot squares)</td><td>Combat, Movement</td></tr>
  <tr><td>Dungeon Map</td><td>Exploration tracking, room layouts</td><td>Exploration</td></tr>
  <tr><td>World Map</td><td>Overland travel, navigation</td><td>Travel Mode</td></tr>
  <tr><td>Initiative Tracker</td><td>Turn order visualization</td><td>Combat system</td></tr>
</table>

<h3>Creatures (Living Entities)</h3>
<p>Autonomous or controlled entities with stats and actions:</p>

<table>
  <tr><th>Creature Type</th><th>Examples</th><th>SRD</th></tr>
  <tr><td>Player Characters</td><td>Adventurers controlled by players</td><td>6 species, 12 classes</td></tr>
  <tr><td>Monsters</td><td>Hostile, neutral, or friendly NPCs</td><td>Monsters compendium</td></tr>
  <tr><td>NPCs</td><td>Non-player characters with stat blocks</td><td>Monsters compendium</td></tr>
  <tr><td>Summons</td><td>Creatures summoned by spells (Find Familiar, Conjure Animals)</td><td>Spells & Monsters</td></tr>
  <tr><td>Companions</td><td>Animal companions, familiars, steeds</td><td>Monsters, Mounts</td></tr>
  <tr><td>Illusions</td><td>Illusory creatures (Deck of Illusions)</td><td>Spells, Magic items</td></tr>
</table>

<h3>Objects (Physical Items)</h3>
<p>Tangible items that can be carried, used, or interacted with:</p>

<table>
  <tr><th>Object Category</th><th>Types</th><th>Examples</th></tr>
  <tr><td>Weapons</td><td>Melee (M), Ranged (R)</td><td>Dagger, Longsword, Longbow (550 items)</td></tr>
  <tr><td>Armor</td><td>Light (LA), Medium (MA), Heavy (HA), Shields (S)</td><td>Leather, Chain Mail, Plate (550 items)</td></tr>
  <tr><td>Tools</td><td>Artisan Tools (AT), Gaming Sets (GS), Kits (T)</td><td>Thieves' Tools, Dice Set (550 items)</td></tr>
  <tr><td>Adventuring Gear</td><td>General (G)</td><td>Rope, Torch, Backpack (550 items)</td></tr>
  <tr><td>Magic Items</td><td>Wands (WD), Rings (RG), Rods (RD), Wondrous</td><td>Wand of Magic Missiles (550 items)</td></tr>
  <tr><td>Consumables</td><td>Potions (P), Scrolls (SC), Food (FD)</td><td>Potion of Healing (550 items)</td></tr>
  <tr><td>Spellcasting Foci</td><td>Arcane (SCF), Divine symbols</td><td>Amulet, Crystal, Wand (550 items)</td></tr>
  <tr><td>Trade Goods</td><td>Materials (TG)</td><td>Canvas, Iron (550 items)</td></tr>
  <tr><td>Vehicles</td><td>Mounts (MNT), Ships (SHP), Land (VEH)</td><td>Horse, Galley, Wagon (550 items)</td></tr>
  <tr><td>Tack & Harness</td><td>Saddles, Barding (TAH)</td><td>Riding Saddle, Exotic Saddle (550 items)</td></tr>
</table>

<h3>Locations (Environmental Contexts)</h3>
<p>Settings and environments where gameplay occurs:</p>

<table>
  <tr><th>Location Type</th><th>Purpose</th><th>Systems</th></tr>
  <tr><td>Dungeons</td><td>Enclosed exploration environments</td><td>Exploration Mode</td></tr>
  <tr><td>Wilderness</td><td>Outdoor exploration and travel</td><td>Travel Mode, Environmental Effects</td></tr>
  <tr><td>Settlements</td><td>Towns, cities for social interaction</td><td>Interaction Mode</td></tr>
  <tr><td>Combat Arenas</td><td>Battlefields, encounter areas</td><td>Combat Mode</td></tr>
  <tr><td>Planes of Existence</td><td>Other dimensions, magical realms</td><td>Spells, Monsters</td></tr>
  <tr><td>Special Locations</td><td>Rooms with hazards, traps, effects</td><td>Environmental Effects, Traps</td></tr>
</table>

<h3>Cross-Reference: Object Types by System</h3>

<h4>Combat System Uses:</h4>
<ul>
  <li><strong>Sheets:</strong> Creature stats, HP tracking</li>
  <li><strong>Dice:</strong> d20 for attacks, damage dice</li>
  <li><strong>Cards:</strong> Initiative cards, condition cards</li>
  <li><strong>Boards:</strong> Battle map with grid</li>
  <li><strong>Creatures:</strong> Player characters, monsters</li>
  <li><strong>Objects:</strong> Weapons, armor, magic items</li>
  <li><strong>Locations:</strong> Combat arena, terrain features</li>
</ul>

<h4>Spellcasting System Uses:</h4>
<ul>
  <li><strong>Sheets:</strong> Spell descriptions, spell slots</li>
  <li><strong>Dice:</strong> Spell attack rolls, spell damage</li>
  <li><strong>Cards:</strong> Individual spell cards</li>
  <li><strong>Hands:</strong> Prepared spells, known spells</li>
  <li><strong>Decks:</strong> Class spell list</li>
  <li><strong>Objects:</strong> Spellcasting foci, material components</li>
</ul>

<h4>Exploration System Uses:</h4>
<ul>
  <li><strong>Dice:</strong> Perception checks, Investigation checks</li>
  <li><strong>Boards:</strong> Dungeon map, tracking explored areas</li>
  <li><strong>Creatures:</strong> Party members, encountered monsters</li>
  <li><strong>Objects:</strong> Adventuring gear, tools</li>
  <li><strong>Locations:</strong> Rooms, corridors, chambers</li>
</ul>

<h3>Implementation Notes</h3>

<p>In digital implementations (like Foundry VTT):</p>
<ul>
  <li><strong>Sheets</strong> → Document types (Actor, Item, JournalEntry)</li>
  <li><strong>Dice</strong> → Roll formulas and dice roller UI</li>
  <li><strong>Cards</strong> → Foundry Cards system or Item documents</li>
  <li><strong>Hands</strong> → Player-owned card collections</li>
  <li><strong>Decks</strong> → Card stacks, compendium packs</li>
  <li><strong>Boards</strong> → Scene with grid, fog of war</li>
  <li><strong>Creatures</strong> → Actor documents with tokens</li>
  <li><strong>Objects</strong> → Item documents</li>
  <li><strong>Locations</strong> → Scene documents, JournalEntry locations</li>
</ul>

<p>The core concepts (dice, cards, etc.) are applied through relational properties in rules and systems, allowing flexible representation across physical and digital play.</p>`
        }
      }
    ],
    flags: {
      'foundry-core-srd-5e': {
        type: 'system',
        systemId: 'srd-object-taxonomy',
        srd52: true
      }
    }
  });

  // Game Modes - Collections of systems for different play styles

  // Interaction Mode
  entries.push({
    name: 'Interaction Mode',
    type: 'base',
    img: 'modules/foundry-core-srd-5e/assets/modes/interaction.svg',
    pages: [
      {
        name: 'Interaction Mode',
        type: 'text',
        title: { show: true, level: 1 },
        text: {
          format: 1,
          content: `<h2>Interaction Mode</h2>

<p><em>Systems and mechanics for roleplaying and social encounters</em></p>

<p>When your game focuses on conversations, negotiations, gathering information, or building relationships with NPCs, you're in <strong>Interaction Mode</strong>. This mode encompasses all social aspects of D&D.</p>

<h3>Core Systems for Interaction</h3>

<h4>Social Interaction</h4>
<p>The primary system for this mode:</p>
<ul>
  <li><strong>NPC Attitudes:</strong> Hostile, Unfriendly, Indifferent, Friendly, Helpful</li>
  <li><strong>Social Skills:</strong> Persuasion, Deception, Intimidation, Insight</li>
  <li><strong>Influence:</strong> Changing NPC attitudes and gathering information</li>
  <li><strong>Conversation Structure:</strong> Turn-based or free-form social encounters</li>
</ul>

<h4>Languages</h4>
<p>Communication and understanding:</p>
<ul>
  <li><strong>Common Languages:</strong> Common, Dwarvish, Elvish, Giant, etc.</li>
  <li><strong>Exotic Languages:</strong> Abyssal, Celestial, Draconic, Infernal</li>
  <li><strong>Secret Languages:</strong> Druidic, Thieves' Cant</li>
</ul>

<h4>Skills & Ability Checks</h4>
<p>Relevant social skills:</p>
<ul>
  <li><strong>Charisma Skills:</strong> Persuasion, Deception, Intimidation, Performance</li>
  <li><strong>Wisdom Skills:</strong> Insight, Animal Handling</li>
  <li><strong>Intelligence Skills:</strong> History, Religion (for cultural knowledge)</li>
</ul>

<h3>Typical Interaction Scenarios</h3>
<ul>
  <li><strong>Negotiation:</strong> Bargaining for better prices, making deals</li>
  <li><strong>Persuasion:</strong> Convincing NPCs to help, change their mind, or reveal information</li>
  <li><strong>Deception:</strong> Lying, disguising intentions, bluffing</li>
  <li><strong>Intimidation:</strong> Threatening, coercing, or frightening NPCs</li>
  <li><strong>Insight:</strong> Reading intentions, detecting lies, understanding motivations</li>
  <li><strong>Gathering Information:</strong> Asking questions, investigating rumors</li>
  <li><strong>Building Relationships:</strong> Making allies, gaining trust, forming bonds</li>
</ul>

<h3>Transitioning Out of Interaction Mode</h3>
<p>Interaction mode typically transitions to:</p>
<ul>
  <li><strong>Combat Mode:</strong> When negotiations fail and initiative is rolled</li>
  <li><strong>Exploration Mode:</strong> When leaving a social scene to investigate or travel</li>
  <li><strong>Downtime Mode:</strong> When beginning long-term relationship building</li>
</ul>`
        }
      }
    ],
    flags: {
      'foundry-core-srd-5e': {
        type: 'game-mode',
        modeId: 'interaction',
        srd52: true,
        relatedSystems: ['social-interaction', 'languages', 'skills-ability-checks']
      }
    }
  });

  // Combat Mode
  entries.push({
    name: 'Combat Mode',
    type: 'base',
    img: 'modules/foundry-core-srd-5e/assets/modes/combat.svg',
    pages: [
      {
        name: 'Combat Mode',
        type: 'text',
        title: { show: true, level: 1 },
        text: {
          format: 1,
          content: `<h2>Combat Mode</h2>

<p><em>Systems and mechanics for tactical battles and skirmishes</em></p>

<p>When initiative is rolled and characters are fighting for their lives, you're in <strong>Combat Mode</strong>. This highly structured mode uses turns, rounds, and precise movement to resolve conflicts.</p>

<h3>Core Systems for Combat</h3>

<h4>Combat</h4>
<p>The primary system for this mode:</p>
<ul>
  <li><strong>Initiative:</strong> Determining turn order (DEX checks)</li>
  <li><strong>Rounds & Turns:</strong> Each round = 6 seconds, everyone gets one turn</li>
  <li><strong>Movement:</strong> Moving up to your Speed, difficult terrain</li>
  <li><strong>Attack Rolls:</strong> Melee, ranged, and spell attacks</li>
  <li><strong>Damage:</strong> Rolling damage dice and applying it to targets</li>
  <li><strong>Cover:</strong> Half cover (+2 AC/DEX), three-quarters cover (+5 AC/DEX)</li>
</ul>

<h4>Combat Actions</h4>
<p>What you can do on your turn:</p>
<ul>
  <li><strong>Attack:</strong> Make weapon or unarmed strike</li>
  <li><strong>Dash:</strong> Extra movement equal to your Speed</li>
  <li><strong>Disengage:</strong> Avoid opportunity attacks</li>
  <li><strong>Dodge:</strong> Impose disadvantage on attacks against you</li>
  <li><strong>Help:</strong> Give an ally advantage</li>
  <li><strong>Hide:</strong> Make a Stealth check</li>
  <li><strong>Ready:</strong> Prepare an action for a trigger</li>
</ul>

<h4>Damage & Healing</h4>
<p>Managing hit points:</p>
<ul>
  <li><strong>Damage Types:</strong> 13 types (slashing, fire, necrotic, etc.)</li>
  <li><strong>Resistance/Vulnerability/Immunity:</strong> Modifying damage taken</li>
  <li><strong>Critical Hits:</strong> Natural 20 = double damage dice</li>
  <li><strong>Healing:</strong> Spells, potions, Hit Dice during Short Rest</li>
  <li><strong>Death Saves:</strong> Three failures = death, three successes = stabilized</li>
</ul>

<h3>Combat Conditions</h3>
<p>Common status effects:</p>
<ul>
  <li><strong>Blinded, Deafened, Frightened:</strong> Sensory impairments</li>
  <li><strong>Grappled, Restrained, Paralyzed:</strong> Movement restrictions</li>
  <li><strong>Prone:</strong> Disadvantage on attacks, advantage for melee attackers</li>
  <li><strong>Stunned, Unconscious:</strong> Loss of actions</li>
</ul>

<h3>Transitioning Out of Combat Mode</h3>
<p>Combat mode typically transitions to:</p>
<ul>
  <li><strong>Exploration Mode:</strong> When combat ends and players investigate the area</li>
  <li><strong>Interaction Mode:</strong> When taking prisoners or negotiating surrender</li>
  <li><strong>Downtime Mode:</strong> When taking a Short Rest to heal and recover</li>
</ul>`
        }
      }
    ],
    flags: {
      'foundry-core-srd-5e': {
        type: 'game-mode',
        modeId: 'combat',
        srd52: true,
        relatedSystems: ['combat', 'combat-actions', 'damage-healing', 'movement-travel']
      }
    }
  });

  // Exploration Mode
  entries.push({
    name: 'Exploration Mode',
    type: 'base',
    img: 'modules/foundry-core-srd-5e/assets/modes/exploration.svg',
    pages: [
      {
        name: 'Exploration Mode',
        type: 'text',
        title: { show: true, level: 1 },
        text: {
          format: 1,
          content: `<h2>Exploration Mode</h2>

<p><em>Systems and mechanics for investigating, searching, and discovering</em></p>

<p>When characters are delving into dungeons, searching for clues, or investigating their surroundings, you're in <strong>Exploration Mode</strong>. Time is more flexible than combat but more structured than downtime.</p>

<h3>Core Systems for Exploration</h3>

<h4>Exploration Activities</h4>
<p>The primary system for this mode:</p>
<ul>
  <li><strong>Drawing Maps:</strong> Tracking your route through complex areas</li>
  <li><strong>Foraging:</strong> Finding food and water (Survival DC 15/20)</li>
  <li><strong>Navigating:</strong> Finding your way (Survival DC varies)</li>
  <li><strong>Tracking:</strong> Following creatures' trails (Survival DC 10-20)</li>
  <li><strong>Keeping Watch:</strong> Staying alert for danger (Perception)</li>
  <li><strong>Sneaking:</strong> Moving stealthily as a group (Stealth)</li>
</ul>

<h4>Skills & Ability Checks</h4>
<p>Heavily used during exploration:</p>
<ul>
  <li><strong>Perception:</strong> Noticing details, spotting hidden things</li>
  <li><strong>Investigation:</strong> Searching areas, finding clues</li>
  <li><strong>Survival:</strong> Tracking, foraging, navigating wilderness</li>
  <li><strong>Stealth:</strong> Sneaking past enemies or avoiding detection</li>
</ul>

<h4>Senses & Vision</h4>
<p>Perception and detection:</p>
<ul>
  <li><strong>Darkvision:</strong> See in darkness (60 ft. typically)</li>
  <li><strong>Blindsight:</strong> Perceive without sight</li>
  <li><strong>Tremorsense:</strong> Detect vibrations through ground</li>
  <li><strong>Truesight:</strong> See through illusions and invisibility</li>
</ul>

<h4>Environmental Effects & Hazards</h4>
<p>Dangers of exploration:</p>
<ul>
  <li><strong>Falling:</strong> 1d6 per 10 feet fallen</li>
  <li><strong>Suffocation:</strong> Minutes equal to 1 + CON mod (minimum 30 seconds)</li>
  <li><strong>Wilderness Hazards:</strong> Quicksand, razorvine, slippery ice</li>
  <li><strong>Temperature Extremes:</strong> Extreme cold/heat requires saves</li>
</ul>

<h3>Common Exploration Scenarios</h3>
<ul>
  <li><strong>Dungeon Delving:</strong> Searching rooms, avoiding traps, finding secret doors</li>
  <li><strong>Wilderness Tracking:</strong> Following monsters or quarry through forests</li>
  <li><strong>Urban Investigation:</strong> Gathering clues in a city</li>
  <li><strong>Stealth Missions:</strong> Infiltrating enemy strongholds</li>
</ul>

<h3>Transitioning Out of Exploration Mode</h3>
<p>Exploration mode typically transitions to:</p>
<ul>
  <li><strong>Combat Mode:</strong> When encountering hostile creatures</li>
  <li><strong>Interaction Mode:</strong> When meeting NPCs or discovering important story elements</li>
  <li><strong>Travel Mode:</strong> When leaving detailed exploration for overland journeys</li>
  <li><strong>Downtime Mode:</strong> When resting or spending extended time in one place</li>
</ul>`
        }
      }
    ],
    flags: {
      'foundry-core-srd-5e': {
        type: 'game-mode',
        modeId: 'exploration',
        srd52: true,
        relatedSystems: ['exploration-activities', 'skills-ability-checks', 'senses-vision', 'environmental-effects']
      }
    }
  });

  // Travel Mode
  entries.push({
    name: 'Travel Mode',
    type: 'base',
    img: 'modules/foundry-core-srd-5e/assets/modes/travel.svg',
    pages: [
      {
        name: 'Travel Mode',
        type: 'text',
        title: { show: true, level: 1 },
        text: {
          format: 1,
          content: `<h2>Travel Mode</h2>

<p><em>Systems and mechanics for journeys and overland movement</em></p>

<p>When the party is moving between locations over significant distances, you're in <strong>Travel Mode</strong>. This mode abstracts moment-to-moment details to focus on the journey as a whole.</p>

<h3>Core Systems for Travel</h3>

<h4>Movement & Travel</h4>
<p>The primary system for this mode:</p>
<ul>
  <li><strong>Travel Pace:</strong>
    <ul>
      <li>Fast (30 miles/day): -5 to passive Perception</li>
      <li>Normal (24 miles/day): Standard movement</li>
      <li>Slow (18 miles/day): Can use Stealth</li>
    </ul>
  </li>
  <li><strong>Mounts & Vehicles:</strong> Faster travel speeds</li>
  <li><strong>Forced March:</strong> Travel beyond 8 hours requires CON saves</li>
</ul>

<h4>Exploration Activities</h4>
<p>What you do while traveling:</p>
<ul>
  <li><strong>Navigating:</strong> Wilderness Survival check to avoid getting lost</li>
  <li><strong>Drawing Maps:</strong> Recording your route</li>
  <li><strong>Foraging:</strong> Finding food (1d6 + WIS pounds on DC 15)</li>
  <li><strong>Tracking:</strong> Following another group</li>
  <li><strong>Keeping Watch:</strong> Staying alert during travel</li>
</ul>

<h4>Environmental Effects & Hazards</h4>
<p>Challenges during travel:</p>
<ul>
  <li><strong>Extreme Heat:</strong> CON save (DC 5 +1/hour) or gain Exhaustion</li>
  <li><strong>Extreme Cold:</strong> DC 10 CON save per hour or gain Exhaustion</li>
  <li><strong>Storms:</strong> Difficult terrain, navigation challenges</li>
  <li><strong>Getting Lost:</strong> Navigation failures lead to wasted time</li>
</ul>

<h4>Exhaustion & Resting</h4>
<p>Recovery during journeys:</p>
<ul>
  <li><strong>Forced March:</strong> CON save (DC 10 +1/hour) or gain Exhaustion</li>
  <li><strong>Long Rest:</strong> 8-hour rest to regain HP and reduce Exhaustion</li>
  <li><strong>Short Rest:</strong> 1-hour break to spend Hit Dice</li>
</ul>

<h3>Travel Activities by Role</h3>
<ul>
  <li><strong>Navigator:</strong> Makes Survival checks to avoid getting lost</li>
  <li><strong>Scout:</strong> Moves ahead to spot danger</li>
  <li><strong>Forager:</strong> Gathers food and water for the party</li>
  <li><strong>Lookout:</strong> Watches for threats</li>
</ul>

<h3>Transitioning Out of Travel Mode</h3>
<p>Travel mode typically transitions to:</p>
<ul>
  <li><strong>Exploration Mode:</strong> When arriving at a destination to investigate</li>
  <li><strong>Combat Mode:</strong> When ambushed or encountering hostile creatures</li>
  <li><strong>Interaction Mode:</strong> When arriving at settlements or meeting travelers</li>
  <li><strong>Downtime Mode:</strong> When spending extended time at a destination</li>
</ul>`
        }
      }
    ],
    flags: {
      'foundry-core-srd-5e': {
        type: 'game-mode',
        modeId: 'travel',
        srd52: true,
        relatedSystems: ['movement-travel', 'exploration-activities', 'environmental-effects', 'exhaustion', 'resting']
      }
    }
  });

  // Downtime Mode
  entries.push({
    name: 'Downtime Mode',
    type: 'base',
    img: 'modules/foundry-core-srd-5e/assets/modes/downtime.svg',
    pages: [
      {
        name: 'Downtime Mode',
        type: 'text',
        title: { show: true, level: 1 },
        text: {
          format: 1,
          content: `<h2>Downtime Mode</h2>

<p><em>Systems and mechanics for rest, recovery, and long-term activities</em></p>

<p>When characters are spending days, weeks, or months between adventures, you're in <strong>Downtime Mode</strong>. This mode handles rest, recovery, training, crafting, and other activities that take significant time.</p>

<h3>Core Systems for Downtime</h3>

<h4>Resting</h4>
<p>The primary recovery system:</p>
<ul>
  <li><strong>Short Rest (1 hour):</strong>
    <ul>
      <li>Spend Hit Dice to regain HP</li>
      <li>Recover some class features</li>
    </ul>
  </li>
  <li><strong>Long Rest (8 hours):</strong>
    <ul>
      <li>Regain all lost HP</li>
      <li>Regain up to half your total Hit Dice</li>
      <li>Regain all spell slots</li>
      <li>Reduce Exhaustion by 1 level</li>
    </ul>
  </li>
</ul>

<h4>Exhaustion</h4>
<p>Recovering from fatigue:</p>
<ul>
  <li>Each Long Rest reduces Exhaustion by 1 level</li>
  <li>Comfortable rest and adequate food speeds recovery</li>
</ul>

<h4>Equipment & Items</h4>
<p>Crafting and shopping:</p>
<ul>
  <li><strong>Crafting Items:</strong> Progress at 5 gp value per day of work</li>
  <li><strong>Buying Equipment:</strong> Availability depends on settlement size</li>
  <li><strong>Selling Treasure:</strong> Typically 50% of item value</li>
</ul>

<h3>Downtime Activities</h3>

<h4>Crafting (Varies)</h4>
<ul>
  <li><strong>Progress:</strong> 5 gp per day of work</li>
  <li><strong>Requirements:</strong> Tools, materials (half item cost), workspace</li>
</ul>

<h4>Practicing a Profession (1+ days)</h4>
<ul>
  <li><strong>Ability Check:</strong> Related skill</li>
  <li><strong>Earnings:</strong> Based on check result</li>
</ul>

<h4>Recuperating (3+ days)</h4>
<ul>
  <li><strong>Benefit:</strong> Advantage on saves to recover from disease or poison</li>
</ul>

<h4>Researching (Varies)</h4>
<ul>
  <li><strong>Cost:</strong> 1 gp per day</li>
  <li><strong>Examples:</strong> Ancient history, monster lore, spell research</li>
</ul>

<h4>Training (250+ days)</h4>
<ul>
  <li><strong>Cost:</strong> 1 gp per day (teacher or materials)</li>
  <li><strong>Gain:</strong> One language or tool proficiency</li>
</ul>

<h3>Lifestyle Expenses</h3>
<table>
  <tr><th>Lifestyle</th><th>Cost/Day</th></tr>
  <tr><td>Squalid</td><td>1 sp</td></tr>
  <tr><td>Poor</td><td>2 sp</td></tr>
  <tr><td>Modest</td><td>1 gp</td></tr>
  <tr><td>Comfortable</td><td>2 gp</td></tr>
  <tr><td>Wealthy</td><td>4 gp</td></tr>
  <tr><td>Aristocratic</td><td>10+ gp</td></tr>
</table>

<h3>Transitioning Out of Downtime Mode</h3>
<p>Downtime mode typically transitions to:</p>
<ul>
  <li><strong>Interaction Mode:</strong> When meeting patrons or receiving new quests</li>
  <li><strong>Exploration Mode:</strong> When beginning a new adventure</li>
  <li><strong>Travel Mode:</strong> When leaving town for a distant location</li>
</ul>`
        }
      }
    ],
    flags: {
      'foundry-core-srd-5e': {
        type: 'game-mode',
        modeId: 'downtime',
        srd52: true,
        relatedSystems: ['resting', 'exhaustion', 'equipment-items', 'damage-healing']
      }
    }
  });
}

/**
 * Build Variant Rules
 */
async function buildVariantRules(entries) {
  const rulesFile = path.join(SRD_DATA_DIR, 'variantrules.json');
  const rulesData = JSON.parse(fs.readFileSync(rulesFile, 'utf8'));

  const importantRules = [
    'Advantage',
    'Disadvantage',
    'Cover',
    'Critical Hit',
    'Inspiration',
    'Long Rest',
    'Short Rest',
    'Surprised'
  ];

  const srdRules = rulesData.variantrule.filter(r =>
    r.srd52 === true && importantRules.includes(r.name)
  );

  console.log(`  Found ${srdRules.length} important variant rules`);

  for (const rule of srdRules) {
    const entry = {
      name: rule.name,
      type: 'base',
      img: `modules/foundry-core-srd-5e/assets/rules/${slugify(rule.name)}.svg`,
      pages: [
        {
          name: rule.name,
          type: 'text',
          title: { show: true, level: 1 },
          text: {
            format: 1,
            content: `<h2>${rule.name}</h2>\n\n<p><em>Source: ${rule.source}, page ${rule.page}</em></p>\n\n${cleanSRDText(extractEntryText(rule.entries))}`
          }
        }
      ],
      flags: {
        'foundry-core-srd-5e': {
          type: 'variant-rule',
          ruleType: rule.ruleType,
          srdSource: rule.source,
          srd52: true,
          page: rule.page,
          _srdData: rule
        }
      }
    };

    entries.push(entry);
  }
}

/**
 * Main build process
 */
async function main() {
  try {
    await buildSpeciesCompendium();
    await buildClassesCompendium();
    await buildSubclassesCompendium();
    await buildMonstersCompendium();
    await buildItemsCompendium();
    await buildSpellsCompendium();
    await buildRulesCompendium();

    console.log('=== Build Complete ===\n');
    console.log('Compendium packs have been generated in:');
    console.log(PACKS_DIR);
    console.log('\nYou can now package and distribute the module with pre-built SRD content.');

  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

main();
