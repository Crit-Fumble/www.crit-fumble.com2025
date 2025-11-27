/**
 * Region Events Manager
 * Captures location-driven events from Foundry VTT regions and logs them
 * Integrates with the RpgEvent system for comprehensive event tracking
 */

export class RegionEventsManager {
  constructor() {
    this.eventQueue = [];
    this.processingInterval = null;
    this.apiClient = null;
  }

  /**
   * Initialize the manager
   */
  async initialize() {
    console.log('Region Events Manager | Initializing...');

    // Get API client from core concepts API module
    this.apiClient = game.modules.get('foundry-core-concepts-api')?.api?.client;

    if (!this.apiClient) {
      console.warn('Region Events Manager | API client not available, events will be queued locally');
    }

    // Register region event hooks
    this.registerHooks();

    // Start processing queue every 5 seconds
    this.processingInterval = setInterval(() => this.processQueue(), 5000);

    console.log('Region Events Manager | Initialized');
  }

  /**
   * Register Foundry hooks for region events
   */
  registerHooks() {
    // Token enters region
    Hooks.on('tokenMoveIn', (region, token, event) => {
      this.handleTokenMoveIn(region, token, event);
    });

    // Token exits region
    Hooks.on('tokenMoveOut', (region, token, event) => {
      this.handleTokenMoveOut(region, token, event);
    });

    // Token moves within region
    Hooks.on('tokenMoveWithin', (region, token, event) => {
      this.handleTokenMoveWithin(region, token, event);
    });

    // Region boundary changed
    Hooks.on('regionBoundary', (region, event) => {
      this.handleRegionBoundary(region, event);
    });

    console.log('Region Events Manager | Hooks registered');
  }

  /**
   * Handle token entering a region
   */
  handleTokenMoveIn(region, token, event) {
    const eventData = this.buildEventData({
      eventType: 'region_enter',
      action: `${token.name} enters ${region.name}`,
      description: `Token entered region at ${new Date().toISOString()}`,
      region,
      token,
      event,
      movementData: event.data?.movement
    });

    this.queueEvent(eventData);
  }

  /**
   * Handle token exiting a region
   */
  handleTokenMoveOut(region, token, event) {
    const eventData = this.buildEventData({
      eventType: 'region_exit',
      action: `${token.name} exits ${region.name}`,
      description: `Token exited region at ${new Date().toISOString()}`,
      region,
      token,
      event,
      movementData: event.data?.movement
    });

    this.queueEvent(eventData);
  }

  /**
   * Handle token moving within a region
   */
  handleTokenMoveWithin(region, token, event) {
    const eventData = this.buildEventData({
      eventType: 'token_move_within',
      action: `${token.name} moves in ${region.name}`,
      description: `Token moved within region at ${new Date().toISOString()}`,
      region,
      token,
      event,
      movementData: event.data?.movement
    });

    this.queueEvent(eventData);
  }

  /**
   * Handle region boundary changes
   */
  handleRegionBoundary(region, event) {
    const eventData = this.buildEventData({
      eventType: 'region_boundary_change',
      action: `${region.name} boundary changed`,
      description: `Region boundary was modified at ${new Date().toISOString()}`,
      region,
      event
    });

    this.queueEvent(eventData);
  }

