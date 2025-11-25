import type { Request } from 'express';

export interface BridgeServerConfig {
  // Server configuration
  port: number;
  host?: string;

  // Redis configuration
  redisUrl: string;
  redisPassword?: string;

  // Authentication
  jwtSecret: string;
  jwtExpiresIn?: string; // Default: '7d'

  // CORS
  allowedOrigins: string[];

  // Database connection (for auth validation)
  databaseUrl: string;

  // WebSocket configuration
  websocket?: {
    heartbeatInterval?: number; // Default: 30000ms
    maxConnections?: number; // Default: 1000
  };

  // Logging
  debug?: boolean;
  logLevel?: 'error' | 'warn' | 'info' | 'debug';
}

export interface JWTPayload {
  userId: string;
  playerId: string;
  username: string;
  email?: string;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export interface WebSocketMessage {
  type: 'join' | 'leave' | 'publish' | 'subscribe' | 'unsubscribe' | 'ping' | 'pong';
  gameId?: string;
  event?: string;
  channel?: string;
  channels?: string[];
  data?: any;
  timestamp?: string;
}

export interface WebSocketConnection {
  id: string;
  userId: string;
  gameId?: string;
  channels: Set<string>;
  lastSeen: number;
}

export interface GameEvent {
  event: string;
  gameId: string;
  userId: string;
  data: any;
  timestamp: string;
}

export interface BridgeStats {
  uptime: number;
  connections: number;
  gamesActive: number;
  eventsPublished: number;
  eventsReceived: number;
  cacheHits: number;
  cacheMisses: number;
}
