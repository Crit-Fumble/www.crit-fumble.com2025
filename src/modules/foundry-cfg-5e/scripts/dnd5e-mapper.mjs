/**
 * D&D 5e Official System Mapper
 * Maps official dnd5e system configuration to Core Concepts format
 *
 * Aligns with:
 * - SRD 5.2.1
 * - PHB 2024
 * - Uses "species" instead of deprecated "race" terminology
 */

const MODULE_ID = 'foundry-cfg-5e';
const MODULE_TITLE = 'CFG 5e Bridge';

export class DnD5eMapper {
  constructor() {
    this.config = null;
    this.mapped = {
      abilities: [],
      skills: [],
      species: [],      // PHB 2024: "species" not "race"
      classes: [],
      backgrounds: [],
      damageTypes: [],
      conditions: [],
      spellSchools: [],
      itemTypes: [],
      actorTypes: [],
      movement: [],
      senses: [],
      languages: [],
      tools: [],
      weapons: [],
      armor: [],
      consumables: [],
      // New categories
      alignments: [],
      sizes: [],
      creatureTypes: [],
      itemRarity: [],
      attunementTypes: [],
      activationTypes: [],
      spellComponents: [],
      currencies: [],
      proficiencies: [],
      weaponMasteries: [],
      facilities: []
    };
  }

  /**
   * Initialize and load official dnd5e config
   */
  async initialize() {
    console.log(`${MODULE_TITLE} | Initializing D&D 5e mapper...`);

    // Get official dnd5e config
    this.config = CONFIG.DND5E;

    if (!this.config) {
      console.error(`${MODULE_TITLE} | Official dnd5e config not found!`);
      return false;
    }

    console.log(`${MODULE_TITLE} | Official dnd5e config loaded (version ${game.system.version})`);
    return true;
  }

  /**
   * Map all official 5e data to Core Concepts format
   */
  async mapAll() {
    if (!this.config) {
      console.error(`${MODULE_TITLE} | Mapper not initialized`);
      return null;
    }

    console.log(`${MODULE_TITLE} | Mapping official 5e data to Core Concepts...`);

    // Map core attributes
    this.mapAbilities();
    this.mapSkills();
    this.mapDamageTypes();
    this.mapConditions();
    this.mapMovementTypes();
    this.mapSenses();
    this.mapLanguages();

    // Map character options
    this.mapSpecies();
    this.mapClasses();

    // Map items
    this.mapTools();
    this.mapWeapons();
    this.mapArmor();

    // Map magic
    this.mapSpellSchools();
    this.mapActivationTypes();
    this.mapSpellComponents();

    // Map additional attributes
    this.mapAlignments();
    this.mapSizes();
    this.mapCreatureTypes();
    this.mapItemRarity();
    this.mapAttunementTypes();
    this.mapCurrencies();
    this.mapWeaponMasteries();
    this.mapFacilities();

    console.log(`${MODULE_TITLE} | Mapping complete`);
    return this.mapped;
  }

  /**
   * Map abilities (Strength, Dexterity, etc.)
   */
  mapAbilities() {
    const abilities = [];

    for (const [key, config] of Object.entries(this.config.abilities || {})) {
      abilities.push({
        id: key,
        name: game.i18n.localize(config.label),
        abbreviation: game.i18n.localize(config.abbreviation),
        fullKey: config.fullKey,
        type: config.type, // 'physical' or 'mental'
        category: 'ability',
        icon: config.icon,
        reference: config.reference,
        defaults: config.defaults || {},
        metadata: {
          source: 'Official dnd5e System',
          systemVersion: game.system.version,
          type: 'ability'
        }
      });
    }

    this.mapped.abilities = abilities;
    console.log(`${MODULE_TITLE} | Mapped ${abilities.length} abilities`);
    return abilities;
  }

