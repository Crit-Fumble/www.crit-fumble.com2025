/**
 * Core Concepts API Server
 *
 * Provides RESTful API endpoints for Core Concepts data in Foundry VTT.
 * Exposes sheets, attributes, types, cards, books, modes, systems, and all Core Concepts schema.
 * Note: This is a socket-based API implementation since Foundry runs in browser.
 * For a true HTTP server with Auth.js, use the Express bridge server.
 */

const MODULE_ID = 'foundry-core-concepts-api';

export class APIServer {
  constructor() {
    this.running = false;
    this.routes = new Map();
    this.middleware = [];
    this.rateLimiter = new Map(); // IP -> { count, resetTime }
  }

  /**
   * Start the API server
   */
  async start() {
    if (this.running) {
      console.warn('API Server | Already running');
      return;
    }

    console.log('API Server | Starting...');

    // Register endpoints
    this.registerEndpoints();

    // Register socket listeners
    this.registerSocketListeners();

    this.running = true;
    console.log('API Server | Started successfully');

    // Log API URL
    const apiUrl = `ws://${window.location.hostname}:${window.location.port}/api`;
    console.log(`API Server | Available at: ${apiUrl}`);
  }

  /**
   * Stop the API server
   */
  async stop() {
    if (!this.running) return;

    console.log('API Server | Stopping...');

    // Unregister socket listeners
    game.socket.off('module.foundry-core-concepts-api');

    this.running = false;
    console.log('API Server | Stopped');
  }

  /**
   * Register socket listeners
   */
  registerSocketListeners() {
    game.socket.on('module.foundry-core-concepts-api', async (request) => {
      const response = await this.handleRequest(request);
      return response;
    });
  }

  /**
   * Handle API request
   */
  async handleRequest(request) {
    const { method, path, headers, body, clientId } = request;

    try {
      // Authenticate
      if (!this.authenticate(headers)) {
        return this.createResponse(401, { error: 'Unauthorized' });
      }

      // Rate limit
      if (!this.checkRateLimit(clientId)) {
        return this.createResponse(429, { error: 'Rate limit exceeded' });
      }

      // Find route
      const handler = this.routes.get(`${method} ${path}`);
      if (!handler) {
        return this.createResponse(404, { error: 'Endpoint not found' });
      }

      // Execute handler
      const result = await handler(request);
      return this.createResponse(200, result);

    } catch (error) {
      console.error('API Server | Error handling request:', error);
      return this.createResponse(500, { error: error.message });
    }
  }

  /**
   * Authenticate request
   */
  authenticate(headers) {
    const token = game.settings.get(MODULE_ID, 'apiToken');
    if (!token) return true; // No token configured, allow all

    const authHeader = headers?.['authorization'];
    if (!authHeader) return false;

    const bearerToken = authHeader.replace('Bearer ', '');
    return bearerToken === token;
  }

  /**
   * Check rate limit
   */
  checkRateLimit(clientId) {
    if (!game.settings.get(MODULE_ID, 'enableRateLimit')) {
      return true;
    }

    const limit = game.settings.get(MODULE_ID, 'rateLimit');
    const now = Date.now();
    const resetTime = 60000; // 1 minute

    if (!this.rateLimiter.has(clientId)) {
      this.rateLimiter.set(clientId, { count: 1, resetTime: now + resetTime });
      return true;
    }

    const limiter = this.rateLimiter.get(clientId);

    // Reset if time expired
    if (now > limiter.resetTime) {
      limiter.count = 1;
      limiter.resetTime = now + resetTime;
      return true;
    }

    // Check limit
    if (limiter.count >= limit) {
      return false;
    }

    limiter.count++;
    return true;
  }

  /**
   * Create API response
   */
  createResponse(status, data) {
    return {
      status,
      data,
      timestamp: Date.now()
    };
  }

  /**
   * Register route
   */
  route(method, path, handler) {
    this.routes.set(`${method} ${path}`, handler);
  }

