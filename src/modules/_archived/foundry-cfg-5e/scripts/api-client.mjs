/**
 * API Client for CFG 5e Bridge
 * Handles communication with Core Concepts (direct) and optional API plugin
 *
 * Architecture:
 *   1. Try Core Concepts direct access (game.coreConcepts)
 *   2. Fallback to Core Concepts API (HTTP) if enabled
 *   3. Graceful degradation if neither available
 */

export class CFGApiClient {
  constructor(config) {
    this.foundryApiUrl = config.foundryApiUrl; // Optional - only if API plugin enabled
    this.platformApiUrl = config.platformApiUrl;
    this.platformApiKey = config.platformApiKey;
    this.authToken = config.authToken;
  }

  /**
   * Check if Core Concepts API plugin is available
   */
  get hasApiPlugin() {
    return !!this.foundryApiUrl;
  }

  /**
   * Check if Core Concepts is available directly
   */
  get hasCoreConceptsDirect() {
    return !!game.coreConcepts;
  }

  /**
   * Get auth headers for Foundry API
   */
  _getFoundryHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.authToken}`
    };
  }

  /**
   * Get auth headers for Platform API
   */
  _getPlatformHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': this.platformApiKey ? `Bearer ${this.platformApiKey}` : ''
    };
  }

  // ============================================================================
  // Asset Management
  // ============================================================================

  /**
   * Register asset with platform
   * Tries: 1) Core Concepts direct, 2) API plugin, 3) null
   * @param {string} url - Asset URL
   * @param {object} metadata - Asset metadata
   * @returns {Promise<object|null>} Asset data or null on error
   */
  async registerAsset(url, metadata = {}) {
    // Try Core Concepts direct access first
    if (this.hasCoreConceptsDirect && game.coreConcepts.assets) {
      try {
        return await game.coreConcepts.assets.register(url, metadata);
      } catch (error) {
        console.warn('CFG API Client | Core Concepts direct failed, trying API:', error);
      }
    }

    // Fallback to API plugin if available
    if (this.hasApiPlugin) {
      try {
        const response = await fetch(`${this.foundryApiUrl}/assets/register`, {
          method: 'POST',
          headers: this._getFoundryHeaders(),
          body: JSON.stringify({ url, metadata })
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.asset;
      } catch (error) {
        console.error('CFG API Client | API plugin failed:', error);
      }
    }

    console.warn('CFG API Client | No asset registration method available');
    return null;
  }

  /**
   * Lookup asset by shortcode
   * @param {string} shortcode - Asset shortcode
   * @returns {Promise<object|null>} Asset data or null on error
   */
  async lookupAsset(shortcode) {
    if (!this.foundryApiUrl) return null;

    try {
      const response = await fetch(`${this.foundryApiUrl}/assets/lookup?shortcode=${shortcode}`, {
        headers: this._getFoundryHeaders()
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.asset;
    } catch (error) {
      console.error('CFG API Client | Failed to lookup asset:', error);
      return null;
    }
  }

  /**
   * Generate print version with QR overlay
   * @param {string} assetId - Asset ID
   * @param {object} options - Print options (opacity, size, position)
   * @returns {Promise<string|null>} Blob URL or null on error
   */
  async generatePrintVersion(assetId, options = {}) {
    if (!this.foundryApiUrl) return null;

    try {
      const params = new URLSearchParams({
        id: assetId,
        ...options
      });

      const response = await fetch(`${this.foundryApiUrl}/assets/print?${params}`, {
        headers: this._getFoundryHeaders()
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('CFG API Client | Failed to generate print version:', error);
      return null;
    }
  }

  // ============================================================================
  // Platform Sync (via Core Concepts API)
  // ============================================================================

  /**
   * Sync actor to platform
   * @param {object} actor - Foundry actor document
   * @returns {Promise<object|null>} Sync result or null on error
   */
  async syncActor(actor) {
    if (!this.foundryApiUrl) return null;

    try {
      const response = await fetch(`${this.foundryApiUrl}/sync/actor`, {
        method: 'POST',
        headers: this._getFoundryHeaders(),
        body: JSON.stringify({
          id: actor.id,
          name: actor.name,
          type: actor.type,
          data: actor.system,
          img: actor.img,
          token: actor.prototypeToken
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('CFG API Client | Failed to sync actor:', error);
      return null;
    }
  }

  /**
   * Sync item to platform
   * @param {object} item - Foundry item document
   * @returns {Promise<object|null>} Sync result or null on error
   */
  async syncItem(item) {
    if (!this.foundryApiUrl) return null;

    try {
      const response = await fetch(`${this.foundryApiUrl}/sync/item`, {
        method: 'POST',
        headers: this._getFoundryHeaders(),
        body: JSON.stringify({
          id: item.id,
          name: item.name,
          type: item.type,
          data: item.system,
          img: item.img
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('CFG API Client | Failed to sync item:', error);
      return null;
    }
  }

  /**
   * Sync scene to platform
   * @param {object} scene - Foundry scene document
   * @returns {Promise<object|null>} Sync result or null on error
   */
  async syncScene(scene) {
    if (!this.foundryApiUrl) return null;

    try {
      const response = await fetch(`${this.foundryApiUrl}/sync/scene`, {
        method: 'POST',
        headers: this._getFoundryHeaders(),
        body: JSON.stringify({
          id: scene.id,
          name: scene.name,
          background: scene.background,
          dimensions: scene.dimensions,
          grid: scene.grid
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('CFG API Client | Failed to sync scene:', error);
      return null;
    }
  }

  // ============================================================================
  // Core Concepts Data Access
  // ============================================================================

  /**
   * Fetch rules data from Core Concepts
   * Tries: 1) Core Concepts direct, 2) API plugin, 3) null
   * @param {string} ruleType - Type of rule (e.g., 'condition', 'action', 'damage-type')
   * @returns {Promise<object[]|null>} Rules array or null on error
   */
  async fetchRules(ruleType) {
    // Try Core Concepts direct access first
    if (this.hasCoreConceptsDirect && game.coreConcepts.rules) {
      try {
        return game.coreConcepts.rules.getByType(ruleType);
      } catch (error) {
        console.warn('CFG API Client | Core Concepts direct failed, trying API:', error);
      }
    }

    // Fallback to API plugin
    if (this.hasApiPlugin) {
      try {
        const response = await fetch(`${this.foundryApiUrl}/core-concepts/rules?type=${ruleType}`, {
          headers: this._getFoundryHeaders()
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.rules;
      } catch (error) {
        console.error('CFG API Client | API plugin failed:', error);
      }
    }

    console.warn('CFG API Client | No rules data source available');
    return null;
  }

  /**
   * Fetch subsystems data from Core Concepts
   * Tries: 1) Core Concepts direct, 2) API plugin, 3) null
   * @param {string} subsystemId - Subsystem ID
   * @returns {Promise<object|null>} Subsystem data or null on error
   */
  async fetchSubsystem(subsystemId) {
    // Try Core Concepts direct access first
    if (this.hasCoreConceptsDirect && game.coreConcepts.subsystems) {
      try {
        return game.coreConcepts.subsystems.get(subsystemId);
      } catch (error) {
        console.warn('CFG API Client | Core Concepts direct failed, trying API:', error);
      }
    }

    // Fallback to API plugin
    if (this.hasApiPlugin) {
      try {
        const response = await fetch(`${this.foundryApiUrl}/core-concepts/subsystems/${subsystemId}`, {
          headers: this._getFoundryHeaders()
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error('CFG API Client | API plugin failed:', error);
      }
    }

    console.warn('CFG API Client | No subsystems data source available');
    return null;
  }

  /**
   * Fetch modes data from Core Concepts
   * Tries: 1) Core Concepts direct, 2) API plugin, 3) null
   * @returns {Promise<object[]|null>} Modes array or null on error
   */
  async fetchModes() {
    // Try Core Concepts direct access first
    if (this.hasCoreConceptsDirect && game.coreConcepts.modes) {
      try {
        return game.coreConcepts.modes.getAll();
      } catch (error) {
        console.warn('CFG API Client | Core Concepts direct failed, trying API:', error);
      }
    }

    // Fallback to API plugin
    if (this.hasApiPlugin) {
      try {
        const response = await fetch(`${this.foundryApiUrl}/core-concepts/modes`, {
          headers: this._getFoundryHeaders()
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.modes;
      } catch (error) {
        console.error('CFG API Client | API plugin failed:', error);
      }
    }

    console.warn('CFG API Client | No modes data source available');
    return null;
  }
}
