/**
 * Foundry CFG 5e Bridge Module
 * Integrates official dnd5e system with Crit-Fumble Gaming platform
 *
 * Architecture:
 *   dnd5e System (game system layer)
 *        ↓
 *   Core Concepts (universal framework - below systems)
 *        ↓
 *   CFG 5e Bridge (game-specific plugin - above system)
 *        ↓
 *   Crit-Fumble Platform (web platform sync)
 */

console.log('CFG 5e Bridge | Loading module...');

// Module configuration
const MODULE_ID = 'foundry-cfg-5e';
const MODULE_TITLE = 'CFG 5e Bridge';

// Module API
export const FoundryCFG5e = {
  MODULE_ID,
  MODULE_TITLE,
  systems: [],
  platformSync: null,
  qrCodeManager: null
};

/**
 * Initialize module on Foundry startup
 */
Hooks.once('init', async () => {
  console.log(`${MODULE_TITLE} | Initializing...`);

  // Verify game system is dnd5e
  if (game.system.id !== 'dnd5e') {
    ui.notifications.error(`${MODULE_TITLE} requires the D&D 5e game system!`);
    console.error(`${MODULE_TITLE} | Wrong game system: ${game.system.id}. Requires 'dnd5e'.`);
    return;
  }

  console.log(`${MODULE_TITLE} | Running on D&D 5e system v${game.system.version}`);

  // Check for Core Concepts dependency
  if (!game.modules.get('foundry-core-concepts')?.active) {
    ui.notifications.error(`${MODULE_TITLE} requires 'foundry-core-concepts' module!`);
    console.error(`${MODULE_TITLE} | Requires 'foundry-core-concepts' module to be active!`);
    return;
  }

  // Register module settings
  registerSettings();

  // Register API on game object
  game.cfg5e = FoundryCFG5e;

  console.log(`${MODULE_TITLE} | Initialization complete`);
});

/**
 * Module ready - after all other modules have initialized
 */
Hooks.once('ready', async () => {
  console.log(`${MODULE_TITLE} | Ready`);

  // Register CFG 5e systems with core concepts
  await registerCFGSystems();

  // Initialize platform sync if enabled
  if (game.settings.get(MODULE_ID, 'enablePlatformSync')) {
    await initializePlatformSync();
  }

  // Initialize QR code system if enabled
  if (game.settings.get(MODULE_ID, 'enableQRCodes')) {
    await initializeQRCodeSystem();
  }

  // Notify GM
  if (game.user.isGM) {
    ui.notifications.info(`${MODULE_TITLE} loaded and connected to D&D 5e system.`);
  }

  console.log(`${MODULE_TITLE} | All CFG systems initialized`);
});

/**
 * Register module settings
 */
function registerSettings() {
  // Platform Sync Settings
  game.settings.register(MODULE_ID, 'enablePlatformSync', {
    name: 'Enable Platform Sync',
    hint: 'Sync actors, items, and scenes to Crit-Fumble web platform',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
    onChange: () => window.location.reload()
  });

  game.settings.register(MODULE_ID, 'platformApiUrl', {
    name: 'Platform API URL',
    hint: 'URL for Crit-Fumble platform API',
    scope: 'world',
    config: true,
    type: String,
    default: 'https://crit-fumble.com/api',
    onChange: () => window.location.reload()
  });

  game.settings.register(MODULE_ID, 'platformApiKey', {
    name: 'Platform API Key',
    hint: 'API key for platform authentication',
    scope: 'world',
    config: true,
    type: String,
    default: '',
    onChange: () => window.location.reload()
  });

  // QR Code Settings
  game.settings.register(MODULE_ID, 'enableQRCodes', {
    name: 'Enable QR Codes',
    hint: 'Add QR codes to tokens and tiles for print versions',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
    onChange: () => window.location.reload()
  });

  game.settings.register(MODULE_ID, 'qrCodeOpacity', {
    name: 'QR Code Opacity',
    hint: 'Opacity of QR codes on print versions (0.0 - 1.0)',
    scope: 'world',
    config: true,
    type: Number,
    default: 0.15,
    range: {
      min: 0.05,
      max: 1.0,
      step: 0.05
    }
  });

  // Enable CFG Systems
  game.settings.register(MODULE_ID, 'enableCFGSystems', {
    name: 'Enable CFG Systems',
    hint: 'Enable Crit-Fumble Gaming enhanced systems',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
    onChange: () => window.location.reload()
  });

  // Enable Behaviors System
  game.settings.register(MODULE_ID, 'enableBehaviors', {
    name: 'Enable Creature Behaviors',
    hint: 'Enable AI-driven creature behavior system',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
    onChange: () => window.location.reload()
  });

  // Behavior Update Interval
  game.settings.register(MODULE_ID, 'behaviorUpdateInterval', {
    name: 'Behavior Update Interval',
    hint: 'How often behaviors update (in milliseconds)',
    scope: 'world',
    config: true,
    type: Number,
    default: 1000,
    range: {
      min: 100,
      max: 10000,
      step: 100
    }
  });

  // Debug Mode
  game.settings.register(MODULE_ID, 'debugMode', {
    name: 'Debug Mode',
    hint: 'Enable detailed logging for CFG systems',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false
  });
}

