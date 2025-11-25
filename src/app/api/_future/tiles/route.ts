/**
 * RPG Tiles API Route
 * Manages individual tiles on game boards
 *
 * SECURITY: Requires authentication, rate limited
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { apiRateLimiter, getClientIdentifier, getIpAddress, checkRateLimit } from '@/lib/rate-limit';
import prismaMain from '@/packages/cfg-lib/db-main';

const prisma = prismaMain;

/**
 * GET /api/rpg/tiles
 * List tiles with filtering
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
    const boardId = searchParams.get('boardId');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '1000');

    const where: any = {};
    if (boardId) where.boardId = boardId;
    if (type) where.type = type;

    const tiles = await prisma.tile.findMany({
      where,
      orderBy: [
        { z: 'asc' },
        { y: 'asc' },
        { x: 'asc' },
      ],
      take: limit,
    });

    return NextResponse.json({ tiles });
  } catch (error) {
    console.error('RPG Tiles API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tiles', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rpg/tiles
 * Create a new tile
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
    const { boardId, x, y, z, type, data } = body;

    if (!boardId || x === undefined || y === undefined || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: boardId, x, y, type' },
        { status: 400 }
      );
    }

    const tile = await prisma.tile.create({
      data: {
        boardId,
        x,
        y,
        z: z || 0,
        type,
        data: data || {},
      },
    });

    return NextResponse.json({ tile }, { status: 201 });
  } catch (error) {
    console.error('RPG Tiles create error:', error);
    return NextResponse.json(
      { error: 'Failed to create tile', details: String(error) },
      { status: 500 }
    );
  }
}
