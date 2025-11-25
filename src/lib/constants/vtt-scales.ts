/**
 * VTT Scale System Constants
 *
 * This file defines all world scales with their digital (VTT display) and
 * print (physical tabletop @ 300 DPI) specifications.
 *
 * Key Concepts:
 * - **Digital specs**: How pixels map to game units on screen (VTT display)
 * - **Print specs**: How game units map to physical inches for miniature play
 * - **Multi-resolution**: Assets can be stored at multiple resolutions and
 *   loaded dynamically based on zoom level
 *
 * Generated from: docs/VTTImageScaleGuidelines.md
 * Script: scripts/generate-print-scales.ts
 */

export const PRINT_DPI = 300;

/**
 * World Scale Enum
 * Defines all supported world scales from Arena (5ft) to Realm (100mi)
 */
export enum WorldScale {
  ARENA = 'ARENA',
  BUILDING = 'BUILDING',
  SETTLEMENT = 'SETTLEMENT',
  COUNTY = 'COUNTY',
  PROVINCE = 'PROVINCE',
  KINGDOM = 'KINGDOM',
  CONTINENT = 'CONTINENT',
  REALM = 'REALM',
}

/**
 * Grid Type Enum
 * Defines the rendering type for each scale
 */
export enum GridType {
  SQUARE = 'square',
  HEX = 'hex',
  VOXEL = 'voxel',
}

/**
 * Digital (VTT Display) Specifications
 */
export interface DigitalSpec {
  /** Width in pixels for VTT display */
  width: number;
  /** Height in pixels for VTT display */
  height: number;
  /** How digital pixels map to game units (e.g., "1 pixel = 1 inch") */
  pixelRatio: string;
}

/**
 * Print (Physical Tabletop @ 300 DPI) Specifications
 */
export interface PrintSpec {
  /** Width in pixels @ 300 DPI */
  width: number;
  /** Height in pixels @ 300 DPI */
  height: number;
  /** Physical width in inches */
  physicalWidth: number;
  /** Physical height in inches */
  physicalHeight: number;
  /** Physical diameter for hex tiles (flat-to-flat) */
  physicalDiameter?: number;
  /** Print scale (e.g., "1 inch = 5 feet") */
  scale: string;
}

/**
 * Scale Metadata
 * Complete specifications for a world scale
 */
export interface ScaleMetadata {
  /** Scale name */
  name: string;
  /** Grid rendering type */
  gridType: GridType;
  /** Tile size description (e.g., "5ft", "1 mile") */
  tileSize: string;
  /** Tile size in feet (for calculations) */
  tileSizeInFeet: number;
  /** Digital (VTT display) specifications */
  digital: DigitalSpec;
  /** Print (physical tabletop) specifications */
  print: PrintSpec;
}

/**
 * VTT Scale Specifications
 *
 * All scales print at 1" x 1" physical size (300 x 300 pixels @ 300 DPI).
 * The scale determines how much game distance that 1" represents.
 *
 * Example: Arena scale (1" = 5ft) vs Building scale (1" = 10ft)
 * Both print at 1" physical, but represent different game distances.
 */
export const VTT_SCALES: Record<WorldScale, ScaleMetadata> = {
  [WorldScale.ARENA]: {
    name: 'Arena',
    gridType: GridType.SQUARE,
    tileSize: '5ft',
    tileSizeInFeet: 5,
    digital: {
      width: 60,
      height: 60,
      pixelRatio: '1 pixel = 1 inch',
    },
    print: {
      width: 300,
      height: 300,
      physicalWidth: 1,
      physicalHeight: 1,
      scale: '1 inch = 5 feet',
    },
  },
  [WorldScale.BUILDING]: {
    name: 'Building',
    gridType: GridType.SQUARE,
    tileSize: '10ft',
    tileSizeInFeet: 10,
    digital: {
      width: 30,
      height: 30,
      pixelRatio: '1 pixel = 4 inches',
    },
    print: {
      width: 300,
      height: 300,
      physicalWidth: 1,
      physicalHeight: 1,
      scale: '1 inch = 10 feet',
    },
  },
  [WorldScale.SETTLEMENT]: {
    name: 'Settlement',
    gridType: GridType.HEX,
    tileSize: '30ft',
    tileSizeInFeet: 30,
    digital: {
      width: 34,
      height: 30,
      pixelRatio: '1 pixel = 1 foot',
    },
    print: {
      width: 300,
      height: 300,
      physicalWidth: 1,
      physicalHeight: 1,
      physicalDiameter: 1,
      scale: '1 inch = 30 feet',
    },
  },
  [WorldScale.COUNTY]: {
    name: 'County',
    gridType: GridType.HEX,
    tileSize: '0.1 mile',
    tileSizeInFeet: 528,
    digital: {
      width: 610,
      height: 528,
      pixelRatio: '1 pixel = 1 foot',
    },
    print: {
      width: 300,
      height: 300,
      physicalWidth: 1,
      physicalHeight: 1,
      physicalDiameter: 1,
      scale: '1 inch = 528 feet',
    },
  },
  [WorldScale.PROVINCE]: {
    name: 'Province',
    gridType: GridType.HEX,
    tileSize: '1 mile',
    tileSizeInFeet: 5280,
    digital: {
      width: 610,
      height: 528,
      pixelRatio: '1 pixel = 10 feet',
    },
    print: {
      width: 300,
      height: 300,
      physicalWidth: 1,
      physicalHeight: 1,
      physicalDiameter: 1,
      scale: '1 inch = 1 mile',
    },
  },
  [WorldScale.KINGDOM]: {
    name: 'Kingdom',
    gridType: GridType.HEX,
    tileSize: '6 miles',
    tileSizeInFeet: 31680,
    digital: {
      width: 610,
      height: 528,
      pixelRatio: '1 pixel = 60 feet',
    },
    print: {
      width: 300,
      height: 300,
      physicalWidth: 1,
      physicalHeight: 1,
      physicalDiameter: 1,
      scale: '1 inch = 6 miles',
    },
  },
  [WorldScale.CONTINENT]: {
    name: 'Continent',
    gridType: GridType.HEX,
    tileSize: '60 miles',
    tileSizeInFeet: 316800,
    digital: {
      width: 610,
      height: 528,
      pixelRatio: '1 pixel = 600 feet',
    },
    print: {
      width: 300,
      height: 300,
      physicalWidth: 1,
      physicalHeight: 1,
      physicalDiameter: 1,
      scale: '1 inch = 60 miles',
    },
  },
  [WorldScale.REALM]: {
    name: 'Realm',
    gridType: GridType.VOXEL,
    tileSize: '100 miles',
    tileSizeInFeet: 528000,
    digital: {
      width: 0, // Variable (voxel rendering)
      height: 0,
      pixelRatio: '1 pixel = 0.1 mile',
    },
    print: {
      width: 300,
      height: 300,
      physicalWidth: 1,
      physicalHeight: 1,
      scale: '1 inch = 100 miles',
    },
  },
} as const;

