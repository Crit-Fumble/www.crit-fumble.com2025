# Tile & Asset System

## Overview

The system has two main components:

1. **RpgAsset** - Simple file storage for any media type (images, audio, video, etc.)
2. **RpgTile** - Multi-scale/multi-resolution tile definitions that reference RpgAssets

## Architecture

```
RpgTile (grass terrain)
├── Arena Scale
│   ├── Low Res → RpgAsset (image)
│   ├── High Res → RpgAsset (image)
│   └── Print Res → RpgAsset (image)
├── Building Scale
│   ├── Low Res → RpgAsset (image)
│   └── High Res → RpgAsset (image)
├── Settlement Scale
│   └── Low Res → RpgAsset (image)
└── Audio Assets → [RpgAsset (audio), RpgAsset (audio)]
```

## RpgAsset - Simple File Storage

**Purpose:** Store any media file with metadata.

**Examples:**
- Image files (PNG, JPG, WebP)
- Audio files (MP3, OGG, WAV)
- Video files (MP4, WebM)
- Documents (PDF)
- Data files (JSON)

**Key Features:**
- Simple key-value storage
- No knowledge of scales or resolutions
- Can be referenced by multiple tiles
- Supports soft delete
- Access control (public, authenticated, premium, admin, private)
- Storage provider agnostic (Vercel Blob, S3, Cloudinary, etc.)

## RpgTile - Multi-Scale Tile System

**Purpose:** Define tiles (terrain, structures, etc.) with all scales and resolutions in one place.

**Key Features:**
- Stores references to RpgAssets for all 8 scales × 4 resolutions = up to 32 assets per tile
- Intelligent fallback system (scales up/down, uses similar scales)
- Supports audio assets for ambient sounds
- Supports animation frames
- Organized by category (terrain, structure, decoration, hazard, effect, overlay)
- Tagged for easy searching

## Example: Creating a 5e Grass Terrain Tile

### Step 1: Upload Assets

```typescript
// Upload grass images at different scales/resolutions
const arenaLowRes: RpgAsset = {
  id: 'asset-grass-arena-low-001',
  name: 'Grass - Arena - Low',
  mediaType: AssetMediaType.IMAGE,
  mimeType: 'image/png',
  storageUrl: 'https://blob.vercel-storage.com/grass-arena-low.png',
  width: 600,
  height: 600,
  // ... other fields
};

const arenaHighRes: RpgAsset = {
  id: 'asset-grass-arena-high-001',
  name: 'Grass - Arena - High',
  mediaType: AssetMediaType.IMAGE,
  mimeType: 'image/png',
  storageUrl: 'https://blob.vercel-storage.com/grass-arena-high.png',
  width: 6000,
  height: 6000,
  // ... other fields
};

const arenaPrintRes: RpgAsset = {
  id: 'asset-grass-arena-print-001',
  name: 'Grass - Arena - Print',
  mediaType: AssetMediaType.IMAGE,
  mimeType: 'image/png',
  storageUrl: 'https://blob.vercel-storage.com/grass-arena-print.png',
  width: 300,
  height: 300,
  // ... other fields
};

// Upload audio assets
const windSound: RpgAsset = {
  id: 'asset-wind-001',
  name: 'Wind Through Grass',
  mediaType: AssetMediaType.AUDIO,
  mimeType: 'audio/mp3',
  storageUrl: 'https://blob.vercel-storage.com/wind.mp3',
  duration: 120,
  // ... other fields
};
```

### Step 2: Create Tile with All Assets

```typescript
const grassTile: RpgTile = {
  id: 'tile-grass-001',
  name: 'Grass',
  category: TileCategory.TERRAIN,
  tags: ['outdoor', 'natural', 'green', 'field'],
  gridType: GridType.SQUARE,
  rpgSystem: 'dnd5e',

  // All scale/resolution combinations
  assets: {
    [WorldScale.ARENA]: {
      [AssetResolution.LOW]: 'asset-grass-arena-low-001',
      [AssetResolution.HIGH]: 'asset-grass-arena-high-001',
      [AssetResolution.PRINT]: 'asset-grass-arena-print-001',
    },
    [WorldScale.BUILDING]: {
      [AssetResolution.LOW]: 'asset-grass-building-low-001',
      [AssetResolution.HIGH]: 'asset-grass-building-high-001',
      [AssetResolution.PRINT]: 'asset-grass-building-print-001',
    },
    [WorldScale.SETTLEMENT]: {
      [AssetResolution.LOW]: 'asset-grass-settlement-low-001',
      [AssetResolution.HIGH]: 'asset-grass-settlement-high-001',
    },
    // ... other scales
  },

  // Ambient audio
  audioAssets: ['asset-wind-001', 'asset-crickets-001'],

  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'admin',
};
```

### Step 3: Use Tile in Game

```typescript
// Get asset for Arena scale at High resolution
const result = getTileAsset(
  grassTile,
  WorldScale.ARENA,
  AssetResolution.HIGH
);

if (result) {
  console.log(`Asset ID: ${result.assetId}`);
  console.log(`Exact match: ${result.isExactMatch}`);

  // Fetch the actual asset
  const asset = await fetchAsset(result.assetId);
  console.log(`URL: ${asset.storageUrl}`);
  console.log(`Size: ${asset.width}x${asset.height}`);
}
```

### Step 4: Fallback Handling

