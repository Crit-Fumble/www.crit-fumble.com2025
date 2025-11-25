/**
 * Asset Utility Functions
 * Handles asset registration, detection, and metadata extraction
 */

import prismaMain from '@/packages/cfg-lib/db-main';
import { generateShortcode, generateQRCodeDataUrl, calculateQRPosition, QRCodeOptions } from './qr-utils';

const prisma = prismaMain;

/**
 * Detect asset type from URL or mime type
 */
export function detectAssetType(url: string, mimeType?: string): string {
  if (mimeType) {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('video/')) return 'video';
  }

  const lower = url.toLowerCase();

  // Image formats
  if (lower.match(/\.(png|jpg|jpeg|gif|webp|svg|bmp)$/)) return 'image';

  // Token/character images
  if (lower.includes('/tokens/') || lower.includes('/characters/')) return 'token';

  // Maps
  if (lower.includes('/maps/') || lower.includes('/scenes/')) return 'map';

  // Tiles
  if (lower.includes('/tiles/')) return 'tile';

  // Audio formats
  if (lower.match(/\.(mp3|ogg|wav|flac|m4a)$/)) return 'audio';
  if (lower.includes('/music/')) return 'music';
  if (lower.includes('/sfx/') || lower.includes('/sounds/')) return 'sfx';

  // Video formats
  if (lower.match(/\.(mp4|webm|mov|avi)$/)) return 'video';

  return 'unknown';
}

/**
 * Detect mime type from URL extension
 */
export function detectMimeType(url: string): string {
  const lower = url.toLowerCase();

  // Images
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.svg')) return 'image/svg+xml';

  // Audio
  if (lower.endsWith('.mp3')) return 'audio/mpeg';
  if (lower.endsWith('.ogg')) return 'audio/ogg';
  if (lower.endsWith('.wav')) return 'audio/wav';
  if (lower.endsWith('.m4a')) return 'audio/mp4';

  // Video
  if (lower.endsWith('.mp4')) return 'video/mp4';
  if (lower.endsWith('.webm')) return 'video/webm';

  return 'application/octet-stream';
}

/**
 * Extract filename from URL
 */
export function extractFilename(url: string): string {
  const parts = url.split('/');
  const lastPart = parts[parts.length - 1];

  // Remove query parameters
  const withoutQuery = lastPart.split('?')[0];

  return withoutQuery || 'asset';
}

/**
 * Determine category from asset type and URL
 */
export function determineCategory(assetType: string, url: string): string | null {
  const lower = url.toLowerCase();

  if (assetType === 'image' || assetType === 'token') {
    if (lower.includes('/tokens/')) return 'token';
    if (lower.includes('/characters/')) return 'character';
    if (lower.includes('/items/')) return 'item';
    if (lower.includes('/ui/')) return 'ui';
  }

  if (assetType === 'map') {
    if (lower.includes('/dungeon')) return 'dungeon';
    if (lower.includes('/city') || lower.includes('/town')) return 'settlement';
    if (lower.includes('/wilderness')) return 'wilderness';
  }

  if (assetType === 'audio' || assetType === 'music') {
    if (lower.includes('/combat')) return 'combat';
    if (lower.includes('/ambient')) return 'ambient';
    if (lower.includes('/exploration')) return 'exploration';
  }

  return null;
}

/**
 * Register or update an asset from Foundry
 */
export async function registerAsset(params: {
  url: string;
  worldId?: string;
  uploadedBy?: string;
  mimeType?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  duration?: number;
  metadata?: any;
}) {
  const { url, worldId, uploadedBy, mimeType, fileSize, width, height, duration, metadata = {} } = params;

  // Check if asset already exists
  const existing = await prisma.rpgAsset.findFirst({
    where: {
      OR: [
        { url },
        {
          metadata: {
            path: ['foundryUrl'],
            equals: url
          }
        }
      ]
    }
  });

  if (existing) {
    // Increment usage count
    return await prisma.rpgAsset.update({
      where: { id: existing.id },
      data: {
        usageCount: { increment: 1 },
        updatedAt: new Date()
      }
    });
  }

  // Create new asset record
  const assetType = detectAssetType(url, mimeType);
  const filename = extractFilename(url);
  const category = determineCategory(assetType, url);
  const detectedMimeType = mimeType || detectMimeType(url);

  // Generate shortcode for image assets (tiles, tokens, maps)
  let shortcode: string | undefined;
  if (assetType === 'image' || assetType === 'tile' || assetType === 'token' || assetType === 'map') {
    try {
      shortcode = await generateShortcode();
    } catch (error) {
      console.warn('Failed to generate shortcode for asset:', error);
      // Continue without shortcode
    }
  }

  return await prisma.rpgAsset.create({
    data: {
      name: filename,
      assetType,
      url,
      mimeType: detectedMimeType,
      fileSize: BigInt(fileSize || 0),
      filename,
      width,
      height,
      duration,
      uploadedBy,
      worldId,
      category,
      shortcode,
      usageCount: 1,
      metadata: {
        foundryUrl: url,
        mirrored: false,
        registeredAt: new Date().toISOString(),
        ...metadata
      }
    }
  });
}

/**
 * Extract all asset URLs from entity data
 */
