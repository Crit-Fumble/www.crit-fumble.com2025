/**
 * Base System
 *
 * Abstract base class for all game systems.
 * Provides common interface and functionality.
 */

const MODULE_ID = 'foundry-core-concepts';

export class BaseSystem {
  constructor(id, name, options = {}) {
    this.id = id;
    this.name = name;
    this.description = options.description || '';
    this.version = options.version || '1.0.0';
    this.author = options.author || 'Unknown';
    this.enabled = options.enabled !== false;
    this.initialized = false;

    // System configuration
    this.config = options.config || {};

    // System state
    this.state = {};
  }

  /**
   * Start the system
   * Override this in child classes
   */
  async start() {
    console.log(`System [${this.name}] | Starting...`);
    this.initialized = true;
    console.log(`System [${this.name}] | Started`);
  }

  /**
   * Stop the system
   * Override this in child classes
   */
  async stop() {
    console.log(`System [${this.name}] | Stopping...`);
    await this.cleanup();
    this.initialized = false;
    console.log(`System [${this.name}] | Stopped`);
  }

  /**
   * Update system state
   * Called periodically (e.g., on world time updates)
   * Override this in child classes
   */
  async update(deltaTime) {
    // Base implementation does nothing
  }

  /**
   * Cleanup system resources
   * Override this in child classes
   */
  async cleanup() {
    // Base implementation does nothing
  }

  /**
   * Get system state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Set system state
   */
  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.onStateChange(this.state);
  }

  /**
   * Called when state changes
   * Override this in child classes
   */
  onStateChange(state) {
    // Base implementation does nothing
  }

  /**
   * Get system configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Update system configuration
   */
  setConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.onConfigChange(this.config);
  }

  /**
   * Called when configuration changes
   * Override this in child classes
   */
  onConfigChange(config) {
    // Base implementation does nothing
  }

  /**
   * Save system state to settings
   */
  async saveState() {
    const key = `system-${this.id}-state`;
    await game.settings.set(MODULE_ID, key, this.state);
  }

  /**
   * Load system state from settings
   */
  async loadState() {
    const key = `system-${this.id}-state`;
    try {
      const savedState = game.settings.get(MODULE_ID, key);
      if (savedState) {
        this.state = savedState;
      }
    } catch (error) {
      console.warn(`System [${this.name}] | Failed to load state:`, error);
    }
  }

  /**
   * Register system settings
   */
  registerSettings() {
    // Register state storage
    game.settings.register(MODULE_ID, `system-${this.id}-state`, {
      scope: 'world',
      config: false,
      type: Object,
      default: {}
    });

    // Register enabled toggle
    game.settings.register(MODULE_ID, `system-${this.id}-enabled`, {
      name: `Enable ${this.name}`,
      hint: this.description,
      scope: 'world',
      config: true,
      type: Boolean,
      default: this.enabled,
      onChange: (value) => {
        this.enabled = value;
        if (value && !this.initialized) {
          this.start();
        } else if (!value && this.initialized) {
          this.stop();
        }
      }
    });
  }

  /**
   * Get system metadata
   */
  getMetadata() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      version: this.version,
      author: this.author,
      enabled: this.enabled,
      initialized: this.initialized
    };
  }

  /**
   * Validate system can run
   */
  validate() {
    // Base implementation always returns true
    // Override in child classes to check dependencies
    return true;
  }

  /**
   * Get system dependencies
   */
  getDependencies() {
    return [];
  }

  /**
   * Export system data (for sharing/backup)
   */
  exportData() {
    return {
      metadata: this.getMetadata(),
      config: this.config,
      state: this.state
    };
  }

  /**
   * Import system data (from sharing/backup)
   */
  async importData(data) {
    if (data.config) {
      this.setConfig(data.config);
    }
    if (data.state) {
      this.setState(data.state);
    }
    await this.saveState();
  }
}
