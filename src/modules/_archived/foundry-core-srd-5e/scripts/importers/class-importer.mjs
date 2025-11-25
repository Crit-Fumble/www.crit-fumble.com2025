/**
 * Class Importer
 *
 * Imports D&D 5e classes from SRD 5.2.1 class/*.json
 */

import { BaseImporter } from './base-importer.mjs';

const CLASS_DATA_DIR = 'c:/Users/hobda/Projects/Crit-Fumble/www.crit-fumble.com/data/5e/5etools-srd521/data/class/';

const CLASS_FILES = [
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

export class ClassImporter extends BaseImporter {
  constructor() {
    super('Class Importer', CLASS_DATA_DIR);
    this.classes = [];
  }

  /**
   * Import all classes from SRD
   */
  async importAll() {
    console.log(`${this.name} | Starting import...`);

    try {
      let totalClasses = 0;

      // Load each class file
      for (const classFile of CLASS_FILES) {
        const filePath = `${this.dataPath}${classFile}`;

        try {
          const response = await fetch(filePath);
          if (!response.ok) {
            console.warn(`${this.name} | Failed to load ${classFile}: ${response.status}`);
            continue;
          }

          const fileData = await response.json();

          if (!fileData.class || !Array.isArray(fileData.class)) {
            console.warn(`${this.name} | Invalid format in ${classFile}`);
            continue;
          }

          // Filter for SRD 5.2.1 content only
          const srdClasses = this.filterSRDContent(fileData.class);
          totalClasses += srdClasses.length;

          // Import each class
          for (const classData of srdClasses) {
            await this.importClass(classData);
            this.logProgress(this.imported, totalClasses, classData.name);
          }

        } catch (error) {
          console.error(`${this.name} | Error loading ${classFile}:`, error);
          this.failed++;
        }
      }

      console.log(`${this.name} | Import complete: ${this.imported} imported, ${this.failed} failed, ${this.skipped} skipped`);

      ui.notifications.info(`Imported ${this.imported} SRD classes`);

      return this.classes;

    } catch (error) {
      console.error(`${this.name} | Import failed:`, error);
      ui.notifications.error('Failed to import SRD classes. Check console for details.');
      throw error;
    }
  }

  /**
   * Import a single class
   */
  async importClass(classData) {
    const typesRegistry = game.coreConcepts?.types;
    if (!typesRegistry) {
      throw new Error('Core Concepts Types Registry not available');
    }

    // Check if already imported
    const classId = `class-${this.slugify(classData.name)}`;
    const existing = typesRegistry.getType(classId);
    if (existing) {
      console.log(`${this.name} | Skipping existing: ${classData.name}`);
      this.skipped++;
      return;
    }

    // Map SRD class data to Core Concepts Type
    const classType = {
      id: classId,
      name: classData.name,
      category: 'class',
      source: 'SRD 5.2.1',
      data: {
        // Basic info
        srdSource: classData.source,
        page: classData.page,

        // Hit dice
        hitDice: `1d${classData.hd?.faces || 8}`,
        hitDiceNumber: classData.hd?.number || 1,
        hitDiceFaces: classData.hd?.faces || 8,

        // Primary abilities
        primaryAbility: this.extractPrimaryAbilities(classData),

        // Saving throws
        savingThrows: classData.proficiency || [],

        // Spellcasting
        spellcastingAbility: classData.spellcastingAbility || null,
        casterProgression: classData.casterProgression || 'none',
        preparedSpells: classData.preparedSpellsProgression || null,
        cantripsKnown: classData.cantripProgression || null,
        spellsKnown: classData.spellsKnownProgressionFixed || null,

        // Starting proficiencies
        startingProficiencies: this.extractStartingProficiencies(classData),

        // Starting equipment
        startingEquipment: classData.startingEquipment || null,

        // Class features (extracted from class table)
        features: this.extractClassFeatures(classData),

        // Subclasses (if any in SRD)
        subclasses: this.extractSubclasses(classData),

        // Multiclass requirements
        multiclassing: classData.multiclassing || null,

        // Art asset
        artAsset: this.getArtAssetPath(classData.name, 'class'),

        // Raw SRD data for reference
        _srdData: classData
      }
    };

    // Register with Types Registry
    try {
      await typesRegistry.registerType(classType);
      this.classes.push(classType);
      this.imported++;

      console.log(`${this.name} | Imported: ${classType.name}`);
    } catch (error) {
      console.warn(`${this.name} | Failed to import ${classData.name}:`, error);
      this.failed++;
    }
  }

  /**
   * Extract primary abilities
   */
  extractPrimaryAbilities(classData) {
    const abilities = [];

    if (classData.primaryAbility && Array.isArray(classData.primaryAbility)) {
      for (const abilityEntry of classData.primaryAbility) {
        for (const [ability, value] of Object.entries(abilityEntry)) {
          if (value === true) {
            abilities.push(ability);
          }
        }
      }
    }

    return abilities;
  }

  /**
   * Extract starting proficiencies
   */
  extractStartingProficiencies(classData) {
    const prof = classData.startingProficiencies || {};

    return {
      armor: prof.armor || [],
      weapons: prof.weapons || [],
      tools: prof.tools || [],
      skills: prof.skills || [],
      skillChoices: this.extractSkillChoices(prof.skills)
    };
  }

  /**
   * Extract skill choices
   */
  extractSkillChoices(skills) {
    if (!skills || !Array.isArray(skills)) return null;

    for (const skillEntry of skills) {
      if (skillEntry.choose) {
        return {
          from: skillEntry.choose.from || [],
          count: skillEntry.choose.count || 2
        };
      }
    }

    return null;
  }

  /**
   * Extract class features from class table
   */
  extractClassFeatures(classData) {
    const features = [];

    // Class features are typically in classTableGroups
    if (classData.classTableGroups && Array.isArray(classData.classTableGroups)) {
      for (const tableGroup of classData.classTableGroups) {
        if (tableGroup.rows && Array.isArray(tableGroup.rows)) {
          for (let level = 0; level < tableGroup.rows.length; level++) {
            const row = tableGroup.rows[level];

            // Extract feature names for this level
            if (Array.isArray(row)) {
              for (const cell of row) {
                if (typeof cell === 'string' && cell.trim()) {
                  features.push({
                    level: level + 1,
                    name: this.cleanSRDText(cell)
                  });
                }
              }
            }
          }
        }
      }
    }

    // Also check classFeatures array if present
    if (classData.classFeatures && Array.isArray(classData.classFeatures)) {
      for (const featureRef of classData.classFeatures) {
        if (typeof featureRef === 'string') {
          // Parse feature reference format: "Feature Name|Class|Source|Level"
          const parts = featureRef.split('|');
          if (parts.length >= 4) {
            const level = parseInt(parts[3]) || 1;
            features.push({
              level: level,
              name: parts[0],
              reference: featureRef
            });
          }
        }
      }
    }

    return features;
  }

  /**
   * Extract subclasses
   */
  extractSubclasses(classData) {
    const subclasses = [];

    if (classData.subclasses && Array.isArray(classData.subclasses)) {
      for (const subclass of classData.subclasses) {
        if (typeof subclass === 'object' && subclass.name) {
          subclasses.push({
            name: subclass.name,
            shortName: subclass.shortName || subclass.name,
            source: subclass.source,
            srd: subclass.srd52 === true
          });
        } else if (typeof subclass === 'string') {
          subclasses.push({
            name: subclass,
            srd: false
          });
        }
      }
    }

    return subclasses;
  }
}
