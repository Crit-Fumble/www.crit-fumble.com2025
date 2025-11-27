/**
 * RPG History API Route
 * Manages gameplay history and event logs
 *
 * SECURITY: Requires authentication, rate limited
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { apiRateLimiter, getClientIdentifier, getIpAddress, checkRateLimit } from '@/lib/rate-limit';
import { prismaConcepts } from '@/lib/db';

const prisma = prismaMain;

/**
 * GET /api/rpg/history
 * List history events with filtering
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
    const sessionId = searchParams.get('sessionId');
    const playerId = searchParams.get('playerId');
    const worldId = searchParams.get('worldId');
    const eventType = searchParams.get('eventType');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};
    if (sessionId) where.sessionId = sessionId;
    if (playerId) where.playerId = playerId;
    if (worldId) where.worldId = worldId;
    if (eventType) where.eventType = eventType;

    const [history, total] = await Promise.all([
      prismaConcepts.rpgHistory.findMany({
        where,
        include: {
          player: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          session: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prismaConcepts.rpgHistory.count({ where }),
    ]);

    return NextResponse.json({
      history,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('RPG History API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rpg/history
 * Create a new history event
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
    const { sessionId, playerId, worldId, eventType, data } = body;

    if (!sessionId || !eventType) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, eventType' },
        { status: 400 }
      );
    }

    const historyEvent = await prismaConcepts.rpgHistory.create({
      data: {
        sessionId,
        playerId: playerId || null,
        worldId: worldId || null,
        eventType,
        data: data || {},
        timestamp: new Date(),
      },
      include: {
        player: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        session: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json({ historyEvent }, { status: 201 });
  } catch (error) {
    console.error('RPG History create error:', error);
    return NextResponse.json(
      { error: 'Failed to create history event', details: String(error) },
      { status: 500 }
    );
  }
}
