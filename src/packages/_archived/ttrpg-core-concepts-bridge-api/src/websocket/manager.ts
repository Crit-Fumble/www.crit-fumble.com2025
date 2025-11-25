/**
 * WebSocket Manager
 * Manages WebSocket connections and message routing
 */

import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { verifyToken } from '../middleware/auth';
import type { WebSocketMessage, WebSocketConnection, GameEvent } from '../types';
import { EventEmitter } from 'events';

export class WebSocketManager extends EventEmitter {
  private wss: WebSocketServer;
  private connections: Map<string, WebSocketConnection>;
  private sockets: Map<string, WebSocket>;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private jwtSecret: string;
  private heartbeatMs: number;
  private maxConnections: number;

  constructor(server: any, options: {
    jwtSecret: string;
    heartbeatInterval?: number;
    maxConnections?: number;
  }) {
    super();

    this.jwtSecret = options.jwtSecret;
    this.heartbeatMs = options.heartbeatInterval || 30000;
    this.maxConnections = options.maxConnections || 1000;
    this.connections = new Map();
    this.sockets = new Map();

    this.wss = new WebSocketServer({ server });
    this.setupWebSocketServer();
    this.startHeartbeat();
  }

  private setupWebSocketServer() {
    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      this.handleConnection(ws, req);
    });

    this.wss.on('error', (error) => {
      console.error('WebSocket server error:', error);
      this.emit('error', error);
    });
  }

  private handleConnection(ws: WebSocket, req: IncomingMessage) {
    // Check connection limit
    if (this.connections.size >= this.maxConnections) {
      ws.close(1008, 'Maximum connections reached');
      return;
    }

    // Extract token from query string
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      ws.close(1008, 'Authentication token required');
      return;
    }

    // Verify token
    let userId: string;
    try {
      const decoded = verifyToken(token, this.jwtSecret);
      userId = decoded.userId;
    } catch (error) {
      ws.close(1008, 'Invalid authentication token');
      return;
    }

    // Create connection
    const connectionId = this.generateConnectionId();
    const connection: WebSocketConnection = {
      id: connectionId,
      userId,
      channels: new Set(),
      lastSeen: Date.now(),
    };

    this.connections.set(connectionId, connection);
    this.sockets.set(connectionId, ws);

    // Send connection acknowledgment
    this.send(ws, {
      type: 'connected',
      data: { connectionId, userId },
      timestamp: new Date().toISOString(),
    });

    // Setup message handler
    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString()) as WebSocketMessage;
        this.handleMessage(connectionId, message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
        this.send(ws, {
          type: 'error',
          data: { message: 'Invalid message format' },
        });
      }
    });

    // Setup close handler
    ws.on('close', () => {
      this.handleDisconnect(connectionId);
    });

    // Setup error handler
    ws.on('error', (error) => {
      console.error(`WebSocket error for connection ${connectionId}:`, error);
      this.handleDisconnect(connectionId);
    });

    // Setup pong handler (for heartbeat)
    ws.on('pong', () => {
      const conn = this.connections.get(connectionId);
      if (conn) {
        conn.lastSeen = Date.now();
      }
    });

    this.emit('connection', { connectionId, userId });
    console.log(`WebSocket connected: ${connectionId} (user: ${userId})`);
  }

  private handleMessage(connectionId: string, message: WebSocketMessage) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    connection.lastSeen = Date.now();

    switch (message.type) {
      case 'join':
        this.handleJoin(connectionId, message);
        break;

      case 'leave':
        this.handleLeave(connectionId, message);
        break;

      case 'publish':
        this.handlePublish(connectionId, message);
        break;

      case 'subscribe':
        this.handleSubscribe(connectionId, message);
        break;

      case 'unsubscribe':
        this.handleUnsubscribe(connectionId, message);
        break;

      case 'ping':
        this.handlePing(connectionId);
        break;

      default:
        console.warn(`Unknown message type: ${message.type}`);
    }
  }

  private handleJoin(connectionId: string, message: WebSocketMessage) {
    const connection = this.connections.get(connectionId);
    if (!connection || !message.gameId) return;

    connection.gameId = message.gameId;
    this.emit('join', { connectionId, gameId: message.gameId, userId: connection.userId });

    const ws = this.sockets.get(connectionId);
    if (ws) {
      this.send(ws, {
        type: 'joined',
        data: { gameId: message.gameId },
        timestamp: new Date().toISOString(),
      });
    }
  }

  private handleLeave(connectionId: string, message: WebSocketMessage) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    const gameId = connection.gameId;
    connection.gameId = undefined;

    this.emit('leave', { connectionId, gameId, userId: connection.userId });

    const ws = this.sockets.get(connectionId);
    if (ws) {
      this.send(ws, {
        type: 'left',
        data: { gameId },
        timestamp: new Date().toISOString(),
      });
    }
  }

  private handlePublish(connectionId: string, message: WebSocketMessage) {
    const connection = this.connections.get(connectionId);
    if (!connection || !message.event || !message.data) return;

    const gameEvent: GameEvent = {
      event: message.event,
      gameId: connection.gameId || 'global',
      userId: connection.userId,
      data: message.data,
      timestamp: new Date().toISOString(),
    };

    this.emit('publish', gameEvent);

    // Broadcast to all subscribers in the same game
    this.broadcast(gameEvent.gameId, gameEvent.event, gameEvent);
  }

  private handleSubscribe(connectionId: string, message: WebSocketMessage) {
    const connection = this.connections.get(connectionId);
    if (!connection || !message.channels) return;

    message.channels.forEach((channel) => {
      connection.channels.add(channel);
    });

    const ws = this.sockets.get(connectionId);
    if (ws) {
      this.send(ws, {
        type: 'subscribed',
        data: { channels: message.channels },
        timestamp: new Date().toISOString(),
      });
    }
  }

  private handleUnsubscribe(connectionId: string, message: WebSocketMessage) {
    const connection = this.connections.get(connectionId);
    if (!connection || !message.channels) return;

    message.channels.forEach((channel) => {
      connection.channels.delete(channel);
    });

    const ws = this.sockets.get(connectionId);
    if (ws) {
      this.send(ws, {
        type: 'unsubscribed',
        data: { channels: message.channels },
        timestamp: new Date().toISOString(),
      });
    }
  }

  private handlePing(connectionId: string) {
    const ws = this.sockets.get(connectionId);
    if (ws) {
      this.send(ws, { type: 'pong', timestamp: new Date().toISOString() });
    }
  }

  private handleDisconnect(connectionId: string) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    this.emit('disconnect', {
      connectionId,
      userId: connection.userId,
      gameId: connection.gameId,
    });

    this.connections.delete(connectionId);
    this.sockets.delete(connectionId);

    console.log(`WebSocket disconnected: ${connectionId}`);
  }

  private send(ws: WebSocket, message: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  public broadcast(gameId: string, event: string, data: any) {
    const message = {
      type: 'event',
      event,
      data,
      timestamp: new Date().toISOString(),
    };

    for (const [connectionId, connection] of this.connections.entries()) {
      // Send to connections in the same game and subscribed to the event
      if (
        connection.gameId === gameId &&
        (connection.channels.has(event) || connection.channels.has('*'))
      ) {
        const ws = this.sockets.get(connectionId);
        if (ws) {
          this.send(ws, message);
        }
      }
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const timeout = this.heartbeatMs * 2;

      for (const [connectionId, connection] of this.connections.entries()) {
        const ws = this.sockets.get(connectionId);
        if (!ws) continue;

        // Check if connection timed out
        if (now - connection.lastSeen > timeout) {
          console.log(`Connection ${connectionId} timed out`);
          ws.close(1000, 'Heartbeat timeout');
          this.handleDisconnect(connectionId);
          continue;
        }

        // Send ping
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        }
      }
    }, this.heartbeatMs);
  }

  public getStats() {
    const games = new Set<string>();
    for (const connection of this.connections.values()) {
      if (connection.gameId) {
        games.add(connection.gameId);
      }
    }

    return {
      connections: this.connections.size,
      gamesActive: games.size,
      maxConnections: this.maxConnections,
    };
  }

  public close() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    for (const ws of this.sockets.values()) {
      ws.close(1001, 'Server shutting down');
    }

    this.wss.close();
    this.connections.clear();
    this.sockets.clear();
  }

  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