/**
 * Register CFG systems
 */
async registerCFGSystems() {
  if (!game.settings.get(MODULE_ID, 'enableCFGSystems')) return;

  const coreConcepts = game.coreConcepts;
  if (!coreConcepts) {
    console.error(`${MODULE_TITLE} | Core Concepts not available`);
    return;
  }

  // ============================================================================
  // PART 1: Extract D&D 5e System Configuration
  // This is 5e-SPECIFIC data (abilities, skills, etc.) - NOT Core Concepts
  // ============================================================================

  console.log(`${MODULE_TITLE} | Extracting D&D 5e system configuration...`);

  const { DnD5eMapper } = await import('./dnd5e-mapper.mjs');
  const mapper = new DnD5eMapper();

  if (!await mapper.initialize()) {
    console.error(`${MODULE_TITLE} | Failed to initialize dnd5e mapper`);
    return;
  }

  // Extract 5e configuration (abilities, skills, damage types, etc.)
  const dnd5eConfig = await mapper.mapAll();

  console.log(`${MODULE_TITLE} | Extracted D&D 5e configuration:`, {
    abilities: dnd5eConfig.abilities.length,
    skills: dnd5eConfig.skills.length,
    species: dnd5eConfig.species.length,
    classes: dnd5eConfig.classes.length,
    damageTypes: dnd5eConfig.damageTypes.length,
    conditions: dnd5eConfig.conditions.length,
    sizes: dnd5eConfig.sizes.length,
    alignments: dnd5eConfig.alignments.length,
    creatureTypes: dnd5eConfig.creatureTypes.length,
    itemRarity: dnd5eConfig.itemRarity.length,
    weaponMasteries: dnd5eConfig.weaponMasteries.length,
    spellSchools: dnd5eConfig.spellSchools.length,
    currencies: dnd5eConfig.currencies.length
  });

  // Store 5e configuration separately (NOT in Core Concepts)
  game.cfg5e.config = dnd5eConfig;

  // ============================================================================
  // PART 2: Load Core Concepts Data
  // This is the ACTUAL Core Concepts: Rules, Cards, Subsystems, Modes
  // ============================================================================

  console.log(`${MODULE_TITLE} | Loading Core Concepts data...`);

  try {
    // Load SRD 5.2 Rules (156 atomic rules from glossary)
    const { srdRules } = await import('../data/rules/index.mjs');

    console.log(`${MODULE_TITLE} | Loading ${srdRules.length} SRD rules into Core Concepts...`);

    // Load each rule into Core Concepts
    let loadedCount = 0;
    let skippedCount = 0;

    for (const rule of srdRules) {
      try {
        await coreConcepts.rules.createRule(
          rule.name,
          '', // trigger - rules from glossary don't have explicit triggers
          'true', // condition - always applies
          rule.description, // effect is the description
          {
            description: rule.description,
            category: rule.category,
            tags: rule.tags || [],
            metadata: {
              ...rule.metadata,
              id: rule.id,
              type: 'rule'
            }
          }
        );
        loadedCount++;
      } catch (error) {
        // Rule might already exist, that's okay
        if (error.message && error.message.includes('already exists')) {
          skippedCount++;
        } else {
          console.warn(`${MODULE_TITLE} | Failed to create rule "${rule.name}":`, error);
        }
      }
    }

    console.log(`${MODULE_TITLE} | Loaded ${loadedCount} SRD rules (${skippedCount} already existed)`);

    // Load damage types
    for (const damageType of rules5e.damageTypes) {
      try {
        await coreConcepts.rules.createRule(
          damageType.name,
          '',
          'true',
          '',
          {
            description: damageType.description,
            category: damageType.category,
            tags: damageType.tags,
            metadata: {
              ...damageType.metadata,
              type: damageType.type,
              id: damageType.id,
              icon: damageType.icon,
              color: damageType.color
            }
          }
        );
      } catch (error) {
        if (!error.message.includes('already exists')) {
          console.warn(`${MODULE_TITLE} | Failed to create rule for ${damageType.name}:`, error);
        }
      }
    }

    // Load actions
    for (const action of rules5e.actions) {
      try {
        await coreConcepts.rules.createRule(
          action.name,
          '',
          'true',
          '',
          {
            description: action.description,
            category: action.category,
            tags: action.tags,
            metadata: {
              ...action.metadata,
              type: action.type,
              id: action.id,
              icon: action.icon,
              actionType: action.actionType
            }
          }
        );
      } catch (error) {
        if (!error.message.includes('already exists')) {
          console.warn(`${MODULE_TITLE} | Failed to create rule for ${action.name}:`, error);
        }
      }
    }

    console.log(`${MODULE_TITLE} | Loaded ${rules5e.conditions.length} conditions, ${rules5e.damageTypes.length} damage types, ${rules5e.actions.length} actions`);

    // Load subsystems
    // Subsystems are stored as plain data for now - they can be enabled/disabled via settings
    // Future: Implement SubsystemsManager in Core Concepts
    game.cfg5e.subsystems = subsystems5e;
    console.log(`${MODULE_TITLE} | Loaded ${subsystems5e.length} subsystems`);

    // Load modes into Core Concepts ModesManager
    for (const mode of modes5e) {
      try {
        coreConcepts.modes.registerMode(mode.id, {
          name: mode.name,
          description: mode.description,
          icon: mode.icon,
          ui: mode.ui,
          actions: mode.actions?.map(a => a.id) || [],
          metadata: mode
        });
      } catch (error) {
        console.warn(`${MODULE_TITLE} | Failed to register mode ${mode.name}:`, error);
      }
    }
    console.log(`${MODULE_TITLE} | Loaded ${modes5e.length} game modes`);

  } catch (error) {
    console.error(`${MODULE_TITLE} | Failed to load 5e data:`, error);
  }

  // Register systems
  const systemsManager = coreConcepts.systems;
  if (!systemsManager) {
    console.error(`${MODULE_TITLE} | Core Concepts Systems Manager not available`);
    return;
  }

  console.log(`${MODULE_TITLE} | Registering CFG systems...`);

  // Register Behavior System
  if (game.settings.get(MODULE_ID, 'enableBehaviors')) {
    try {
      const { BehaviorSystem } = await import('./systems/behavior-system.mjs');
      const behaviorSystem = new BehaviorSystem();
      systemsManager.registerSystem(behaviorSystem);
      FoundryCFG5e.systems.push(behaviorSystem);
      console.log(`${MODULE_TITLE} | Registered Behavior System`);
    } catch (error) {
      console.error(`${MODULE_TITLE} | Failed to load Behavior System:`, error);
    }
  }

  // TODO: Register other CFG systems
  // Examples:
  // - Advanced Combat System
  // - Skill Challenges System
  // - Social Encounters System
  // - Crafting System
  // - Reputation System
  // - etc.

  console.log(`${MODULE_TITLE} | CFG systems registered`);
}

