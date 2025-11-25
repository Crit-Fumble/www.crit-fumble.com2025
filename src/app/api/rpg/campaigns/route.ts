/**
 * RPG Campaigns API Route
 * Manages campaigns that can span multiple worlds and sessions
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prismaMain from '@/packages/cfg-lib/db-main';

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
      where.OR = [
        { primaryWorldId: worldId },
        { worlds: { some: { worldId } } },
      ];
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
      { players: { some: { playerId: session.user.id, deletedAt: null } } },
    ];

    const campaigns = await prismaMain.rpgCampaign.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        primaryWorld: {
          select: {
            id: true,
            name: true,
            systemName: true,
          },
        },
        players: {
          where: { deletedAt: null },
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
              },
            },
          },
        },
        worlds: {
          where: { deletedAt: null, isActive: true },
          include: {
            world: {
              select: {
                id: true,
                name: true,
                systemName: true,
              },
            },
          },
        },
        _count: {
          select: {
            sessions: true,
            players: true,
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
      primaryWorldId,
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

    // If primaryWorldId is provided, verify the user owns or has GM permissions for that world
    if (primaryWorldId) {
      const worldAccess = await prismaMain.rPGWorld.findFirst({
        where: {
          id: primaryWorldId,
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
    }

    // Create campaign in a transaction with the creator as first GM
    const campaign = await prismaMain.$transaction(async (tx) => {
      const newCampaign = await tx.rpgCampaign.create({
        data: {
          name,
          description,
          systemName,
          primaryWorldId,
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
              username: true,
              email: true,
            },
          },
          primaryWorld: {
            select: {
              id: true,
              name: true,
              systemName: true,
            },
          },
        },
      });

      // Add the creator as the primary GM
      await tx.rpgCampaignPlayer.create({
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
