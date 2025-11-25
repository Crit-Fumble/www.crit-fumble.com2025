/**
 * Foundry World Snapshot API
 * Manages FoundryWorldSnapshot records for sync state tracking
 *
 * SECURITY: Owner-only access (Foundry operations)
 */

import { NextRequest, NextResponse } from 'next/server';
import prismaMain from '@/packages/cfg-lib/db-main';
import { auth } from '@/packages/cfg-lib/auth';
import { isOwner } from '@/lib/admin';
import { prisma as critPrisma } from '@/lib/db';

const prisma = prismaMain;

/**
 * GET /api/foundry/snapshot
 * Get snapshot info for a world
 *
 * SECURITY: Owner-only access
 */
export async function GET(request: NextRequest) {
  try {
    // AUTHENTICATION: Require logged-in user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // AUTHORIZATION: Owner-only
    const user = await critPrisma.critUser.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !isOwner(user)) {
      return NextResponse.json(
        { error: 'Forbidden - Owner access required' },
        { status: 403 }
      );
    }
    const { searchParams } = new URL(request.url);
    const worldId = searchParams.get('worldId');

    if (!worldId) {
      return NextResponse.json(
        { error: 'worldId required' },
        { status: 400 }
      );
    }

    const snapshot = await prisma.foundryWorldSnapshot.findUnique({
      where: { worldId },
      include: {
        world: true,
        instance: true,
      }
    });

    if (!snapshot) {
      return NextResponse.json(
        { error: 'Snapshot not found for this world' },
        { status: 404 }
      );
    }

    return NextResponse.json({ snapshot });
  } catch (error) {
    console.error('Snapshot GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch snapshot', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/foundry/snapshot
 * Create or update snapshot record
 *
 * SECURITY: Owner-only access
 */
export async function POST(request: NextRequest) {
  try {
    // AUTHENTICATION: Require logged-in user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // AUTHORIZATION: Owner-only
    const user = await critPrisma.critUser.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !isOwner(user)) {
      return NextResponse.json(
        { error: 'Forbidden - Owner access required' },
        { status: 403 }
      );
    }
    const body = await request.json();
    const {
      worldId,
      instanceId,
      status,
      accessUrl,
      joinCode,
      currentPlayers,
    } = body;

    if (!worldId) {
      return NextResponse.json(
        { error: 'worldId required' },
        { status: 400 }
      );
    }

    // Upsert snapshot
    const snapshot = await prisma.foundryWorldSnapshot.upsert({
      where: { worldId },
      create: {
        worldId,
        instanceId,
        status: status || 'stored',
        lastSyncAt: new Date(),
        accessUrl,
        joinCode,
        currentPlayers: currentPlayers || 0,
      },
      update: {
        instanceId,
        status,
        lastSyncAt: new Date(),
        accessUrl,
        joinCode,
        currentPlayers,
        lastActivityAt: currentPlayers > 0 ? new Date() : undefined,
      }
    });

    return NextResponse.json({ snapshot });
  } catch (error) {
    console.error('Snapshot POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create/update snapshot', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/foundry/snapshot/sync
 * Update lastSyncAt timestamp after sync operation
 *
 * SECURITY: Owner-only access
 */
export async function PATCH(request: NextRequest) {
  try {
    // AUTHENTICATION: Require logged-in user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // AUTHORIZATION: Owner-only
    const user = await critPrisma.critUser.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !isOwner(user)) {
      return NextResponse.json(
        { error: 'Forbidden - Owner access required' },
        { status: 403 }
      );
    }
    const body = await request.json();
    const { worldId, syncType } = body;

    if (!worldId) {
      return NextResponse.json(
        { error: 'worldId required' },
        { status: 400 }
      );
    }

    const updateData: any = {
      lastSyncAt: new Date(),
    };

    if (syncType === 'save') {
      updateData.lastSavedAt = new Date();
    } else if (syncType === 'load') {
      updateData.lastLoadedAt = new Date();
    }

    const snapshot = await prisma.foundryWorldSnapshot.update({
      where: { worldId },
      data: updateData
    });

    return NextResponse.json({ snapshot });
  } catch (error) {
    console.error('Snapshot PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update snapshot', details: String(error) },
      { status: 500 }
    );
  }
}