  /**
   * Map skills
   */
  mapSkills() {
    const skills = [];

    for (const [key, config] of Object.entries(this.config.skills || {})) {
      skills.push({
        id: key,
        name: game.i18n.localize(config.label),
        ability: config.ability,
        category: 'skill',
        icon: config.icon,
        reference: config.reference,
        metadata: {
          source: 'Official dnd5e System',
          systemVersion: game.system.version,
          type: 'skill'
        }
      });
    }

    this.mapped.skills = skills;
    console.log(`${MODULE_TITLE} | Mapped ${skills.length} skills`);
    return skills;
  }

  /**
   * Map damage types
   */
  mapDamageTypes() {
    const damageTypes = [];

    for (const [key, config] of Object.entries(this.config.damageTypes || {})) {
      damageTypes.push({
        id: key,
        name: game.i18n.localize(config.label),
        type: 'damage-type',
        category: this.categorizeDamageType(key),
        icon: config.icon,
        color: config.color,
        reference: config.reference,
        isPhysical: config.isPhysical || false,
        metadata: {
          source: 'Official dnd5e System',
          systemVersion: game.system.version,
          type: 'damage-type'
        }
      });
    }

    this.mapped.damageTypes = damageTypes;
    console.log(`${MODULE_TITLE} | Mapped ${damageTypes.length} damage types`);
    return damageTypes;
  }

  /**
   * Map conditions
   */
  mapConditions() {
    const conditions = [];

    for (const [key, config] of Object.entries(this.config.conditionTypes || {})) {
      conditions.push({
        id: key,
        name: game.i18n.localize(config.label),
        type: 'condition',
        category: this.categorizeCondition(key),
        icon: config.icon,
        reference: config.reference,
        levels: config.levels,
        metadata: {
          source: 'Official dnd5e System',
          systemVersion: game.system.version,
          type: 'condition',
          pseudo: config.pseudo || false
        }
      });
    }

    this.mapped.conditions = conditions;
    console.log(`${MODULE_TITLE} | Mapped ${conditions.length} conditions`);
    return conditions;
  }

  /**
   * Map species (PHB 2024: formerly "race")
   */
  mapSpecies() {
    const species = [];

    // In official system, this might be in actorTypes or creature types
    // We'll map from creature types for now, but prioritize humanoid origins
    for (const [key, config] of Object.entries(this.config.creatureTypes || {})) {
      // Filter to playable species (humanoids primarily)
      if (this.isPlayableSpecies(key, config)) {
        species.push({
          id: key,
          name: game.i18n.localize(config.label),
          type: 'species',
          category: 'character-option',
          icon: config.icon,
          reference: config.reference,
          metadata: {
            source: 'Official dnd5e System',
            systemVersion: game.system.version,
            type: 'species',
            terminology: 'PHB 2024 uses "species" not "race"'
          }
        });
      }
    }

    this.mapped.species = species;
    console.log(`${MODULE_TITLE} | Mapped ${species.length} species`);
    return species;
  }

  /**
   * Map classes
   */
  mapClasses() {
    const classes = [];

    // Classes might be in advancement types or we extract from compendium
    // For now, we'll create a basic structure
    // This will be enhanced by reading from compendium packs

    const classNames = [
      'barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk',
      'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard'
    ];

    for (const className of classNames) {
      classes.push({
        id: className,
        name: className.charAt(0).toUpperCase() + className.slice(1),
        type: 'class',
        category: 'character-option',
        hitDie: this.getClassHitDie(className),
        primaryAbility: this.getClassPrimaryAbility(className),
        metadata: {
          source: 'SRD 5.2.1',
          type: 'class'
        }
      });
    }

    this.mapped.classes = classes;
    console.log(`${MODULE_TITLE} | Mapped ${classes.length} classes`);
    return classes;
  }

