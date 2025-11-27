#!/usr/bin/env node

/**
 * Foundry VTT Management API Server
 * Standalone Express server for managing Foundry VTT Docker containers
 *
 * This server runs on the DigitalOcean droplet and provides secure endpoints
 * for starting/stopping Foundry instances with dual-environment isolation.
 */

import express from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate, auditLog } from './api/auth.js';
import { createRouter } from './api/routes.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Middleware: JSON body parser
app.use(express.json());

// Middleware: Rate limiting (100 requests per 15 minutes per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});

app.use(limiter);

// Middleware: Audit logging (before authentication)
app.use(auditLog);

// Middleware: Bearer token authentication (except /health)
app.use((req, res, next) => {
  // Skip authentication for health check
  if (req.path === '/health') {
    return next();
  }
  authenticate(req, res, next);
});

// Routes
app.use(createRouter());

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[ERROR]', err);
  res.status(500).json({
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, HOST, () => {
  console.log('='.repeat(60));
  console.log('Foundry VTT Management API Server');
  console.log('='.repeat(60));
  console.log(`Listening on: ${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`Security:`);
  console.log(`  ✓ Rate limiting: 100 req/15min per IP`);
  console.log(`  ✓ Bearer token authentication`);
  console.log(`  ✓ Dual-environment isolation (staging/production)`);
  console.log(`  ✓ Audit logging enabled`);
  console.log('');
  console.log('SECURITY WARNING:');
  console.log('  This API should ONLY be accessible from Vercel IPs via firewall.');
  console.log('  Ensure UFW is configured to block all other access to port 3001.');
  console.log('='.repeat(60));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});
