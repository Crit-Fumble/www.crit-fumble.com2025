/**
 * Authentication API Routes
 * Handles token exchange and validation
 */

import { Router, Request, Response } from 'express';
import type { AuthRequest, JWTPayload } from '../types';
import { signToken } from '../middleware/auth';

export interface AuthRouterOptions {
  jwtSecret: string;
  jwtExpiresIn?: string;
  validateSession: (sessionToken: string) => Promise<{
    playerId: string;
    username: string;
    email?: string;
  } | null>;
  getPlayer: (playerId: string) => Promise<any>;
  authenticateJWT: (req: AuthRequest, res: Response, next: Function) => void;
}

export function createAuthRouter(options: AuthRouterOptions): Router {
  const router = Router();
  const { jwtSecret, jwtExpiresIn = '7d', validateSession, getPlayer, authenticateJWT } = options;

  /**
   * Exchange NextAuth session token for JWT
   * POST /auth/exchange
   */
  router.post('/exchange', async (req: Request, res: Response) => {
    try {
      const { sessionToken } = req.body;

      if (!sessionToken) {
        return res.status(400).json({ error: 'Session token required' });
      }

      // Validate session token
      const session = await validateSession(sessionToken);

      if (!session) {
        return res.status(401).json({ error: 'Invalid or expired session token' });
      }

      // Generate JWT token
      const jwtPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
        userId: session.playerId,
        playerId: session.playerId,
        username: session.username,
        email: session.email,
      };

      const jwtToken = signToken(jwtPayload, jwtSecret, jwtExpiresIn);

      res.json({
        token: jwtToken,
        expiresIn: parseExpiry(jwtExpiresIn),
        user: {
          id: session.playerId,
          username: session.username,
          email: session.email,
        },
      });
    } catch (error) {
      console.error('Token exchange error:', error);
      res.status(500).json({ error: 'Failed to exchange token' });
    }
  });

  /**
   * Verify JWT token
   * POST /auth/verify
   */
  router.post('/verify', authenticateJWT, (req: AuthRequest, res: Response) => {
    res.json({
      valid: true,
      user: req.user,
    });
  });

  /**
   * Get current user info
   * GET /auth/me
   */
  router.get('/me', authenticateJWT, async (req: AuthRequest, res: Response) => {
    try {
      const player = await getPlayer(req.user!.playerId);

      if (!player) {
        return res.status(404).json({ error: 'Player not found' });
      }

      res.json(player);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Failed to fetch user info' });
    }
  });

  return router;
}

function parseExpiry(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60; // Default 7 days

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 60 * 60;
    case 'd': return value * 24 * 60 * 60;
    default: return 7 * 24 * 60 * 60;
  }
}