export function extractAssetUrls(entity: any, entityType: string): string[] {
  const urls: string[] = [];

  switch (entityType) {
    case 'creatures':
      if (entity.imageUrl) urls.push(entity.imageUrl);
      if (entity.stats?.img) urls.push(entity.stats.img);
      break;

    case 'things':
      if (entity.imageUrl) urls.push(entity.imageUrl);
      if (entity.properties?.img) urls.push(entity.properties.img);
      break;

    case 'boards':
      if (entity.backgroundUrl) urls.push(entity.backgroundUrl);
      if (entity.tokens && Array.isArray(entity.tokens)) {
        entity.tokens.forEach((token: any) => {
          if (token.img) urls.push(token.img);
        });
      }
      if (entity.tiles && Array.isArray(entity.tiles)) {
        entity.tiles.forEach((tile: any) => {
          if (tile.texture) urls.push(tile.texture);
        });
      }
      break;

    case 'books':
      if (entity.pages && Array.isArray(entity.pages)) {
        entity.pages.forEach((page: any) => {
          if (page.src) urls.push(page.src);
          if (page.video) urls.push(page.video);
        });
      }
      break;

    case 'tables':
      if (entity.entries && Array.isArray(entity.entries)) {
        entity.entries.forEach((entry: any) => {
          if (entry.img) urls.push(entry.img);
        });
      }
      break;
  }

  // Filter out empty, null, or placeholder URLs
  return urls.filter(url =>
    url &&
    typeof url === 'string' &&
    url.length > 0 &&
    !url.includes('mystery-man') &&
    !url.includes('placeholder')
  );
}

/**
 * Register all assets from an entity
 */
export async function registerEntityAssets(
  entity: any,
  entityType: string,
  worldId?: string
) {
  const urls = extractAssetUrls(entity, entityType);
  const registeredAssets = [];

  for (const url of urls) {
    try {
      const asset = await registerAsset({
        url,
        worldId,
        metadata: {
          entityType,
          entityId: entity.id || entity.foundryId
        }
      });
      registeredAssets.push(asset);
    } catch (error) {
      console.error(`Failed to register asset ${url}:`, error);
    }
  }

  return registeredAssets;
}

/**
 * Get asset statistics for a world
 */
export async function getWorldAssetStats(worldId: string) {
  const assets = await prisma.rpgAsset.findMany({
    where: { worldId },
    select: {
      assetType: true,
      fileSize: true,
      usageCount: true,
      metadata: true
    }
  });

  const stats = {
    total: assets.length,
    byType: {} as Record<string, number>,
    totalSize: BigInt(0),
    mirrored: 0,
    notMirrored: 0,
    highUsage: 0, // >= 10 uses
    totalUsage: 0
  };

  for (const asset of assets) {
    // Count by type
    stats.byType[asset.assetType] = (stats.byType[asset.assetType] || 0) + 1;

    // Sum file sizes
    stats.totalSize += asset.fileSize;

    // Count mirrored
    if (asset.metadata?.mirrored) {
      stats.mirrored++;
    } else {
      stats.notMirrored++;
    }

    // Count high usage
    if (asset.usageCount >= 10) {
      stats.highUsage++;
    }

    stats.totalUsage += asset.usageCount;
  }

  return stats;
}

/**
 * Overlay QR code onto an image (server-side using canvas)
 * Returns the modified image as a buffer
 */
export async function overlayQRCodeOnImage(
  imageBuffer: Buffer,
  shortcode: string,
  options: Partial<QRCodeOptions> = {}
): Promise<Buffer> {
  try {
    // Dynamically import canvas and sharp
    const { createCanvas, loadImage } = await import('canvas');

    // Load the original image
    const image = await loadImage(imageBuffer);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');

    // Draw original image
    ctx.drawImage(image, 0, 0);

    // Generate QR code
    const qrDataUrl = await generateQRCodeDataUrl(shortcode, options);
    const qrImage = await loadImage(qrDataUrl);

    // Calculate position
    const qrSize = options.size || 64;
    const { x, y } = calculateQRPosition(
      image.width,
      image.height,
      qrSize,
      options.position,
      options.cornerOffset
    );

    // Set opacity and draw QR code
    ctx.globalAlpha = options.opacity || 0.15;
    ctx.drawImage(qrImage, x, y, qrSize, qrSize);

    // Reset alpha
    ctx.globalAlpha = 1.0;

    // Return as buffer
    return canvas.toBuffer('image/png');
  } catch (error) {
    console.error('Failed to overlay QR code:', error);
    throw error;
  }
}

/**
 * Generate print-ready version of tile with QR code overlay
 */
export async function generatePrintReadyAsset(
  assetId: string,
  options: Partial<QRCodeOptions> = {}
): Promise<{ buffer: Buffer; mimeType: string } | null> {
  const asset = await prisma.rpgAsset.findUnique({
    where: { id: assetId },
  });

  if (!asset || !asset.shortcode) {
    return null;
  }

  try {
    // Fetch the original image
    const response = await fetch(asset.url);
    if (!response.ok) {
      throw new Error(`Failed to fetch asset: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Overlay QR code
    const printReadyBuffer = await overlayQRCodeOnImage(buffer, asset.shortcode, options);

    return {
      buffer: printReadyBuffer,
      mimeType: 'image/png',
    };
  } catch (error) {
    console.error('Failed to generate print-ready asset:', error);
    return null;
  }
}
