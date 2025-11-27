/**
 * Foundry Assets API
 * Manages asset tracking and mirroring
 *
 * SECURITY: Owner-only access (Foundry operations)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prismaMain } from '@/lib/db';
import prismaMain from '@/packages/cfg-lib/db-main';
import { auth } from '@/packages/cfg-lib/auth';
import { isOwner } from '@/lib/admin';
import { prisma as critPrisma } from '@/lib/db';
import { getWorldAssetStats } from '@/lib/asset-utils';
const prisma = prismaMain;
 * GET /api/foundry/assets
 * List assets with optional filtering
 * SECURITY: Owner-only access
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
    const { searchParams } = new URL(request.url);
    const worldId = searchParams.get('worldId');
    const assetType = searchParams.get('assetType');
    const mirrored = searchParams.get('mirrored');
    const minUsage = searchParams.get('minUsage');
    const stats = searchParams.get('stats') === 'true';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    // Return stats if requested
    if (stats && worldId) {
      const assetStats = await getWorldAssetStats(worldId);
      return NextResponse.json({ stats: assetStats });
    // Build where clause
    const where: any = {};
    if (worldId) {
      where.worldId = worldId;
    if (assetType) {
      where.assetType = assetType;
    if (mirrored !== null) {
      where.metadata = {
        path: ['mirrored'],
        equals: mirrored === 'true'
      };
    if (minUsage) {
      where.usageCount = {
        gte: parseInt(minUsage)
    const assets = await prismaMain.rpgAsset.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: {
        usageCount: 'desc'
      },
      select: {
        id: true,
        name: true,
        assetType: true,
        url: true,
        mimeType: true,
        fileSize: true,
        width: true,
        height: true,
        duration: true,
        category: true,
        tags: true,
        usageCount: true,
        metadata: true,
        worldId: true,
        createdAt: true,
        updatedAt: true
      }
    const total = await prismaMain.rpgAsset.count({ where });
    return NextResponse.json({
      assets,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
  } catch (error) {
    console.error('Assets GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assets', details: String(error) },
      { status: 500 }
    );
  }
}
 * DELETE /api/foundry/assets
 * Delete unused assets
export async function DELETE(request: NextRequest) {
    const assetId = searchParams.get('assetId');
    const unused = searchParams.get('unused') === 'true';
    if (!worldId && !assetId) {
        { error: 'worldId or assetId required' },
        { status: 400 }
    let deleted;
    if (assetId) {
      // Delete specific asset
      deleted = await prismaMain.rpgAsset.delete({
        where: { id: assetId }
      });
      return NextResponse.json({
        success: true,
        deleted: 1,
        asset: deleted
    if (unused && worldId) {
      // Delete assets with usageCount = 0
      deleted = await prismaMain.rpgAsset.deleteMany({
        where: {
          worldId,
          usageCount: 0
        }
        deleted: deleted.count
      { error: 'No deletion criteria specified' },
      { status: 400 }
    console.error('Assets DELETE error:', error);
      { error: 'Failed to delete assets', details: String(error) },