  /**
   * Map movement types
   */
  mapMovementTypes() {
    const movement = [];

    for (const [key, config] of Object.entries(this.config.movementTypes || {})) {
      movement.push({
        id: key,
        name: game.i18n.localize(config.label),
        type: 'movement',
        category: 'attribute',
        icon: config.icon,
        metadata: {
          source: 'Official dnd5e System',
          systemVersion: game.system.version,
          type: 'movement'
        }
      });
    }

    this.mapped.movement = movement;
    console.log(`${MODULE_TITLE} | Mapped ${movement.length} movement types`);
    return movement;
  }

  /**
   * Map senses
   */
  mapSenses() {
    const senses = [];

    for (const [key, config] of Object.entries(this.config.senses || {})) {
      senses.push({
        id: key,
        name: game.i18n.localize(config.label),
        type: 'sense',
        category: 'attribute',
        icon: config.icon,
        metadata: {
          source: 'Official dnd5e System',
          systemVersion: game.system.version,
          type: 'sense'
        }
      });
    }

    this.mapped.senses = senses;
    console.log(`${MODULE_TITLE} | Mapped ${senses.length} senses`);
    return senses;
  }

  /**
   * Map languages
   */
  mapLanguages() {
    const languages = [];

    for (const [key, config] of Object.entries(this.config.languages || {})) {
      languages.push({
        id: key,
        name: game.i18n.localize(config.label),
        type: 'language',
        category: 'trait',
        children: config.children || [],
        metadata: {
          source: 'Official dnd5e System',
          systemVersion: game.system.version,
          type: 'language'
        }
      });
    }

    this.mapped.languages = languages;
    console.log(`${MODULE_TITLE} | Mapped ${languages.length} languages`);
    return languages;
  }

  /**
   * Map tools
   */
  mapTools() {
    const tools = [];

    for (const [key, config] of Object.entries(this.config.toolTypes || {})) {
      tools.push({
        id: key,
        name: game.i18n.localize(config.label),
        type: 'tool',
        category: 'item',
        reference: config.reference,
        metadata: {
          source: 'Official dnd5e System',
          systemVersion: game.system.version,
          type: 'tool'
        }
      });
    }

    this.mapped.tools = tools;
    console.log(`${MODULE_TITLE} | Mapped ${tools.length} tool types`);
    return tools;
  }

  /**
   * Map weapons
   */
  mapWeapons() {
    const weapons = [];

    for (const [key, config] of Object.entries(this.config.weaponTypes || {})) {
      weapons.push({
        id: key,
        name: game.i18n.localize(config.label),
        type: 'weapon',
        category: 'item',
        reference: config.reference,
        metadata: {
          source: 'Official dnd5e System',
          systemVersion: game.system.version,
          type: 'weapon'
        }
      });
    }

    // Also map weapon properties
    for (const [key, config] of Object.entries(this.config.weaponProperties || {})) {
      weapons.push({
        id: `property-${key}`,
        name: game.i18n.localize(config.label),
        type: 'weapon-property',
        category: 'item-property',
        reference: config.reference,
        metadata: {
          source: 'Official dnd5e System',
          systemVersion: game.system.version,
          type: 'weapon-property'
        }
      });
    }

    this.mapped.weapons = weapons;
    console.log(`${MODULE_TITLE} | Mapped ${weapons.length} weapon types/properties`);
    return weapons;
  }

  /**
   * Map armor
   */
  mapArmor() {
    const armor = [];

    for (const [key, config] of Object.entries(this.config.armorTypes || {})) {
      armor.push({
        id: key,
        name: game.i18n.localize(config.label),
        type: 'armor',
        category: 'item',
        reference: config.reference,
        metadata: {
          source: 'Official dnd5e System',
          systemVersion: game.system.version,
          type: 'armor'
        }
      });
    }

    this.mapped.armor = armor;
    console.log(`${MODULE_TITLE} | Mapped ${armor.length} armor types`);
    return armor;
  }

