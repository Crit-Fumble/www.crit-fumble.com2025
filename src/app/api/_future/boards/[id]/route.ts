/**
 * RPG Board Detail API Route
 * Get, update, or delete a specific board
 *
 * SECURITY: Requires authentication, rate limited
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { apiRateLimiter, getClientIdentifier, getIpAddress, checkRateLimit } from '@/lib/rate-limit';
import prismaMain from '@/packages/cfg-lib/db-main';

const prisma = prismaMain;

/**
 * GET /api/rpg/boards/[id]
 * Get a specific board by ID
 *
 * SECURITY: Requires authentication, rate limited
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const board = await prisma.board.findUnique({
      where: { id: params.id },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        tiles: {
          orderBy: [
            { z: 'asc' },
            { y: 'asc' },
            { x: 'asc' },
          ],
        },
        _count: {
          select: {
            tiles: true,
          },
        },
      },
    });

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    return NextResponse.json({ board });
  } catch (error) {
    console.error('RPG Board get error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch board', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/rpg/boards/[id]
 * Update a board
 *
 * SECURITY: Requires authentication, rate limited
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { name, width, height, cellSize } = body;

    const updateData: any = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (width !== undefined) updateData.width = width;
    if (height !== undefined) updateData.height = height;
    if (cellSize !== undefined) updateData.cellSize = cellSize;

    const board = await prisma.board.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json({ board });
  } catch (error) {
    console.error('RPG Board update error:', error);
    return NextResponse.json(
      { error: 'Failed to update board', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/rpg/boards/[id]
 * Delete a board
 *
 * SECURITY: Requires authentication, rate limited
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Delete all tiles first (cascade should handle this, but being explicit)
    await prisma.tile.deleteMany({
      where: { boardId: params.id },
    });

    // Delete the board
    await prisma.board.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('RPG Board delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete board', details: String(error) },
      { status: 500 }
    );
  }
}
