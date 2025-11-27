/**
 * RPG Campaigns API Route
 * Manages campaigns that can span multiple worlds and sessions
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prismaConcepts, coreConceptsAvailable } from '@/lib/db';

/**
 * GET /api/rpg/campaigns
 * List campaigns for the authenticated user or filter by various params
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if Core Concepts is available
    if (!prismaConcepts || !coreConceptsAvailable) {
      return NextResponse.json(
        {
          error: 'Core Concepts RPG features are temporarily unavailable',
          campaigns: [],
          total: 0
        },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const worldId = searchParams.get('worldId');
    const status = searchParams.get('status');
    const systemName = searchParams.get('systemName');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {
      deletedAt: null,
    };

    // Filter by world if specified
    if (worldId) {
      where.worldId = worldId;
    }

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Filter by system
    if (systemName) {
      where.systemName = systemName;
    }

    // Filter by user membership (as owner, GM, or player)
    where.OR = [
      { ownerId: session.user.id },
      { members: { some: { playerId: session.user.id, deletedAt: null } } },
    ];

    const campaigns = await prismaConcepts.rpgCampaign.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
        world: {
          select: {
            id: true,
            name: true,
            systemName: true,
          },
        },
        members: {
          where: { deletedAt: null },
          include: {
            player: {
              select: {
                id: true,
                displayName: true,
                email: true,
              },
            },
            character: {
              select: {
                id: true,
                name: true,
                creatureType: true,
              },
            },
          },
        },
        _count: {
          select: {
            sessions: true,
            members: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // Active campaigns first
        { updatedAt: 'desc' },
      ],
      take: limit,
    });

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error('RPG Campaigns API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rpg/campaigns
 * Create a new RPG campaign
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      systemName,
      worldId,
      imageUrl,
      bannerUrl,
      isPublic = false,
      isOpen = false,
      settings = {},
      metadata = {},
    } = body;

    if (!name || !systemName) {
      return NextResponse.json(
        { error: 'Missing required fields: name, systemName' },
        { status: 400 }
      );
    }

    // If worldId is provided, verify the user owns or has GM permissions for that world
    if (worldId) {
      const worldAccess = await prismaConcepts.rpgWorld.findFirst({
        where: {
          id: worldId,
          ownerId: session.user.id,
        },
      });

      if (!worldAccess) {
        return NextResponse.json(
          { error: 'You do not have permission to use this world' },
          { status: 403 }
        );
      }
    }

    // Create campaign in a transaction with the creator as first member
    const campaign = await prismaConcepts.$transaction(async (tx) => {
      const newCampaign = await tx.rpgCampaign.create({
        data: {
          name,
          description,
          systemName,
          worldId,
          ownerId: session.user.id,
          imageUrl,
          bannerUrl,
          isPublic,
          isOpen,
          settings,
          metadata,
          status: 'planning',
        },
        include: {
          owner: {
            select: {
              id: true,
              displayName: true,
              email: true,
            },
          },
          world: {
            select: {
              id: true,
              name: true,
              systemName: true,
            },
          },
        },
      });

      // Add the creator as the primary GM
      await tx.campaignMember.create({
        data: {
          campaignId: newCampaign.id,
          playerId: session.user.id,
          role: 'gm',
          status: 'active',
          joinedAt: new Date(),
        },
      });

      return newCampaign;
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    console.error('RPG Campaigns create error:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign', details: String(error) },
      { status: 500 }
    );
  }
}
