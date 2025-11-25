/**
 * RPG Creatures API Route
 * Manages creatures including player characters and NPCs
 * Supports Foundry VTT synchronization
 *
 * SECURITY: Requires authentication, rate limited
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { apiRateLimiter, getClientIdentifier, getIpAddress, checkRateLimit } from '@/lib/rate-limit';
import prismaMain from '@/packages/cfg-lib/db-main';

const prisma = prismaMain;

/**
 * GET /api/rpg/creatures
 * List creatures with optional filters
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
    const creatureType = searchParams.get('creatureType');
    const worldId = searchParams.get('worldId');
    const campaignId = searchParams.get('campaignId');
    const foundryId = searchParams.get('foundryId');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};

    if (creatureType) {
      where.creatureType = creatureType;
    }

    if (worldId) {
      where.worldId = worldId;
    }

    if (campaignId) {
      where.campaignId = campaignId;
    }

    if (foundryId) {
      where.foundryId = foundryId;
    }

    const creatures = await prisma.rpgCreature.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        world: true,
        campaign: true,
      }
    });

    const total = await prisma.rpgCreature.count({ where });

    return NextResponse.json({
      creatures,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    console.error('RPG Creatures API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch creatures', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rpg/creatures
 * Create a new creature (supports Foundry sync)
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
    const {
      foundryId,
      worldId,
      campaignId,
      name,
      creatureType,
      race,
      class: characterClass,
      level,
      stats,
      inventory,
      notes,
      tags,
      imageUrl,
      metadata
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Missing required field: name' },
        { status: 400 }
      );
    }

    // Check if creature with same foundryId already exists (upsert behavior)
    let creature;
    if (foundryId) {
      const existing = await prisma.rpgCreature.findFirst({
        where: { foundryId }
      });

      if (existing) {
        // Update existing creature
        creature = await prisma.rpgCreature.update({
          where: { id: existing.id },
          data: {
            name,
            creatureType,
            race,
            class: characterClass,
            level: level || 0,
            stats: stats || {},
            inventory: inventory || [],
            notes: notes || [],
            tags: tags || [],
            imageUrl,
            metadata: metadata || {},
            worldId,
            campaignId,
          }
        });

        return NextResponse.json({
          creature,
          updated: true
        }, { status: 200 });
      }
    }

    // Create new creature
    creature = await prisma.rpgCreature.create({
      data: {
        foundryId,
        name,
        creatureType: creatureType || 'npc',
        race,
        class: characterClass,
        level: level || 0,
        stats: stats || {},
        inventory: inventory || [],
        notes: notes || [],
        tags: tags || [],
        imageUrl,
        metadata: metadata || {},
        worldId,
        campaignId,
      }
    });

    return NextResponse.json({
      creature,
      created: true
    }, { status: 201 });
  } catch (error) {
    console.error('RPG Creatures create error:', error);
    return NextResponse.json(
      { error: 'Failed to create creature', details: String(error) },
      { status: 500 }
    );
  }
}
