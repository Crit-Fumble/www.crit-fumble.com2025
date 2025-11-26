import { Router } from 'express';
import { z } from 'zod';
import prisma from '../services/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

const createPlayerSchema = z.object({
  userId: z.string(),
  campaignId: z.string(),
  role: z.enum(['player', 'gm', 'spectator']).default('player'),
  characterId: z.string().optional(),
  isActive: z.boolean().default(true),
  metadata: z.record(z.unknown()).optional(),
});

const updatePlayerSchema = createPlayerSchema.partial().omit({ userId: true, campaignId: true });

const querySchema = z.object({
  userId: z.string().optional(),
  campaignId: z.string().optional(),
  role: z.string().optional(),
  isActive: z.string().transform(v => v === 'true').optional(),
  limit: z.string().transform(Number).default('50'),
  offset: z.string().transform(Number).default('0'),
});

// GET /api/v1/players
router.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const query = querySchema.parse(req.query);

    const where: Record<string, unknown> = {};
    if (query.userId) where.userId = query.userId;
    if (query.campaignId) where.campaignId = query.campaignId;
    if (query.role) where.role = query.role;
    if (query.isActive !== undefined) where.isActive = query.isActive;

    const [players, total] = await Promise.all([
      prisma.rpgPlayer.findMany({
        where,
        take: Math.min(query.limit, 100),
        skip: query.offset,
        orderBy: { createdAt: 'desc' },
        include: {
          campaign: { select: { id: true, name: true } },
        },
      }),
      prisma.rpgPlayer.count({ where }),
    ]);

    res.json({ players, total, limit: query.limit, offset: query.offset });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/players/:id
router.get('/:id', async (req, res, next) => {
  try {
    const player = await prisma.rpgPlayer.findUnique({
      where: { id: req.params.id },
      include: {
        campaign: true,
      },
    });

    if (!player) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }

    res.json(player);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/players
router.post('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const data = createPlayerSchema.parse(req.body);

    const player = await prisma.rpgPlayer.create({
      data: {
        userId: data.userId,
        campaignId: data.campaignId,
        role: data.role,
        characterId: data.characterId,
        isActive: data.isActive,
        metadata: data.metadata,
      },
    });

    res.status(201).json(player);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/players/upsert - Upsert by userId + campaignId
router.post('/upsert', async (req: AuthenticatedRequest, res, next) => {
  try {
    const data = createPlayerSchema.parse(req.body);

    const player = await prisma.rpgPlayer.upsert({
      where: {
        userId_campaignId: {
          userId: data.userId,
          campaignId: data.campaignId,
        },
      },
      create: {
        userId: data.userId,
        campaignId: data.campaignId,
        role: data.role,
        characterId: data.characterId,
        isActive: data.isActive,
        metadata: data.metadata,
      },
      update: {
        role: data.role,
        characterId: data.characterId,
        isActive: data.isActive,
        metadata: data.metadata,
      },
    });

    res.status(200).json(player);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/players/:id
router.patch('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const data = updatePlayerSchema.parse(req.body);

    const player = await prisma.rpgPlayer.update({
      where: { id: req.params.id },
      data,
    });

    res.json(player);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/players/:id
router.delete('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    await prisma.rpgPlayer.delete({
      where: { id: req.params.id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
