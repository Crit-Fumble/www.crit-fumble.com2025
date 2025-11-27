/**
 * RPG Tile System
 *
 * RpgTile is the core multi-scale/multi-resolution tile system.
 * Each tile (e.g., "grass", "stone", "water") stores references to assets
 * for all scales and resolutions in one place.
 *
 * RpgAsset is a simple file storage system that can store any media type
 * (images, audio, video, etc.) and is referenced by RpgTile.
 */

import { WorldScale, GridType } from '@/lib/constants/vtt-scales';

/**
 * Asset Resolution Types
 * Different resolutions for different use cases
 */
export enum AssetResolution {
  /** Low resolution for fast loading (600x600 @ 10ppi) */
  LOW = 'low',
  /** Medium resolution for standard display (1200x1200 @ 20ppi) */
  MEDIUM = 'medium',
  /** High resolution for detailed view (6000x6000 @ 100ppi) */
  HIGH = 'high',
  /** Print resolution for physical tabletop (300x300 @ 300 DPI) */
  PRINT = 'print',
}

/**
 * Tile Asset Reference
 * References an RpgAsset file for a specific scale and resolution
 */
export interface TileAssetRef {
  /** World scale this asset is for */
  scale: WorldScale;
  /** Resolution of this asset */
  resolution: AssetResolution;
  /** Reference to RpgAsset ID */
  assetId: string;
  /** Optional: Override dimensions if different from scale defaults */
  width?: number;
  /** Optional: Override dimensions if different from scale defaults */
  height?: number;
}

/**
 * Tile Category
 * Used to organize tiles (terrain, structure, decoration, etc.)
 */
export enum TileCategory {
  TERRAIN = 'terrain',
  STRUCTURE = 'structure',
  DECORATION = 'decoration',
  HAZARD = 'hazard',
  EFFECT = 'effect',
  OVERLAY = 'overlay',
}

/**
 * RPG Tile
 * Multi-scale/multi-resolution tile definition
 *
 * Example: A "grass" tile stores references to grass assets for:
 * - All 8 scales (Arena, Building, Settlement, County, Province, Kingdom, Continent, Realm)
 * - All 4 resolutions (Low, Medium, High, Print)
 * - Total of up to 32 asset references per tile
 *
 * If a specific scale/resolution combination is missing, the system can:
 * - Scale down from a higher resolution
 * - Scale up from a lower resolution
 * - Use a similar scale's asset
 */
export interface RpgTile {
  /** Unique tile ID */
  id: string;

  /** Tile name (e.g., "Grass", "Stone Floor", "Water") */
  name: string;

  /** Tile category for organization */
  category: TileCategory;

  /** Tags for searching (e.g., ["outdoor", "natural", "green"]) */
  tags: string[];

  /** Grid type this tile is designed for (square, hex, voxel) */
  gridType: GridType;

  /** RPG system this tile is for (e.g., "dnd5e", "cypher", "all") */
  rpgSystem: string;

  /**
   * Asset references for all scales and resolutions
   * Organized as: assets[scale][resolution] = assetId
   *
   * Example:
   * {
   *   ARENA: {
   *     LOW: 'asset-grass-arena-low-001',
   *     HIGH: 'asset-grass-arena-high-001',
   *     PRINT: 'asset-grass-arena-print-001',
   *   },
   *   BUILDING: {
   *     LOW: 'asset-grass-building-low-001',
   *     HIGH: 'asset-grass-building-high-001',
   *   },
   *   // ... other scales
   * }
   */
  assets: Partial<Record<WorldScale, Partial<Record<AssetResolution, string>>>>;

  /** Optional: Audio asset IDs for ambient sounds */
  audioAssets?: string[];

  /** Optional: Animation frame asset IDs (for animated tiles) */
  animationFrames?: string[];

  /** Optional: Animation frame rate (frames per second) */
  animationFps?: number;

  /** Optional: Tile variants (e.g., different grass patterns) */
  variants?: string[];

