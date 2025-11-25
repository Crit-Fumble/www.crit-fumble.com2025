/**
 * Type definitions for VTT Tile System
 * Based on docs/TILE_SYSTEM.md
 */

// ============================================================================
// Tile Assets
// ============================================================================

export type TileType = 'square' | 'hex'
export type TileScale = 'base' | 'detail'
export type TileCategory = 'floor' | 'wall' | 'decoration' | 'terrain' | 'object'

export interface TileAsset {
  id: string
  createdAt: Date
  updatedAt: Date

  // Asset info
  name: string
  description?: string
  type: TileType
  scale: TileScale

  // Dimensions (in pixels)
  width: number
  height: number

  // Storage URLs
  url: string          // Base version
  detailUrl?: string   // High-res version

  // Tile specifications
  tileSize: number     // 60, 600, or 528 pixels
  isTransparent: boolean

  // Tilesheet metadata
  isSheet: boolean
  sheetColumns?: number
  sheetRows?: number

  // Categorization
  category?: TileCategory
  tags: string[]

  // Ownership
  uploadedBy?: string
  isPublic: boolean

  // Usage tracking
  usageCount: number
}

// ============================================================================
// Cards (10x10x10 chunks)
// ============================================================================

export interface CardCoordinate {
  x: number
  y: number
  z: number
}

export interface TileReference {
  tileAssetId: string
  rotation?: number      // 0, 90, 180, 270
  flipHorizontal?: boolean
  flipVertical?: boolean
  opacity?: number       // 0.0 to 1.0
}

// 10x10x10 grid of tiles
export type TileGrid = TileReference[][][]

export interface CardTileData {
  tiles: TileGrid
}

export interface Card {
  id: string
  createdAt: Date
  updatedAt: Date

  // Position (in card coordinates)
  x: number
  y: number
  z: number

  // Tile data
  tileData: CardTileData

  // Exploration state
  isExplored: boolean
  visibleToPlayers: boolean
  fogOfWar: boolean

  // Parent sheet
  sheetId: string

  // Simple reference (for single-tile cards)
  tileAssetId?: string

  // Agents/entities
  agents: string[]  // Agent IDs

  // Metadata
  metadata: Record<string, any>
}

// ============================================================================
// Location Sheets
// ============================================================================

export type SheetType = 'dungeon' | 'overworld' | 'interior' | 'custom'
export type GridType = 'square' | 'hex'

export interface LocationSheet {
  id: string
  createdAt: Date
  updatedAt: Date

  // Sheet info
  name: string
  description?: string
  type: SheetType

  // Grid configuration
  gridType: GridType
  scale: number  // Pixels per 5ft square (or hex size)

  // Adventure association
  critSessionId?: string
  campaignId?: string

  // Party position (in card coordinates)
  partyX: number
  partyY: number
  partyZ: number

  // Minimap cache
  minimapUrl?: string
  minimapUpdatedAt?: Date

  // Bounds (for optimization)
  minX?: number
  maxX?: number
  minY?: number
  maxY?: number
  minZ?: number
  maxZ?: number

  // Ownership
  createdBy: string
  gmIds: string[]

  // Sharing
  isPublic: boolean
  isTemplate: boolean

  // Metadata
  metadata: Record<string, any>
}

// ============================================================================
// Boards (Active Play Area)
// ============================================================================

export interface TokenPosition {
  tokenId: string
  agentId: string
  x: number      // Tile coordinate (not card)
  y: number
  z: number
}

export interface TurnOrderEntry {
  tokenId: string
  initiative: number
  hasActed: boolean
}

export interface Board {
  id: string
  createdAt: Date
  updatedAt: Date

  // Board info
  name: string
  description?: string

  // Active session
  critSessionId: string

  // Source sheet
  sheetId: string

  // Board center (in card coordinates)
  centerX: number
  centerY: number
  centerZ: number

  // Board size (max 50x50x50)
  sizeX: number
  sizeY: number
  sizeZ: number

  // Viewport state
  viewportX?: number
  viewportY?: number
  viewportZoom?: number

  // Active tokens
  activeTokens: TokenPosition[]

