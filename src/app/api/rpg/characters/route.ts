import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { isWorldEditable } from '@/lib/worldEditLock';
import { apiRateLimiter, getClientIdentifier, getIpAddress, checkRateLimit } from '@/lib/rate-limit';

/**
 * GET /api/rpg/characters
 * List all characters for a world (player's own characters only)
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

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const worldId = searchParams.get('worldId');

    if (!worldId) {
      return NextResponse.json(
        { error: 'worldId is required' },
        { status: 400 }
      );
    }

    // Check world ownership
    const world = await prisma.rpgWorld.findUnique({
      where: { id: worldId },
      select: { ownerId: true },
    });

    if (!world) {
      return NextResponse.json(
        { error: 'World not found' },
        { status: 404 }
      );
    }

    if (world.ownerId !== userId) {
      return NextResponse.json(
        { error: 'Access denied - you do not own this world' },
        { status: 403 }
      );
    }

    // Get all character sheets for this world (player's own characters only)
    // Characters are represented as RpgSheet with type 'character' or 'hand'
    const characters = await prisma.rpgSheet.findMany({
      where: {
        createdBy: userId,
        type: {
          in: ['character', 'hand'],
        },
        // Filter by world if there's a relation (via metadata or campaign)
        // Note: RpgSheet doesn't have direct rpgWorldId, may need to query via campaign
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ characters });
  } catch (error) {
    console.error('Error fetching characters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch characters' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rpg/characters
 * Create a new character (requires GM approval)
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

    const userId = session.user.id;
    const body = await request.json();

    const {
      rpgWorldId,
      name,
      race,
      class: charClass,
      level = 1,
      imageUrl,
      backstory,
      lawfulness = 50,
      goodness = 50,
      faith = 50,
      courage = 50,
    } = body;

    if (!rpgWorldId || !name) {
      return NextResponse.json(
        { error: 'rpgWorldId and name are required' },
        { status: 400 }
      );
    }

    // Check world exists
    const world = await prisma.rpgWorld.findUnique({
      where: { id: rpgWorldId },
      select: { id: true, ownerId: true },
    });

    if (!world) {
      return NextResponse.json(
        { error: 'World not found' },
        { status: 404 }
      );
    }

    // Check if world is editable (must be offline)
    const lockStatus = await isWorldEditable(rpgWorldId);
    if (!lockStatus.editable) {
      return NextResponse.json(
        {
          error: 'World is not editable',
          reason: lockStatus.reason,
          status: lockStatus.status,
          locked: true,
        },
        { status: 423 } // 423 Locked
      );
    }

    // Compute alignment from axes
    const getLawfulnessLabel = (value: number) =>
      value >= 67 ? 'Lawful' : value >= 34 ? 'Neutral' : 'Chaotic';
    const getGoodnessLabel = (value: number) =>
      value >= 67 ? 'Good' : value >= 34 ? 'Neutral' : 'Evil';

    let alignment = 'True Neutral';
    if (lawfulness < 34 || lawfulness >= 67 || goodness < 34 || goodness >= 67) {
      const lawfulnessLabel = getLawfulnessLabel(lawfulness);
      const goodnessLabel = getGoodnessLabel(goodness);
      alignment = `${lawfulnessLabel} ${goodnessLabel}`;
    }

    // Create character sheet (RpgSheet with type 'character')
    // Store character-specific data in metadata field
    const character = await prisma.rpgSheet.create({
      data: {
        createdBy: userId,
        name,
        type: 'character',
        description: backstory,
        metadata: {
          rpgWorldId, // Store world reference in metadata
          race,
          class: charClass,
          level,
          imageUrl,
          lawfulness,
          goodness,
          faith,
          courage,
          alignment,
          approvalStatus: 'pending',
          currentHp: 10,
          maxHp: 10,
          armorClass: 10,
          experience: 0,
        },
      },
    });

    return NextResponse.json({
      success: true,
      character,
    });
  } catch (error) {
    console.error('Error creating character:', error);
    return NextResponse.json(
      { error: 'Failed to create character' },
      { status: 500 }
    );
  }
}