/**
 * Context menu for actors
 */
Hooks.on('getActorDirectoryEntryContext', (html, options) => {
  if (!game.settings.get(MODULE_ID, 'enableBehaviors')) return;

  options.push({
    name: 'Manage Behaviors',
    icon: '<i class="fas fa-brain"></i>',
    condition: () => game.user.isGM,
    callback: (li) => {
      const actor = game.actors.get(li.data('documentId'));
      if (actor) {
        showBehaviorDialog(actor);
      }
    }
  });
});

/**
 * Show behavior management dialog
 */
function showBehaviorDialog(actor) {
  const behaviorSystem = game.cfg5e.systems.find(s => s.id === 'cfg-behaviors');
  if (!behaviorSystem) {
    ui.notifications.warn('Behavior System not available');
    return;
  }

  const behaviors = behaviorSystem.manager.getAllBehaviors();
  const actorBehaviors = behaviorSystem.manager.getActorBehaviors(actor);
  const actorBehaviorIds = new Set(actorBehaviors.map(b => b.id));

  const content = `
    <div class="behavior-management">
      <h3>Manage Behaviors for ${actor.name}</h3>
      <form>
        ${behaviors.map(behavior => `
          <div class="form-group">
            <label>
              <input type="checkbox"
                     name="${behavior.id}"
                     ${actorBehaviorIds.has(behavior.id) ? 'checked' : ''}>
              <strong>${behavior.name}</strong>
              <span style="color: #666;">(${behavior.type})</span>
            </label>
            <p style="margin-left: 20px; color: #999; font-size: 12px;">
              ${behavior.description}
            </p>
          </div>
        `).join('')}
      </form>
    </div>
  `;

  new Dialog({
    title: `Behaviors - ${actor.name}`,
    content: content,
    buttons: {
      save: {
        icon: '<i class="fas fa-save"></i>',
        label: 'Save',
        callback: async (html) => {
          const manager = behaviorSystem.manager;

          // Process each behavior
          for (const behavior of behaviors) {
            const checkbox = html.find(`input[name="${behavior.id}"]`)[0];
            const isChecked = checkbox.checked;
            const hasBehavior = actorBehaviorIds.has(behavior.id);

            if (isChecked && !hasBehavior) {
              await manager.assignBehaviorToActor(behavior, actor);
            } else if (!isChecked && hasBehavior) {
              await manager.removeBehaviorFromActor(behavior, actor);
            }
          }

          ui.notifications.info(`Behaviors updated for ${actor.name}`);
        }
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: 'Cancel'
      }
    },
    default: 'save'
  }).render(true);
}

