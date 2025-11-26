import { Router } from 'express';
import { z } from 'zod';
import prisma from '../services/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Validation schemas
const createWorldSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  ownerId: z.string(),
  isPublic: z.boolean().default(false),
  worldType: z.string().optional(),
  scaleTier: z.enum(['micro', 'small', 'medium', 'large', 'planetary', 'stellar', 'galactic']).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const updateWorldSchema = createWorldSchema.partial().omit({ ownerId: true });

const querySchema = z.object({
  ownerId: z.string().optional(),
  isPublic: z.string().transform(v => v === 'true').optional(),
  limit: z.string().transform(Number).default('50'),
  offset: z.string().transform(Number).default('0'),
});

// GET /api/v1/worlds
router.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const query = querySchema.parse(req.query);

    const where: Record<string, unknown> = {};
    if (query.ownerId) where.ownerId = query.ownerId;
    if (query.isPublic !== undefined) where.isPublic = query.isPublic;

    const [worlds, total] = await Promise.all([
      prisma.rpgWorld.findMany({
        where,
        take: Math.min(query.limit, 100),
        skip: query.offset,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.rpgWorld.count({ where }),
    ]);

    res.json({ worlds, total, limit: query.limit, offset: query.offset });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/worlds/:id
router.get('/:id', async (req, res, next) => {
  try {
    const world = await prisma.rpgWorld.findUnique({
      where: { id: req.params.id },
      include: {
        creatures: { take: 10 },
        locations: { take: 10 },
        sessions: { take: 5 },
      },
    });

    if (!world) {
      res.status(404).json({ error: 'World not found' });
      return;
    }

    res.json(world);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/worlds
router.post('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const data = createWorldSchema.parse(req.body);

    const world = await prisma.rpgWorld.create({
      data: {
        name: data.name,
        description: data.description,
        ownerId: data.ownerId,
        isPublic: data.isPublic,
        worldType: data.worldType,
        scaleTier: data.scaleTier,
        metadata: data.metadata,
      },
    });

    res.status(201).json(world);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/worlds/:id
router.patch('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const data = updateWorldSchema.parse(req.body);

    const world = await prisma.rpgWorld.update({
      where: { id: req.params.id },
      data,
    });

    res.json(world);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/worlds/:id
router.delete('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    await prisma.rpgWorld.delete({
      where: { id: req.params.id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