/**
 * Get scale metadata by scale enum
 */
export function getScaleMetadata(scale: WorldScale): ScaleMetadata {
  return VTT_SCALES[scale];
}

/**
 * Get scale metadata by name (case-insensitive)
 */
export function getScaleByName(name: string): ScaleMetadata | undefined {
  const upperName = name.toUpperCase() as WorldScale;
  return VTT_SCALES[upperName];
}

/**
 * Get digital pixel ratio for a scale
 */
export function getDigitalPixelRatio(scale: WorldScale): string {
  return VTT_SCALES[scale].digital.pixelRatio;
}

/**
 * Get digital dimensions for a scale
 */
export function getDigitalDimensions(scale: WorldScale): { width: number; height: number } {
  const { width, height } = VTT_SCALES[scale].digital;
  return { width, height };
}

/**
 * Get print dimensions for a scale
 */
export function getPrintDimensions(scale: WorldScale): { width: number; height: number } {
  const { width, height } = VTT_SCALES[scale].print;
  return { width, height };
}

/**
 * Get physical dimensions for a scale (in inches)
 */
export function getPhysicalDimensions(scale: WorldScale): { width: number; height: number; diameter?: number } {
  const { physicalWidth, physicalHeight, physicalDiameter } = VTT_SCALES[scale].print;
  return {
    width: physicalWidth,
    height: physicalHeight,
    diameter: physicalDiameter,
  };
}

/**
 * Get grid type for a scale
 */
export function getGridType(scale: WorldScale): GridType {
  return VTT_SCALES[scale].gridType;
}

/**
 * Get all scales of a specific grid type
 */
export function getScalesByGridType(gridType: GridType): ScaleMetadata[] {
  return Object.values(VTT_SCALES).filter((scale) => scale.gridType === gridType);
}

/**
 * Get all square grid scales (Arena, Building)
 */
export function getSquareScales(): ScaleMetadata[] {
  return getScalesByGridType(GridType.SQUARE);
}

/**
 * Get all hex grid scales (Settlement, County, Province, Kingdom, Continent)
 */
export function getHexScales(): ScaleMetadata[] {
  return getScalesByGridType(GridType.HEX);
}

/**
 * Get all voxel scales (Realm)
 */
export function getVoxelScales(): ScaleMetadata[] {
  return getScalesByGridType(GridType.VOXEL);
}

/**
 * Multi-Resolution Asset Support
 *
 * Assets can be stored at multiple resolutions for different use cases:
 * - Low-res (600x600 @ 10ppi): Fast loading, zoomed-out views
 * - High-res (6000x6000 @ 100ppi): Detailed view, zoomed-in
 * - Print-res (300x300 @ 300 DPI): Physical printing
 *
 * The system should load the appropriate resolution based on:
 * 1. Current zoom level
 * 2. Screen size
 * 3. Network speed
 * 4. Use case (VTT display vs print export)
 */
export enum AssetResolution {
  /** Low resolution for fast loading (600x600 @ 10ppi) */
  LOW = 'low',
  /** High resolution for detailed view (6000x6000 @ 100ppi) */
  HIGH = 'high',
  /** Print resolution for physical tabletop (300x300 @ 300 DPI) */
  PRINT = 'print',
}

/**
 * Multi-Resolution Asset Metadata
 * Defines available resolutions for a terrain/asset type
 */
export interface MultiResAsset {
  /** Asset ID */
  id: string;
  /** Asset name/type (e.g., "grass", "stone", "water") */
  name: string;
  /** World scale this asset belongs to */
  scale: WorldScale;
  /** Available resolutions */
  resolutions: {
    [AssetResolution.LOW]?: string; // URL or path to low-res asset
    [AssetResolution.HIGH]?: string; // URL or path to high-res asset
    [AssetResolution.PRINT]?: string; // URL or path to print-res asset
  };
}

/**
 * Example: Terrain type with multiple resolutions
 *
 * When implementing 5e terrain types, each terrain can have multiple
 * resolution versions that are loaded based on zoom level:
 *
 * const grassTerrain: MultiResAsset = {
 *   id: 'terrain-grass-01',
 *   name: 'Grass',
 *   scale: WorldScale.ARENA,
 *   resolutions: {
 *     [AssetResolution.LOW]: '/assets/terrain/grass-600x600.png',
 *     [AssetResolution.HIGH]: '/assets/terrain/grass-6000x6000.png',
 *     [AssetResolution.PRINT]: '/assets/terrain/grass-300x300-print.png',
 *   },
 * };
 */
