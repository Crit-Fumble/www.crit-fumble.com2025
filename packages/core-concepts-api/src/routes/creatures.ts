
import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import prisma from '../services/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Validation schemas matching the Prisma schema
const createCreatureSchema = z.object({
  name: z.string().min(1).max(100),
  race: z.string().max(50).optional(),
  class: z.string().max(50).optional(),
  profession: z.string().max(50).optional(),
  level: z.number().default(0),
  imageUrl: z.string().optional(),
  worldId: z.string().optional(),
  campaignId: z.string().optional(),
  playerId: z.string().optional(), // null for NPCs, set for player characters
  foundryId: z.string().optional(),
  // Behavior axes (0-100)
  lawfulness: z.number().min(0).max(100).default(50),
  goodness: z.number().min(0).max(100).default(50),
  faith: z.number().min(0).max(100).default(50),
  courage: z.number().min(0).max(100).default(50),
  alignment: z.string().max(20).optional(),
  // Needs (0-100)
  foodNeed: z.number().min(0).max(100).default(85),
  waterNeed: z.number().min(0).max(100).default(90),
  sleepNeed: z.number().min(0).max(100).default(100),
  relaxationNeed: z.number().min(0).max(100).default(60),
  adventureNeed: z.number().min(0).max(100).default(100),
  // JSON fields
  needDepletionRates: z.record(z.unknown()).optional(),
  professionData: z.record(z.unknown()).optional(),
  residence: z.record(z.unknown()).optional(),
  inventory: z.array(z.unknown()).optional(),
  routine: z.array(z.unknown()).optional(),
  relationships: z.array(z.unknown()).optional(),
  // Current state
  currentActivity: z.string().max(100).optional(),
  currentLocation: z.string().max(100).optional(),
  simulationZone: z.string().default('inactive'),
  notes: z.array(z.string()).optional(),
  tags: z.array(z.unknown()).optional(),
});

const updateCreatureSchema = createCreatureSchema.partial();

const querySchema = z.object({
  worldId: z.string().optional(),
  campaignId: z.string().optional(),
  foundryId: z.string().optional(),
  playerId: z.string().optional(),
  isPlayerCharacter: z.string().transform(v => v === 'true').optional(),
  limit: z.string().transform(Number).default('50'),
  offset: z.string().transform(Number).default('0'),
});

