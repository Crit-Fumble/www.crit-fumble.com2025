/**
 * Systems Manager
 *
 * Manages game systems (weather, travel, crafting, economy, reputation, etc.)
 * Provides framework for creating and running extensible game systems.
 * GMs can add additional systems via modules or compendiums.
 */

const MODULE_ID = 'foundry-core-concepts';

export class SystemsManager {
  constructor() {
    this.systems = new Map();
    this.systemModules = new Map(); // For external system modules
    this.initialized = false;
    this.updateInterval = null;
  }

  /**
   * Initialize the systems manager
   */
  async initialize() {
    console.log('Systems Manager | Initializing...');

    // Load built-in systems
    await this.loadBuiltInSystems();

    // Load external system modules
    await this.loadExternalSystems();

    // Load custom systems from journal entries
    await this.loadCustomSystems();

    // Start enabled systems
    await this.startSystems();

    // Register hooks
    this.registerHooks();

    // Start update loop
    this.startUpdateLoop();

    this.initialized = true;
    console.log('Systems Manager | Ready');
    console.log(`Systems Manager | Loaded ${this.systems.size} systems`);
  }

  /**
   * Load built-in systems
   */
  async loadBuiltInSystems() {
    // Systems will be loaded dynamically
    // GMs can enable/disable via settings
    console.log('Systems Manager | Loading built-in systems...');

    // Import built-in systems
    try {
      const { WeatherSystem } = await import('./systems/weather-system.mjs');
      this.registerSystem(new WeatherSystem());
    } catch (error) {
      console.log('Systems Manager | Weather system not available (optional)');
    }

    // Future built-in systems
    // const { TravelSystem } = await import('./systems/travel-system.mjs');
    // const { CraftingSystem } = await import('./systems/crafting-system.mjs');
    // etc.
  }

  /**
   * Load external system modules
   * These are separate modules that extend the systems framework
   */
  async loadExternalSystems() {
    console.log('Systems Manager | Loading external system modules...');

    // Check for modules that provide systems
    for (const module of game.modules) {
      if (module.active && module.flags?.[MODULE_ID]?.providesSystem) {
        const systemId = module.flags[MODULE_ID].systemId;
        const systemClass = module.flags[MODULE_ID].systemClass;

        if (systemId && systemClass) {
          try {
            // External modules can register their systems via API
            console.log(`Systems Manager | Found external system: ${systemId} from module ${module.id}`);
            this.systemModules.set(systemId, module);
          } catch (error) {
            console.error(`Systems Manager | Failed to load external system ${systemId}:`, error);
          }
        }
      }
    }
  }

  /**
   * Load custom systems from journal entries
   * GMs can create simple systems via journal entries with special flags
   */
  async loadCustomSystems() {
    console.log('Systems Manager | Loading custom systems...');

    const customSystemEntries = game.journal.filter(j => j.getFlag(MODULE_ID, 'isSystem'));

    for (const entry of customSystemEntries) {
      const systemData = {
        id: entry.getFlag(MODULE_ID, 'systemId'),
        name: entry.name,
        description: entry.getFlag(MODULE_ID, 'systemDescription') || '',
        config: entry.getFlag(MODULE_ID, 'systemConfig') || {},
        rules: entry.getFlag(MODULE_ID, 'systemRules') || []
      };

      if (systemData.id) {
        // Create a simple system from journal data
        const customSystem = this.createCustomSystem(systemData);
        this.registerSystem(customSystem);
        console.log(`Systems Manager | Loaded custom system: ${systemData.name}`);
      }
    }
  }

  /**
   * Create a custom system from journal entry data
   */
  createCustomSystem(data) {
    const { BaseSystem } = require('./systems/base-system.mjs');

    // Create a simple system that uses the rules engine
    const system = new BaseSystem(data.id, data.name, {
      description: data.description,
      config: data.config
    });

    // Override start to register rules
    const originalStart = system.start.bind(system);
    system.start = async function() {
      await originalStart();

      // Register system rules with the rules engine
      for (const rule of data.rules) {
        await game.coreConcepts.rules.createRule(
          rule.name,
          rule.trigger,
          rule.condition,
          rule.effect,
          { category: `system-${data.id}` }
        );
      }
    };

    return system;
  }

  /**
   * Register a game system
   */
  registerSystem(system) {
    if (!system.validate()) {
      console.warn(`Systems Manager | System ${system.name} failed validation`);
      return false;
    }

    // Check dependencies
    const dependencies = system.getDependencies();
    for (const depId of dependencies) {
      if (!this.systems.has(depId)) {
        console.warn(`Systems Manager | System ${system.name} requires ${depId} which is not loaded`);
        return false;
      }
    }

    // Register settings for the system
    system.registerSettings();

    // Add to registry
    this.systems.set(system.id, system);
    console.log(`Systems Manager | Registered system: ${system.name}`);

    return true;
  }