  /**
   * Map spell schools
   */
  mapSpellSchools() {
    const spellSchools = [];

    for (const [key, config] of Object.entries(this.config.spellSchools || {})) {
      spellSchools.push({
        id: key,
        name: game.i18n.localize(config.label),
        type: 'spell-school',
        category: 'magic',
        icon: config.icon,
        reference: config.reference,
        metadata: {
          source: 'Official dnd5e System',
          systemVersion: game.system.version,
          type: 'spell-school'
        }
      });
    }

    this.mapped.spellSchools = spellSchools;
    console.log(`${MODULE_TITLE} | Mapped ${spellSchools.length} spell schools`);
    return spellSchools;
  }

  /**
   * Map alignments
   */
  mapAlignments() {
    const alignments = [];

    for (const [key, config] of Object.entries(this.config.alignments || {})) {
      alignments.push({
        id: key,
        name: game.i18n.localize(config.label),
        type: 'alignment',
        category: 'trait',
        abbreviation: config.abbreviation,
        metadata: {
          source: 'Official dnd5e System',
          systemVersion: game.system.version,
          type: 'alignment'
        }
      });
    }

    this.mapped.alignments = alignments;
    console.log(`${MODULE_TITLE} | Mapped ${alignments.length} alignments`);
    return alignments;
  }

  /**
   * Map creature sizes
   */
  mapSizes() {
    const sizes = [];

    for (const [key, config] of Object.entries(this.config.actorSizes || {})) {
      sizes.push({
        id: key,
        name: game.i18n.localize(config.label),
        abbreviation: config.abbreviation,
        type: 'size',
        category: 'attribute',
        hitDie: config.hitDie,
        token: config.token,
        capacityMultiplier: config.capacityMultiplier,
        metadata: {
          source: 'Official dnd5e System',
          systemVersion: game.system.version,
          type: 'size'
        }
      });
    }

    this.mapped.sizes = sizes;
    console.log(`${MODULE_TITLE} | Mapped ${sizes.length} creature sizes`);
    return sizes;
  }

  /**
   * Map creature types
   */
  mapCreatureTypes() {
    const creatureTypes = [];

    for (const [key, config] of Object.entries(this.config.creatureTypes || {})) {
      creatureTypes.push({
        id: key,
        name: game.i18n.localize(config.label),
        type: 'creature-type',
        category: 'trait',
        icon: config.icon,
        reference: config.reference,
        metadata: {
          source: 'Official dnd5e System',
          systemVersion: game.system.version,
          type: 'creature-type'
        }
      });
    }

    this.mapped.creatureTypes = creatureTypes;
    console.log(`${MODULE_TITLE} | Mapped ${creatureTypes.length} creature types`);
    return creatureTypes;
  }

  /**
   * Map item rarity
   */
  mapItemRarity() {
    const itemRarity = [];

    for (const [key, config] of Object.entries(this.config.itemRarity || {})) {
      itemRarity.push({
        id: key,
        name: game.i18n.localize(config.label),
        type: 'rarity',
        category: 'item-property',
        metadata: {
          source: 'Official dnd5e System',
          systemVersion: game.system.version,
          type: 'rarity'
        }
      });
    }

    this.mapped.itemRarity = itemRarity;
    console.log(`${MODULE_TITLE} | Mapped ${itemRarity.length} rarity levels`);
    return itemRarity;
  }

  /**
   * Map attunement types
   */
  mapAttunementTypes() {
    const attunementTypes = [];

    for (const [key, config] of Object.entries(this.config.attunementTypes || {})) {
      attunementTypes.push({
        id: key,
        name: game.i18n.localize(config.label),
        type: 'attunement',
        category: 'item-property',
        metadata: {
          source: 'Official dnd5e System',
          systemVersion: game.system.version,
          type: 'attunement'
        }
      });
    }

    this.mapped.attunementTypes = attunementTypes;
    console.log(`${MODULE_TITLE} | Mapped ${attunementTypes.length} attunement types`);
    return attunementTypes;
  }

