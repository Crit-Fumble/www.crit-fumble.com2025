/**
 * RPG Session Detail API Route
 * Get, update, or delete a specific session
 *
 * SECURITY: Requires authentication, rate limited
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { apiRateLimiter, getClientIdentifier, getIpAddress, checkRateLimit } from '@/lib/rate-limit';
import prismaMain from '@/packages/cfg-lib/db-main';

const prisma = prismaMain;

/**
 * GET /api/rpg/sessions/[id]
 * Get a specific session by ID
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

    const rpgSession = await prisma.rpgSession.findUnique({
      where: { id: params.id },
      include: {
        dm: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        history: {
          orderBy: {
            timestamp: 'desc',
          },
          take: 100,
        },
        _count: {
          select: {
            history: true,
          },
        },
      },
    });

    if (!rpgSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ session: rpgSession });
  } catch (error) {
    console.error('RPG Session get error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/rpg/sessions/[id]
 * Update a session
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
    const { name, status, endedAt } = body;

    const updateData: any = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (status !== undefined) updateData.status = status;
    if (endedAt !== undefined) updateData.endedAt = new Date(endedAt);

    const rpgSession = await prisma.rpgSession.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json({ session: rpgSession });
  } catch (error) {
    console.error('RPG Session update error:', error);
    return NextResponse.json(
      { error: 'Failed to update session', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/rpg/sessions/[id]
 * Delete a session
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

    await prisma.rpgSession.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('RPG Session delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete session', details: String(error) },
      { status: 500 }
    );
  }
}
