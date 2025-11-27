/**
 * RPG Campaign Detail API Route
 * Manages individual campaign operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { apiRateLimiter, getClientIdentifier, getIpAddress, checkRateLimit } from '@/lib/rate-limit';
import { prismaConcepts } from '@/lib/db';

/**
 * GET /api/rpg/campaigns/:id
 * Get a specific campaign by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    const campaign = await prismaConcepts.rpgCampaign.findFirst({
      where: {
        id,
        deletedAt: null,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { playerId: session.user.id } } },
          { isPublic: true }, // Allow viewing public campaigns
        ],
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
            description: true,
            systemName: true,
            ownerId: true,
          },
        },
        members: {
          include: {
            player: {
              select: {
                id: true,
                displayName: true,
                email: true,
              },
            },
          },
          orderBy: [
            { role: 'asc' }, // GMs first
            { joinedAt: 'asc' },
          ],
        },
        sessions: {
          select: {
            id: true,
            sessionTitle: true,
            sessionDate: true,
            systemName: true,
          },
          orderBy: {
            sessionDate: 'desc',
          },
          take: 10, // Latest 10 sessions
        },
        _count: {
          select: {
            sessions: true,
            members: true,
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

    const { id } = await params;

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      status,
      worldId,
      imageUrl,
      bannerUrl,
      isPublic,
      isOpen,
      settings,
      metadata,
    } = body;

    // Verify user is owner or GM
    const existingCampaign = await prismaConcepts.rpgCampaign.findFirst({
      where: {
        id,
        deletedAt: null,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { playerId: session.user.id, role: 'gm', status: 'active', deletedAt: null } } },
        ],
      },
    });

    if (!existingCampaign) {
      return NextResponse.json(
        { error: 'Campaign not found or you do not have permission to edit it' },
        { status: 404 }
      );
    }

    // If changing world, verify access
    if (worldId && worldId !== existingCampaign.worldId) {
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
    if (worldId !== undefined) updateData.worldId = worldId;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (bannerUrl !== undefined) updateData.bannerUrl = bannerUrl;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (isOpen !== undefined) updateData.isOpen = isOpen;
    if (settings !== undefined) updateData.settings = settings;
    if (metadata !== undefined) updateData.metadata = metadata;

    const campaign = await prismaConcepts.rpgCampaign.update({
      where: { id },
      data: updateData,
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
        _count: {
          select: {
            sessions: true,
            members: true,
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

    const { id } = await params;

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is owner
    const existingCampaign = await prismaConcepts.rpgCampaign.findFirst({
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
    await prismaConcepts.rpgCampaign.update({
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