  /**
   * Build standardized event data for logging
   */
  buildEventData({ eventType, action, description, region, token, event, movementData }) {
    const sessionId = game.settings.get('foundry-core-concepts', 'currentSessionId') || 'default-session';

    // Extract player info
    const players = [];
    if (token?.actor) {
      const actor = token.actor;
      // Get the player who owns this actor
      const ownership = actor.ownership || {};
      Object.keys(ownership).forEach(userId => {
        if (ownership[userId] >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER) {
          const user = game.users.get(userId);
          if (user) {
            players.push({
              userId: user.id,
              userName: user.name,
              actorId: actor.id,
              actorName: actor.name
            });
          }
        }
      });
    }

    // Extract token data
    const tokens = [];
    if (token) {
      tokens.push({
        tokenId: token.id,
        name: token.name,
        position: {
          x: token.x,
          y: token.y,
          elevation: token.elevation || 0
        },
        dimensions: {
          width: token.width,
          height: token.height
        },
        actorId: token.actor?.id,
        actorName: token.actor?.name,
        img: token.texture?.src || token.img
      });
    }

    // Extract location data (region as location)
    const locations = [];
    if (region) {
      locations.push({
        regionId: region.id,
        regionName: region.name,
        sceneId: region.parent?.id,
        sceneName: region.parent?.name,
        shapes: region.shapes?.map(s => ({
          type: s.type,
          points: s.points,
          hole: s.hole
        })) || [],
        elevation: {
          bottom: region.elevation?.bottom,
          top: region.elevation?.top
        }
      });
    }

    // Build movement data
    const movement = movementData ? {
      origin: movementData.origin,
      destination: movementData.destination,
      waypoints: movementData.passed?.waypoints || [],
      distance: movementData.passed?.distance || 0,
      cost: movementData.passed?.cost || 0
    } : null;

    // Build system-specific data
    const systemData = {
      foundry: {
        version: game.version,
        system: game.system.id,
        systemVersion: game.system.version,
        sceneId: canvas.scene?.id,
        sceneName: canvas.scene?.name,
        regionId: region?.id,
        regionName: region?.name,
        tokenId: token?.id,
        userId: game.userId,
        userName: game.user.name,
        timestamp: new Date().toISOString()
      },
      event: event?.name ? {
        name: event.name,
        user: event.user?.id,
        data: event.data
      } : null
    };

    return {
      eventType,
      action,
      description,
      sessionId,
      players,
      tokens,
      locations,
      things: [], // Could be populated with doors, furniture, etc.
      movement,
      systemData,
      metadata: {
        source: 'foundry-vtt',
        module: 'foundry-core-concepts',
        capturedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Queue an event for processing
   */
  queueEvent(eventData) {
    this.eventQueue.push(eventData);
    console.log(`Region Events Manager | Event queued: ${eventData.eventType} - ${eventData.action}`);

    // If queue is getting large, process immediately
    if (this.eventQueue.length > 10) {
      this.processQueue();
    }
  }

  /**
   * Process queued events
   */
  async processQueue() {
    if (this.eventQueue.length === 0) return;
    if (!this.apiClient) {
      console.warn('Region Events Manager | API client not available, keeping events in queue');
      return;
    }

    const eventsToProcess = [...this.eventQueue];
    this.eventQueue = [];

    console.log(`Region Events Manager | Processing ${eventsToProcess.length} events...`);

    for (const eventData of eventsToProcess) {
      try {
        await this.apiClient.logEvent(eventData);
        console.log(`Region Events Manager | Event logged: ${eventData.eventType}`);
      } catch (error) {
        console.error('Region Events Manager | Failed to log event:', error);
        // Re-queue the event
        this.eventQueue.push(eventData);
      }
    }
  }

  /**
   * Get current event queue status
   */
  getQueueStatus() {
    return {
      queueLength: this.eventQueue.length,
      events: this.eventQueue.map(e => ({
        type: e.eventType,
        action: e.action,
        timestamp: e.metadata.capturedAt
      }))
    };
  }

  /**
   * Manually log a custom event
   */
  async logCustomEvent({ eventType, action, description, players, tokens, locations, things, systemData }) {
    const sessionId = game.settings.get('foundry-core-concepts', 'currentSessionId') || 'default-session';

    const eventData = {
      eventType,
      action,
      description,
      sessionId,
      players: players || [],
      tokens: tokens || [],
      locations: locations || [],
      things: things || [],
      movement: null,
      systemData: systemData || {},
      metadata: {
        source: 'foundry-vtt',
        module: 'foundry-core-concepts',
        capturedAt: new Date().toISOString(),
        manual: true
      }
    };

    this.queueEvent(eventData);
  }

  /**
   * Cleanup
   */
  async cleanup() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    // Process any remaining events
    await this.processQueue();

    console.log('Region Events Manager | Cleaned up');
  }
}

export default RegionEventsManager;
