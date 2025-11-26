import { Router } from 'express';
import { z } from 'zod';
import prisma from '../services/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Validation schemas
const createCreatureSchema = z.object({
  name: z.string().min(1).max(255),
  foundryId: z.string().optional(),
  worldId: z.string().optional(),
  campaignId: z.string().optional(),
  creatureType: z.string().optional(),
  isPlayerCharacter: z.boolean().default(false),
  currentHp: z.number().optional(),
  maxHp: z.number().optional(),
  level: z.number().optional(),
  experience: z.number().optional(),
  behaviorAxes: z.record(z.unknown()).optional(),
  needs: z.record(z.unknown()).optional(),
  professions: z.array(z.string()).optional(),
  routines: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const updateCreatureSchema = createCreatureSchema.partial();

const querySchema = z.object({
  worldId: z.string().optional(),
  campaignId: z.string().optional(),
  foundryId: z.string().optional(),
  isPlayerCharacter: z.string().transform(v => v === 'true').optional(),
  limit: z.string().transform(Number).default('50'),
  offset: z.string().transform(Number).default('0'),
});

// GET /api/v1/creatures
router.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const query = querySchema.parse(req.query);

    const where: Record<string, unknown> = {};
    if (query.worldId) where.worldId = query.worldId;
    if (query.campaignId) where.campaignId = query.campaignId;
    if (query.foundryId) where.foundryId = query.foundryId;
    if (query.isPlayerCharacter !== undefined) where.isPlayerCharacter = query.isPlayerCharacter;

    const [creatures, total] = await Promise.all([
      prisma.rpgCreature.findMany({
        where,
        take: Math.min(query.limit, 100),
        skip: query.offset,
        orderBy: { updatedAt: 'desc' },
        include: {
          world: { select: { id: true, name: true } },
          campaign: { select: { id: true, name: true } },
        },
      }),
      prisma.rpgCreature.count({ where }),
    ]);

    res.json({ creatures, total, limit: query.limit, offset: query.offset });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/creatures/:id
router.get('/:id', async (req, res, next) => {
  try {
    const creature = await prisma.rpgCreature.findUnique({
      where: { id: req.params.id },
      include: {
        world: true,
        campaign: true,
      },
    });

    if (!creature) {
      res.status(404).json({ error: 'Creature not found' });
      return;
    }

    res.json(creature);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/creatures
router.post('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const data = createCreatureSchema.parse(req.body);

    const creature = await prisma.rpgCreature.create({
      data: {
        name: data.name,
        foundryId: data.foundryId,
        worldId: data.worldId,
        campaignId: data.campaignId,
        creatureType: data.creatureType,
        isPlayerCharacter: data.isPlayerCharacter,
        currentHp: data.currentHp,
        maxHp: data.maxHp,
        level: data.level,
        experience: data.experience,
        behaviorAxes: data.behaviorAxes,
        needs: data.needs,
        professions: data.professions,
        routines: data.routines,
        metadata: data.metadata,
      },
    });

    res.status(201).json(creature);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/creatures/upsert - Upsert by foundryId
router.post('/upsert', async (req: AuthenticatedRequest, res, next) => {
  try {
    const data = createCreatureSchema.parse(req.body);

    if (!data.foundryId) {
      res.status(400).json({ error: 'foundryId required for upsert' });
      return;
    }

    const creature = await prisma.rpgCreature.upsert({
      where: { foundryId: data.foundryId },
      create: {
        name: data.name,
        foundryId: data.foundryId,
        worldId: data.worldId,
        campaignId: data.campaignId,
        creatureType: data.creatureType,
        isPlayerCharacter: data.isPlayerCharacter,
        currentHp: data.currentHp,
        maxHp: data.maxHp,
        level: data.level,
        experience: data.experience,
        behaviorAxes: data.behaviorAxes,
        needs: data.needs,
        professions: data.professions,
        routines: data.routines,
        metadata: data.metadata,
      },
      update: {
        name: data.name,
        worldId: data.worldId,
        campaignId: data.campaignId,
        creatureType: data.creatureType,
        isPlayerCharacter: data.isPlayerCharacter,
        currentHp: data.currentHp,
        maxHp: data.maxHp,
        level: data.level,
        experience: data.experience,
        behaviorAxes: data.behaviorAxes,
        needs: data.needs,
        professions: data.professions,
        routines: data.routines,
        metadata: data.metadata,
      },
    });

    res.status(200).json(creature);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/creatures/:id
router.patch('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const data = updateCreatureSchema.parse(req.body);

    const creature = await prisma.rpgCreature.update({
      where: { id: req.params.id },
      data,
    });

    res.json(creature);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/creatures/:id
router.delete('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    await prisma.rpgCreature.delete({
      where: { id: req.params.id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
