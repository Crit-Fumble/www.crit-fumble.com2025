/**
 * RPG Types API Route
 * Manages entity types (classes, creature types, item types, etc.)
 *
 * SECURITY: Requires authentication, rate limited
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { apiRateLimiter, getClientIdentifier, getIpAddress, checkRateLimit } from '@/lib/rate-limit';
import prismaMain from '@/packages/cfg-lib/db-main';

const prisma = prismaMain;

/**
 * GET /api/rpg/types
 * List all types (stub implementation)
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
    const category = searchParams.get('category'); // 'class', 'race', 'creature', 'item'
    const limit = parseInt(searchParams.get('limit') || '50');

    // TODO: Implement types table and retrieval
    // Types define templates for entities (e.g., "Fighter" class, "Dragon" creature type)

    return NextResponse.json({
      types: [],
      message: 'Types API stub - implementation pending'
    });
  } catch (error) {
    console.error('RPG Types API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch types', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rpg/types
 * Create a new type (stub implementation)
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
    const { name, category, attributes, abilities } = body;

    if (!name || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: name, category' },
        { status: 400 }
      );
    }

    // TODO: Create RpgType table in Prisma schema
    // Should store type definitions that can be applied to entities

    return NextResponse.json({
      success: true,
      message: 'Types API stub - implementation pending'
    }, { status: 201 });
  } catch (error) {
    console.error('RPG Types create error:', error);
    return NextResponse.json(
      { error: 'Failed to create type', details: String(error) },
      { status: 500 }
    );
  }
}
