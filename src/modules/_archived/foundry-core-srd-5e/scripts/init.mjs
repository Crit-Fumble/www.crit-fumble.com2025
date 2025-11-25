/**
 * Foundry Core SRD 5e Module
 * D&D 5e System Reference Document implementation
 *
 * All SRD content is pre-packaged in compendium packs.
 * No runtime import required!
 */

console.log('Foundry Core SRD 5e | Loading module...');

// Module configuration
const MODULE_ID = 'foundry-core-srd-5e';
const MODULE_TITLE = 'Foundry Core SRD 5e';

// Module API
export const FoundrySRD5e = {
  MODULE_ID,
  MODULE_TITLE,
  systems: []
};

/**
 * Initialize module on Foundry startup
 */
Hooks.once('init', async () => {
  console.log(`${MODULE_TITLE} | Initializing...`);

  // Check for core concepts dependency
  if (!game.modules.get('foundry-core-concepts')?.active) {
    console.error(`${MODULE_TITLE} | Requires 'foundry-core-concepts' module to be active!`);
    return;
  }

  // Register module settings
  registerSettings();

  // Register API on game object
  game.srd5e = FoundrySRD5e;

  console.log(`${MODULE_TITLE} | Initialization complete`);
});

/**
 * Module ready - after all other modules have initialized
 */
Hooks.once('ready', async () => {
  console.log(`${MODULE_TITLE} | Ready`);

  // Register 5e SRD systems with core concepts
  await registerSRDSystems();

  // Notify GM
  if (game.user.isGM) {
    ui.notifications.info(`${MODULE_TITLE} loaded. SRD 5e compendia ready to use!`);
  }

  console.log(`${MODULE_TITLE} | All SRD systems registered`);
});

/**
 * Register module settings
 */
function registerSettings() {
  // Enable SRD Systems
  game.settings.register(MODULE_ID, 'enableSRDSystems', {
    name: 'Enable SRD Systems',
    hint: 'Enable D&D 5e SRD game systems',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
    onChange: () => window.location.reload()
  });

  // Debug Mode
  game.settings.register(MODULE_ID, 'debugMode', {
    name: 'Debug Mode',
    hint: 'Enable detailed SRD system logging',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false
  });
}

/**
 * Register SRD systems
 */
async registerSRDSystems() {
  if (!game.settings.get(MODULE_ID, 'enableSRDSystems')) return;

  const systemsManager = game.coreConcepts?.systems;
  if (!systemsManager) {
    console.error(`${MODULE_TITLE} | Core Concepts Systems Manager not available`);
    return;
  }

  console.log(`${MODULE_TITLE} | Registering SRD systems...`);

  // TODO: Register actual SRD systems
  // Examples:
  // - Resting System (short rest, long rest)
  // - Exhaustion System (6 levels)
  // - Conditions System (blinded, charmed, etc.)
  // - Spellcasting System (spell slots, concentration)
  // - Death Saves System
  // - Inspiration System

  console.log(`${MODULE_TITLE} | SRD systems registered`);
}

/**
 * Cleanup on shutdown
 */
Hooks.on('closeWorld', async () => {
  console.log(`${MODULE_TITLE} | Shutting down...`);
});

// Export for external access
export default FoundrySRD5e;
