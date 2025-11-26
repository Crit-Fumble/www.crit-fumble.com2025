import { Router } from 'express';
import { z } from 'zod';
import prisma from '../services/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

const createSessionSchema = z.object({
  name: z.string().min(1).max(255),
  worldId: z.string().optional(),
  campaignId: z.string().optional(),
  gameMode: z.string().optional(),
  status: z.enum(['planning', 'active', 'paused', 'completed']).default('planning'),
  startedAt: z.string().datetime().optional(),
  endedAt: z.string().datetime().optional(),
  inCombat: z.boolean().default(false),
  combatRound: z.number().default(0),
  metadata: z.record(z.unknown()).optional(),
});

const updateSessionSchema = createSessionSchema.partial();

const querySchema = z.object({
  worldId: z.string().optional(),
  campaignId: z.string().optional(),
  status: z.string().optional(),
  limit: z.string().transform(Number).default('50'),
  offset: z.string().transform(Number).default('0'),
});

// GET /api/v1/sessions
router.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const query = querySchema.parse(req.query);

    const where: Record<string, unknown> = {};
    if (query.worldId) where.worldId = query.worldId;
    if (query.campaignId) where.campaignId = query.campaignId;
    if (query.status) where.status = query.status;

    const [sessions, total] = await Promise.all([
      prisma.rpgSession.findMany({
        where,
        take: Math.min(query.limit, 100),
        skip: query.offset,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.rpgSession.count({ where }),
    ]);

    res.json({ sessions, total, limit: query.limit, offset: query.offset });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/sessions/:id
router.get('/:id', async (req, res, next) => {
  try {
    const session = await prisma.rpgSession.findUnique({
      where: { id: req.params.id },
      include: {
        world: true,
        campaign: true,
        history: { take: 20, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    res.json(session);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/sessions
router.post('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const data = createSessionSchema.parse(req.body);

    const session = await prisma.rpgSession.create({
      data: {
        name: data.name,
        worldId: data.worldId,
        campaignId: data.campaignId,
        gameMode: data.gameMode,
        status: data.status,
        startedAt: data.startedAt ? new Date(data.startedAt) : undefined,
        endedAt: data.endedAt ? new Date(data.endedAt) : undefined,
        inCombat: data.inCombat,
        combatRound: data.combatRound,
        metadata: data.metadata,
      },
    });

    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/sessions/:id
router.patch('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const data = updateSessionSchema.parse(req.body);

    const session = await prisma.rpgSession.update({
      where: { id: req.params.id },
      data: {
        ...data,
        startedAt: data.startedAt ? new Date(data.startedAt) : undefined,
        endedAt: data.endedAt ? new Date(data.endedAt) : undefined,
      },
    });

    res.json(session);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/sessions/:id
router.delete('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    await prisma.rpgSession.delete({
      where: { id: req.params.id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