  /** Metadata */
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

/**
 * Tile Asset Lookup Result
 * Result of looking up an asset for a specific scale and resolution
 */
export interface TileAssetLookup {
  /** Found asset ID */
  assetId: string;
  /** Scale this asset is for */
  scale: WorldScale;
  /** Resolution this asset is for */
  resolution: AssetResolution;
  /** Whether this is an exact match or fallback */
  isExactMatch: boolean;
  /** If fallback, what was used (e.g., "scaled from HIGH", "using BUILDING scale") */
  fallbackReason?: string;
}

/**
 * Tile Collection
 * Groups related tiles together (e.g., "5e Terrain Pack", "Dungeon Floors")
 */
export interface TileCollection {
  /** Collection ID */
  id: string;
  /** Collection name */
  name: string;
  /** Collection description */
  description: string;
  /** Tile IDs in this collection */
  tileIds: string[];
  /** Category */
  category: TileCategory;
  /** RPG system */
  rpgSystem: string;
  /** Thumbnail asset ID */
  thumbnailAssetId?: string;
  /** Metadata */
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

/**
 * Get asset for a specific scale and resolution with fallback
 */
export function getTileAsset(
  tile: RpgTile,
  scale: WorldScale,
  resolution: AssetResolution
): TileAssetLookup | null {
  // Try exact match first
  const assetId = tile.assets[scale]?.[resolution];
  if (assetId) {
    return {
      assetId,
      scale,
      resolution,
      isExactMatch: true,
    };
  }

  // Fallback strategy 1: Try other resolutions at same scale
  const scaleAssets = tile.assets[scale];
  if (scaleAssets) {
    // Prefer higher resolution over lower
    const resolutionPriority: AssetResolution[] = [
      AssetResolution.HIGH,
      AssetResolution.MEDIUM,
      AssetResolution.PRINT,
      AssetResolution.LOW,
    ];

    for (const fallbackRes of resolutionPriority) {
      const fallbackAssetId = scaleAssets[fallbackRes];
      if (fallbackAssetId) {
        return {
          assetId: fallbackAssetId,
          scale,
          resolution: fallbackRes,
          isExactMatch: false,
          fallbackReason: `Using ${fallbackRes} resolution instead of ${resolution}`,
        };
      }
    }
  }

  // Fallback strategy 2: Try similar scales
  // For square grids: Arena <-> Building
  // For hex grids: Try adjacent scales
  const scaleFallbacks: Partial<Record<WorldScale, WorldScale[]>> = {
    [WorldScale.ARENA]: [WorldScale.BUILDING],
    [WorldScale.BUILDING]: [WorldScale.ARENA],
    [WorldScale.SETTLEMENT]: [WorldScale.COUNTY, WorldScale.ARENA],
    [WorldScale.COUNTY]: [WorldScale.SETTLEMENT, WorldScale.PROVINCE],
    [WorldScale.PROVINCE]: [WorldScale.COUNTY, WorldScale.KINGDOM],
    [WorldScale.KINGDOM]: [WorldScale.PROVINCE, WorldScale.CONTINENT],
    [WorldScale.CONTINENT]: [WorldScale.KINGDOM, WorldScale.REALM],
    [WorldScale.REALM]: [WorldScale.CONTINENT],
  };

  const fallbackScales = scaleFallbacks[scale] || [];
  for (const fallbackScale of fallbackScales) {
    const fallbackScaleAssets = tile.assets[fallbackScale];
    if (fallbackScaleAssets) {
      // Try to find any resolution at the fallback scale
      for (const fallbackRes of [
        AssetResolution.HIGH,
        AssetResolution.MEDIUM,
        AssetResolution.PRINT,
        AssetResolution.LOW,
      ]) {
        const fallbackAssetId = fallbackScaleAssets[fallbackRes];
        if (fallbackAssetId) {
          return {
            assetId: fallbackAssetId,
            scale: fallbackScale,
            resolution: fallbackRes,
            isExactMatch: false,
            fallbackReason: `Using ${fallbackScale} scale ${fallbackRes} resolution`,
          };
        }
      }
    }
  }

  // No fallback found
  return null;
}

/**
 * Get all available scales for a tile
 */
export function getTileScales(tile: RpgTile): WorldScale[] {
  return Object.keys(tile.assets) as WorldScale[];
}

/**
 * Get all available resolutions for a tile at a specific scale
 */
export function getTileResolutions(tile: RpgTile, scale: WorldScale): AssetResolution[] {
  const scaleAssets = tile.assets[scale];
  if (!scaleAssets) return [];
  return Object.keys(scaleAssets) as AssetResolution[];
}

/**
 * Check if tile has asset for specific scale and resolution
 */
export function hasTileAsset(
  tile: RpgTile,
  scale: WorldScale,
  resolution: AssetResolution
): boolean {
  return !!tile.assets[scale]?.[resolution];
}

/**
 * Get tile coverage summary
 * Returns how many scale/resolution combinations are populated
 */
export function getTileCoverage(tile: RpgTile): {
  total: number;
  populated: number;
  missing: Array<{ scale: WorldScale; resolution: AssetResolution }>;
} {
  const allScales = Object.values(WorldScale);
  const allResolutions = Object.values(AssetResolution);
  const total = allScales.length * allResolutions.length; // 8 scales × 4 resolutions = 32

  let populated = 0;
  const missing: Array<{ scale: WorldScale; resolution: AssetResolution }> = [];

  for (const scale of allScales) {
    for (const resolution of allResolutions) {
      if (hasTileAsset(tile, scale, resolution)) {
        populated++;
      } else {
        missing.push({ scale, resolution });
      }
    }
  }

  return { total, populated, missing };
}

/**
 * Example: 5e Grass Terrain Tile
 *
 * const grassTile: RpgTile = {
 *   id: 'tile-grass-001',
 *   name: 'Grass',
 *   category: TileCategory.TERRAIN,
 *   tags: ['outdoor', 'natural', 'green', 'field'],
 *   gridType: GridType.SQUARE,
 *   rpgSystem: 'dnd5e',
 *   assets: {
 *     [WorldScale.ARENA]: {
 *       [AssetResolution.LOW]: 'asset-grass-arena-low-001',
 *       [AssetResolution.HIGH]: 'asset-grass-arena-high-001',
 *       [AssetResolution.PRINT]: 'asset-grass-arena-print-001',
 *     },
 *     [WorldScale.BUILDING]: {
 *       [AssetResolution.LOW]: 'asset-grass-building-low-001',
 *       [AssetResolution.HIGH]: 'asset-grass-building-high-001',
 *       [AssetResolution.PRINT]: 'asset-grass-building-print-001',
 *     },
 *     [WorldScale.SETTLEMENT]: {
 *       [AssetResolution.LOW]: 'asset-grass-settlement-low-001',
 *       [AssetResolution.HIGH]: 'asset-grass-settlement-high-001',
 *     },
 *     // ... other scales
 *   },
 *   audioAssets: ['asset-wind-grass-001', 'asset-crickets-001'],
 *   createdAt: new Date(),
 *   updatedAt: new Date(),
 *   createdBy: 'admin',
 * };
 */
