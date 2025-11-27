
import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import prisma from '../services/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Significance is an integer 1-10 in the schema
const createHistorySchema = z.object({
  eventType: z.string().max(50),
  eventTitle: z.string().max(500),
  eventDescription: z.string().optional(),
  significance: z.number().min(1).max(10).default(1),
  inGameTime: z.record(z.unknown()).optional(),
  sessionId: z.string().optional(),
  worldId: z.string().optional(),
  locationId: z.string().optional(),
  participantIds: z.array(z.string()).default([]),
  gmIds: z.array(z.string()).default([]),
  characterIds: z.array(z.string()).default([]),
  systemName: z.string().max(100).optional(),
  characterLevel: z.number().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const querySchema = z.object({
  sessionId: z.string().optional(),
  worldId: z.string().optional(),
  eventType: z.string().optional(),
  significance: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).default('100'),
  offset: z.string().transform(Number).default('0'),
});

// GET /api/v1/history
router.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const query = querySchema.parse(req.query);

    const where: Prisma.RpgHistoryWhereInput = {};
    if (query.sessionId) where.sessionId = query.sessionId;
    if (query.worldId) where.worldId = query.worldId;
    if (query.eventType) where.eventType = query.eventType;
    if (query.significance) where.significance = { gte: query.significance };

    const [events, total] = await Promise.all([
      prisma.rpgHistory.findMany({
        where,
        take: Math.min(query.limit, 500),
        skip: query.offset,
        orderBy: { createdAt: 'desc' },
        include: {
          session: { select: { id: true, sessionTitle: true, sessionNumber: true } },
          world: { select: { id: true, name: true } },
          location: { select: { id: true, name: true } },
        },
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
      include: {
        session: true,
        world: true,
        location: true,
      },
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
        eventType: data.eventType,
        eventTitle: data.eventTitle,
        eventDescription: data.eventDescription,
        significance: data.significance,
        inGameTime: data.inGameTime as Prisma.InputJsonValue | undefined,
        sessionId: data.sessionId,
        worldId: data.worldId,
        locationId: data.locationId,
        participantIds: data.participantIds as Prisma.InputJsonValue,
        gmIds: data.gmIds as Prisma.InputJsonValue,
        characterIds: data.characterIds as Prisma.InputJsonValue,
        systemName: data.systemName,
        characterLevel: data.characterLevel,
        metadata: (data.metadata ?? {}) as Prisma.InputJsonValue,
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
        eventType: event.eventType,
        eventTitle: event.eventTitle,
        eventDescription: event.eventDescription,
        significance: event.significance,
        inGameTime: event.inGameTime as Prisma.InputJsonValue | undefined,
        sessionId: event.sessionId,
        worldId: event.worldId,
        locationId: event.locationId,
        participantIds: event.participantIds as Prisma.InputJsonValue,
        gmIds: event.gmIds as Prisma.InputJsonValue,
        characterIds: event.characterIds as Prisma.InputJsonValue,
        systemName: event.systemName,
        characterLevel: event.characterLevel,
        metadata: (event.metadata ?? {}) as Prisma.InputJsonValue,
      })),
    });

    res.status(201).json({ count: events.count });
  } catch (error) {
    next(error);
  }
});

// Note: History events are immutable - no PATCH or DELETE

export default router;
