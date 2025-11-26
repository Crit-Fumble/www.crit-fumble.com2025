/**
 * Asset Management Endpoints
 * Handles asset registration, shortcodes, and QR code generation
 * Game-system agnostic - works with any Foundry system
 */

export class AssetsEndpoint {
  constructor(apiRouter) {
    this.router = apiRouter;
    this.platformUrl = null;
    this.platformApiKey = null;
  }

  /**
   * Initialize endpoint with platform settings
   */
  async initialize(settings) {
    this.platformUrl = settings.platformUrl || 'http://localhost:3000';
    this.platformApiKey = settings.platformApiKey;
    console.log('Assets API | Initialized with platform:', this.platformUrl);
  }

  /**
   * Register asset with platform
   * POST /assets/register
   */
  async registerAsset(request) {
    const { url, metadata = {} } = request.body;

    if (!url) {
      return {
        success: false,
        error: 'Asset URL is required'
      };
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

      return {
        success: true,
        asset: data.asset
      };
    } catch (error) {
      console.error('Assets API | Failed to register asset:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get asset by shortcode
   * GET /assets/lookup?shortcode=ABC123
   */
  async lookupAsset(request) {
    const { shortcode } = request.query;

    if (!shortcode) {
      return {
        success: false,
        error: 'Shortcode is required'
      };
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

      return {
        success: true,
        asset: data.asset
      };
    } catch (error) {
      console.error('Assets API | Failed to lookup asset:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate print-ready version with QR code
   * GET /assets/print?id=xxx&opacity=0.15&position=corner
   */
  async generatePrintVersion(request) {
    const { id, opacity, size, position, cornerOffset } = request.query;

    if (!id) {
      return {
        success: false,
        error: 'Asset ID is required'
      };
    }

    try {
      // Build query params
      const params = new URLSearchParams({
        id,
        ...(opacity && { opacity }),
        ...(size && { size }),
        ...(position && { position }),
        ...(cornerOffset && { cornerOffset })
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

      // Return the image blob URL
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      return {
        success: true,
        url: blobUrl,
        mimeType: response.headers.get('content-type')
      };
    } catch (error) {
      console.error('Assets API | Failed to generate print version:', error);
      return {
        success: false,
        error: error.message
      };
    }
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
   * Register routes
   */
  registerRoutes() {
    this.router.registerRoute('POST', '/assets/register', this.registerAsset.bind(this));
    this.router.registerRoute('GET', '/assets/lookup', this.lookupAsset.bind(this));
    this.router.registerRoute('GET', '/assets/print', this.generatePrintVersion.bind(this));
  }
}
