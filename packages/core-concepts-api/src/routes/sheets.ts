import { Router } from 'express';
import { z } from 'zod';
import prisma from '../services/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

const createSheetSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(['character', 'hand', 'location', 'creature', 'environment', 'item']),
  createdBy: z.string(),
  worldId: z.string().optional(),
  campaignId: z.string().optional(),
  systemId: z.string().optional(),
  data: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const updateSheetSchema = createSheetSchema.partial().omit({ createdBy: true });

const querySchema = z.object({
  type: z.string().optional(),
  createdBy: z.string().optional(),
  worldId: z.string().optional(),
  campaignId: z.string().optional(),
  limit: z.string().transform(Number).default('50'),
  offset: z.string().transform(Number).default('0'),
});

// GET /api/v1/sheets
router.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const query = querySchema.parse(req.query);

    const where: Record<string, unknown> = {};
    if (query.type) where.type = query.type;
    if (query.createdBy) where.createdBy = query.createdBy;
    if (query.worldId) where.worldId = query.worldId;
    if (query.campaignId) where.campaignId = query.campaignId;

    const [sheets, total] = await Promise.all([
      prisma.rpgSheet.findMany({
        where,
        take: Math.min(query.limit, 100),
        skip: query.offset,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.rpgSheet.count({ where }),
    ]);

    res.json({ sheets, total, limit: query.limit, offset: query.offset });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/sheets/:id
router.get('/:id', async (req, res, next) => {
  try {
    const sheet = await prisma.rpgSheet.findUnique({
      where: { id: req.params.id },
    });

    if (!sheet) {
      res.status(404).json({ error: 'Sheet not found' });
      return;
    }

    res.json(sheet);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/sheets
router.post('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const data = createSheetSchema.parse(req.body);

    const sheet = await prisma.rpgSheet.create({
      data: {
        name: data.name,
        type: data.type,
        createdBy: data.createdBy,
        worldId: data.worldId,
        campaignId: data.campaignId,
        systemId: data.systemId,
        data: data.data,
        metadata: data.metadata,
      },
    });

    res.status(201).json(sheet);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/sheets/:id
router.patch('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const data = updateSheetSchema.parse(req.body);

    const sheet = await prisma.rpgSheet.update({
      where: { id: req.params.id },
      data,
    });

    res.json(sheet);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/sheets/:id
router.delete('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    await prisma.rpgSheet.delete({
      where: { id: req.params.id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
