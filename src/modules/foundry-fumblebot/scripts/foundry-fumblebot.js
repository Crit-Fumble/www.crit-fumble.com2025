/**
 * Foundry FumbleBot Integration Module
 *
 * Provides REST API endpoints for FumbleBot to interact with Foundry VTT
 * Version: 0.1.0 (Proof of Concept)
 */

// Module initialization
Hooks.once('init', async function() {
  console.log('Foundry FumbleBot | Initializing module...');

  // Register module settings
  game.settings.register('foundry-fumblebot', 'apiKey', {
    name: 'Bot API Key',
    hint: 'API key for FumbleBot authentication (auto-generated)',
    scope: 'world',
    config: false,
    type: String,
    default: ''
  });

  game.settings.register('foundry-fumblebot', 'enabled', {
    name: 'Enable FumbleBot Integration',
    hint: 'Allow FumbleBot to interact with this world',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false
  });

  console.log('Foundry FumbleBot | Module settings registered');
});

// Module ready
Hooks.once('ready', async function() {
  console.log('Foundry FumbleBot | Module ready');

  // TODO: Generate API key if not exists
  // TODO: Create bot user account if enabled
  // TODO: Initialize REST API server

  // Register simple health check endpoint (POC)
  if (typeof game.modules.get('foundry-fumblebot')?.api !== 'undefined') {
    console.log('Foundry FumbleBot | API endpoints registered');
  }
});

/**
 * Simple REST API Handler (Proof of Concept)
 *
 * In a full implementation, this would be replaced with a proper Express/Fastify server
 * For POC, we'll use Foundry's socket.io to expose endpoints
 */
class FumbleBotAPI {
  /**
   * Health check endpoint
   * GET /api/fumblebot/health
   */
  static async health() {
    return {
      status: 'ok',
      version: '0.1.0',
      foundryVersion: game.version,
      worldId: game.world.id,
      worldTitle: game.world.title,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get chat messages (stub for Phase 1)
   * GET /api/fumblebot/chat
   */
  static async getChat(limit = 10) {
    // TODO: Implement in Phase 1
    return {
      messages: [],
      total: 0,
      error: 'Not implemented - Phase 1'
    };
  }

  /**
   * Send chat message (stub for Phase 1)
   * POST /api/fumblebot/chat
   */
  static async sendChat(message, options = {}) {
    // TODO: Implement in Phase 1
    return {
      success: false,
      error: 'Not implemented - Phase 1'
    };
  }
}

// Export API for socket.io access
if (typeof game !== 'undefined') {
  game.modules.get('foundry-fumblebot').api = FumbleBotAPI;
}

// Socket.io handler for external requests (POC approach)
Hooks.on('ready', () => {
  if (!game.user.isGM) return; // Only GMs can handle API requests

  game.socket.on('module.foundry-fumblebot', async (data) => {
    const { action, params, requestId } = data;

    console.log(`Foundry FumbleBot | Received request: ${action}`);

    let response;
    try {
      switch (action) {
        case 'health':
          response = await FumbleBotAPI.health();
          break;
        case 'getChat':
          response = await FumbleBotAPI.getChat(params?.limit);
          break;
        case 'sendChat':
          response = await FumbleBotAPI.sendChat(params?.message, params?.options);
          break;
        default:
          response = { error: `Unknown action: ${action}` };
      }
    } catch (error) {
      console.error(`Foundry FumbleBot | Error handling ${action}:`, error);
      response = { error: error.message };
    }

    // Send response back via socket
    game.socket.emit('module.foundry-fumblebot.response', {
      requestId,
      response
    });
  });

  console.log('Foundry FumbleBot | Socket handlers registered');
});

console.log('Foundry FumbleBot | Module loaded');
