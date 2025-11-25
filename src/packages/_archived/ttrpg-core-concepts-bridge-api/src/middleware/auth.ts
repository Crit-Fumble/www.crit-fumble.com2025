/**
 * Authentication Middleware
 * Validates JWT tokens from Foundry VTT modules and web clients
 */

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { AuthRequest, JWTPayload } from '../types';

export function createAuthMiddleware(jwtSecret: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header required' });
    }

    const token = authHeader.replace('Bearer ', '');

    try {
      const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
      req.user = decoded;
      next();
    } catch (error) {
      console.error('JWT verification failed:', error);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
  };
}

export function verifyToken(token: string, jwtSecret: string): JWTPayload {
  return jwt.verify(token, jwtSecret) as JWTPayload;
}

export function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>, jwtSecret: string, expiresIn = '7d'): string {
  return jwt.sign(payload, jwtSecret, { expiresIn });
}