  /**
   * Map activation types (action, bonus action, reaction, etc.)
   */
  mapActivationTypes() {
    const activationTypes = [];

    for (const [key, config] of Object.entries(this.config.abilityActivationTypes || {})) {
      activationTypes.push({
        id: key,
        name: game.i18n.localize(config.label),
        type: 'activation-type',
        category: 'action',
        abbreviation: config.abbreviation,
        scalar: config.scalar,
        metadata: {
          source: 'Official dnd5e System',
          systemVersion: game.system.version,
          type: 'activation-type'
        }
      });
    }

    this.mapped.activationTypes = activationTypes;
    console.log(`${MODULE_TITLE} | Mapped ${activationTypes.length} activation types`);
    return activationTypes;
  }

  /**
   * Map spell components
   */
  mapSpellComponents() {
    const spellComponents = [];

    // Spell components are typically V, S, M
    const components = this.config.spellComponents || {
      vocal: { label: 'DND5E.ComponentVerbal', abbreviation: 'V' },
      somatic: { label: 'DND5E.ComponentSomatic', abbreviation: 'S' },
      material: { label: 'DND5E.ComponentMaterial', abbreviation: 'M' },
      ritual: { label: 'DND5E.Ritual', abbreviation: 'R' },
      concentration: { label: 'DND5E.Concentration', abbreviation: 'C' }
    };

    for (const [key, config] of Object.entries(components)) {
      spellComponents.push({
        id: key,
        name: game.i18n.localize(config.label),
        abbreviation: config.abbreviation,
        type: 'spell-component',
        category: 'magic',
        metadata: {
          source: 'Official dnd5e System',
          systemVersion: game.system.version,
          type: 'spell-component'
        }
      });
    }

    this.mapped.spellComponents = spellComponents;
    console.log(`${MODULE_TITLE} | Mapped ${spellComponents.length} spell components`);
    return spellComponents;
  }

  /**
   * Map currencies
   */
  mapCurrencies() {
    const currencies = [];

    for (const [key, config] of Object.entries(this.config.currencies || {})) {
      currencies.push({
        id: key,
        name: game.i18n.localize(config.label),
        abbreviation: config.abbreviation,
        type: 'currency',
        category: 'item',
        conversion: config.conversion,
        metadata: {
          source: 'Official dnd5e System',
          systemVersion: game.system.version,
          type: 'currency'
        }
      });
    }

    this.mapped.currencies = currencies;
    console.log(`${MODULE_TITLE} | Mapped ${currencies.length} currencies`);
    return currencies;
  }

  /**
   * Map weapon masteries (PHB 2024)
   */
  mapWeaponMasteries() {
    const weaponMasteries = [];

    for (const [key, config] of Object.entries(this.config.weaponMasteries || {})) {
      weaponMasteries.push({
        id: key,
        name: game.i18n.localize(config.label),
        type: 'weapon-mastery',
        category: 'combat',
        icon: config.icon,
        reference: config.reference,
        metadata: {
          source: 'Official dnd5e System (PHB 2024)',
          systemVersion: game.system.version,
          type: 'weapon-mastery'
        }
      });
    }

    this.mapped.weaponMasteries = weaponMasteries;
    console.log(`${MODULE_TITLE} | Mapped ${weaponMasteries.length} weapon masteries`);
    return weaponMasteries;
  }

