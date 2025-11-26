import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getCategoryFromAssetType, ASSET_TYPE_CATEGORIES } from '@/lib/constants/asset-types';

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'all', 'image', 'audio', 'video', 'document'
  const search = searchParams.get('search');
  const sort = searchParams.get('sort') || 'createdAt';
  const order = searchParams.get('order') || 'desc';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const campaignId = searchParams.get('campaignId');
  const worldId = searchParams.get('worldId');

  try {
    // Build the where clause
    const where: Record<string, unknown> = {
      uploadedBy: session.user.id,
      deletedAt: null,
    };

    // Filter by asset type category
    if (type && type !== 'all' && type in ASSET_TYPE_CATEGORIES) {
      // Get all asset types that belong to this category
      const categoryAssetTypes = getAssetTypesForCategory(type);
      where.assetType = { in: categoryAssetTypes };
    }

    // Filter by campaign
    if (campaignId) {
      where.campaignId = campaignId;
    }

    // Filter by world
    if (worldId) {
      where.worldId = worldId;
    }

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { filename: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ];
    }

    // Get total count
    const total = await prisma.rpgAsset.count({ where });

    // Build orderBy
    const orderBy: Record<string, string> = {};
    if (['name', 'createdAt', 'fileSize', 'assetType'].includes(sort)) {
      orderBy[sort] = order === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    // Fetch assets with pagination
    const assets = await prisma.rpgAsset.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        description: true,
        assetType: true,
        url: true,
        mimeType: true,
        fileSize: true,
        filename: true,
        width: true,
        height: true,
        duration: true,
        createdAt: true,
        category: true,
        tags: true,
        world: {
          select: {
            id: true,
            name: true,
          },
        },
        campaign: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Get counts by category for filter badges
    const categoryCounts = await prisma.rpgAsset.groupBy({
      by: ['assetType'],
      where: {
        uploadedBy: session.user.id,
        deletedAt: null,
        ...(campaignId && { campaignId }),
        ...(worldId && { worldId }),
      },
      _count: {
        id: true,
      },
    });

    // Aggregate counts by category
    const countsByCategory: Record<string, number> = {
      document: 0,
      image: 0,
      audio: 0,
      video: 0,
    };

    categoryCounts.forEach((item) => {
      const category = getCategoryFromAssetType(item.assetType);
      countsByCategory[category] = (countsByCategory[category] || 0) + item._count.id;
    });

    return NextResponse.json({
      assets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      counts: countsByCategory,
    });
  } catch (error) {
    console.error('Error fetching assets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assets' },
      { status: 500 }
    );
  }
}

// Helper to get all asset types for a category
function getAssetTypesForCategory(category: string): string[] {
  const types: string[] = [category]; // The category itself is often used as an asset type

  // Add common subtypes
  switch (category) {
    case 'image':
      types.push('token', 'map', 'tile', 'portrait', 'handout');
      break;
    case 'audio':
      types.push('music', 'sfx', 'ambience', 'voice');
      break;
    case 'video':
      types.push('animated_map', 'cutscene', 'tutorial');
      break;
    case 'document':
      types.push('rules', 'character_sheet', 'adventure');
      break;
  }

  return types;
}
