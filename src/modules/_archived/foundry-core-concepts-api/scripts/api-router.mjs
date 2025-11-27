/**
 * API Router for Foundry VTT
 * Exposes Foundry functionality via HTTP endpoints
 */

import express from 'express';
import cors from 'cors';
import { registerSyncRoutes } from './endpoints/sync.mjs';
import { AssetsEndpoint } from './endpoints/assets.mjs';

/**
 * API Router
 * Creates an Express server with routes for Foundry control
 */
export class APIRouter {
  constructor(config) {
    this.config = config;
    this.app = null;
    this.server = null;
    this.assetsEndpoint = null;
  }

  /**
   * Start the API server
   */
  async start() {
    // Create Express app
    this.app = express();

    // Middleware
    this.app.use(cors({
      origin: this.config.allowedOrigins,
      credentials: true
    }));
    this.app.use(express.json());

    // Authentication middleware
    this.app.use((req, res, next) => {
      // Skip auth for health check
      if (req.path === '/health') {
        return next();
      }

      const authHeader = req.headers.authorization;
      const token = authHeader?.replace('Bearer ', '');

      if (!token || token !== this.config.authToken) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      next();
    });

    // Logging middleware
    if (this.config.debugMode) {
      this.app.use((req, res, next) => {
        console.log(`[API] ${req.method} ${req.path}`, req.body);
        next();
      });
    }

    // Register routes
    this.registerRoutes();

    // Start server
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.config.apiPort, () => {
        console.log(`[API] Server listening on port ${this.config.apiPort}`);
        resolve();
      }).on('error', reject);
    });
  }

  /**
   * Stop the API server
   */
  async stop() {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          console.log('[API] Server stopped');
          resolve();
        });
      });
    }
  }

  /**
   * Register API routes
   */
  registerRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        foundry: {
          version: game.version,
          world: game.world.id,
          system: game.system.id
        }
      });
    });

    // World info
    this.app.get('/world', (req, res) => {
      res.json({
        id: game.world.id,
        title: game.world.title,
        system: game.system.id,
        systemVersion: game.system.version,
        foundryVersion: game.version
      });
    });

    // Actors routes
    this.app.get('/actors', async (req, res) => {
      try {
        const actors = game.actors.contents.map(a => this._serializeDocument(a));
        res.json({ actors });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/actors/:id', async (req, res) => {
      try {
        const actor = game.actors.get(req.params.id);
        if (!actor) {
          return res.status(404).json({ error: 'Actor not found' });
        }
        res.json(this._serializeDocument(actor));
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/actors', async (req, res) => {
      try {
        const actor = await Actor.create(req.body);
        res.json(this._serializeDocument(actor));
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    this.app.patch('/actors/:id', async (req, res) => {
      try {
        const actor = game.actors.get(req.params.id);
        if (!actor) {
          return res.status(404).json({ error: 'Actor not found' });
        }
        await actor.update(req.body);
        res.json(this._serializeDocument(actor));
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    this.app.delete('/actors/:id', async (req, res) => {
      try {
        const actor = game.actors.get(req.params.id);
        if (!actor) {
          return res.status(404).json({ error: 'Actor not found' });
        }
        await actor.delete();
        res.json({ success: true });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Items routes
    this.app.get('/items', async (req, res) => {
      try {
        const items = game.items.contents.map(i => this._serializeDocument(i));
        res.json({ items });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/items/:id', async (req, res) => {
      try {
        const item = game.items.get(req.params.id);
        if (!item) {
          return res.status(404).json({ error: 'Item not found' });
        }
        res.json(this._serializeDocument(item));
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/items', async (req, res) => {
      try {
        const item = await Item.create(req.body);
        res.json(this._serializeDocument(item));
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Scenes routes
    this.app.get('/scenes', async (req, res) => {
      try {
        const scenes = game.scenes.contents.map(s => this._serializeDocument(s));
        res.json({ scenes });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/scenes/:id', async (req, res) => {
      try {
        const scene = game.scenes.get(req.params.id);
        if (!scene) {
          return res.status(404).json({ error: 'Scene not found' });
        }
        res.json(this._serializeDocument(scene));
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/scenes/:id/activate', async (req, res) => {
      try {
        const scene = game.scenes.get(req.params.id);
        if (!scene) {
          return res.status(404).json({ error: 'Scene not found' });
        }
        await scene.activate();
        res.json({ success: true, scene: this._serializeDocument(scene) });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Chat messages
    this.app.post('/chat', async (req, res) => {
      try {
        const message = await ChatMessage.create(req.body);
        res.json(this._serializeDocument(message));
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Combat routes
    this.app.get('/combats', async (req, res) => {
      try {
        const combats = game.combats.contents.map(c => this._serializeDocument(c));
        res.json({ combats });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/combats/:id', async (req, res) => {
      try {
        const combat = game.combats.get(req.params.id);
        if (!combat) {
          return res.status(404).json({ error: 'Combat not found' });
        }
        res.json(this._serializeDocument(combat));
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/combats/:id/start', async (req, res) => {
      try {
        const combat = game.combats.get(req.params.id);
        if (!combat) {
          return res.status(404).json({ error: 'Combat not found' });
        }
        await combat.startCombat();
        res.json(this._serializeDocument(combat));
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    this.app.post('/combats/:id/next', async (req, res) => {
      try {
        const combat = game.combats.get(req.params.id);
        if (!combat) {
          return res.status(404).json({ error: 'Combat not found' });
        }
        await combat.nextTurn();
        res.json(this._serializeDocument(combat));
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Compendium routes
    this.app.get('/compendia', async (req, res) => {
      try {
        const packs = game.packs.contents.map(p => ({
          id: p.collection,
          name: p.metadata.name,
          label: p.metadata.label,
          type: p.metadata.type,
          system: p.metadata.system
        }));
        res.json({ packs });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/compendia/:id', async (req, res) => {
      try {
        const pack = game.packs.get(req.params.id);
        if (!pack) {
          return res.status(404).json({ error: 'Compendium not found' });
        }

        const documents = await pack.getDocuments();
        res.json({
          id: pack.collection,
          documents: documents.map(d => this._serializeDocument(d))
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Users routes
    this.app.get('/users', async (req, res) => {
      try {
        const users = game.users.contents.map(u => ({
          id: u.id,
          name: u.name,
          role: u.role,
          active: u.active
        }));
        res.json({ users });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Execute macro
    this.app.post('/macros/execute', async (req, res) => {
      try {
        const { script } = req.body;
        if (!script) {
          return res.status(400).json({ error: 'Script required' });
        }

        // Execute in Foundry context
        const result = await (async function() {
          return eval(script);
        })();

        res.json({ result });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Generic document query
    this.app.post('/query', async (req, res) => {
      try {
        const { collection, filter } = req.body;

        if (!collection) {
          return res.status(400).json({ error: 'Collection required' });
        }

        let documents = game[collection]?.contents || [];

        // Apply filter if provided
        if (filter) {
          documents = documents.filter(doc => {
            for (const [key, value] of Object.entries(filter)) {
              if (doc[key] !== value) {
                return false;
              }
            }
            return true;
          });
        }

        res.json({
          documents: documents.map(d => this._serializeDocument(d))
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Register sync routes for Crit-Fumble integration
    registerSyncRoutes(this.app);

    // Register assets endpoint (QR codes, shortcodes)
    this.registerAssetsRoutes();

    // Register event logging routes
    this.registerEventRoutes();
  }

  /**
   * Register assets endpoint routes
   */
  registerAssetsRoutes() {
    // Initialize assets endpoint
    this.assetsEndpoint = new AssetsEndpoint(this);
    this.assetsEndpoint.initialize({
      platformUrl: this.config.platformUrl || 'http://localhost:3000',
      platformApiKey: this.config.platformApiKey
    });

    // Register asset routes
    this.app.post('/assets/register', async (req, res) => {
      try {
        const result = await this.assetsEndpoint.registerAsset({ body: req.body });
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/assets/lookup', async (req, res) => {
      try {
        const result = await this.assetsEndpoint.lookupAsset({ query: req.query });
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/assets/print', async (req, res) => {
      try {
        const result = await this.assetsEndpoint.generatePrintVersion({ query: req.query });
        if (result.success) {
          // Return image blob
          res.set('Content-Type', result.mimeType);
          res.send(result.url); // This will need adjustment for actual blob handling
        } else {
          res.status(400).json(result);
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    console.log('[API] Assets routes registered');
  }

  /**
   * Register event logging routes
   */
  registerEventRoutes() {
    // Log a game event
    this.app.post('/events', async (req, res) => {
      try {
        const eventData = req.body;

        if (!eventData.eventType || !eventData.sessionId) {
          return res.status(400).json({ error: 'eventType and sessionId required' });
        }

        // Store event locally (could be sent to external API)
        const event = {
          id: foundry.utils.randomID(),
          createdAt: new Date().toISOString(),
          ...eventData
        };

        // Emit socket event so all clients can see it
        game.socket.emit('module.foundry-core-concepts-api', {
          type: 'event',
          event
        });

        res.json({ success: true, event });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get events for a session
    this.app.get('/events', async (req, res) => {
      try {
        const { sessionId, eventType, limit = '100' } = req.query;

        if (!sessionId) {
          return res.status(400).json({ error: 'sessionId query parameter required' });
        }

        // In a real implementation, this would query a database
        // For now, return empty array (events are forwarded to external API)
        res.json({ events: [], message: 'Events are logged to external API' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get region event queue status
    this.app.get('/events/queue', async (req, res) => {
      try {
        const regionEvents = game.coreConcepts?.regionEvents;
        if (!regionEvents) {
          return res.status(503).json({ error: 'Region events manager not initialized' });
        }

        const status = regionEvents.getQueueStatus();
        res.json(status);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    console.log('[API] Event routes registered');
  }

  /**
   * Serialize a Foundry document for JSON response
   */
  _serializeDocument(doc) {
    return {
      id: doc.id,
      name: doc.name,
      type: doc.type,
      data: doc.system || doc.data,
      img: doc.img,
      flags: doc.flags,
      folder: doc.folder?.id || null
    };
  }
}

export default APIRouter;
