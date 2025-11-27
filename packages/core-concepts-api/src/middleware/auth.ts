
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  apiKeyId?: string;
  source?: 'api_key' | 'jwt' | 'internal';
}

/**
 * API Key authentication middleware
 * Supports:
 * - X-API-Key header (for external clients)
 * - Authorization: Bearer <jwt> (for website backend)
 * - X-Internal-Secret header (for DO VPC internal calls)
 */
export function apiKeyAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  // Check for internal secret (Foundry instances in VPC)
  const internalSecret = req.headers['x-internal-secret'];
  if (internalSecret && internalSecret === process.env.INTERNAL_API_SECRET) {
    req.source = 'internal';
    req.userId = req.headers['x-user-id'] as string;
    next();
    return;
  }

  // Check for API key
  const apiKey = req.headers['x-api-key'];
  if (apiKey && typeof apiKey === 'string') {
    // Validate API key format and lookup
    if (validateApiKey(apiKey)) {
      req.source = 'api_key';
      req.apiKeyId = apiKey;
      next();
      return;
    }
  }

  // Check for JWT token
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as {
        userId: string;
      };
      req.source = 'jwt';
      req.userId = decoded.userId;
      next();
      return;
    } catch {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
  }

  res.status(401).json({ error: 'Authentication required' });
}

/**
 * Validate API key format
 * In production, this would check against the database
 */
function validateApiKey(key: string): boolean {
  // Simple validation - key must be at least 32 chars
  // In production, validate against CritApiKey table via website DB
  return key.length >= 32;
}

/**
 * Optional auth - allows unauthenticated requests but extracts user if present
 */
export function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as {
        userId: string;
      };
      req.source = 'jwt';
      req.userId = decoded.userId;
    } catch {
      // Invalid token, but continue without auth
    }
  }
  next();
}
