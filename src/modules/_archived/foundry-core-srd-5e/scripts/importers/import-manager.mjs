/**
 * Import Manager
 *
 * Coordinates all SRD 5.2.1 data imports
 */

import { SpeciesImporter } from './species-importer.mjs';

const MODULE_ID = 'foundry-core-srd-5e';

export class ImportManager {
  constructor() {
    this.importers = new Map();
    this.results = new Map();
    this.importing = false;
  }

  /**
   * Initialize all importers
   */
  async initialize() {
    console.log('Import Manager | Initializing...');

    // Register importers
    this.registerImporter('species', new SpeciesImporter());

    // TODO: Register other importers as they're created
    // this.registerImporter('creatures', new CreatureImporter());
    // this.registerImporter('items', new ItemImporter());
    // this.registerImporter('spells', new SpellImporter());
    // this.registerImporter('classes', new ClassImporter());

    console.log(`Import Manager | Registered ${this.importers.size} importers`);
  }

  /**
   * Register an importer
   */
  registerImporter(id, importer) {
    this.importers.set(id, importer);
  }

  /**
   * Import all SRD data
   */
  async importAll() {
    if (this.importing) {
      ui.notifications.warn('Import already in progress');
      return;
    }

    this.importing = true;
    console.log('Import Manager | Starting full SRD import...');

    const startTime = Date.now();
    const errors = [];

    try {
      // Import in order: Types first, then data that uses those types

      // Phase 1: Types
      await this.importPhase('Types', ['species']);

      // Phase 2: Core Data (TODO: uncomment as importers are created)
      // await this.importPhase('Core Data', ['creatures', 'items', 'spells']);

      // Phase 3: Classes & Features (TODO)
      // await this.importPhase('Classes', ['classes']);

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      const totalStats = this.getTotalStats();

      console.log('Import Manager | Import complete!');
      console.log(`Import Manager | Duration: ${duration}s`);
      console.log(`Import Manager | Imported: ${totalStats.imported}`);
      console.log(`Import Manager | Failed: ${totalStats.failed}`);
      console.log(`Import Manager | Skipped: ${totalStats.skipped}`);

      ui.notifications.info(`SRD import complete! Imported ${totalStats.imported} items in ${duration}s`);

      return {
        success: true,
        duration,
        stats: totalStats,
        results: Object.fromEntries(this.results)
      };

    } catch (error) {
      console.error('Import Manager | Import failed:', error);
      ui.notifications.error('SRD import failed. Check console for details.');
      throw error;
    } finally {
      this.importing = false;
    }
  }

  /**
   * Import a specific phase
   */
  async importPhase(phaseName, importerIds) {
    console.log(`Import Manager | Phase: ${phaseName}`);

    for (const importerId of importerIds) {
      const importer = this.importers.get(importerId);
      if (!importer) {
        console.warn(`Import Manager | Importer '${importerId}' not found`);
        continue;
      }

      try {
        console.log(`Import Manager | Running ${importerId} importer...`);
        const result = await importer.importAll();
        this.results.set(importerId, {
          success: true,
          stats: importer.getStats(),
          data: result
        });
      } catch (error) {
        console.error(`Import Manager | ${importerId} import failed:`, error);
        this.results.set(importerId, {
          success: false,
          error: error.message,
          stats: importer.getStats()
        });
      }
    }
  }

  /**
   * Import specific category
   */
  async importCategory(categoryId) {
    const importer = this.importers.get(categoryId);
    if (!importer) {
      throw new Error(`Importer '${categoryId}' not found`);
    }

    console.log(`Import Manager | Importing ${categoryId}...`);

    try {
      const result = await importer.importAll();
      const stats = importer.getStats();

      ui.notifications.info(`${categoryId} import complete! Imported ${stats.imported} items`);

      return {
        success: true,
        stats,
        data: result
      };
    } catch (error) {
      console.error(`Import Manager | ${categoryId} import failed:`, error);
      ui.notifications.error(`${categoryId} import failed. Check console for details.`);
      throw error;
    }
  }

  /**
   * Get total statistics across all importers
   */
  getTotalStats() {
    const total = {
      imported: 0,
      failed: 0,
      skipped: 0,
      total: 0
    };

    for (const [id, result] of this.results) {
      if (result.stats) {
        total.imported += result.stats.imported || 0;
        total.failed += result.stats.failed || 0;
        total.skipped += result.stats.skipped || 0;
      }
    }

    total.total = total.imported + total.failed + total.skipped;
    return total;
  }

  /**
   * Clear all imported data
   */
  async clearAll() {
    // TODO: Implement clearing imported types/data
    console.warn('Import Manager | Clear all not yet implemented');
  }

  /**
   * Get import results
   */
  getResults() {
    return Object.fromEntries(this.results);
  }

  /**
   * Check if importing
   */
  isImporting() {
    return this.importing;
  }
}

// Global singleton
let importManager = null;

/**
 * Get import manager instance
 */
export function getImportManager() {
  if (!importManager) {
    importManager = new ImportManager();
  }
  return importManager;
}
