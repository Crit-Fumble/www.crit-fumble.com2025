/**
 * RPG Sessions API Route
 * Manages game sessions for RPG gameplay
 *
 * SECURITY: Requires authentication, rate limited
 */

import { NextRequest, NextResponse } from 'next/server';
import prismaMain from '@/packages/cfg-lib/db-main';
import { auth } from '@/packages/cfg-lib/auth';
import { apiRateLimiter, getClientIdentifier, getIpAddress, checkRateLimit } from '@/lib/rate-limit';

const prisma = prismaMain;

/**
 * GET /api/rpg/sessions
 * List all RPG sessions for a world
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
    const authSession = await auth();
    if (!authSession?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const worldId = searchParams.get('worldId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};
    if (worldId) where.worldId = worldId;
    if (status) where.status = status;

    const sessions = await prisma.rpgSession.findMany({
      where,
      include: {
        dm: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        _count: {
          select: {
            history: true,
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
      take: limit,
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('RPG Sessions API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rpg/sessions
 * Create a new RPG session
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
    const authSession = await auth();
    if (!authSession?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { worldId, name, dmId } = body;

    if (!worldId || !name || !dmId) {
      return NextResponse.json(
        { error: 'Missing required fields: worldId, name, dmId' },
        { status: 400 }
      );
    }

    const session = await prisma.rpgSession.create({
      data: {
        worldId,
        name,
        dmId,
        startedAt: new Date(),
        status: 'active',
      },
      include: {
        dm: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    console.error('RPG Sessions create error:', error);
    return NextResponse.json(
      { error: 'Failed to create session', details: String(error) },
      { status: 500 }
    );
  }
}
