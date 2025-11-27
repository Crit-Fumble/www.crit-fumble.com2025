
import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import prisma from '../services/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

const createBoardSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  sessionId: z.string().optional(),
  sheetId: z.string(), // Required - links to RpgSheet
  // Board center coordinates
  centerX: z.number().default(0),
  centerY: z.number().default(0),
  centerZ: z.number().default(0),
  // Board size
  sizeX: z.number().default(50),
  sizeY: z.number().default(50),
  sizeZ: z.number().default(50),
  // Viewport state
  viewportX: z.number().optional(),
  viewportY: z.number().optional(),
  viewportZoom: z.number().default(1.0),
  // Game state
  activeTokens: z.array(z.unknown()).default([]),
  turnOrder: z.array(z.unknown()).default([]),
  currentTurn: z.number().optional(),
  currentRound: z.number().optional(),
  inGameTime: z.record(z.unknown()).optional(),
  activeMode: z.string().default('play'),
  gridType: z.enum(['square', 'hex', 'none']).default('square'),
  // Metadata
  metadata: z.record(z.unknown()).optional(),
  tags: z.array(z.unknown()).default([]),
});

const updateBoardSchema = createBoardSchema.partial().omit({ sheetId: true });

const querySchema = z.object({
  sessionId: z.string().optional(),
  sheetId: z.string().optional(),
  limit: z.string().transform(Number).default('20'),
  offset: z.string().transform(Number).default('0'),
});

// GET /api/v1/boards
router.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const query = querySchema.parse(req.query);

    const where: Prisma.RpgBoardWhereInput = {};
    if (query.sessionId) where.sessionId = query.sessionId;
    if (query.sheetId) where.sheetId = query.sheetId;

    const [boards, total] = await Promise.all([
      prisma.rpgBoard.findMany({
        where,
        take: Math.min(query.limit, 50),
        skip: query.offset,
        orderBy: { updatedAt: 'desc' },
        include: { sheet: true },
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
      include: { sheet: true, session: true },
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
        description: data.description,
        sessionId: data.sessionId,
        sheetId: data.sheetId,
        centerX: data.centerX,
        centerY: data.centerY,
        centerZ: data.centerZ,
        sizeX: data.sizeX,
        sizeY: data.sizeY,
        sizeZ: data.sizeZ,
        viewportX: data.viewportX,
        viewportY: data.viewportY,
        viewportZoom: data.viewportZoom,
        activeTokens: data.activeTokens as Prisma.InputJsonValue,
        turnOrder: data.turnOrder as Prisma.InputJsonValue,
        currentTurn: data.currentTurn,
        currentRound: data.currentRound,
        inGameTime: data.inGameTime as Prisma.InputJsonValue | undefined,
        activeMode: data.activeMode,
        gridType: data.gridType,
        metadata: (data.metadata ?? {}) as Prisma.InputJsonValue,
        tags: data.tags as Prisma.InputJsonValue,
      },
      include: { sheet: true },
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

    const updateData: Prisma.RpgBoardUpdateInput = {
      name: data.name,
      description: data.description,
      sessionId: data.sessionId,
      centerX: data.centerX,
      centerY: data.centerY,
      centerZ: data.centerZ,
      sizeX: data.sizeX,
      sizeY: data.sizeY,
      sizeZ: data.sizeZ,
      viewportX: data.viewportX,
      viewportY: data.viewportY,
      viewportZoom: data.viewportZoom,
      activeTokens: data.activeTokens ? (data.activeTokens as Prisma.InputJsonValue) : undefined,
      turnOrder: data.turnOrder ? (data.turnOrder as Prisma.InputJsonValue) : undefined,
      currentTurn: data.currentTurn,
      currentRound: data.currentRound,
      inGameTime: data.inGameTime ? (data.inGameTime as Prisma.InputJsonValue) : undefined,
      activeMode: data.activeMode,
      gridType: data.gridType,
      metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : undefined,
      tags: data.tags ? (data.tags as Prisma.InputJsonValue) : undefined,
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData];
      }
    });

    const board = await prisma.rpgBoard.update({
      where: { id: req.params.id },
      data: updateData,
      include: { sheet: true },
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
