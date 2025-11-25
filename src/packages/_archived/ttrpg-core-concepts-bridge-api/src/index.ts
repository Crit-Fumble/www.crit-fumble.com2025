/**
 * TTRPG Core Concepts Bridge API
 *
 * Standalone server that bridges Foundry VTT and web applications
 * - Authentication via JWT tokens
 * - Real-time game state sync via WebSocket
 * - Redis caching for performance
 * - REST API for game data access
 */

export { createBridgeServer, BridgeServer } from './server';
export type { BridgeServerConfig, JWTPayload, GameEvent, WebSocketMessage } from './types';
export { createCoreConceptsRouter } from './api/core-concepts';
export { createAuthRouter } from './api/auth';
export { WebSocketManager } from './websocket/manager';
export { RedisManager } from './utils/redis';
