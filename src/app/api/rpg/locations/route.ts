/**
 * RPG Locations API Route
 * Manages game locations from single pixels to vast regions
 *
 * SECURITY: Requires authentication, rate limited
 */

import { NextRequest, NextResponse } from 'next/server';
import { prismaConcepts } from '@/lib/db';
import { auth } from '@/packages/cfg-lib/auth';
import { apiRateLimiter, getClientIdentifier, getIpAddress, checkRateLimit } from '@/lib/rate-limit';

const prisma = prismaMain;

/**
 * GET /api/rpg/locations
 * List locations (stub implementation)
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
    const locationType = searchParams.get('locationType'); // 'dungeon', 'settlement', 'wilderness'
    const worldId = searchParams.get('worldId');
    const parentLocationId = searchParams.get('parentLocationId');
    const limit = parseInt(searchParams.get('limit') || '50');

    // TODO: Enhance location retrieval
    // Currently using LocationSheet - may need additional location metadata
    // Support hierarchical locations (continent > kingdom > city > building > room)

    const locationSheets = await prismaConcepts.locationSheet.findMany({
      where: locationType ? { type: locationType } : undefined,
      include: {
        _count: {
          select: {
            cards: true,
            boardTiles: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return NextResponse.json({
      locations: locationSheets,
      message: 'Locations API - using LocationSheet table'
    });
  } catch (error) {
    console.error('RPG Locations API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch locations', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rpg/locations
 * Create a new location (stub implementation)
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
    const { name, locationType, description, parentLocationId, coordinates } = body;

    if (!name || !locationType) {
      return NextResponse.json(
        { error: 'Missing required fields: name, locationType' },
        { status: 400 }
      );
    }

    // TODO: Consider creating dedicated Location table
    // Or enhance LocationSheet with better metadata
    // Support location hierarchies and relationships

    return NextResponse.json({
      success: true,
      message: 'Locations API stub - consider using LocationSheet or create dedicated table'
    }, { status: 201 });
  } catch (error) {
    console.error('RPG Locations create error:', error);
    return NextResponse.json(
      { error: 'Failed to create location', details: String(error) },
      { status: 500 }
    );
  }
}
