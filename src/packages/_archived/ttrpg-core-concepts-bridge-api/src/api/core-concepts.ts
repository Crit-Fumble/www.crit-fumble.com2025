/**
 * Core Concepts API Routes
 * REST API for game state management
 */

import { Router, Response } from 'express';
import type { AuthRequest } from '../types';

export interface CoreConceptsRouterOptions {
  authenticateJWT: (req: AuthRequest, res: Response, next: Function) => void;
  prisma: any; // Prisma client instance
}

export function createCoreConceptsRouter(options: CoreConceptsRouterOptions): Router {
  const router = Router();
  const { authenticateJWT, prisma } = options;

  /**
   * Sessions
   */

  // Get all sessions for a world
  router.get('/sessions', authenticateJWT, async (req: AuthRequest, res: Response) => {
    try {
      const { worldId } = req.query;

      if (!worldId || typeof worldId !== 'string') {
        return res.status(400).json({ error: 'worldId query parameter required' });
      }

      const sessions = await prisma.rpgSession.findMany({
        where: { worldId },
        orderBy: { startedAt: 'desc' },
      });

      res.json(sessions);
    } catch (error) {
      console.error('Get sessions error:', error);
      res.status(500).json({ error: 'Failed to fetch sessions' });
    }
  });

  // Create a new session
  router.post('/sessions', authenticateJWT, async (req: AuthRequest, res: Response) => {
    try {
      const { worldId, name, dmId } = req.body;

      if (!worldId || !name) {
        return res.status(400).json({ error: 'worldId and name required' });
      }

      const session = await prisma.rpgSession.create({
        data: {
          worldId,
          name,
          dmId: dmId || req.user!.playerId,
          startedAt: new Date(),
          status: 'active',
        },
      });

      res.json(session);
    } catch (error) {
      console.error('Create session error:', error);
      res.status(500).json({ error: 'Failed to create session' });
    }
  });

  /**
   * History
   */

  // Get session history
  router.get('/history', authenticateJWT, async (req: AuthRequest, res: Response) => {
    try {
      const { sessionId, worldId, limit = '100' } = req.query;

      const where: any = {};
      if (worldId) where.worldId = worldId;
      if (sessionId) where.sessionId = sessionId;

      const history = await prisma.rpgHistory.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: parseInt(limit as string, 10),
      });

      res.json(history);
    } catch (error) {
      console.error('Get history error:', error);
      res.status(500).json({ error: 'Failed to fetch history' });
    }
  });

  // Create history entry
  router.post('/history', authenticateJWT, async (req: AuthRequest, res: Response) => {
    try {
      const { worldId, sessionId, eventType, data } = req.body;

      if (!worldId || !sessionId || !eventType) {
        return res.status(400).json({ error: 'worldId, sessionId, and eventType required' });
      }

      const historyEntry = await prisma.rpgHistory.create({
        data: {
          worldId,
          sessionId,
          playerId: req.user!.playerId,
          eventType,
          data: data || {},
          timestamp: new Date(),
        },
      });

      res.json(historyEntry);
    } catch (error) {
      console.error('Create history error:', error);
      res.status(500).json({ error: 'Failed to create history entry' });
    }
  });

  /**
   * Boards (Maps)
   */

  // Get boards
  router.get('/boards', authenticateJWT, async (req: AuthRequest, res: Response) => {
    try {
      const { worldId } = req.query;

      if (!worldId || typeof worldId !== 'string') {
        return res.status(400).json({ error: 'worldId query parameter required' });
      }

      const boards = await prisma.board.findMany({
        where: { worldId },
        orderBy: { createdAt: 'desc' },
      });

      res.json(boards);
    } catch (error) {
      console.error('Get boards error:', error);
      res.status(500).json({ error: 'Failed to fetch boards' });
    }
  });

  // Create board
  router.post('/boards', authenticateJWT, async (req: AuthRequest, res: Response) => {
    try {
      const { worldId, name, width, height, cellSize } = req.body;

      if (!worldId || !name || !width || !height) {
        return res.status(400).json({ error: 'worldId, name, width, and height required' });
      }

      const board = await prisma.board.create({
        data: {
          worldId,
          name,
          width,
          height,
          cellSize: cellSize || 50,
          ownerId: req.user!.playerId,
          createdAt: new Date(),
        },
      });

      res.json(board);
    } catch (error) {
      console.error('Create board error:', error);
      res.status(500).json({ error: 'Failed to create board' });
    }
  });

  // Get tiles for a board
  router.get('/boards/:boardId/tiles', authenticateJWT, async (req: AuthRequest, res: Response) => {
    try {
      const { boardId } = req.params;

      const tiles = await prisma.tile.findMany({
        where: { boardId },
        orderBy: [
          { z: 'asc' },
          { y: 'asc' },
          { x: 'asc' },
        ],
      });

      res.json(tiles);
    } catch (error) {
      console.error('Get tiles error:', error);
      res.status(500).json({ error: 'Failed to fetch tiles' });
    }
  });

  /**
   * Tiles
   */

  // Create tile
  router.post('/tiles', authenticateJWT, async (req: AuthRequest, res: Response) => {
    try {
      const { boardId, x, y, z, type, data } = req.body;

      if (!boardId || x === undefined || y === undefined || !type) {
        return res.status(400).json({ error: 'boardId, x, y, and type required' });
      }

      const tile = await prisma.tile.create({
        data: {
          boardId,
          x,
          y,
          z: z || 0,
          type,
          data: data || {},
          createdAt: new Date(),
        },
      });

      res.json(tile);
    } catch (error) {
      console.error('Create tile error:', error);
      res.status(500).json({ error: 'Failed to create tile' });
    }
  });

  /**
   * Events (RpgEvent)
   */

  // Log a game event
  router.post('/events', authenticateJWT, async (req: AuthRequest, res: Response) => {
    try {
      const {
        eventType,
        action,
        description,
        sessionId,
        players,
        tokens,
        locations,
        things,
        activityId,
        movement,
        actorId,
        targetId,
        result,
        systemData,
        metadata
      } = req.body;

      if (!eventType || !sessionId) {
        return res.status(400).json({ error: 'eventType and sessionId required' });
      }

      const event = await prisma.rpgEvent.create({
        data: {
          eventType,
          action,
          description,
          sessionId,
          players: players || [],
          tokens: tokens || [],
          locations: locations || [],
          things: things || [],
          activityId,
          movement,
          actorId,
          targetId,
          result,
          systemData: systemData || {},
          metadata: metadata || {},
        },
      });

      res.json(event);
    } catch (error) {
      console.error('Create event error:', error);
      res.status(500).json({ error: 'Failed to log event' });
    }
  });

  // Get events for a session
  router.get('/events', authenticateJWT, async (req: AuthRequest, res: Response) => {
    try {
      const { sessionId, eventType, limit = '100' } = req.query;

      if (!sessionId || typeof sessionId !== 'string') {
        return res.status(400).json({ error: 'sessionId query parameter required' });
      }

      const where: any = { sessionId };
      if (eventType && typeof eventType === 'string') {
        where.eventType = eventType;
      }

      const events = await prisma.rpgEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string, 10),
      });

      res.json(events);
    } catch (error) {
      console.error('Get events error:', error);
      res.status(500).json({ error: 'Failed to fetch events' });
    }
  });

  // Get event by ID
  router.get('/events/:id', authenticateJWT, async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const event = await prisma.rpgEvent.findUnique({
        where: { id },
      });

      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      res.json(event);
    } catch (error) {
      console.error('Get event error:', error);
      res.status(500).json({ error: 'Failed to fetch event' });
    }
  });

  // Get event statistics for a session
  router.get('/events/stats/:sessionId', authenticateJWT, async (req: AuthRequest, res: Response) => {
    try {
      const { sessionId } = req.params;

      // Get event counts by type
      const eventCounts = await prisma.rpgEvent.groupBy({
        by: ['eventType'],
        where: { sessionId },
        _count: true,
      });

      // Get total event count
      const totalEvents = await prisma.rpgEvent.count({
        where: { sessionId },
      });

      // Get recent events
      const recentEvents = await prisma.rpgEvent.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          eventType: true,
          action: true,
          createdAt: true,
        },
      });

      res.json({
        totalEvents,
        eventCounts,
        recentEvents,
      });
    } catch (error) {
      console.error('Get event stats error:', error);
      res.status(500).json({ error: 'Failed to fetch event statistics' });
    }
  });

  return router;
}
