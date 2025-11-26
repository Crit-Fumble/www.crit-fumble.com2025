import { Router } from 'express';
import { z } from 'zod';
import prisma from '../services/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

const createBoardSchema = z.object({
  name: z.string().min(1).max(255),
  sessionId: z.string().optional(),
  worldId: z.string().optional(),
  width: z.number().default(50),
  height: z.number().default(50),
  depth: z.number().default(1),
  gridType: z.enum(['square', 'hex', 'none']).default('square'),
  state: z.record(z.unknown()).optional(),
  turnOrder: z.array(z.string()).optional(),
  viewportState: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const updateBoardSchema = createBoardSchema.partial();

const querySchema = z.object({
  sessionId: z.string().optional(),
  worldId: z.string().optional(),
  limit: z.string().transform(Number).default('20'),
  offset: z.string().transform(Number).default('0'),
});

// GET /api/v1/boards
router.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const query = querySchema.parse(req.query);

    const where: Record<string, unknown> = {};
    if (query.sessionId) where.sessionId = query.sessionId;
    if (query.worldId) where.worldId = query.worldId;

    const [boards, total] = await Promise.all([
      prisma.rpgBoard.findMany({
        where,
        take: Math.min(query.limit, 50),
        skip: query.offset,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.rpgBoard.count({ where }),
    ]);

    res.json({ boards, total, limit: query.limit, offset: query.offset });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/boards/:id
router.get('/:id', async (req, res, next) => {
  try {
    const board = await prisma.rpgBoard.findUnique({
      where: { id: req.params.id },
    });

    if (!board) {
      res.status(404).json({ error: 'Board not found' });
      return;
    }

    res.json(board);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/boards
router.post('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const data = createBoardSchema.parse(req.body);

    const board = await prisma.rpgBoard.create({
      data: {
        name: data.name,
        sessionId: data.sessionId,
        worldId: data.worldId,
        width: data.width,
        height: data.height,
        depth: data.depth,
        gridType: data.gridType,
        state: data.state,
        turnOrder: data.turnOrder,
        viewportState: data.viewportState,
        metadata: data.metadata,
      },
    });

    res.status(201).json(board);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/boards/:id
router.patch('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const data = updateBoardSchema.parse(req.body);

    const board = await prisma.rpgBoard.update({
      where: { id: req.params.id },
      data,
    });

    res.json(board);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/boards/:id
router.delete('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    await prisma.rpgBoard.delete({
      where: { id: req.params.id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
