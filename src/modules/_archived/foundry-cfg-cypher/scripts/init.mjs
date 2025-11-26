/**
 * Foundry CFG Cypher Bridge Module
 * Integrates official Cypher System with Crit-Fumble Gaming platform
 *
 * Architecture (following D&D 5e pattern):
 *   Cypher System (game system layer - mrkwnzl v3.4.3)
 *        ↓
 *   Core Concepts (universal framework)
 *        ↓
 *   CFG Cypher Bridge (game-specific adapter - this module)
 *        ↓
 *   Crit-Fumble Platform (web platform sync)
 *
 * LICENSE: Module code is MIT. CSRD content is CSOL. See LICENSE-CSOL.
 */

import { CypherSystemAdapter } from './cypher-system-adapter.mjs';
import { CharacterSentenceBuilder } from './character-sentence.mjs';

console.log('CFG Cypher Bridge | Loading module...');

// Module configuration
const MODULE_ID = 'foundry-cfg-cypher';
const MODULE_TITLE = 'CFG Cypher Bridge';

// Module API
export const FoundryCFGCypher = {
  MODULE_ID,
  MODULE_TITLE,
  adapter: null,
  sentenceBuilder: CharacterSentenceBuilder
};

/**
 * Initialize module on Foundry startup
 */
Hooks.once('init', async () => {
  console.log(`${MODULE_TITLE} | Initializing...`);

  // Verify game system is cyphersystem
  if (game.system.id !== 'cyphersystem') {
    ui.notifications.error(`${MODULE_TITLE} requires the Cypher System game system!`);
    console.error(`${MODULE_TITLE} | Wrong game system: ${game.system.id}. Requires 'cyphersystem'.`);
    return;
  }

  console.log(`${MODULE_TITLE} | Running on Cypher System v${game.system.version}`);

  // Check for Core Concepts dependency
  if (!game.modules.get('foundry-core-concepts')?.active) {
    ui.notifications.error(`${MODULE_TITLE} requires 'foundry-core-concepts' module!`);
    console.error(`${MODULE_TITLE} | Requires 'foundry-core-concepts' module to be active!`);
    return;
  }

  // Register module settings
  registerSettings();

  // Register API on game object
  game.cfgCypher = FoundryCFGCypher;

  console.log(`${MODULE_TITLE} | Initialization complete`);
});

/**
 * Module ready - after all other modules have initialized
 */
Hooks.once('ready', async () => {
  console.log(`${MODULE_TITLE} | Ready`);

  // Wait for Core Concepts to be fully initialized
  if (!game.coreConcepts) {
    console.error(`${MODULE_TITLE} | Core Concepts not available!`);
    return;
  }

  // Initialize Cypher System adapter
  const adapter = new CypherSystemAdapter();
  const initialized = await adapter.initialize();

  if (!initialized) {
    console.error(`${MODULE_TITLE} | Failed to initialize adapter`);
    return;
  }

  // Register adapter with Core Concepts SystemsManager
  if (game.coreConcepts.systems) {
    game.coreConcepts.systems.registerAdapter('cyphersystem', adapter);
    console.log(`${MODULE_TITLE} | Adapter registered with Core Concepts`);
  }

  // Register CSRD types with TypesRegistry
  if (game.coreConcepts.types) {
    adapter.registerWithCoreСoncepts();
    console.log(`${MODULE_TITLE} | CSRD types registered with TypesRegistry`);
  }

  // Store adapter reference
  game.cfgCypher.adapter = adapter;

  // Convenience methods for accessing CSRD data
  game.cfgCypher.getDescriptors = (category = null) => {
    if (!game.coreConcepts?.types) return [];

    const descriptors = game.coreConcepts.types.getByCategory('cypher-descriptor');

    if (category) {
      return descriptors.filter(d => d.category === category);
    }

    return descriptors;
  };

  game.cfgCypher.getTypes = (category = null) => {
    if (!game.coreConcepts?.types) return [];

    const types = game.coreConcepts.types.getByCategory('cypher-type');

    if (category) {
      return types.filter(t => t.category === category);
    }

    return types;
  };

  game.cfgCypher.getFoci = (category = null) => {
    if (!game.coreConcepts?.types) return [];

    const foci = game.coreConcepts.types.getByCategory('cypher-focus');

    if (category) {
      return foci.filter(f => f.category === category);
    }

    return foci;
  };

  // Convenience method for building character sentences
  game.cfgCypher.buildSentence = (descriptor, type, focus) => {
    return CharacterSentenceBuilder.build({ descriptor, type, focus });
  };

  // Convenience method for parsing character sentences
  game.cfgCypher.parseSentence = (sentence) => {
    return CharacterSentenceBuilder.parse(sentence);
  };

  // Initialize platform sync if enabled
  if (game.settings.get(MODULE_ID, 'enablePlatformSync')) {
    await initializePlatformSync();
  }

  // Notify GM
  if (game.user.isGM) {
    const descriptorCount = game.cfgCypher.getDescriptors().length;
    const typeCount = game.cfgCypher.getTypes().length;
    const fociCount = game.cfgCypher.getFoci().length;

    ui.notifications.info(`${MODULE_TITLE} loaded and connected to Cypher System. CSRD data: ${descriptorCount} descriptors, ${typeCount} types, ${fociCount} foci.`);
  }

  console.log(`${MODULE_TITLE} | All systems initialized`);
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
    hint: 'URL of the Crit-Fumble platform API',
    scope: 'world',
    config: true,
    type: String,
    default: 'https://crit-fumble.com/api'
  });

  game.settings.register(MODULE_ID, 'platformApiKey', {
    name: 'Platform API Key',
    hint: 'API key for authenticating with the platform',
    scope: 'world',
    config: true,
    type: String,
    default: ''
  });

  // Game Mode Settings
  game.settings.register(MODULE_ID, 'gameMode', {
    name: 'Game Mode',
    hint: 'Which Cypher System game are you playing?',
    scope: 'world',
    config: true,
    type: String,
    choices: {
      'cypher': 'Generic Cypher System',
      'numenera': 'Numenera',
      'the-strange': 'The Strange',
      'predation': 'Predation',
      'gods-of-the-fall': 'Gods of the Fall',
      'unmasked': 'Unmasked',
      'fairy-tale': 'Fairy Tale',
      'weird-west': 'Weird West',
      'cyberpunk': 'Cyberpunk'
    },
    default: 'cypher'
  });

  // Debug Mode
  game.settings.register(MODULE_ID, 'debugMode', {
    name: 'Debug Mode',
    hint: 'Enable detailed logging for troubleshooting',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false
  });
}

