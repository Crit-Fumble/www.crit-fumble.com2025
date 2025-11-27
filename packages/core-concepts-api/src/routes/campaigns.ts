
import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import prisma from '../services/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

const createCampaignSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  ownerId: z.string(),
  systemName: z.string().max(100),
  status: z.enum(['planning', 'active', 'paused', 'completed', 'archived']).default('planning'),
  isPublic: z.boolean().default(false),
  settings: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const updateCampaignSchema = createCampaignSchema.partial().omit({ ownerId: true });

const querySchema = z.object({
  ownerId: z.string().optional(),
  status: z.string().optional(),
  isPublic: z.string().transform(v => v === 'true').optional(),
  limit: z.string().transform(Number).default('50'),
  offset: z.string().transform(Number).default('0'),
});

// GET /api/v1/campaigns
router.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const query = querySchema.parse(req.query);

    const where: Prisma.RpgCampaignWhereInput = {};
    if (query.ownerId) where.ownerId = query.ownerId;
    if (query.status) where.status = query.status;
    if (query.isPublic !== undefined) where.isPublic = query.isPublic;

    const [campaigns, total] = await Promise.all([
      prisma.rpgCampaign.findMany({
        where,
        take: Math.min(query.limit, 100),
        skip: query.offset,
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: {
            select: {
              sessions: true,
              members: true,
              assets: true,
            },
          },
        },
      }),
      prisma.rpgCampaign.count({ where }),
    ]);

    res.json({ campaigns, total, limit: query.limit, offset: query.offset });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/campaigns/:id
router.get('/:id', async (req, res, next) => {
  try {
    const campaign = await prisma.rpgCampaign.findUnique({
      where: { id: req.params.id },
      include: {
        sessions: { take: 10, orderBy: { createdAt: 'desc' } },
        members: {
          include: { player: true },
        },
        world: true,
      },
    });

    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    res.json(campaign);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/campaigns
router.post('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const data = createCampaignSchema.parse(req.body);

    const campaign = await prisma.rpgCampaign.create({
      data: {
        name: data.name,
        description: data.description,
        ownerId: data.ownerId,
        systemName: data.systemName,
        status: data.status,
        isPublic: data.isPublic,
        settings: (data.settings ?? {}) as Prisma.InputJsonValue,
        metadata: (data.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });

    res.status(201).json(campaign);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/campaigns/:id
router.patch('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const data = updateCampaignSchema.parse(req.body);

    const updateData: Prisma.RpgCampaignUpdateInput = {
      name: data.name,
      description: data.description,
      systemName: data.systemName,
      status: data.status,
      isPublic: data.isPublic,
      settings: data.settings ? (data.settings as Prisma.InputJsonValue) : undefined,
      metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : undefined,
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData];
      }
    });

    const campaign = await prisma.rpgCampaign.update({
      where: { id: req.params.id },
      data: updateData,
    });

    res.json(campaign);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/campaigns/:id
router.delete('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    await prisma.rpgCampaign.delete({
      where: { id: req.params.id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
