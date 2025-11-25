/**
 * Foundry Core Concepts Module
 * Implements unified TTRPG core concepts for Foundry VTT
 */

import { TypesRegistry } from './types-registry.mjs';
import { BooksManager } from './books-manager.mjs';
import { RulesEngine } from './rules-engine.mjs';
import { ModesManager } from './modes-manager.mjs';
import { DecksManager } from './decks-manager.mjs';
import { SystemsManager } from './systems-manager.mjs';
import { EntityCardsManager } from './entity-cards.mjs';
import { PlayersManager } from './players-manager.mjs';
import { TeamsManager } from './teams-manager.mjs';
import { RegionEventsManager } from './region-events-manager.mjs';
import { AssetsManager } from './assets-manager.mjs';

console.log('Foundry Core Concepts | Loading module...');

// Module configuration
const MODULE_ID = 'foundry-core-concepts';
const MODULE_TITLE = 'Foundry Core Concepts';

// Module API
export const CoreConcepts = {
  MODULE_ID,
  MODULE_TITLE,
  types: null,
  books: null,
  rules: null,
  modes: null,
  decks: null,
  systems: null,
  entityCards: null,
  players: null,
  teams: null,
  regionEvents: null,
  assets: null
};

/**
 * Initialize module on Foundry startup
 */
Hooks.once('init', async () => {
  console.log(`${MODULE_TITLE} | Initializing...`);

  // Register module settings
  registerSettings();

  // Initialize core systems
  CoreConcepts.types = new TypesRegistry();
  CoreConcepts.books = new BooksManager();
  CoreConcepts.rules = new RulesEngine();
  CoreConcepts.modes = new ModesManager();
  CoreConcepts.decks = new DecksManager();
  CoreConcepts.systems = new SystemsManager();
  CoreConcepts.entityCards = new EntityCardsManager();
  CoreConcepts.players = new PlayersManager();
  CoreConcepts.teams = new TeamsManager();
  CoreConcepts.regionEvents = new RegionEventsManager();
  CoreConcepts.assets = new AssetsManager();

  // Register custom document types
  await registerDocumentTypes();

  // Register API on game object
  game.coreConcepts = CoreConcepts;

  console.log(`${MODULE_TITLE} | Initialization complete`);
});

/**
 * Module ready - after all other modules have initialized
 */
Hooks.once('ready', async () => {
  console.log(`${MODULE_TITLE} | Ready`);

  // Initialize managers
  await CoreConcepts.types.initialize();
  await CoreConcepts.books.initialize();
  await CoreConcepts.rules.initialize();
  await CoreConcepts.modes.initialize();
  await CoreConcepts.decks.initialize();
  await CoreConcepts.systems.initialize();
  await CoreConcepts.entityCards.initialize();
  await CoreConcepts.players.initialize();
  await CoreConcepts.teams.initialize();
  await CoreConcepts.regionEvents.initialize();
  await CoreConcepts.assets.initialize();

  // Notify GM
  if (game.user.isGM) {
    ui.notifications.info(`${MODULE_TITLE} is active. Enhanced TTRPG concepts available.`);
  }

  console.log(`${MODULE_TITLE} | All systems initialized`);
});

/**
 * Register module settings
 */
function registerSettings() {
  // Enable Types System
  game.settings.register(MODULE_ID, 'enableTypes', {
    name: 'Enable Types System',
    hint: 'Enable unified type definitions (classes, creature types, etc.)',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
    onChange: () => window.location.reload()
  });

  // Enable Books System
  game.settings.register(MODULE_ID, 'enableBooks', {
    name: 'Enable Books System',
    hint: 'Enable enhanced books with cards, tables, and rules',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
    onChange: () => window.location.reload()
  });

  // Enable Rules Engine
  game.settings.register(MODULE_ID, 'enableRules', {
    name: 'Enable Rules Engine',
    hint: 'Enable formal rules system with triggers and effects',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
    onChange: () => window.location.reload()
  });

  // Enable Modes System
  game.settings.register(MODULE_ID, 'enableModes', {
    name: 'Enable Game Modes',
    hint: 'Enable game mode system (Exploration, Social, Travel, etc.)',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
    onChange: () => window.location.reload()
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

  // API Integration Token
  game.settings.register(MODULE_ID, 'apiToken', {
    name: 'Crit-Fumble API Token',
    hint: 'Authentication token for Crit-Fumble platform integration',
    scope: 'world',
    config: true,
    type: String,
    default: ''
  });

  // Platform URL
  game.settings.register(MODULE_ID, 'platformUrl', {
    name: 'Platform URL',
    hint: 'URL of the Crit-Fumble platform (e.g., https://crit-fumble.com)',
    scope: 'world',
    config: true,
    type: String,
    default: 'http://localhost:3000'
  });

  // Platform API Key
  game.settings.register(MODULE_ID, 'platformApiKey', {
    name: 'Platform API Key',
    hint: 'API key for platform authentication',
    scope: 'world',
    config: true,
    type: String,
    default: ''
  });

  // Cached Assets (hidden setting)
  game.settings.register(MODULE_ID, 'cachedAssets', {
    name: 'Cached Assets',
    scope: 'world',
    config: false,
    type: Object,
    default: {}
  });
}

/**
 * Register custom document types
 */
async function registerDocumentTypes() {
  console.log(`${MODULE_TITLE} | Registering custom document types...`);

  // Document types are registered by the individual managers
  // This is a placeholder for any global document registration
}

/**
 * Cleanup on shutdown
 */
Hooks.on('closeWorld', async () => {
  console.log(`${MODULE_TITLE} | Shutting down...`);

  await CoreConcepts.types?.cleanup();
  await CoreConcepts.books?.cleanup();
  await CoreConcepts.rules?.cleanup();
  await CoreConcepts.modes?.cleanup();
  await CoreConcepts.decks?.cleanup();
  await CoreConcepts.systems?.cleanup();
  await CoreConcepts.entityCards?.cleanup();
  await CoreConcepts.players?.cleanup();
  await CoreConcepts.teams?.cleanup();
  await CoreConcepts.regionEvents?.cleanup();
  await CoreConcepts.assets?.cleanup();
});

// Export for external access
export default CoreConcepts;
