/**
 * Asset Mirroring API
 * Handles copying assets from Foundry to Vercel Blob storage
 *
 * SECURITY: Requires authentication, rate limited, world ownership verified
 */

import { NextRequest, NextResponse } from 'next/server';
import { prismaMain } from '@/lib/db';
import { auth } from '@/lib/auth';
import { apiRateLimiter, getClientIdentifier, getIpAddress, checkRateLimit } from '@/lib/rate-limit';
// import { put } from '@vercel/blob';  // Uncomment when ready for Phase 3

const prisma = prismaMain;

/**
 * Verify user has access to a world (owner or player)
 */
async function verifyWorldAccess(userId: string, worldId: string): Promise<boolean> {
  const world = await prisma.rpgWorld.findFirst({
    where: {
      id: worldId,
      deletedAt: null,
      OR: [
        { ownerId: userId },
        { campaigns: { some: { players: { some: { playerId: userId, deletedAt: null } } } } }
      ]
    }
  });
  return !!world;
}

/**
 * POST /api/foundry/assets/mirror
 * Mirror an asset from Foundry to Vercel Blob
 *
 * Phase 3 Implementation - Currently stubbed
 * SECURITY: Requires authentication, rate limited
 */
export async function POST(request: NextRequest) {
  try {
    // RATE LIMITING
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

    // AUTHENTICATION
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { assetId, assetIds, worldId, minUsage = 10 } = body;

    // Phase 3: Implement actual mirroring
    // For now, return stub response

    if (assetId) {
      // Mirror single asset
      const asset = await prisma.rpgAsset.findUnique({
        where: { id: assetId }
      });

      if (!asset) {
        return NextResponse.json(
          { error: 'Asset not found' },
          { status: 404 }
        );
      }

      // AUTHORIZATION: Verify user has access to the asset's world
      if (asset.worldId && !(await verifyWorldAccess(session.user.id, asset.worldId))) {
        return NextResponse.json(
          { error: 'Forbidden - no access to this world' },
          { status: 403 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Asset mirroring not yet implemented (Phase 3)',
        asset: {
          id: asset.id,
          url: asset.url,
          mirrored: false,
          plan: 'Will download from Foundry, optimize, and upload to Vercel Blob'
        }
      }, { status: 501 });
    }

    if (assetIds && Array.isArray(assetIds)) {
      // Mirror multiple specific assets - requires worldId for authorization
      if (!worldId) {
        return NextResponse.json(
          { error: 'worldId required for batch mirroring' },
          { status: 400 }
        );
      }

      // AUTHORIZATION: Verify user has access to the world
      if (!(await verifyWorldAccess(session.user.id, worldId))) {
        return NextResponse.json(
          { error: 'Forbidden - no access to this world' },
          { status: 403 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Batch mirroring not yet implemented (Phase 3)',
        count: assetIds.length
      }, { status: 501 });
    }

    if (worldId) {
      // AUTHORIZATION: Verify user has access to the world
      if (!(await verifyWorldAccess(session.user.id, worldId))) {
        return NextResponse.json(
          { error: 'Forbidden - no access to this world' },
          { status: 403 }
        );
      }

      // Mirror popular assets for a world
      const popularAssets = await prisma.rpgAsset.findMany({
        where: {
          worldId,
          usageCount: { gte: minUsage },
          metadata: {
            path: ['mirrored'],
            equals: false
          }
        },
        take: 100
      });

      return NextResponse.json({
        success: true,
        message: 'World asset mirroring not yet implemented (Phase 3)',
        worldId,
        eligibleAssets: popularAssets.length,
        minUsage,
        plan: `Would mirror ${popularAssets.length} assets with usage >= ${minUsage}`
      }, { status: 501 });
    }

    return NextResponse.json(
      { error: 'assetId, assetIds, or worldId required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Asset mirror error:', error);
    return NextResponse.json(
      { error: 'Failed to mirror asset', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/foundry/assets/mirror
 * Get mirroring status for world
 *
 * SECURITY: Requires authentication, rate limited, world access verified
 */
export async function GET(request: NextRequest) {
  try {
    // RATE LIMITING
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

    // AUTHENTICATION
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
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

    // AUTHORIZATION: Verify user has access to the world
    if (!(await verifyWorldAccess(session.user.id, worldId))) {
      return NextResponse.json(
        { error: 'Forbidden - no access to this world' },
        { status: 403 }
      );
    }

    const [total, mirrored, notMirrored, highUsage] = await Promise.all([
      prisma.rpgAsset.count({ where: { worldId } }),
      prisma.rpgAsset.count({
        where: {
          worldId,
          metadata: { path: ['mirrored'], equals: true }
        }
      }),
      prisma.rpgAsset.count({
        where: {
          worldId,
          metadata: { path: ['mirrored'], equals: false }
        }
      }),
      prisma.rpgAsset.count({
        where: {
          worldId,
          usageCount: { gte: 10 },
          metadata: { path: ['mirrored'], equals: false }
        }
      })
    ]);

    return NextResponse.json({
      worldId,
      assets: {
        total,
        mirrored,
        notMirrored,
        eligibleForMirroring: highUsage
      },
      mirroringEnabled: false, // Phase 3
      recommendation: highUsage > 0
        ? `${highUsage} popular assets could be mirrored`
        : 'No assets currently eligible for mirroring'
    });
  } catch (error) {
    console.error('Mirror status error:', error);
    return NextResponse.json(
      { error: 'Failed to get mirror status', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * FUTURE Phase 3 Implementation
 *
 * async function mirrorAssetToBlob(asset: RpgAsset) {
 *   // 1. Download from Foundry
 *   const response = await fetch(asset.url);
 *   const buffer = await response.arrayBuffer();
 *
 *   // 2. Optimize if image
 *   let optimized = buffer;
 *   if (asset.assetType === 'image') {
 *     optimized = await optimizeImage(buffer);
 *   }
 *
 *   // 3. Upload to Vercel Blob
 *   const blob = await put(
 *     `worlds/${asset.worldId}/${asset.filename}`,
 *     optimized,
 *     { access: 'public' }
 *   );
 *
 *   // 4. Update asset record
 *   await prisma.rpgAsset.update({
 *     where: { id: asset.id },
 *     data: {
 *       url: blob.url,
 *       fileSize: BigInt(blob.size),
 *       metadata: {
 *         ...asset.metadata,
 *         mirrored: true,
 *         mirroredAt: new Date().toISOString(),
 *         originalFoundryUrl: asset.url
 *       }
 *     }
 *   });
 *
 *   // 5. Update entity references
 *   await updateEntityReferences(asset.id, blob.url);
 * }
 */
