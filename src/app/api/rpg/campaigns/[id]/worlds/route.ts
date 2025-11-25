/**
 * RPG Campaign Worlds API Route
 * Manages worlds associated with campaigns
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { apiRateLimiter, getClientIdentifier, getIpAddress, checkRateLimit } from '@/lib/rate-limit';
import prismaMain from '@/packages/cfg-lib/db-main';

/**
 * GET /api/rpg/campaigns/:id/worlds
 * Get all worlds associated with a campaign
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has access to this campaign
    const campaign = await prismaMain.rpgCampaign.findFirst({
      where: {
        id: params.id,
        deletedAt: null,
        OR: [
          { ownerId: session.user.id },
          { players: { some: { playerId: session.user.id, deletedAt: null } } },
          { isPublic: true },
        ],
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const worlds = await prismaMain.rpgCampaignWorld.findMany({
      where: {
        campaignId: params.id,
        deletedAt: null,
      },
      include: {
        world: {
          select: {
            id: true,
            name: true,
            description: true,
            systemName: true,
            ownerId: true,
            imageUrl: true,
          },
        },
      },
      orderBy: {
        sessionCount: 'desc',
      },
    });

    return NextResponse.json({ worlds });
  } catch (error) {
    console.error('RPG Campaign Worlds GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaign worlds', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rpg/campaigns/:id/worlds
 * Add a world to a campaign
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { worldId, notes } = body;

    if (!worldId) {
      return NextResponse.json(
        { error: 'Missing required field: worldId' },
        { status: 400 }
      );
    }

    // Verify campaign exists and user is owner or GM
    const campaign = await prismaMain.rpgCampaign.findFirst({
      where: {
        id: params.id,
        deletedAt: null,
        OR: [
          { ownerId: session.user.id },
          { players: { some: { playerId: session.user.id, role: 'gm', status: 'active', deletedAt: null } } },
        ],
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found or you do not have permission to manage worlds' },
        { status: 404 }
      );
    }

    // Verify user has access to the world
    const worldAccess = await prismaMain.rPGWorld.findFirst({
      where: {
        id: worldId,
        OR: [
          { ownerId: session.user.id },
          { owners: { some: { ownerId: session.user.id, status: 'active', deletedAt: null } } },
          { gameMasters: { some: { gmId: session.user.id, status: 'active', deletedAt: null } } },
        ],
      },
    });

    if (!worldAccess) {
      return NextResponse.json(
        { error: 'You do not have permission to use this world' },
        { status: 403 }
      );
    }

    // Check if world is already in campaign
    const existingWorld = await prismaMain.rpgCampaignWorld.findFirst({
      where: {
        campaignId: params.id,
        worldId,
        deletedAt: null,
      },
    });

    if (existingWorld) {
      return NextResponse.json(
        { error: 'World is already in this campaign' },
        { status: 400 }
      );
    }

    // Add world to campaign
    const campaignWorld = await prismaMain.rpgCampaignWorld.create({
      data: {
        campaignId: params.id,
        worldId,
        addedBy: session.user.id,
        isActive: true,
        notes,
      },
      include: {
        world: {
          select: {
            id: true,
            name: true,
            description: true,
            systemName: true,
            ownerId: true,
            imageUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ world: campaignWorld }, { status: 201 });
  } catch (error) {
    console.error('RPG Campaign Worlds POST error:', error);
    return NextResponse.json(
      { error: 'Failed to add world to campaign', details: String(error) },
      { status: 500 }
    );
  }
}
