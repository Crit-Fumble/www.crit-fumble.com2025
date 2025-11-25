/**
 * Base Importer
 *
 * Abstract base class for all SRD data importers
 */

export class BaseImporter {
  constructor(name, dataPath) {
    this.name = name;
    this.dataPath = dataPath;
    this.imported = 0;
    this.failed = 0;
    this.skipped = 0;
  }

  /**
   * Load SRD JSON data from file
   */
  async loadSRDData() {
    try {
      const response = await fetch(this.dataPath);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`${this.name} | Failed to load data from ${this.dataPath}:`, error);
      throw error;
    }
  }

  /**
   * Filter for SRD 5.2.1 content
   */
  filterSRDContent(items) {
    return items.filter(item => item.srd52 === true);
  }

  /**
   * Create slug from text
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
   * Extract text from SRD entries
   */
  extractEntryText(entries) {
    if (!entries) return '';
    if (typeof entries === 'string') return entries;

    let text = '';
    for (const entry of Array.isArray(entries) ? entries : [entries]) {
      if (typeof entry === 'string') {
        text += entry + ' ';
      } else if (entry.type === 'list' && entry.items) {
        for (const item of entry.items) {
          text += '• ' + (typeof item === 'string' ? item : this.extractEntryText([item])) + '\n';
        }
      } else if (entry.type === 'entries' && entry.entries) {
        text += this.extractEntryText(entry.entries);
      } else if (entry.entries) {
        text += this.extractEntryText(entry.entries);
      }
    }

    return text.trim();
  }

  /**
   * Clean and format SRD text (remove formatting tags)
   */
  cleanSRDText(text) {
    if (!text) return '';

    return text
      // Remove dice roll tags
      .replace(/\{@dice ([^}]+)\}/g, '$1')
      // Remove damage tags
      .replace(/\{@damage ([^}]+)\}/g, '$1')
      // Remove hit tags
      .replace(/\{@hit ([^}]+)\}/g, '+$1')
      // Remove DC tags
      .replace(/\{@dc (\d+)\}/g, 'DC $1')
      // Remove action tags
      .replace(/\{@action ([^}]+)\}/g, '$1')
      // Remove condition tags
      .replace(/\{@condition ([^}]+)\}/g, '$1')
      // Remove spell tags
      .replace(/\{@spell ([^}]+)\}/g, '$1')
      // Remove creature tags
      .replace(/\{@creature ([^}]+)\}/g, '$1')
      // Remove item tags
      .replace(/\{@item ([^}]+)\}/g, '$1')
      // Remove other tags
      .replace(/\{@[a-z]+ ([^}]+)\}/g, '$1')
      .trim();
  }

  /**
   * Get art asset path for entity
   */
  getArtAssetPath(entityName, entityType = 'creature') {
    // Art assets are in www.crit-fumble.com/public/img
    // All CC0 licensed
    const slug = this.slugify(entityName);
    return `public/img/${entityType}s/${slug}.png`;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      imported: this.imported,
      failed: this.failed,
      skipped: this.skipped,
      total: this.imported + this.failed + this.skipped
    };
  }

  /**
   * Log import progress
   */
  logProgress(current, total, itemName) {
    if (current % 10 === 0 || current === total) {
      console.log(`${this.name} | Progress: ${current}/${total} (${Math.round(current/total*100)}%) - ${itemName}`);
    }
  }

  /**
   * Abstract method - must be implemented by subclasses
   */
  async importAll() {
    throw new Error(`${this.name} | importAll() must be implemented by subclass`);
  }
}