/**
 * Initialize platform sync system
 */
async function initializePlatformSync() {
  const apiUrl = game.settings.get(MODULE_ID, 'platformApiUrl');
  const apiKey = game.settings.get(MODULE_ID, 'platformApiKey');

  if (!apiKey) {
    console.warn(`${MODULE_TITLE} | Platform sync enabled but no API key configured`);
    return;
  }

  console.log(`${MODULE_TITLE} | Initializing platform sync...`);

  FoundryCFG5e.platformSync = {
    apiUrl,
    apiKey,
    async syncActor(actor) {
      if (game.settings.get(MODULE_ID, 'debugMode')) {
        console.log(`${MODULE_TITLE} | Syncing actor:`, actor.name);
      }
      // TODO: Implement actual sync
    },
    async syncItem(item) {
      if (game.settings.get(MODULE_ID, 'debugMode')) {
        console.log(`${MODULE_TITLE} | Syncing item:`, item.name);
      }
      // TODO: Implement actual sync
    },
    async syncScene(scene) {
      if (game.settings.get(MODULE_ID, 'debugMode')) {
        console.log(`${MODULE_TITLE} | Syncing scene:`, scene.name);
      }
      // TODO: Implement actual sync
    }
  };

  console.log(`${MODULE_TITLE} | Platform sync initialized`);
}

/**
 * Initialize QR code system
 * Uses Foundry Core Concepts API for game-agnostic QR code generation
 */