  /**
   * Unregister a system
   */
  async unregisterSystem(systemId) {
    const system = this.systems.get(systemId);
    if (!system) return;

    // Stop if running
    if (system.initialized) {
      await system.stop();
    }

    // Remove from registry
    this.systems.delete(systemId);
    console.log(`Systems Manager | Unregistered system: ${system.name}`);
  }

  /**
   * Start all enabled systems
   */
  async startSystems() {
    const systems = Array.from(this.systems.values());

    // Sort by dependencies (systems with no deps first)
    const sorted = this.topologicalSort(systems);

    for (const system of sorted) {
      if (system.enabled) {
        try {
          await system.loadState();
          await system.start();
          console.log(`Systems Manager | Started system: ${system.name}`);
        } catch (error) {
          console.error(`Systems Manager | Failed to start system ${system.name}:`, error);
        }
      }
    }
  }

  /**
   * Topological sort of systems by dependencies
   */
  topologicalSort(systems) {
    const sorted = [];
    const visited = new Set();
    const visiting = new Set();

    const visit = (system) => {
      if (visited.has(system.id)) return;
      if (visiting.has(system.id)) {
        console.warn(`Systems Manager | Circular dependency detected for ${system.name}`);
        return;
      }

      visiting.add(system.id);

      for (const depId of system.getDependencies()) {
        const dep = this.systems.get(depId);
        if (dep) visit(dep);
      }

      visiting.delete(system.id);
      visited.add(system.id);
      sorted.push(system);
    };

    for (const system of systems) {
      visit(system);
    }

    return sorted;
  }

  /**
   * Stop all systems
   */
  async stopSystems() {
    for (const system of this.systems.values()) {
      if (system.initialized) {
        await system.stop();
      }
    }
  }

  /**
   * Start update loop
   * Updates all systems periodically
   */
  startUpdateLoop() {
    // Update systems every 1 second
    this.updateInterval = setInterval(() => {
      this.updateSystems(1); // 1 second delta
    }, 1000);
  }

  /**
   * Update all systems
   */
  async updateSystems(deltaTime) {
    for (const system of this.systems.values()) {
      if (system.initialized && system.enabled) {
        try {
          await system.update(deltaTime);
        } catch (error) {
          console.error(`Systems Manager | Error updating ${system.name}:`, error);
        }
      }
    }
  }

  /**
   * Get system by ID
   */
  getSystem(systemId) {
    return this.systems.get(systemId);
  }

  /**
   * Get all systems
   */
  getAllSystems() {
    return Array.from(this.systems.values());
  }

  /**
   * Get enabled systems
   */
  getEnabledSystems() {
    return Array.from(this.systems.values()).filter(s => s.enabled);
  }

  /**
   * Get system metadata
   */
  getSystemMetadata(systemId) {
    const system = this.systems.get(systemId);
    return system ? system.getMetadata() : null;
  }

  /**
   * Enable a system
   */
  async enableSystem(systemId) {
    const system = this.systems.get(systemId);
    if (!system) return;

    system.enabled = true;
    if (!system.initialized) {
      await system.start();
    }
  }

  /**
   * Disable a system
   */
  async disableSystem(systemId) {
    const system = this.systems.get(systemId);
    if (!system) return;

    system.enabled = false;
    if (system.initialized) {
      await system.stop();
    }
  }

  /**
   * Register hooks for system integration
   */
  registerHooks() {
    // Hook into world time updates
    Hooks.on('updateWorldTime', (worldTime, delta) => {
      // delta is in seconds
      this.updateSystems(delta);
    });

    // Allow other modules to register systems
    Hooks.on('coreConcepts.registerSystem', (system) => {
      this.registerSystem(system);
    });

    // Reload custom systems when journals change
    Hooks.on('createJournalEntry', () => this.loadCustomSystems());
    Hooks.on('updateJournalEntry', () => this.loadCustomSystems());
    Hooks.on('deleteJournalEntry', () => this.loadCustomSystems());
  }

  /**
   * Export all system data
   */
  exportAllSystems() {
    const data = {};
    for (const [id, system] of this.systems) {
      data[id] = system.exportData();
    }
    return data;
  }

  /**
   * Import system data
   */
  async importSystemData(systemId, data) {
    const system = this.systems.get(systemId);
    if (system) {
      await system.importData(data);
    }
  }

  /**
   * Cleanup
   */
  async cleanup() {
    // Stop update loop
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    // Stop all systems
    await this.stopSystems();

    // Clear registry
    this.systems.clear();
    this.systemModules.clear();
    this.initialized = false;
  }
}

/**
 * API for external modules to register systems
 */
export function registerGameSystem(system) {
  Hooks.callAll('coreConcepts.registerSystem', system);
}