  /**
   * Register all API endpoints
   */
  registerEndpoints() {
    // Health check
    this.route('GET', '/health', async () => {
      return { status: 'ok', foundry: game.data.version };
    });

    // Get world info
    this.route('GET', '/world', async () => {
      return {
        id: game.world.id,
        title: game.world.title,
        system: game.system.id,
        version: game.data.version
      };
    });

    // Actors
    this.route('GET', '/actors', async () => {
      return game.actors.map(a => this.serializeActor(a));
    });

    this.route('GET', '/actors/:id', async (req) => {
      const actor = game.actors.get(req.params.id);
      if (!actor) throw new Error('Actor not found');
      return this.serializeActor(actor, true);
    });

    this.route('POST', '/actors', async (req) => {
      const actor = await Actor.create(req.body);
      return this.serializeActor(actor);
    });

    this.route('PATCH', '/actors/:id', async (req) => {
      const actor = game.actors.get(req.params.id);
      if (!actor) throw new Error('Actor not found');
      await actor.update(req.body);
      return this.serializeActor(actor);
    });

    this.route('DELETE', '/actors/:id', async (req) => {
      const actor = game.actors.get(req.params.id);
      if (!actor) throw new Error('Actor not found');
      await actor.delete();
      return { success: true };
    });

    // Items
    this.route('GET', '/items', async () => {
      return game.items.map(i => this.serializeItem(i));
    });

    this.route('GET', '/items/:id', async (req) => {
      const item = game.items.get(req.params.id);
      if (!item) throw new Error('Item not found');
      return this.serializeItem(item, true);
    });

    // Scenes
    this.route('GET', '/scenes', async () => {
      return game.scenes.map(s => this.serializeScene(s));
    });

    this.route('GET', '/scenes/:id', async (req) => {
      const scene = game.scenes.get(req.params.id);
      if (!scene) throw new Error('Scene not found');
      return this.serializeScene(scene, true);
    });

    // Journal entries
    this.route('GET', '/journal', async () => {
      return game.journal.map(j => this.serializeJournal(j));
    });

    this.route('GET', '/journal/:id', async (req) => {
      const journal = game.journal.get(req.params.id);
      if (!journal) throw new Error('Journal not found');
      return this.serializeJournal(journal, true);
    });

    // Core Concepts - Types
    this.route('GET', '/types', async () => {
      if (!game.coreConcepts?.types) {
        throw new Error('Core Concepts not available');
      }
      return game.coreConcepts.types.getAllTypes();
    });

    // Core Concepts - Books
    this.route('GET', '/books', async () => {
      if (!game.coreConcepts?.books) {
        throw new Error('Core Concepts not available');
      }
      return game.coreConcepts.books.getAllBooks();
    });

    // Core Concepts - Rules
    this.route('GET', '/rules', async () => {
      if (!game.coreConcepts?.rules) {
        throw new Error('Core Concepts not available');
      }
      return game.coreConcepts.rules.getAllRules();
    });

    // Core Concepts - Modes
    this.route('GET', '/modes', async () => {
      if (!game.coreConcepts?.modes) {
        throw new Error('Core Concepts not available');
      }
      return {
        current: game.coreConcepts.modes.currentMode,
        available: game.coreConcepts.modes.modes
      };
    });

    this.route('POST', '/modes/set', async (req) => {
      if (!game.coreConcepts?.modes) {
        throw new Error('Core Concepts not available');
      }
      await game.coreConcepts.modes.setMode(req.body.modeId);
      return { success: true, mode: req.body.modeId };
    });

    // Core Concepts - Systems
    this.route('GET', '/systems', async () => {
      if (!game.coreConcepts?.systems) {
        throw new Error('Core Concepts not available');
      }
      return game.coreConcepts.systems.getAllSystems().map(s => s.getMetadata());
    });

    // Behaviors
    this.route('GET', '/behaviors', async () => {
      if (!game.foundryBehaviors?.manager) {
        throw new Error('Behaviors module not available');
      }
      return game.foundryBehaviors.manager.getAllBehaviors().map(b => b.getMetadata());
    });

    this.route('GET', '/actors/:id/behaviors', async (req) => {
      if (!game.foundryBehaviors?.manager) {
        throw new Error('Behaviors module not available');
      }
      const actor = game.actors.get(req.params.id);
      if (!actor) throw new Error('Actor not found');
      return game.foundryBehaviors.manager.getActorBehaviors(actor).map(b => b.getMetadata());
    });

    // RPG Sessions
    this.route('GET', '/rpg/sessions', async () => {
      if (!game.foundryPostgreSQL?.db) {
        throw new Error('PostgreSQL storage not available');
      }
      const result = await game.foundryPostgreSQL.db.query(
        `SELECT * FROM "RpgSession" WHERE world_id = $1 ORDER BY "startedAt" DESC`,
        [game.world.id]
      );
      return result.rows;
    });

    this.route('GET', '/rpg/sessions/:id', async (req) => {
      if (!game.foundryPostgreSQL?.db) {
        throw new Error('PostgreSQL storage not available');
      }
      const result = await game.foundryPostgreSQL.db.query(
        `SELECT * FROM "RpgSession" WHERE id = $1 AND world_id = $2`,
        [req.params.id, game.world.id]
      );
      if (result.rows.length === 0) throw new Error('Session not found');
      return result.rows[0];
    });

    this.route('POST', '/rpg/sessions', async (req) => {
      if (!game.foundryPostgreSQL?.db) {
        throw new Error('PostgreSQL storage not available');
      }
      const { name, dmId } = req.body;
      const result = await game.foundryPostgreSQL.db.query(
        `INSERT INTO "RpgSession" (world_id, name, "dmId", "startedAt", status)
         VALUES ($1, $2, $3, NOW(), 'active')
         RETURNING *`,
        [game.world.id, name, dmId]
      );
      return result.rows[0];
    });

    this.route('PATCH', '/rpg/sessions/:id', async (req) => {
      if (!game.foundryPostgreSQL?.db) {
        throw new Error('PostgreSQL storage not available');
      }
      const fields = [];
      const values = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(req.body)) {
        fields.push(`"${key}" = $${paramIndex++}`);
        values.push(value);
      }

      values.push(req.params.id);
      values.push(game.world.id);

      const result = await game.foundryPostgreSQL.db.query(
        `UPDATE "RpgSession"
         SET ${fields.join(', ')}, "updatedAt" = NOW()
         WHERE id = $${paramIndex++} AND world_id = $${paramIndex}
         RETURNING *`,
        values
      );
      if (result.rows.length === 0) throw new Error('Session not found');
      return result.rows[0];
    });

