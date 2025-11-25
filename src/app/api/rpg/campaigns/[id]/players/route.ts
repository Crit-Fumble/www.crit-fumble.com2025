/**
 * RPG Campaign Players API Route
 * Manages player membership in campaigns
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { apiRateLimiter, getClientIdentifier, getIpAddress, checkRateLimit } from '@/lib/rate-limit';
import prismaMain from '@/packages/cfg-lib/db-main';

/**
 * GET /api/rpg/campaigns/:id/players
 * Get all players in a campaign
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

    const players = await prismaMain.rpgCampaignPlayer.findMany({
      where: {
        campaignId: params.id,
        deletedAt: null,
      },
      include: {
        player: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        character: {
          select: {
            id: true,
            name: true,
            creatureType: true,
            level: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' }, // GMs first
        { joinedAt: 'asc' },
      ],
    });

    return NextResponse.json({ players });
  } catch (error) {
    console.error('RPG Campaign Players GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaign players', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rpg/campaigns/:id/players
 * Add a player to a campaign (invite or join)
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
    const { playerId, role = 'player', characterId, notes } = body;

    if (!playerId) {
      return NextResponse.json(
        { error: 'Missing required field: playerId' },
        { status: 400 }
      );
    }

    // Verify campaign exists and user has permission to add players
    const campaign = await prismaMain.rpgCampaign.findFirst({
      where: {
        id: params.id,
        deletedAt: null,
        OR: [
          { ownerId: session.user.id },
          { players: { some: { playerId: session.user.id, role: 'gm', status: 'active', deletedAt: null } } },
          // Allow self-join for open campaigns
          { isOpen: true, id: params.id },
        ],
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found or you do not have permission to add players' },
        { status: 404 }
      );
    }

    // Only GMs/owners can add other players or assign GM role
    const isOwnerOrGM = campaign.ownerId === session.user.id || await prismaMain.rpgCampaignPlayer.findFirst({
      where: {
        campaignId: params.id,
        playerId: session.user.id,
        role: 'gm',
        status: 'active',
        deletedAt: null,
      },
    });

    if (!isOwnerOrGM && (playerId !== session.user.id || role === 'gm')) {
      return NextResponse.json(
        { error: 'You do not have permission to perform this action' },
        { status: 403 }
      );
    }

    // Check if player is already in campaign
    const existingPlayer = await prismaMain.rpgCampaignPlayer.findFirst({
      where: {
        campaignId: params.id,
        playerId,
        deletedAt: null,
      },
    });

    if (existingPlayer) {
      return NextResponse.json(
        { error: 'Player is already in this campaign' },
        { status: 400 }
      );
    }

    // Add player to campaign
    const campaignPlayer = await prismaMain.rpgCampaignPlayer.create({
      data: {
        campaignId: params.id,
        playerId,
        role,
        characterId,
        notes,
        status: campaign.isOpen ? 'active' : 'invited',
        invitedAt: new Date(),
        invitedBy: session.user.id,
        joinedAt: campaign.isOpen ? new Date() : null,
      },
      include: {
        player: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        character: {
          select: {
            id: true,
            name: true,
            creatureType: true,
            level: true,
          },
        },
      },
    });

    return NextResponse.json({ player: campaignPlayer }, { status: 201 });
  } catch (error) {
    console.error('RPG Campaign Players POST error:', error);
    return NextResponse.json(
      { error: 'Failed to add player to campaign', details: String(error) },
      { status: 500 }
    );
  }
}
