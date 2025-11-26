import { Router } from 'express';
import { z } from 'zod';
import prisma from '../services/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

const createHistorySchema = z.object({
  sessionId: z.string(),
  worldId: z.string().optional(),
  eventType: z.string(),
  description: z.string(),
  significance: z.enum(['trivial', 'minor', 'moderate', 'major', 'legendary']).default('minor'),
  participants: z.array(z.string()).optional(),
  location: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  timestamp: z.string().datetime().optional(),
});

const querySchema = z.object({
  sessionId: z.string().optional(),
  worldId: z.string().optional(),
  eventType: z.string().optional(),
  significance: z.string().optional(),
  limit: z.string().transform(Number).default('100'),
  offset: z.string().transform(Number).default('0'),
});

// GET /api/v1/history
router.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const query = querySchema.parse(req.query);

    const where: Record<string, unknown> = {};
    if (query.sessionId) where.sessionId = query.sessionId;
    if (query.worldId) where.worldId = query.worldId;
    if (query.eventType) where.eventType = query.eventType;
    if (query.significance) where.significance = query.significance;

    const [events, total] = await Promise.all([
      prisma.rpgHistory.findMany({
        where,
        take: Math.min(query.limit, 500),
        skip: query.offset,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.rpgHistory.count({ where }),
    ]);

    res.json({ events, total, limit: query.limit, offset: query.offset });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/history/:id
router.get('/:id', async (req, res, next) => {
  try {
    const event = await prisma.rpgHistory.findUnique({
      where: { id: req.params.id },
    });

    if (!event) {
      res.status(404).json({ error: 'History event not found' });
      return;
    }

    res.json(event);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/history
router.post('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const data = createHistorySchema.parse(req.body);

    const event = await prisma.rpgHistory.create({
      data: {
        sessionId: data.sessionId,
        worldId: data.worldId,
        eventType: data.eventType,
        description: data.description,
        significance: data.significance,
        participants: data.participants,
        location: data.location,
        metadata: data.metadata,
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      },
    });

    res.status(201).json(event);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/history/batch - Create multiple events at once
router.post('/batch', async (req: AuthenticatedRequest, res, next) => {
  try {
    const batchSchema = z.array(createHistorySchema);
    const data = batchSchema.parse(req.body);

    const events = await prisma.rpgHistory.createMany({
      data: data.map(event => ({
        sessionId: event.sessionId,
        worldId: event.worldId,
        eventType: event.eventType,
        description: event.description,
        significance: event.significance,
        participants: event.participants,
        location: event.location,
        metadata: event.metadata,
        timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
      })),
    });

    res.status(201).json({ count: events.count });
  } catch (error) {
    next(error);
  }
});

// Note: History events are immutable - no PATCH or DELETE

export default router;