  /**
   * Map facilities (strongholds, vehicles, etc.)
   */
  mapFacilities() {
    const facilities = [];

    for (const [key, config] of Object.entries(this.config.facilities || {})) {
      facilities.push({
        id: key,
        name: game.i18n.localize(config.label),
        type: 'facility',
        category: 'structure',
        metadata: {
          source: 'Official dnd5e System',
          systemVersion: game.system.version,
          type: 'facility'
        }
      });
    }

    this.mapped.facilities = facilities;
    console.log(`${MODULE_TITLE} | Mapped ${facilities.length} facilities`);
    return facilities;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Categorize damage type
   */
  categorizeDamageType(key) {
    const physical = ['bludgeoning', 'piercing', 'slashing'];
    const elemental = ['acid', 'cold', 'fire', 'lightning', 'thunder'];
    const magical = ['force', 'necrotic', 'poison', 'psychic', 'radiant'];

    if (physical.includes(key)) return 'physical';
    if (elemental.includes(key)) return 'elemental';
    if (magical.includes(key)) return 'magical';
    return 'other';
  }

  /**
   * Categorize condition
   */
  categorizeCondition(key) {
    const impairment = ['blinded', 'deafened', 'poisoned', 'stunned'];
    const movement = ['grappled', 'prone', 'restrained'];
    const severe = ['incapacitated', 'paralyzed', 'petrified', 'unconscious'];
    const mental = ['charmed', 'frightened'];

    if (impairment.includes(key)) return 'impairment';
    if (movement.includes(key)) return 'movement';
    if (severe.includes(key)) return 'severe';
    if (mental.includes(key)) return 'mental';
    return 'other';
  }

  /**
   * Check if creature type is a playable species
   */
  isPlayableSpecies(key, config) {
    // Humanoid is the primary playable type in D&D
    // PHB 2024 playable species are typically humanoid
    const playableTypes = ['humanoid'];
    return playableTypes.includes(key);
  }

  /**
   * Get hit die for class
   */
  getClassHitDie(className) {
    const hitDice = {
      'barbarian': 'd12',
      'bard': 'd8',
      'cleric': 'd8',
      'druid': 'd8',
      'fighter': 'd10',
      'monk': 'd8',
      'paladin': 'd10',
      'ranger': 'd10',
      'rogue': 'd8',
      'sorcerer': 'd6',
      'warlock': 'd8',
      'wizard': 'd6'
    };
    return hitDice[className] || 'd8';
  }

  /**
   * Get primary ability for class
   */
  getClassPrimaryAbility(className) {
    const primaryAbilities = {
      'barbarian': 'str',
      'bard': 'cha',
      'cleric': 'wis',
      'druid': 'wis',
      'fighter': 'str',
      'monk': 'dex',
      'paladin': 'str',
      'ranger': 'dex',
      'rogue': 'dex',
      'sorcerer': 'cha',
      'warlock': 'cha',
      'wizard': 'int'
    };
    return primaryAbilities[className] || 'str';
  }

  /**
   * Get D&D 5e System Configuration
   *
   * This returns the 5e-SPECIFIC configuration (abilities, skills, etc.)
   * These are NOT Core Concepts - they're 5e system properties!
   *
   * Core Concepts only contains:
   * - Rules (156 from SRD glossary)
   * - Cards (spells, items, creatures)
   * - Subsystems (chase scenes, crafting, etc.)
   * - Modes (interaction, exploration, combat, travel, downtime)
   */
  get5eConfiguration() {
    return this.mapped;
  }

  /**
   * Export to Core Concepts format
   *
   * IMPORTANT: This returns ONLY what belongs in Core Concepts:
   * - Rules: From SRD glossary (loaded separately)
   * - Cards: Spells, items, creatures (extracted from compendiums)
   * - Subsystems: Complex mechanics (defined separately)
   * - Modes: Gameplay states (defined separately)
   *
   * It does NOT export 5e-specific properties like abilities, skills, etc.
   */
  exportToCoreConceptsFormat() {
    return {
      // Rules loaded from SRD glossary (see data/rules/srd-glossary.mjs)
      rules: [], // Populated by rules engine, not mapper

      // Cards extracted from compendiums (to be implemented)
      cards: {
        spells: [],    // From dnd5e.spells compendium
        items: [],     // From dnd5e.items compendium
        creatures: [], // From dnd5e.monsters compendium
        features: []   // From class/species features
      },

      // Subsystems (to be defined)
      subsystems: [],

      // Modes (to be defined)
      modes: []
    };
  }
}

export default DnD5eMapper;
