/**
 * RPG Tile Detail API Route
 * Get, update, or delete a specific tile
 *
 * SECURITY: Requires authentication, rate limited
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { apiRateLimiter, getClientIdentifier, getIpAddress, checkRateLimit } from '@/lib/rate-limit';
import prismaMain from '@/packages/cfg-lib/db-main';

const prisma = prismaMain;

/**
 * GET /api/rpg/tiles/[id]
 * Get a specific tile by ID
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

    const tile = await prisma.tile.findUnique({
      where: { id: params.id },
      include: {
        board: {
          select: {
            id: true,
            name: true,
            worldId: true,
          },
        },
      },
    });

    if (!tile) {
      return NextResponse.json({ error: 'Tile not found' }, { status: 404 });
    }

    return NextResponse.json({ tile });
  } catch (error) {
    console.error('RPG Tile get error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tile', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/rpg/tiles/[id]
 * Update a tile
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
    const { x, y, z, type, data } = body;

    const updateData: any = { updatedAt: new Date() };
    if (x !== undefined) updateData.x = x;
    if (y !== undefined) updateData.y = y;
    if (z !== undefined) updateData.z = z;
    if (type !== undefined) updateData.type = type;
    if (data !== undefined) updateData.data = data;

    const tile = await prisma.tile.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ tile });
  } catch (error) {
    console.error('RPG Tile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update tile', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/rpg/tiles/[id]
 * Delete a tile
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

    await prisma.tile.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('RPG Tile delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete tile', details: String(error) },
      { status: 500 }
    );
  }
}
