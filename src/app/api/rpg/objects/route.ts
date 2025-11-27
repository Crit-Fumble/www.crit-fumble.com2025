/**
 * RPG Objects API Route
 * Manages non-creature objects in the game world
 *
 * SECURITY: Requires authentication, rate limited
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { apiRateLimiter, getClientIdentifier, getIpAddress, checkRateLimit } from '@/lib/rate-limit';
import { prismaConcepts } from '@/lib/db';

/**
 * GET /api/rpg/objects
 * List objects (stub implementation)
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
    const objectType = searchParams.get('objectType'); // 'door', 'furniture', 'container', 'item'
    const locationId = searchParams.get('locationId');
    const boardId = searchParams.get('boardId');
    const limit = parseInt(searchParams.get('limit') || '100');

    // TODO: Unify object retrieval
    // Currently split across SpatialObject (placed objects) and items
    // May need to clarify distinction between "objects in world" vs "items in inventory"

    const where: any = {};
    if (boardId) where.boardId = boardId;
    if (locationId) where.sheetId = locationId;

    const spatialObjects = await prismaConcepts.spatialObject.findMany({
      where,
      include: {
        objectType: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return NextResponse.json({
      objects: spatialObjects,
      message: 'Objects API - using SpatialObject table for placed objects'
    });
  } catch (error) {
    console.error('RPG Objects API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch objects', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rpg/objects
 * Create a new object (stub implementation)
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
    const { objectTypeId, name, locationId, boardId, position } = body;

    if (!objectTypeId) {
      return NextResponse.json(
        { error: 'Missing required field: objectTypeId' },
        { status: 400 }
      );
    }

    // TODO: Clarify object creation flow
    // SpatialObject for world-placed objects (doors, furniture)
    // Separate system for inventory items?

    return NextResponse.json({
      success: true,
      message: 'Objects API stub - use SpatialObject table for placed objects'
    }, { status: 201 });
  } catch (error) {
    console.error('RPG Objects create error:', error);
    return NextResponse.json(
      { error: 'Failed to create object', details: String(error) },
      { status: 500 }
    );
  }
}
