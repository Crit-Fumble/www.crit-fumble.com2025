/**
 * Assets Manager
 *
 * Handles asset registration, QR codes, and shortcodes
 * Game-system agnostic - works with any Foundry system
 */

const MODULE_ID = 'foundry-core-concepts';

export class AssetsManager {
  constructor() {
    this.assets = new Map();
    this.initialized = false;
    this.platformUrl = null;
    this.platformApiKey = null;
  }

  /**
   * Initialize the assets manager
   */
  async initialize() {
    console.log('Assets Manager | Initializing...');

    // Get platform settings from module settings
    this.platformUrl = game.settings.get(MODULE_ID, 'platformUrl') || 'http://localhost:3000';
    this.platformApiKey = game.settings.get(MODULE_ID, 'platformApiKey') || '';

    // Load cached assets
    await this.loadAssets();

    this.initialized = true;
    console.log('Assets Manager | Ready');
  }

  /**
   * Load cached assets from flags
   */
  async loadAssets() {
    const cachedAssets = game.settings.get(MODULE_ID, 'cachedAssets') || {};

    for (const [url, assetData] of Object.entries(cachedAssets)) {
      this.assets.set(url, assetData);
    }

    console.log(`Assets Manager | Loaded ${this.assets.size} cached assets`);
  }

  /**
   * Register asset with platform
   * @param {string} url - Asset URL
   * @param {object} metadata - Asset metadata
   * @returns {Promise<object|null>} Asset data or null on error
   */
  async register(url, metadata = {}) {
    if (!url) {
      console.error('Assets Manager | URL is required');
      return null;
    }

    // Check cache first
    if (this.assets.has(url)) {
      console.log('Assets Manager | Using cached asset for:', url);
      return this.assets.get(url);
    }

    try {
      // Call platform API to register asset
      const response = await fetch(`${this.platformUrl}/api/rpg/assets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.platformApiKey ? `Bearer ${this.platformApiKey}` : ''
        },
        body: JSON.stringify({
          url,
          name: metadata.name || this.extractFilename(url),
          assetType: metadata.type || this.detectAssetType(url),
          category: metadata.category,
          metadata: {
            foundryUrl: url,
            ...metadata
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Platform API error: ${response.statusText}`);
      }

      const data = await response.json();
      const asset = data.asset;

      // Cache the asset
      this.assets.set(url, asset);
      await this.saveCache();

      console.log('Assets Manager | Registered asset:', asset.shortcode);
      return asset;
    } catch (error) {
      console.error('Assets Manager | Failed to register asset:', error);
      return null;
    }
  }

  /**
   * Lookup asset by shortcode
   * @param {string} shortcode - Asset shortcode
   * @returns {Promise<object|null>} Asset data or null on error
   */
  async lookup(shortcode) {
    if (!shortcode) {
      console.error('Assets Manager | Shortcode is required');
      return null;
    }

    // Check cache for matching shortcode
    for (const asset of this.assets.values()) {
      if (asset.shortcode === shortcode) {
        return asset;
      }
    }

    try {
      const response = await fetch(
        `${this.platformUrl}/api/rpg/assets/lookup?shortcode=${shortcode}`,
        {
          headers: {
            'Authorization': this.platformApiKey ? `Bearer ${this.platformApiKey}` : ''
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Platform API error: ${response.statusText}`);
      }

      const data = await response.json();
      const asset = data.asset;

      // Cache the asset
      if (asset && asset.url) {
        this.assets.set(asset.url, asset);
        await this.saveCache();
      }

      return asset;
    } catch (error) {
      console.error('Assets Manager | Failed to lookup asset:', error);
      return null;
    }
  }

  /**
   * Generate print version with QR code
   * @param {string} assetId - Asset ID
   * @param {object} options - Print options
   * @returns {Promise<string|null>} Blob URL or null on error
   */
  async generatePrintVersion(assetId, options = {}) {
    if (!assetId) {
      console.error('Assets Manager | Asset ID is required');
      return null;
    }

    try {
      const params = new URLSearchParams({
        id: assetId,
        opacity: options.opacity || '0.15',
        size: options.size || '100',
        position: options.position || 'corner',
        ...(options.cornerOffset && { cornerOffset: options.cornerOffset })
      });

      const response = await fetch(
        `${this.platformUrl}/api/rpg/assets/print?${params}`,
        {
          headers: {
            'Authorization': this.platformApiKey ? `Bearer ${this.platformApiKey}` : ''
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Platform API error: ${response.statusText}`);
      }

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Assets Manager | Failed to generate print version:', error);
      return null;
    }
  }

  /**
   * Get asset by URL
   * @param {string} url - Asset URL
   * @returns {object|null} Asset data or null
   */
  getByUrl(url) {
    return this.assets.get(url) || null;
  }

  /**
   * Get all cached assets
   * @returns {Array} Array of asset data
   */
  getAll() {
    return Array.from(this.assets.values());
  }

  /**
   * Clear cache
   */
  async clearCache() {
    this.assets.clear();
    await game.settings.set(MODULE_ID, 'cachedAssets', {});
    console.log('Assets Manager | Cache cleared');
  }

  /**
   * Save asset cache to settings
   */
  async saveCache() {
    const cachedAssets = {};
    for (const [url, asset] of this.assets) {
      cachedAssets[url] = asset;
    }
    await game.settings.set(MODULE_ID, 'cachedAssets', cachedAssets);
  }

  /**
   * Helper: Extract filename from URL
   */
  extractFilename(url) {
    const parts = url.split('/');
    const lastPart = parts[parts.length - 1];
    return lastPart.split('?')[0] || 'asset';
  }

  /**
   * Helper: Detect asset type from URL
   */
  detectAssetType(url) {
    const lower = url.toLowerCase();

    if (lower.match(/\.(png|jpg|jpeg|gif|webp|svg|bmp)$/)) {
      if (lower.includes('/tokens/')) return 'token';
      if (lower.includes('/tiles/')) return 'tile';
      if (lower.includes('/maps/') || lower.includes('/scenes/')) return 'map';
      return 'image';
    }

    if (lower.match(/\.(mp3|ogg|wav|flac|m4a)$/)) {
      if (lower.includes('/music/')) return 'music';
      if (lower.includes('/sfx/')) return 'sfx';
      return 'audio';
    }

    if (lower.match(/\.(mp4|webm|mov|avi)$/)) {
      return 'video';
    }

    return 'unknown';
  }

  /**
   * Cleanup
   */
  async cleanup() {
    await this.saveCache();
    this.assets.clear();
    this.initialized = false;
  }
}
