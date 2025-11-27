/**
 * Authentication Middleware
 * Validates bearer tokens for dual-environment (staging/production) access
 */

import type { Request, Response, NextFunction } from 'express';
import type { FoundryEnvironment } from '../types.js';

// Extend Express Request type to include environment
declare global {
  namespace Express {
    interface Request {
      environment?: FoundryEnvironment;
    }
  }
}

/**
 * Bearer token authentication middleware with environment isolation
 * Validates tokens against environment-specific secrets
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const environmentHeader = req.headers['x-environment'] as string | undefined;

  // Extract bearer token
  const token = authHeader?.replace('Bearer ', '');
  if (!token) {
    console.log(`[SECURITY] Missing bearer token from ${req.ip}`);
    res.status(401).json({ error: 'Missing authorization token' });
    return;
  }

  // Validate environment header
  if (!environmentHeader || !['staging', 'production'].includes(environmentHeader)) {
    console.log(`[SECURITY] Invalid or missing X-Environment header from ${req.ip}`);
    res.status(400).json({ error: 'Invalid or missing X-Environment header. Must be "staging" or "production".' });
    return;
  }

  const environment = environmentHeader as FoundryEnvironment;

  // Get environment-specific secret from env vars
  const expectedSecret = environment === 'production'
    ? process.env.FOUNDRY_MANAGEMENT_SECRET_PROD
    : process.env.FOUNDRY_MANAGEMENT_SECRET_STAGING;

  if (!expectedSecret) {
    console.error(`[SECURITY] Missing secret for ${environment} environment`);
    res.status(500).json({ error: 'Server configuration error' });
    return;
  }

  // Validate token
  if (token !== expectedSecret) {
    console.log(`[SECURITY] Invalid token for ${environment} environment from ${req.ip}`);
    res.status(401).json({ error: 'Invalid authentication token' });
    return;
  }

  // Attach environment to request for downstream use
  req.environment = environment;

  console.log(`[AUTH] Authenticated request for ${environment} environment from ${req.ip}`);
  next();
}

/**
 * Audit logging middleware
 * Logs all requests for security auditing
 */
export function auditLog(req: Request, res: Response, next: NextFunction): void {
  const log = {
    timestamp: new Date().toISOString(),
    ip: req.ip,
    method: req.method,
    path: req.path,
    environment: req.environment || 'unknown',
    body: req.body,
    headers: {
      authorization: req.headers.authorization ? '[REDACTED]' : 'none',
      'x-environment': req.headers['x-environment'] || 'none',
      'user-agent': req.headers['user-agent'] || 'unknown'
    }
  };

  console.log(`[AUDIT] ${JSON.stringify(log)}`);

  // TODO: Optionally send to external logging service (e.g., Datadog, Logtail)
  // await fetch('https://logs.example.com/ingest', { method: 'POST', body: JSON.stringify(log) });

  next();
}
