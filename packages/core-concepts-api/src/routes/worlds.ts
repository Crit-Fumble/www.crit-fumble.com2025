
import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import prisma from '../services/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Matches RpgWorld schema
const createWorldSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  systemName: z.string().max(100),
  worldScale: z.string().max(50).default('Realm'),
  ownerId: z.string(), // Platform user ID
  foundryWorldId: z.string().optional(),
  containerWorldId: z.string().optional(),
  settings: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
  tags: z.array(z.unknown()).optional(),
});

const updateWorldSchema = createWorldSchema.partial().omit({ ownerId: true });

const querySchema = z.object({
  ownerId: z.string().optional(),
  systemName: z.string().optional(),
  worldScale: z.string().optional(),
  limit: z.string().transform(Number).default('50'),
  offset: z.string().transform(Number).default('0'),
});

// GET /api/v1/worlds
router.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const query = querySchema.parse(req.query);

    const where: Prisma.RpgWorldWhereInput = {};
    if (query.ownerId) where.ownerId = query.ownerId;
    if (query.systemName) where.systemName = query.systemName;
    if (query.worldScale) where.worldScale = query.worldScale;

    const [worlds, total] = await Promise.all([
      prisma.rpgWorld.findMany({
        where,
        take: Math.min(query.limit, 100),
        skip: query.offset,
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: {
            select: {
              creatures: true,
              locations: true,
              campaigns: true,
              assets: true,
            },
          },
        },
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
        creatures: { take: 10, orderBy: { name: 'asc' } },
        locations: { take: 10, orderBy: { name: 'asc' } },
        campaigns: { take: 5 },
        containedWorlds: { take: 10 },
        containerWorld: true,
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
        systemName: data.systemName,
        worldScale: data.worldScale,
        ownerId: data.ownerId,
        foundryWorldId: data.foundryWorldId,
        containerWorldId: data.containerWorldId,
        settings: (data.settings ?? {}) as Prisma.InputJsonValue,
        metadata: (data.metadata ?? {}) as Prisma.InputJsonValue,
        tags: (data.tags ?? []) as Prisma.InputJsonValue,
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

    const updateData: Prisma.RpgWorldUpdateInput = {
      name: data.name,
      description: data.description,
      systemName: data.systemName,
      worldScale: data.worldScale,
      foundryWorldId: data.foundryWorldId,
      containerWorldId: data.containerWorldId,
      settings: data.settings ? (data.settings as Prisma.InputJsonValue) : undefined,
      metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : undefined,
      tags: data.tags ? (data.tags as Prisma.InputJsonValue) : undefined,
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData];
      }
    });

    const world = await prisma.rpgWorld.update({
      where: { id: req.params.id },
      data: updateData,
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