async function initializeQRCodeSystem() {
  console.log(`${MODULE_TITLE} | Initializing QR code system...`);

  const opacity = game.settings.get(MODULE_ID, 'qrCodeOpacity');
  const apiUrl = game.settings.get(MODULE_ID, 'platformApiUrl');

  // Get Core Concepts API URL from the module
  const coreConceptsApi = game.modules.get('foundry-core-concepts-api');
  const apiPort = coreConceptsApi?.active ? game.settings.get('foundry-core-concepts-api', 'apiPort') : null;
  const foundryApiUrl = apiPort ? `http://localhost:${apiPort}` : null;

  FoundryCFG5e.qrCodeManager = {
    opacity,
    foundryApiUrl,

    /**
     * Register asset with platform via Foundry API
     */
    async registerAsset(url, metadata = {}) {
      if (!foundryApiUrl) {
        console.warn(`${MODULE_TITLE} | Core Concepts API not available`);
        return null;
      }

      if (game.settings.get(MODULE_ID, 'debugMode')) {
        console.log(`${MODULE_TITLE} | Registering asset via API:`, url);
      }

      try {
        const response = await fetch(`${foundryApiUrl}/assets/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${game.settings.get('foundry-core-concepts-api', 'authToken')}`
          },
          body: JSON.stringify({
            url,
            metadata: {
              opacity: this.opacity,
              ...metadata
            }
          })
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.asset;
      } catch (error) {
        console.error(`${MODULE_TITLE} | Failed to register asset:`, error);
        return null;
      }
    },

    /**
     * Generate print version with QR overlay via Foundry API
     */
    async generatePrintVersion(assetId) {
      if (!foundryApiUrl) {
        console.warn(`${MODULE_TITLE} | Core Concepts API not available`);
        return null;
      }

      if (game.settings.get(MODULE_ID, 'debugMode')) {
        console.log(`${MODULE_TITLE} | Generating print version via API:`, assetId);
      }

      try {
        const params = new URLSearchParams({
          id: assetId,
          opacity: this.opacity.toString()
        });

        const response = await fetch(`${foundryApiUrl}/assets/print?${params}`, {
          headers: {
            'Authorization': `Bearer ${game.settings.get('foundry-core-concepts-api', 'authToken')}`
          }
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }

        const blob = await response.blob();
        return URL.createObjectURL(blob);
      } catch (error) {
        console.error(`${MODULE_TITLE} | Failed to generate print version:`, error);
        return null;
      }
    }
  };

  console.log(`${MODULE_TITLE} | QR code system initialized (using Core Concepts API)`);
}

/**
 * Hook: Actor created - sync to platform
 */
Hooks.on('createActor', async (actor, options, userId) => {
  if (!game.settings.get(MODULE_ID, 'enablePlatformSync')) return;
  if (!FoundryCFG5e.platformSync) return;

  try {
    await FoundryCFG5e.platformSync.syncActor(actor);

    // Register token asset if it has one
    if (actor.prototypeToken?.texture?.src && FoundryCFG5e.qrCodeManager) {
      await FoundryCFG5e.qrCodeManager.registerAsset(
        actor.prototypeToken.texture.src,
        { actorId: actor.id, actorName: actor.name, type: 'token' }
      );
    }
  } catch (error) {
    console.error(`${MODULE_TITLE} | Failed to sync actor:`, error);
  }
});

/**
 * Hook: Actor updated - sync to platform
 */
Hooks.on('updateActor', async (actor, changes, options, userId) => {
  if (!game.settings.get(MODULE_ID, 'enablePlatformSync')) return;
  if (!FoundryCFG5e.platformSync) return;

  try {
    await FoundryCFG5e.platformSync.syncActor(actor);
  } catch (error) {
    console.error(`${MODULE_TITLE} | Failed to update actor:`, error);
  }
});

/**
 * Hook: Item created - sync to platform
 */
Hooks.on('createItem', async (item, options, userId) => {
  if (!game.settings.get(MODULE_ID, 'enablePlatformSync')) return;
  if (!FoundryCFG5e.platformSync) return;

  try {
    await FoundryCFG5e.platformSync.syncItem(item);

    // Register item image if it has one
    if (item.img && FoundryCFG5e.qrCodeManager) {
      await FoundryCFG5e.qrCodeManager.registerAsset(
        item.img,
        { itemId: item.id, itemName: item.name, type: 'item' }
      );
    }
  } catch (error) {
    console.error(`${MODULE_TITLE} | Failed to sync item:`, error);
  }
});

/**
 * Hook: Scene created - sync to platform
 */
Hooks.on('createScene', async (scene, options, userId) => {
  if (!game.settings.get(MODULE_ID, 'enablePlatformSync')) return;
  if (!FoundryCFG5e.platformSync) return;

  try {
    await FoundryCFG5e.platformSync.syncScene(scene);

    // Register background image if it has one
    if (scene.background?.src && FoundryCFG5e.qrCodeManager) {
      await FoundryCFG5e.qrCodeManager.registerAsset(
        scene.background.src,
        { sceneId: scene.id, sceneName: scene.name, type: 'map' }
      );
    }
  } catch (error) {
    console.error(`${MODULE_TITLE} | Failed to sync scene:`, error);
  }
});

/**
 * Cleanup on shutdown
 */
Hooks.on('closeWorld', async () => {
  console.log(`${MODULE_TITLE} | Shutting down...`);

  for (const system of FoundryCFG5e.systems) {
    if (system.cleanup) {
      await system.cleanup();
    }
  }
});

// Export for external access
export default FoundryCFG5e;