  // Combat tracking
  turnOrder: TurnOrderEntry[]
  currentTurn?: number
  combatActive: boolean

  // Metadata
  metadata: Record<string, any>
}

// ============================================================================
// Hex Grid System
// ============================================================================

export interface HexCoordinate {
  col: number  // Column (offset)
  row: number  // Row
}

export interface AxialHexCoordinate {
  q: number  // Diagonal axis
  r: number  // Row axis
}

export interface HexTileData {
  coord: HexCoordinate
  tileAssetId: string
  terrain?: string
  elevation?: number
}

// ============================================================================
// Rendering & Viewport
// ============================================================================

export interface Viewport {
  x: number          // World X position
  y: number          // World Y position
  zoom: number       // Zoom level (0.1 to 10.0)
  width: number      // Viewport width in pixels
  height: number     // Viewport height in pixels
}

export interface VisibleTiles {
  tiles: TileReference[]
  startX: number     // Tile coordinates
  startY: number
  endX: number
  endY: number
}

export interface RenderOptions {
  viewport: Viewport
  showGrid: boolean
  showFogOfWar: boolean
  showTokens: boolean
  highlightTile?: { x: number; y: number; z: number }
}

// ============================================================================
// Tile Processing
// ============================================================================

export interface TileProcessingOptions {
  sourceUrl: string
  targetType: TileType
  targetScale: TileScale
  generateDetail: boolean
  optimize: boolean
}

export interface TileProcessingResult {
  baseUrl: string
  detailUrl?: string
  width: number
  height: number
  fileSize: number
}

export interface TilesheetProcessingOptions extends TileProcessingOptions {
  columns: number
  rows: number
  extractIndividual: boolean
}

export interface TilesheetProcessingResult extends TileProcessingResult {
  tiles?: TileProcessingResult[]
  tileCount: number
}

// ============================================================================
// Minimap
// ============================================================================

export interface MinimapPixel {
  x: number
  y: number
  color: string      // Hex color based on explored state
  isParty: boolean
  isBoard: boolean
}

export interface MinimapData {
  width: number      // In pixels (1 pixel = 1 card)
  height: number
  pixels: MinimapPixel[]
  partyX: number
  partyY: number
}

// ============================================================================
// Utility Types
// ============================================================================

export interface Bounds {
  minX: number
  minY: number
  minZ: number
  maxX: number
  maxY: number
  maxZ: number
}

export interface TileDimensions {
  width: number
  height: number
  scale: number  // Pixels per 5ft
}

// Sparse storage key for cards
export type CardKey = `${number},${number},${number}`  // "x,y,z"

// Helper to create card key
export function cardKey(x: number, y: number, z: number): CardKey {
  return `${x},${y},${z}`
}

// Helper to parse card key
export function parseCardKey(key: CardKey): CardCoordinate {
  const [x, y, z] = key.split(',').map(Number)
  return { x, y, z }
}

// ============================================================================
// Constants
// ============================================================================

export const TILE_SIZES = {
  SQUARE_BASE: 60,      // 1 inch = 1 pixel, 5ft = 60px
  SQUARE_DETAIL: 600,   // 10 inches = 10 pixels, 5ft = 600px
  HEX_1MILE: 528,       // 1 pixel = 10ft, 5280ft = 528px
  HEX_10MILE: 5280,     // 10 mile hex
} as const

export const CARD_DIMENSIONS = {
  WIDTH: 10,   // Tiles
  HEIGHT: 10,  // Tiles
  DEPTH: 10,   // Tiles
  TOTAL_TILES: 1000,  // 10x10x10
} as const

export const BOARD_LIMITS = {
  MAX_WIDTH: 50,   // Cards
  MAX_HEIGHT: 50,  // Cards
  MAX_DEPTH: 50,   // Cards
  MAX_CARDS: 125000,  // 50x50x50
} as const

export const ZOOM_LEVELS = {
  MIN: 0.1,
  MAX: 10.0,
  DEFAULT: 1.0,
  DETAIL_THRESHOLD: 2.0,  // Load detail tiles when zoom > 2x
} as const
