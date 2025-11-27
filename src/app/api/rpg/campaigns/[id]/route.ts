/**
 * RPG Campaign Detail API Route
 * Manages individual campaign operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { apiRateLimiter, getClientIdentifier, getIpAddress, checkRateLimit } from '@/lib/rate-limit';
import { prismaMain } from '@/lib/db';

/**
 * GET /api/rpg/campaigns/:id
 * Get a specific campaign by ID
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

    const { id } = await params;

    const campaign = await prismaMain.rpgCampaign.findFirst({
      where: {
        id,
        deletedAt: null,
        OR: [
          { ownerId: session.user.id },
          { players: { some: { playerId: session.user.id, deletedAt: null } } },
          { isPublic: true }, // Allow viewing public campaigns
        ],
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
            description: true,
            systemName: true,
            ownerId: true,
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
                level: true,
              },
            },
          },
          orderBy: [
            { role: 'asc' }, // GMs first
            { joinedAt: 'asc' },
          ],
        },
        worlds: {
          where: { deletedAt: null },
          include: {
            world: {
              select: {
                id: true,
                name: true,
                description: true,
                systemName: true,
              },
            },
          },
          orderBy: {
            sessionCount: 'desc',
          },
        },
        sessions: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            status: true,
            startedAt: true,
            endedAt: true,
            playtimeMins: true,
          },
          orderBy: {
            startedAt: 'desc',
          },
          take: 10, // Latest 10 sessions
        },
        _count: {
          select: {
            sessions: true,
            players: true,
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error('RPG Campaign GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaign', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/rpg/campaigns/:id
 * Update a campaign
 */
export async function PATCH(
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

    const { id } = await params;
    const body = await request.json();
    const {
      name,
      description,
      status,
      primaryWorldId,
      imageUrl,
      bannerUrl,
      isPublic,
      isOpen,
      settings,
      metadata,
    } = body;

    // Verify user is owner or GM
    const existingCampaign = await prismaMain.rpgCampaign.findFirst({
      where: {
        id,
        deletedAt: null,
        OR: [
          { ownerId: session.user.id },
          { players: { some: { playerId: session.user.id, role: 'gm', status: 'active', deletedAt: null } } },
        ],
      },
    });

    if (!existingCampaign) {
      return NextResponse.json(
        { error: 'Campaign not found or you do not have permission to edit it' },
        { status: 404 }
      );
    }

    // If changing primary world, verify access
    if (primaryWorldId && primaryWorldId !== existingCampaign.primaryWorldId) {
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

    // Build update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'active' && !existingCampaign.startedAt) {
        updateData.startedAt = new Date();
      }
      if (status === 'completed' && !existingCampaign.completedAt) {
        updateData.completedAt = new Date();
      }
    }
    if (primaryWorldId !== undefined) updateData.primaryWorldId = primaryWorldId;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (bannerUrl !== undefined) updateData.bannerUrl = bannerUrl;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (isOpen !== undefined) updateData.isOpen = isOpen;
    if (settings !== undefined) updateData.settings = settings;
    if (metadata !== undefined) updateData.metadata = metadata;

    const campaign = await prismaMain.rpgCampaign.update({
      where: { id },
      data: updateData,
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
        _count: {
          select: {
            sessions: true,
            players: true,
          },
        },
      },
    });

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error('RPG Campaign PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update campaign', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/rpg/campaigns/:id
 * Soft delete a campaign (only owner can delete)
 */
export async function DELETE(
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

    const { id } = await params;

    // Verify user is owner
    const existingCampaign = await prismaMain.rpgCampaign.findFirst({
      where: {
        id,
        ownerId: session.user.id,
        deletedAt: null,
      },
    });

    if (!existingCampaign) {
      return NextResponse.json(
        { error: 'Campaign not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }

    // Soft delete the campaign
    await prismaMain.rpgCampaign.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'abandoned',
      },
    });

    return NextResponse.json({ success: true, message: 'Campaign deleted' });
  } catch (error) {
    console.error('RPG Campaign DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete campaign', details: String(error) },
      { status: 500 }
    );
  }
}
