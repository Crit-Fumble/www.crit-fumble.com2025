/**
 * RPG Boards API Route
 * Manages game boards/maps
 *
 * SECURITY: Requires authentication, rate limited
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { apiRateLimiter, getClientIdentifier, getIpAddress, checkRateLimit } from '@/lib/rate-limit';
import prismaMain from '@/packages/cfg-lib/db-main';

const prisma = prismaMain;

/**
 * GET /api/rpg/boards
 * List all boards for a world
 *
 * SECURITY: Requires authentication, rate limited
 */
export async function GET(request: NextRequest) {
  try {
    // RATE LIMITING: 200 requests/minute for reads
    const ip = getIpAddress(request);
    const rateLimitResult = await checkRateLimit(
      apiRateLimiter,
      getClientIdentifier(undefined, ip)
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: { 'Retry-After': rateLimitResult.retryAfter.toString() }
        }
      );
    }

    // AUTHENTICATION: Require logged-in user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const worldId = searchParams.get('worldId');
    const ownerId = searchParams.get('ownerId');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};
    if (worldId) where.worldId = worldId;
    if (ownerId) where.ownerId = ownerId;

    const boards = await prisma.board.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        _count: {
          select: {
            tiles: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return NextResponse.json({ boards });
  } catch (error) {
    console.error('RPG Boards API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch boards', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rpg/boards
 * Create a new board
 *
 * SECURITY: Requires authentication, rate limited
 */
export async function POST(request: NextRequest) {
  try {
    // RATE LIMITING: 100 requests/minute for writes
    const ip = getIpAddress(request);
    const rateLimitResult = await checkRateLimit(
      apiRateLimiter,
      getClientIdentifier(undefined, ip)
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: { 'Retry-After': rateLimitResult.retryAfter.toString() }
        }
      );
    }

    // AUTHENTICATION: Require logged-in user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { worldId, name, width, height, cellSize, ownerId } = body;

    if (!worldId || !name || !width || !height) {
      return NextResponse.json(
        { error: 'Missing required fields: worldId, name, width, height' },
        { status: 400 }
      );
    }

    const board = await prisma.board.create({
      data: {
        worldId,
        name,
        width,
        height,
        cellSize: cellSize || 32,
        ownerId: ownerId || null,
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ board }, { status: 201 });
  } catch (error) {
    console.error('RPG Boards create error:', error);
    return NextResponse.json(
      { error: 'Failed to create board', details: String(error) },
      { status: 500 }
    );
  }
}
