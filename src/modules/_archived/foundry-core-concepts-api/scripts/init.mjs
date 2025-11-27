/**
 * Core Concepts API Module
 * RESTful API plugin for Core Concepts with JWT authentication
 */

import { APIServer } from './api-server.mjs';
import { AuthClient } from './auth-client.mjs';
import { APIClient } from './api-client.mjs';

console.log('Core Concepts API | Loading module...');

// Module configuration
const MODULE_ID = 'foundry-core-concepts-api';
const MODULE_TITLE = 'Core Concepts API';

// Module API
export const CoreConceptsAPI = {
  MODULE_ID,
  MODULE_TITLE,
  server: null,
  auth: null,
  client: null,
  externalApiURL: null
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

  // Initialize authentication client
  CoreConceptsAPI.auth = new AuthClient();

  // Initialize API server
  CoreConceptsAPI.server = new APIServer();

  // Register API on game object
  game.coreConceptsAPI = CoreConceptsAPI;

  console.log(`${MODULE_TITLE} | Initialization complete`);
});

/**
 * Module ready - after all other modules have initialized
 */
Hooks.once('ready', async () => {
  console.log(`${MODULE_TITLE} | Ready`);

  // Get API mode
  const apiMode = game.settings.get(MODULE_ID, 'apiMode');

  // Authenticate with bridge server
  const bridgeURL = game.settings.get(MODULE_ID, 'bridgeURL');
  if (bridgeURL && CoreConceptsAPI.auth) {
    try {
      await CoreConceptsAPI.auth.authenticate(bridgeURL);
      console.log(`${MODULE_TITLE} | Authentication successful`);
    } catch (error) {
      console.error(`${MODULE_TITLE} | Authentication failed:`, error);
      if (game.user.isGM) {
        ui.notifications.error(`${MODULE_TITLE} authentication failed. Check console for details.`);
      }
    }
  }

  // Handle API mode
  if (apiMode === 'builtin') {
    // Start built-in API server
    if (CoreConceptsAPI.server) {
      await CoreConceptsAPI.server.start();
      console.log(`${MODULE_TITLE} | Built-in API server started`);
    }
  } else if (apiMode === 'external') {
    // Configure external API endpoint
    const externalApiURL = game.settings.get(MODULE_ID, 'externalApiURL');
    if (externalApiURL) {
      CoreConceptsAPI.externalApiURL = externalApiURL;

      // Initialize API client for external endpoint
      const authToken = game.settings.get(MODULE_ID, 'apiToken');
      CoreConceptsAPI.client = new APIClient(externalApiURL, authToken);

      console.log(`${MODULE_TITLE} | Using external API: ${externalApiURL}`);
      console.log(`${MODULE_TITLE} | API client initialized - accessible via game.coreConceptsAPI.client`);
    } else {
      console.warn(`${MODULE_TITLE} | External API mode selected but no URL configured`);
      if (game.user.isGM) {
        ui.notifications.warn(`${MODULE_TITLE}: External API mode requires a URL to be configured.`);
      }
    }
  }

  // Notify GM
  if (game.user.isGM) {
    const authStatus = CoreConceptsAPI.auth?.isAuthenticated() ? 'authenticated' : 'not authenticated';
    let message = '';

    if (apiMode === 'disabled') {
      message = `${MODULE_TITLE} API is disabled.`;
    } else if (apiMode === 'builtin') {
      message = `${MODULE_TITLE} built-in server active (${authStatus}).`;
    } else if (apiMode === 'external') {
      const externalApiURL = game.settings.get(MODULE_ID, 'externalApiURL');
      message = `${MODULE_TITLE} using external API: ${externalApiURL || 'NOT CONFIGURED'}`;
    }

    ui.notifications.info(message);
  }

  console.log(`${MODULE_TITLE} | Ready (mode: ${apiMode})`);
});

/**
 * Register module settings
 */
function registerSettings() {
  // API Mode
  game.settings.register(MODULE_ID, 'apiMode', {
    name: 'API Mode',
    hint: 'Choose how to expose Core Concepts data: Built-in server, External API, or Disabled',
    scope: 'world',
    config: true,
    type: String,
    choices: {
      'disabled': 'Disabled - No API access',
      'builtin': 'Built-in Server - Run API server inside Foundry',
      'external': 'External API - Connect to custom API endpoint'
    },
    default: 'disabled',
    onChange: () => window.location.reload()
  });

  // External API URL (for custom implementations)
  game.settings.register(MODULE_ID, 'externalApiURL', {
    name: 'External API URL',
    hint: 'URL of your custom Core Concepts API (e.g., https://api.yourdomain.com/api/rpg)',
    scope: 'world',
    config: true,
    type: String,
    default: '',
    onChange: () => window.location.reload()
  });

  // Bridge Server URL
  game.settings.register(MODULE_ID, 'bridgeURL', {
    name: 'Bridge Server URL',
    hint: 'URL of the Express bridge server for authentication (e.g., http://localhost:3002)',
    scope: 'world',
    config: true,
    type: String,
    default: 'http://localhost:3002',
    onChange: () => window.location.reload()
  });

  // Enable API (deprecated - use apiMode instead)
  game.settings.register(MODULE_ID, 'enableAPI', {
    name: 'Enable API Server (Legacy)',
    hint: 'DEPRECATED: Use "API Mode" setting instead',
    scope: 'world',
    config: false, // Hidden from UI
    type: Boolean,
    default: false,
    onChange: (value) => {
      // Auto-migrate to new apiMode setting
      if (value) {
        game.settings.set(MODULE_ID, 'apiMode', 'builtin');
      }
    }
  });

  // API Port
  game.settings.register(MODULE_ID, 'apiPort', {
    name: 'API Port',
    hint: 'Port for the API server (requires restart). Default: 30001 (Foundry uses 30000)',
    scope: 'world',
    config: true,
    type: Number,
    default: 30001,
    onChange: () => window.location.reload()
  });

  // API Token
  game.settings.register(MODULE_ID, 'apiToken', {
    name: 'API Authentication Token',
    hint: 'Secret token for authenticating API requests',
    scope: 'world',
    config: true,
    type: String,
    default: ''
  });

  // Enable CORS
  game.settings.register(MODULE_ID, 'enableCORS', {
    name: 'Enable CORS',
    hint: 'Allow cross-origin requests (needed for web integration)',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true
  });

  // Rate Limiting
  game.settings.register(MODULE_ID, 'enableRateLimit', {
    name: 'Enable Rate Limiting',
    hint: 'Limit API requests per minute to prevent abuse',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true
  });

  // Rate Limit
  game.settings.register(MODULE_ID, 'rateLimit', {
    name: 'Rate Limit (requests/minute)',
    hint: 'Maximum requests per minute per IP',
    scope: 'world',
    config: true,
    type: Number,
    default: 60,
    range: {
      min: 10,
      max: 1000,
      step: 10
    }
  });

  // Debug Mode
  game.settings.register(MODULE_ID, 'debugMode', {
    name: 'Debug Mode',
    hint: 'Enable detailed API logging',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false
  });
}

/**
 * Cleanup on shutdown
 */
Hooks.on('closeWorld', async () => {
  console.log(`${MODULE_TITLE} | Shutting down...`);

  await CoreConceptsAPI.server?.stop();
  CoreConceptsAPI.auth?.clearToken();
});

// Export for external access
export default CoreConceptsAPI;
