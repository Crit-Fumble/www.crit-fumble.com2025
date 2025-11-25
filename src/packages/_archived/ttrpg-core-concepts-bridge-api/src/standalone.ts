#!/usr/bin/env node
/**
 * Standalone Bridge Server Entry Point
 * Runs the bridge server as a standalone process
 */

import { PrismaClient } from '@prisma/client';
import { createBridgeServer } from './server';
import type { BridgeServerConfig } from './types';

// Load environment variables
const PORT = parseInt(process.env.BRIDGE_PORT || process.env.PORT || '3001', 10);
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
const DATABASE_URL = process.env.DATABASE_URL;

if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET or NEXTAUTH_SECRET environment variable is required');
  process.exit(1);
}

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

// Parse allowed origins
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map(origin => origin.trim());

// Initialize Prisma
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Bridge configuration
const config: BridgeServerConfig = {
  port: PORT,
  host: process.env.HOST || '0.0.0.0',
  redisUrl: REDIS_URL,
  redisPassword: process.env.REDIS_PASSWORD,
  jwtSecret: JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  databaseUrl: DATABASE_URL,
  allowedOrigins: ALLOWED_ORIGINS,
  websocket: {
    heartbeatInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL || '30000', 10),
    maxConnections: parseInt(process.env.WS_MAX_CONNECTIONS || '1000', 10),
  },
  debug: process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development',
  logLevel: (process.env.LOG_LEVEL as any) || 'info',
};

// Start server
async function main() {
  console.log('Starting TTRPG Core Concepts Bridge API...');

  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected');

    // Create and start bridge server
    const server = await createBridgeServer(config, prisma);

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received, shutting down gracefully...`);

      try {
        await server.stop();
        process.exit(0);
      } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Log any unhandled errors
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      shutdown('UNCAUGHT_EXCEPTION');
    });

  } catch (error) {
    console.error('Failed to start bridge server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