    // RPG History
    this.route('GET', '/rpg/history', async (req) => {
      if (!game.foundryPostgreSQL?.db) {
        throw new Error('PostgreSQL storage not available');
      }
      const { sessionId, limit = 100 } = req.query || {};

      let query = `SELECT * FROM "RpgHistory" WHERE world_id = $1`;
      const params = [game.world.id];

      if (sessionId) {
        query += ` AND "sessionId" = $2`;
        params.push(sessionId);
      }

      query += ` ORDER BY "timestamp" DESC LIMIT $${params.length + 1}`;
      params.push(limit);

      const result = await game.foundryPostgreSQL.db.query(query, params);
      return result.rows;
    });

    this.route('POST', '/rpg/history', async (req) => {
      if (!game.foundryPostgreSQL?.db) {
        throw new Error('PostgreSQL storage not available');
      }
      const { sessionId, playerId, eventType, data } = req.body;
      const result = await game.foundryPostgreSQL.db.query(
        `INSERT INTO "RpgHistory" (world_id, "sessionId", "playerId", "eventType", data, timestamp)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING *`,
        [game.world.id, sessionId, playerId, eventType, JSON.stringify(data)]
      );
      return result.rows[0];
    });

    // Boards (Maps/Scenes)
    this.route('GET', '/rpg/boards', async () => {
      if (!game.foundryPostgreSQL?.db) {
        throw new Error('PostgreSQL storage not available');
      }
      const result = await game.foundryPostgreSQL.db.query(
        `SELECT * FROM "Board" WHERE world_id = $1 ORDER BY "createdAt" DESC`,
        [game.world.id]
      );
      return result.rows;
    });