// GET /api/v1/creatures
router.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const query = querySchema.parse(req.query);

    const where: Prisma.RpgCreatureWhereInput = {};
    if (query.worldId) where.worldId = query.worldId;
    if (query.campaignId) where.campaignId = query.campaignId;
    if (query.foundryId) where.foundryId = query.foundryId;
    if (query.playerId) where.playerId = query.playerId;
    // isPlayerCharacter = has a playerId
    if (query.isPlayerCharacter !== undefined) {
      where.playerId = query.isPlayerCharacter ? { not: null } : null;
    }

    const [creatures, total] = await Promise.all([
      prisma.rpgCreature.findMany({
        where,
        take: Math.min(query.limit, 100),
        skip: query.offset,
        orderBy: { updatedAt: 'desc' },
        include: {
          world: { select: { id: true, name: true } },
          campaign: { select: { id: true, name: true } },
          player: { select: { id: true, displayName: true, userId: true } },
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
        player: true,
        activities: { take: 10, orderBy: { createdAt: 'desc' } },
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
        race: data.race,
        class: data.class,
        profession: data.profession,
        level: data.level,
        imageUrl: data.imageUrl,
        worldId: data.worldId,
        campaignId: data.campaignId,
        playerId: data.playerId,
        foundryId: data.foundryId,
        lawfulness: data.lawfulness,
        goodness: data.goodness,
        faith: data.faith,
        courage: data.courage,
        alignment: data.alignment,
        foodNeed: data.foodNeed,
        waterNeed: data.waterNeed,
        sleepNeed: data.sleepNeed,
        relaxationNeed: data.relaxationNeed,
        adventureNeed: data.adventureNeed,
        needDepletionRates: (data.needDepletionRates ?? {}) as Prisma.InputJsonValue,
        professionData: (data.professionData ?? {}) as Prisma.InputJsonValue,
        residence: (data.residence ?? {}) as Prisma.InputJsonValue,
        inventory: (data.inventory ?? []) as Prisma.InputJsonValue,
        routine: (data.routine ?? []) as Prisma.InputJsonValue,
        relationships: (data.relationships ?? []) as Prisma.InputJsonValue,
        currentActivity: data.currentActivity,
        currentLocation: data.currentLocation,
        simulationZone: data.simulationZone,
        notes: data.notes ?? [],
        tags: (data.tags ?? []) as Prisma.InputJsonValue,
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

    const createData = {
      name: data.name,
      race: data.race,
      class: data.class,
      profession: data.profession,
      level: data.level,
      imageUrl: data.imageUrl,
      worldId: data.worldId,
      campaignId: data.campaignId,
      playerId: data.playerId,
      foundryId: data.foundryId,
      lawfulness: data.lawfulness,
      goodness: data.goodness,
      faith: data.faith,
      courage: data.courage,
      alignment: data.alignment,
      foodNeed: data.foodNeed,
      waterNeed: data.waterNeed,
      sleepNeed: data.sleepNeed,
      relaxationNeed: data.relaxationNeed,
      adventureNeed: data.adventureNeed,
      needDepletionRates: (data.needDepletionRates ?? {}) as Prisma.InputJsonValue,
      professionData: (data.professionData ?? {}) as Prisma.InputJsonValue,
      residence: (data.residence ?? {}) as Prisma.InputJsonValue,
      inventory: (data.inventory ?? []) as Prisma.InputJsonValue,
      routine: (data.routine ?? []) as Prisma.InputJsonValue,
      relationships: (data.relationships ?? []) as Prisma.InputJsonValue,
      currentActivity: data.currentActivity,
      currentLocation: data.currentLocation,
      simulationZone: data.simulationZone,
      notes: data.notes ?? [],
      tags: (data.tags ?? []) as Prisma.InputJsonValue,
    };

    const creature = await prisma.rpgCreature.upsert({
      where: { foundryId: data.foundryId },
      create: createData,
      update: {
        ...createData,
        foundryId: undefined, // Don't update foundryId
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

    const updateData: Prisma.RpgCreatureUpdateInput = {
      name: data.name,
      race: data.race,
      class: data.class,
      profession: data.profession,
      level: data.level,
      imageUrl: data.imageUrl,
      worldId: data.worldId,
      campaignId: data.campaignId,
      playerId: data.playerId,
      foundryId: data.foundryId,
      lawfulness: data.lawfulness,
      goodness: data.goodness,
      faith: data.faith,
      courage: data.courage,
      alignment: data.alignment,
      foodNeed: data.foodNeed,
      waterNeed: data.waterNeed,
      sleepNeed: data.sleepNeed,
      relaxationNeed: data.relaxationNeed,
      adventureNeed: data.adventureNeed,
      needDepletionRates: data.needDepletionRates ? (data.needDepletionRates as Prisma.InputJsonValue) : undefined,
      professionData: data.professionData ? (data.professionData as Prisma.InputJsonValue) : undefined,
      residence: data.residence ? (data.residence as Prisma.InputJsonValue) : undefined,
      inventory: data.inventory ? (data.inventory as Prisma.InputJsonValue) : undefined,
      routine: data.routine ? (data.routine as Prisma.InputJsonValue) : undefined,
      relationships: data.relationships ? (data.relationships as Prisma.InputJsonValue) : undefined,
      currentActivity: data.currentActivity,
      currentLocation: data.currentLocation,
      simulationZone: data.simulationZone,
      notes: data.notes,
      tags: data.tags ? (data.tags as Prisma.InputJsonValue) : undefined,
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData];
      }
    });

    const creature = await prisma.rpgCreature.update({
      where: { id: req.params.id },
      data: updateData,
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
