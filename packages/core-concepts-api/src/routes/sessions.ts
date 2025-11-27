
import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import prisma from '../services/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Matches the RpgSession schema
const createSessionSchema = z.object({
  sessionNumber: z.number().optional(),
  sessionTitle: z.string().max(500).optional(),
  sessionDate: z.string().datetime(),
  systemName: z.string().max(255),
  campaignId: z.string().optional(),
  campaignName: z.string().max(255).optional(),
  worldId: z.string().optional(),
  sessionNotes: z.string().optional(),
  playerNotes: z.string().optional(),
  summary: z.string().optional(),
  highlights: z.array(z.unknown()).default([]),
  gmIds: z.array(z.string()).default([]),
  playerIds: z.array(z.string()).default([]),
  characterIds: z.array(z.string()).default([]),
  durationMinutes: z.number().optional(),
  xpAwarded: z.number().optional(),
  inGameTimeStart: z.record(z.unknown()).optional(),
  inGameTimeEnd: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const updateSessionSchema = createSessionSchema.partial();

const querySchema = z.object({
  worldId: z.string().optional(),
  campaignId: z.string().optional(),
  systemName: z.string().optional(),
  limit: z.string().transform(Number).default('50'),
  offset: z.string().transform(Number).default('0'),
});

// GET /api/v1/sessions
router.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const query = querySchema.parse(req.query);

    const where: Prisma.RpgSessionWhereInput = {};
    if (query.worldId) where.worldId = query.worldId;
    if (query.campaignId) where.campaignId = query.campaignId;
    if (query.systemName) where.systemName = query.systemName;

    const [sessions, total] = await Promise.all([
      prisma.rpgSession.findMany({
        where,
        take: Math.min(query.limit, 100),
        skip: query.offset,
        orderBy: { sessionDate: 'desc' },
        include: {
          campaign: { select: { id: true, name: true } },
          world: { select: { id: true, name: true } },
        },
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
        boards: true,
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
        sessionNumber: data.sessionNumber,
        sessionTitle: data.sessionTitle,
        sessionDate: new Date(data.sessionDate),
        systemName: data.systemName,
        campaignId: data.campaignId,
        campaignName: data.campaignName,
        worldId: data.worldId,
        sessionNotes: data.sessionNotes,
        playerNotes: data.playerNotes,
        summary: data.summary,
        highlights: data.highlights as Prisma.InputJsonValue,
        gmIds: data.gmIds as Prisma.InputJsonValue,
        playerIds: data.playerIds as Prisma.InputJsonValue,
        characterIds: data.characterIds as Prisma.InputJsonValue,
        durationMinutes: data.durationMinutes,
        xpAwarded: data.xpAwarded,
        inGameTimeStart: data.inGameTimeStart as Prisma.InputJsonValue | undefined,
        inGameTimeEnd: data.inGameTimeEnd as Prisma.InputJsonValue | undefined,
        metadata: (data.metadata ?? {}) as Prisma.InputJsonValue,
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

    const updateData: Prisma.RpgSessionUpdateInput = {
      sessionNumber: data.sessionNumber,
      sessionTitle: data.sessionTitle,
      sessionDate: data.sessionDate ? new Date(data.sessionDate) : undefined,
      systemName: data.systemName,
      campaignId: data.campaignId,
      campaignName: data.campaignName,
      worldId: data.worldId,
      sessionNotes: data.sessionNotes,
      playerNotes: data.playerNotes,
      summary: data.summary,
      highlights: data.highlights ? (data.highlights as Prisma.InputJsonValue) : undefined,
      gmIds: data.gmIds ? (data.gmIds as Prisma.InputJsonValue) : undefined,
      playerIds: data.playerIds ? (data.playerIds as Prisma.InputJsonValue) : undefined,
      characterIds: data.characterIds ? (data.characterIds as Prisma.InputJsonValue) : undefined,
      durationMinutes: data.durationMinutes,
      xpAwarded: data.xpAwarded,
      inGameTimeStart: data.inGameTimeStart ? (data.inGameTimeStart as Prisma.InputJsonValue) : undefined,
      inGameTimeEnd: data.inGameTimeEnd ? (data.inGameTimeEnd as Prisma.InputJsonValue) : undefined,
      metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : undefined,
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData];
      }
    });

    const session = await prisma.rpgSession.update({
      where: { id: req.params.id },
      data: updateData,
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
