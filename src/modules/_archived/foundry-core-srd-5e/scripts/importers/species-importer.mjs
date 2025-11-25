/**
 * Species Importer
 *
 * Imports species (humanoid subtypes) from SRD 5.2.1 races.json
 * Note: SRD 5.2.1 uses "species" terminology, not "race"
 */

const MODULE_ID = 'foundry-core-srd-5e';
const SRD_DATA_PATH = 'c:/Users/hobda/Projects/Crit-Fumble/www.crit-fumble.com/data/5e/5etools-srd521/data/races.json';

export class SpeciesImporter {
  constructor() {
    this.species = [];
    this.imported = 0;
  }

  /**
   * Import all species from SRD
   */
  async importAll() {
    console.log('Species Importer | Starting import...');

    try {
      // Load SRD data
      const response = await fetch(SRD_DATA_PATH);
      const srdData = await response.json();

      if (!srdData.race || !Array.isArray(srdData.race)) {
        throw new Error('Invalid SRD races.json format');
      }

      // Filter for SRD 5.2.1 content only
      const srdSpecies = srdData.race.filter(r => r.srd52 === true);

      console.log(`Species Importer | Found ${srdSpecies.length} SRD species`);

      // Import each species as a Type
      for (const speciesData of srdSpecies) {
        await this.importSpecies(speciesData);
      }

      console.log(`Species Importer | Imported ${this.imported} species`);
      return this.species;

    } catch (error) {
      console.error('Species Importer | Error:', error);
      ui.notifications.error('Failed to import SRD species. Check console for details.');
      throw error;
    }
  }

  /**
   * Import a single species
   */
  async importSpecies(speciesData) {
    const typesRegistry = game.coreConcepts?.types;
    if (!typesRegistry) {
      throw new Error('Core Concepts Types Registry not available');
    }

    // Map SRD species data to Core Concepts Type
    const speciesType = {
      id: `species-${this.slugify(speciesData.name)}`,
      name: speciesData.name,
      category: 'species',
      source: 'SRD 5.2.1',
      data: {
        // Basic info
        srdSource: speciesData.source,
        page: speciesData.page,

        // Creature classification
        creatureTypes: speciesData.creatureTypes || ['humanoid'],

        // Physical traits
        size: this.mapSize(speciesData.size),
        speed: speciesData.speed || 30,
        darkvision: speciesData.darkvision || 0,

        // Species traits
        traits: this.extractTraits(speciesData),

        // Ability score increases (if any)
        abilityScoreIncrease: this.extractAbilityScores(speciesData),

        // Description/lore
        description: this.extractDescription(speciesData),

        // Raw SRD data for reference
        _srdData: speciesData
      }
    };

    // Register with Types Registry
    try {
      await typesRegistry.registerType(speciesType);
      this.species.push(speciesType);
      this.imported++;

      console.log(`Species Importer | Imported: ${speciesType.name}`);
    } catch (error) {
      console.warn(`Species Importer | Failed to import ${speciesData.name}:`, error);
    }
  }

  /**
   * Map SRD size notation to full name
   */
  mapSize(sizeArray) {
    if (!sizeArray || sizeArray.length === 0) return 'Medium';

    const sizeMap = {
      'T': 'Tiny',
      'S': 'Small',
      'M': 'Medium',
      'L': 'Large',
      'H': 'Huge',
      'G': 'Gargantuan'
    };

    return sizeMap[sizeArray[0]] || 'Medium';
  }

  /**
   * Extract traits from species data
   */
  extractTraits(speciesData) {
    const traits = [];

    if (speciesData.entries && Array.isArray(speciesData.entries)) {
      for (const entry of speciesData.entries) {
        if (entry.type === 'entries' && entry.name) {
          traits.push({
            name: entry.name,
            description: this.extractEntryText(entry.entries),
            type: 'species-trait'
          });
        }
      }
    }

    return traits;
  }

  /**
   * Extract ability score increases
   */
  extractAbilityScores(speciesData) {
    const abilityScores = {};

    if (speciesData.ability && Array.isArray(speciesData.ability)) {
      for (const abilityEntry of speciesData.ability) {
        for (const [ability, value] of Object.entries(abilityEntry)) {
          if (ability !== 'choose') {
            abilityScores[ability] = value;
          }
        }
      }
    }

    return abilityScores;
  }

  /**
   * Extract description text from entries
   */
  extractDescription(speciesData) {
    let description = '';

    if (speciesData.entries && Array.isArray(speciesData.entries)) {
      for (const entry of speciesData.entries) {
        if (typeof entry === 'string') {
          description += entry + '\n\n';
        } else if (entry.type === 'entries' && entry.entries) {
          description += this.extractEntryText(entry.entries) + '\n\n';
        }
      }
    }

    return description.trim();
  }

  /**
   * Extract text from nested entries
   */
  extractEntryText(entries) {
    if (!entries) return '';

    let text = '';
    for (const entry of entries) {
      if (typeof entry === 'string') {
        text += entry + ' ';
      } else if (entry.type === 'list' && entry.items) {
        for (const item of entry.items) {
          text += '• ' + (typeof item === 'string' ? item : this.extractEntryText([item])) + '\n';
        }
      } else if (entry.entries) {
        text += this.extractEntryText(entry.entries);
      }
    }

    return text.trim();
  }

  /**
   * Create slug from name
   */
  slugify(text) {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
  }

  /**
   * Get imported species count
   */
  getImportedCount() {
    return this.imported;
  }

  /**
   * Get all imported species
   */
  getImportedSpecies() {
    return this.species;
  }
}