```typescript
// Request County scale at Medium resolution
// But we only have Settlement Low and High
const result = getTileAsset(
  grassTile,
  WorldScale.COUNTY,
  AssetResolution.MEDIUM
);

if (result && !result.isExactMatch) {
  console.log(`Fallback used: ${result.fallbackReason}`);
  // Output: "Using SETTLEMENT scale HIGH resolution"
}
```

## Scale/Resolution Matrix

Each tile can have up to **32 asset references** (8 scales × 4 resolutions):

| Scale       | Low Res | Medium Res | High Res | Print Res |
|-------------|---------|------------|----------|-----------|
| Arena       | ✓       | ✓          | ✓        | ✓         |
| Building    | ✓       | ✓          | ✓        | ✓         |
| Settlement  | ✓       | ✓          | ✓        | ✓         |
| County      | ✓       | ✓          | ✓        | ✓         |
| Province    | ✓       | ✓          | ✓        | ✓         |
| Kingdom     | ✓       | ✓          | ✓        | ✓         |
| Continent   | ✓       | ✓          | ✓        | ✓         |
| Realm       | ✓       | ✓          | ✓        | ✓         |

**Note:** Not all combinations need to be populated. The system will fallback intelligently.

## Fallback Strategy

When a specific scale/resolution is not available:

1. **Try other resolutions at same scale** (prefer higher res)
2. **Try similar scales** (e.g., Arena ↔ Building, County → Settlement)
3. **Scale image with tools** (future: automatic scaling service)

## Asset Storage Best Practices

### For Image Assets
- **Low Res:** 600x600px @ 10ppi (fast loading, zoomed out)
- **Medium Res:** 1200x1200px @ 20ppi (standard display)
- **High Res:** 6000x6000px @ 100ppi (zoomed in, detailed)
- **Print Res:** 300x300px @ 300 DPI (physical printing)

### For Audio Assets
- Format: MP3 or OGG for broad compatibility
- Bitrate: 128-192 kbps for ambient sounds
- Loop: Ensure seamless looping for ambient tracks
- Length: 30-120 seconds for ambient, shorter for effects

### For Video Assets
- Format: MP4 (H.264) or WebM
- Resolution: 1920x1080 or 1280x720
- Bitrate: Optimize for web (2-5 Mbps)

## Tile Categories

- **TERRAIN:** Ground surfaces (grass, stone, dirt, water)
- **STRUCTURE:** Buildings, walls, doors, windows
- **DECORATION:** Props, furniture, decorations
- **HAZARD:** Dangerous terrain (lava, spikes, traps)
- **EFFECT:** Visual effects (fire, smoke, magic)
- **OVERLAY:** Grid overlays, lighting, fog of war

## Tile Collections

Group related tiles together:

```typescript
const dungeonFloorsPack: TileCollection = {
  id: 'collection-dungeon-floors-001',
  name: '5e Dungeon Floors',
  description: 'Complete set of dungeon floor tiles',
  tileIds: [
    'tile-stone-floor-001',
    'tile-cracked-floor-001',
    'tile-mossy-floor-001',
    'tile-dirt-floor-001',
  ],
  category: TileCategory.TERRAIN,
  rpgSystem: 'dnd5e',
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'admin',
};
```

## API Usage Examples

### Upload Asset

```typescript
const uploadRequest: AssetUploadRequest = {
  file: imageFile,
  name: 'Grass - Arena - High',
  description: 'High resolution grass tile for arena scale',
  mediaType: AssetMediaType.IMAGE,
  accessLevel: AssetAccessLevel.PUBLIC,
  tags: ['terrain', 'grass', 'arena'],
  altText: 'Green grass texture',
};

const response = await uploadAsset(uploadRequest);
console.log(`Asset ID: ${response.asset.id}`);
```

### Query Assets

```typescript
const filters: AssetQueryFilters = {
  mediaType: AssetMediaType.IMAGE,
  tags: ['terrain', 'grass'],
  search: 'arena',
  page: 1,
  pageSize: 20,
};

const assets = await queryAssets(filters);
```

### Create Tile

```typescript
const tile: RpgTile = {
  id: 'tile-grass-001',
  name: 'Grass',
  category: TileCategory.TERRAIN,
  tags: ['outdoor', 'natural'],
  gridType: GridType.SQUARE,
  rpgSystem: 'dnd5e',
  assets: {
    [WorldScale.ARENA]: {
      [AssetResolution.HIGH]: assetId,
    },
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: userId,
};

await createTile(tile);
```

## Benefits

1. **Define once, use everywhere:** Create a tile with all scales/resolutions in one place
2. **Intelligent fallbacks:** System automatically finds best available asset
3. **Flexible storage:** RpgAsset can store any media type
4. **Easy organization:** Categories, tags, and collections
5. **Future-proof:** Can add new scales/resolutions without breaking existing tiles
6. **Efficient:** Only load assets needed for current scale/zoom level
7. **Scalable:** Can generate missing resolutions with image processing tools

## Future Enhancements

- **Automatic scaling service:** Generate missing resolutions automatically
- **CDN integration:** Serve assets from CDN for faster loading
- **Compression:** Optimize images on upload
- **Variants:** Support tile variants (e.g., different grass patterns)
- **Animation:** Support animated tiles with frame sequences
- **3D assets:** Support 3D models for voxel scales