/**
 * Initialize platform sync
 */
async function initializePlatformSync() {
  console.log(`${MODULE_TITLE} | Initializing platform sync...`);

  const apiUrl = game.settings.get(MODULE_ID, 'platformApiUrl');
  const apiKey = game.settings.get(MODULE_ID, 'platformApiKey');

  if (!apiUrl || !apiKey) {
    console.warn(`${MODULE_TITLE} | Platform sync enabled but API URL or key not configured`);
    return;
  }

  // Hook into actor creation/updates
  Hooks.on('createActor', async (actor, options, userId) => {
    if (game.settings.get(MODULE_ID, 'debugMode')) {
      console.log(`${MODULE_TITLE} | Actor created:`, actor.name);
    }

    await syncActor(actor);
  });

  Hooks.on('updateActor', async (actor, changes, options, userId) => {
    if (game.settings.get(MODULE_ID, 'debugMode')) {
      console.log(`${MODULE_TITLE} | Actor updated:`, actor.name);
    }

    await syncActor(actor);
  });

  // Hook into item creation
  Hooks.on('createItem', async (item, options, userId) => {
    if (game.settings.get(MODULE_ID, 'debugMode')) {
      console.log(`${MODULE_TITLE} | Item created:`, item.name);
    }

    await syncItem(item);
  });

  // Hook into scene creation
  Hooks.on('createScene', async (scene, options, userId) => {
    if (game.settings.get(MODULE_ID, 'debugMode')) {
      console.log(`${MODULE_TITLE} | Scene created:`, scene.name);
    }

    await syncScene(scene);
  });

  console.log(`${MODULE_TITLE} | Platform sync initialized`);
}

/**
 * Sync actor to platform
 */
async function syncActor(actor) {
  if (!game.cfgCypher.adapter) {
    console.warn(`${MODULE_TITLE} | Adapter not available for sync`);
    return;
  }

  try {
    const creatureData = game.cfgCypher.adapter.mapActorToCreature(actor);

    if (!creatureData) {
      console.warn(`${MODULE_TITLE} | Unsupported actor type: ${actor.type}`);
      return;
    }

    const apiUrl = game.settings.get(MODULE_ID, 'platformApiUrl');
    const apiKey = game.settings.get(MODULE_ID, 'platformApiKey');

    const response = await fetch(`${apiUrl}/foundry/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        entity: 'creatures',
        data: creatureData
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    if (game.settings.get(MODULE_ID, 'debugMode')) {
      console.log(`${MODULE_TITLE} | Actor synced:`, actor.name);
    }
  } catch (error) {
    console.error(`${MODULE_TITLE} | Failed to sync actor:`, error);
  }
}

/**
 * Sync item to platform
 */
async function syncItem(item) {
  if (!game.cfgCypher.adapter) {
    console.warn(`${MODULE_TITLE} | Adapter not available for sync`);
    return;
  }

  try {
    const itemData = game.cfgCypher.adapter.mapItemToRpgItem(item);

    const apiUrl = game.settings.get(MODULE_ID, 'platformApiUrl');
    const apiKey = game.settings.get(MODULE_ID, 'platformApiKey');

    const response = await fetch(`${apiUrl}/foundry/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        entity: 'things',
        data: itemData
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    if (game.settings.get(MODULE_ID, 'debugMode')) {
      console.log(`${MODULE_TITLE} | Item synced:`, item.name);
    }
  } catch (error) {
    console.error(`${MODULE_TITLE} | Failed to sync item:`, error);
  }
}

/**
 * Sync scene to platform
 */
async function syncScene(scene) {
  if (!game.cfgCypher.adapter) {
    console.warn(`${MODULE_TITLE} | Adapter not available for sync`);
    return;
  }

  try {
    const boardData = game.cfgCypher.adapter.mapSceneToBoard(scene);

    const apiUrl = game.settings.get(MODULE_ID, 'platformApiUrl');
    const apiKey = game.settings.get(MODULE_ID, 'platformApiKey');

    const response = await fetch(`${apiUrl}/foundry/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        entity: 'boards',
        data: boardData
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    if (game.settings.get(MODULE_ID, 'debugMode')) {
      console.log(`${MODULE_TITLE} | Scene synced:`, scene.name);
    }
  } catch (error) {
    console.error(`${MODULE_TITLE} | Failed to sync scene:`, error);
  }
}

// Export for external access
export default FoundryCFGCypher;
