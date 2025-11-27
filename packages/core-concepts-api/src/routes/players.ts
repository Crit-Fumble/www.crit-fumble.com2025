
import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import prisma from '../services/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Matches RpgPlayer schema - players are game identities linked to platform users
const createPlayerSchema = z.object({
  userId: z.string(), // Platform user reference
  displayName: z.string().max(100).optional(),
  defaultRole: z.enum(['player', 'gm', 'spectator']).default('player'),
  gameSettings: z.record(z.unknown()).optional(),
});

const updatePlayerSchema = createPlayerSchema.partial().omit({ userId: true });

const querySchema = z.object({
  userId: z.string().optional(),
  limit: z.string().transform(Number).default('50'),
  offset: z.string().transform(Number).default('0'),
});

// GET /api/v1/players
router.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const query = querySchema.parse(req.query);

    const where: Prisma.RpgPlayerWhereInput = {};
    if (query.userId) where.userId = query.userId;

    const [players, total] = await Promise.all([
      prisma.rpgPlayer.findMany({
        where,
        take: Math.min(query.limit, 100),
        skip: query.offset,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              ownedCampaigns: true,
              campaignMemberships: true,
              controlledCharacters: true,
            },
          },
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
        ownedCampaigns: { take: 10 },
        campaignMemberships: {
          include: { campaign: true },
          take: 10,
        },
        controlledCharacters: { take: 10 },
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

// GET /api/v1/players/by-user/:userId - Find player by platform user ID
router.get('/by-user/:userId', async (req, res, next) => {
  try {
    const player = await prisma.rpgPlayer.findUnique({
      where: { userId: req.params.userId },
      include: {
        ownedCampaigns: { take: 5 },
        campaignMemberships: {
          include: { campaign: true },
          take: 5,
        },
      },
    });

    if (!player) {
      res.status(404).json({ error: 'Player not found for user' });
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
        displayName: data.displayName,
        defaultRole: data.defaultRole,
        gameSettings: (data.gameSettings ?? {}) as Prisma.InputJsonValue,
      },
    });

    res.status(201).json(player);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/players/upsert - Upsert by userId
router.post('/upsert', async (req: AuthenticatedRequest, res, next) => {
  try {
    const data = createPlayerSchema.parse(req.body);

    const player = await prisma.rpgPlayer.upsert({
      where: { userId: data.userId },
      create: {
        userId: data.userId,
        displayName: data.displayName,
        defaultRole: data.defaultRole,
        gameSettings: (data.gameSettings ?? {}) as Prisma.InputJsonValue,
      },
      update: {
        displayName: data.displayName,
        defaultRole: data.defaultRole,
        gameSettings: data.gameSettings ? (data.gameSettings as Prisma.InputJsonValue) : undefined,
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

    const updateData: Prisma.RpgPlayerUpdateInput = {
      displayName: data.displayName,
      defaultRole: data.defaultRole,
      gameSettings: data.gameSettings ? (data.gameSettings as Prisma.InputJsonValue) : undefined,
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData];
      }
    });

    const player = await prisma.rpgPlayer.update({
      where: { id: req.params.id },
      data: updateData,
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