    this.route('GET', '/rpg/boards/:id', async (req) => {
      if (!game.foundryPostgreSQL?.db) {
        throw new Error('PostgreSQL storage not available');
      }
      const result = await game.foundryPostgreSQL.db.query(
        `SELECT * FROM "Board" WHERE id = $1 AND world_id = $2`,
        [req.params.id, game.world.id]
      );
      if (result.rows.length === 0) throw new Error('Board not found');
      return result.rows[0];
    });

    this.route('POST', '/rpg/boards', async (req) => {
      if (!game.foundryPostgreSQL?.db) {
        throw new Error('PostgreSQL storage not available');
      }
      const { name, width, height, cellSize, ownerId } = req.body;
      const result = await game.foundryPostgreSQL.db.query(
        `INSERT INTO "Board" (world_id, name, width, height, "cellSize", "ownerId", "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING *`,
        [game.world.id, name, width, height, cellSize, ownerId]
      );
      return result.rows[0];
    });

    this.route('PATCH', '/rpg/boards/:id', async (req) => {
      if (!game.foundryPostgreSQL?.db) {
        throw new Error('PostgreSQL storage not available');
      }
      const fields = [];
      const values = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(req.body)) {
        fields.push(`"${key}" = $${paramIndex++}`);
        values.push(value);
      }

      values.push(req.params.id);
      values.push(game.world.id);

      const result = await game.foundryPostgreSQL.db.query(
        `UPDATE "Board"
         SET ${fields.join(', ')}, "updatedAt" = NOW()
         WHERE id = $${paramIndex++} AND world_id = $${paramIndex}
         RETURNING *`,
        values
      );
      if (result.rows.length === 0) throw new Error('Board not found');
      return result.rows[0];
    });

    this.route('DELETE', '/rpg/boards/:id', async (req) => {
      if (!game.foundryPostgreSQL?.db) {
        throw new Error('PostgreSQL storage not available');
      }
      const result = await game.foundryPostgreSQL.db.query(
        `DELETE FROM "Board" WHERE id = $1 AND world_id = $2`,
        [req.params.id, game.world.id]
      );
      if (result.rowCount === 0) throw new Error('Board not found');
      return { success: true };
    });

    // Tiles
    this.route('GET', '/rpg/boards/:boardId/tiles', async (req) => {
      if (!game.foundryPostgreSQL?.db) {
        throw new Error('PostgreSQL storage not available');
      }
      const result = await game.foundryPostgreSQL.db.query(
        `SELECT t.* FROM "Tile" t
         JOIN "Board" b ON t."boardId" = b.id
         WHERE t."boardId" = $1 AND b.world_id = $2
         ORDER BY t.z, t.y, t.x`,
        [req.params.boardId, game.world.id]
      );
      return result.rows;
    });

    this.route('GET', '/rpg/tiles/:id', async (req) => {
      if (!game.foundryPostgreSQL?.db) {
        throw new Error('PostgreSQL storage not available');
      }
      const result = await game.foundryPostgreSQL.db.query(
        `SELECT t.* FROM "Tile" t
         JOIN "Board" b ON t."boardId" = b.id
         WHERE t.id = $1 AND b.world_id = $2`,
        [req.params.id, game.world.id]
      );
      if (result.rows.length === 0) throw new Error('Tile not found');
      return result.rows[0];
    });

    this.route('POST', '/rpg/tiles', async (req) => {
      if (!game.foundryPostgreSQL?.db) {
        throw new Error('PostgreSQL storage not available');
      }
      const { boardId, x, y, z, type, data } = req.body;

      // Verify board exists and belongs to this world
      const boardCheck = await game.foundryPostgreSQL.db.query(
        `SELECT id FROM "Board" WHERE id = $1 AND world_id = $2`,
        [boardId, game.world.id]
      );
      if (boardCheck.rows.length === 0) throw new Error('Board not found');

      const result = await game.foundryPostgreSQL.db.query(
        `INSERT INTO "Tile" ("boardId", x, y, z, type, data, "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING *`,
        [boardId, x, y, z || 0, type, JSON.stringify(data || {})]
      );
      return result.rows[0];
    });

    this.route('PATCH', '/rpg/tiles/:id', async (req) => {
      if (!game.foundryPostgreSQL?.db) {
        throw new Error('PostgreSQL storage not available');
      }
      const fields = [];
      const values = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(req.body)) {
        const fieldValue = (key === 'data') ? JSON.stringify(value) : value;
        fields.push(`"${key}" = $${paramIndex++}`);
        values.push(fieldValue);
      }

      values.push(req.params.id);
      values.push(game.world.id);

      const result = await game.foundryPostgreSQL.db.query(
        `UPDATE "Tile" t
         SET ${fields.join(', ')}, "updatedAt" = NOW()
         FROM "Board" b
         WHERE t."boardId" = b.id
           AND t.id = $${paramIndex++}
           AND b.world_id = $${paramIndex}
         RETURNING t.*`,
        values
      );
      if (result.rows.length === 0) throw new Error('Tile not found');
      return result.rows[0];
    });

    this.route('DELETE', '/rpg/tiles/:id', async (req) => {
      if (!game.foundryPostgreSQL?.db) {
        throw new Error('PostgreSQL storage not available');
      }
      const result = await game.foundryPostgreSQL.db.query(
        `DELETE FROM "Tile" t
         USING "Board" b
         WHERE t."boardId" = b.id
           AND t.id = $1
           AND b.world_id = $2`,
        [req.params.id, game.world.id]
      );
      if (result.rowCount === 0) throw new Error('Tile not found');
      return { success: true };
    });

    console.log(`API Server | Registered ${this.routes.size} endpoints`);
  }

  /**
   * Serialize actor
   */
  serializeActor(actor, detailed = false) {
    const data = {
      id: actor.id,
      name: actor.name,
      type: actor.type,
      img: actor.img
    };

    if (detailed) {
      data.system = actor.system;
      data.items = actor.items.map(i => this.serializeItem(i));
      data.effects = actor.effects.map(e => ({ id: e.id, name: e.name, icon: e.icon }));
    }

    return data;
  }

  /**
   * Serialize item
   */
  serializeItem(item, detailed = false) {
    const data = {
      id: item.id,
      name: item.name,
      type: item.type,
      img: item.img
    };

    if (detailed) {
      data.system = item.system;
    }

    return data;
  }

  /**
   * Serialize scene
   */
  serializeScene(scene, detailed = false) {
    const data = {
      id: scene.id,
      name: scene.name,
      active: scene.active,
      img: scene.img || scene.background?.src
    };

    if (detailed) {
      data.tokens = scene.tokens.map(t => ({
        id: t.id,
        name: t.name,
        x: t.x,
        y: t.y,
        actorId: t.actorId
      }));
    }

    return data;
  }

  /**
   * Serialize journal
   */
  serializeJournal(journal, detailed = false) {
    const data = {
      id: journal.id,
      name: journal.name
    };

    if (detailed) {
      data.pages = journal.pages.map(p => ({
        id: p.id,
        name: p.name,
        type: p.type
      }));
    }

    return data;
  }
}
