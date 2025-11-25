/**
 * Bridge Server
 * Main server implementation
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import type { BridgeServerConfig } from './types';
import { createAuthMiddleware } from './middleware/auth';
import { createAuthRouter } from './api/auth';
import { createCoreConceptsRouter } from './api/core-concepts';
import { WebSocketManager } from './websocket/manager';
import { RedisManager } from './utils/redis';

export class BridgeServer {
  private app: express.Application;
  private httpServer: ReturnType<typeof createServer>;
  private config: BridgeServerConfig;
  private wsManager: WebSocketManager | null = null;
  private redis: RedisManager | null = null;
  private prisma: any; // Prisma client
  private startTime: number = 0;
  private stats = {
    eventsPublished: 0,
    eventsReceived: 0,
    cacheHits: 0,
    cacheMisses: 0,
  };

  constructor(config: BridgeServerConfig, prisma: any) {
    this.config = config;
    this.prisma = prisma;
    this.app = express();
    this.httpServer = createServer(this.app);

    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    // CORS
    this.app.use(cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);

        if (this.config.allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
    }));

    // Body parsing
    this.app.use(express.json());

    // Request logging
    if (this.config.debug) {
      this.app.use((req: Request, res: Response, next: NextFunction) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
        next();
      });
    }
  }

  private setupRoutes() {
    const authenticateJWT = createAuthMiddleware(this.config.jwtSecret);

    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'ok',
        service: 'ttrpg-core-concepts-bridge-api',
        timestamp: new Date().toISOString(),
        uptime: this.startTime ? Date.now() - this.startTime : 0,
        connections: this.wsManager?.getStats().connections || 0,
        redis: this.redis?.isConnected() || false,
      });
    });

    // Stats endpoint
    this.app.get('/stats', (req: Request, res: Response) => {
      const wsStats = this.wsManager?.getStats() || { connections: 0, gamesActive: 0 };

      res.json({
        uptime: this.startTime ? Date.now() - this.startTime : 0,
        connections: wsStats.connections,
        gamesActive: wsStats.gamesActive,
        eventsPublished: this.stats.eventsPublished,
        eventsReceived: this.stats.eventsReceived,
        cacheHits: this.stats.cacheHits,
        cacheMisses: this.stats.cacheMisses,
        redis: this.redis?.isConnected() || false,
      });
    });

    // Auth routes
    const authRouter = createAuthRouter({
      jwtSecret: this.config.jwtSecret,
      jwtExpiresIn: this.config.jwtExpiresIn,
      validateSession: async (sessionToken: string) => {
        const session = await this.prisma.session.findUnique({
          where: { sessionToken },
          include: { player: true },
        });

        if (!session || session.expires < new Date()) {
          return null;
        }

        return {
          playerId: session.playerId,
          username: session.player.username,
          email: session.player.email || undefined,
        };
      },
      getPlayer: async (playerId: string) => {
        return await this.prisma.player.findUnique({
          where: { id: playerId },
          select: {
            id: true,
            username: true,
            email: true,
            discordId: true,
            discordUsername: true,
            githubId: true,
            githubUsername: true,
            defaultRole: true,
            lastLoginAt: true,
          },
        });
      },
      authenticateJWT,
    });

    this.app.use('/auth', authRouter);

    // Core Concepts API routes
    const coreConceptsRouter = createCoreConceptsRouter({
      authenticateJWT,
      prisma: this.prisma,
    });

    this.app.use('/api', coreConceptsRouter);

    // Error handling
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      console.error('Server error:', err);
      res.status(500).json({
        error: 'Internal server error',
        message: this.config.debug ? err.message : undefined,
      });
    });
  }

  async start(): Promise<void> {
    // Connect to Redis
    if (this.config.redisUrl) {
      this.redis = new RedisManager(this.config.redisUrl, {
        password: this.config.redisPassword,
        onError: (error) => {
          console.error('Redis error:', error);
        },
      });

      await this.redis.connect();

      // Subscribe to game events for caching
      await this.redis.subscribe('game:events', (event) => {
        this.stats.eventsReceived++;
        if (this.config.debug) {
          console.log('Game event received:', event);
        }
      });
    }

    // Setup WebSocket
    this.wsManager = new WebSocketManager(this.httpServer, {
      jwtSecret: this.config.jwtSecret,
      heartbeatInterval: this.config.websocket?.heartbeatInterval,
      maxConnections: this.config.websocket?.maxConnections,
    });

    // Forward WebSocket events to Redis pub/sub
    if (this.redis) {
      this.wsManager.on('publish', async (event) => {
        this.stats.eventsPublished++;
        await this.redis!.publish('game:events', event);

        // Cache event
        const cacheKey = `event:${event.gameId}:${event.event}`;
        await this.redis!.rpush(cacheKey, event);

        if (this.config.debug) {
          console.log('Event published:', event.event);
        }
      });
    }

    // Start HTTP server
    const port = this.config.port;
    const host = this.config.host || '0.0.0.0';

    await new Promise<void>((resolve) => {
      this.httpServer.listen(port, host, () => {
        this.startTime = Date.now();
        console.log(`\n🌉 TTRPG Core Concepts Bridge API`);
        console.log(`   Port: ${port}`);
        console.log(`   Host: ${host}`);
        console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`   Allowed Origins: ${this.config.allowedOrigins.join(', ')}`);
        console.log(`   Redis: ${this.redis?.isConnected() ? '✅' : '❌'}`);
        console.log(`   WebSocket: ✅`);
        console.log(`\n   Health: http://${host === '0.0.0.0' ? 'localhost' : host}:${port}/health`);
        console.log(`   Stats: http://${host === '0.0.0.0' ? 'localhost' : host}:${port}/stats`);
        console.log(`   WebSocket: ws://${host === '0.0.0.0' ? 'localhost' : host}:${port}?token=<JWT>`);
        console.log(`\n   Ready for connections\n`);
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    console.log('Shutting down bridge server...');

    // Close WebSocket connections
    if (this.wsManager) {
      this.wsManager.close();
    }

    // Disconnect Redis
    if (this.redis) {
      await this.redis.disconnect();
    }

    // Close HTTP server
    await new Promise<void>((resolve, reject) => {
      this.httpServer.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Disconnect Prisma
    await this.prisma.$disconnect();

    console.log('Bridge server stopped');
  }

  getStats() {
    const wsStats = this.wsManager?.getStats() || { connections: 0, gamesActive: 0 };

    return {
      uptime: this.startTime ? Date.now() - this.startTime : 0,
      connections: wsStats.connections,
      gamesActive: wsStats.gamesActive,
      eventsPublished: this.stats.eventsPublished,
      eventsReceived: this.stats.eventsReceived,
      cacheHits: this.stats.cacheHits,
      cacheMisses: this.stats.cacheMisses,
    };
  }
}

/**
 * Factory function to create and start a bridge server
 */
export async function createBridgeServer(config: BridgeServerConfig, prisma: any): Promise<BridgeServer> {
  const server = new BridgeServer(config, prisma);
  await server.start();
  return server;
}
