# Tile-Based Location System for foundry-core-srd-5e

## Overview

This document defines a **tile-based location system** for the foundry-core-srd-5e module that:

- Uses **JSON format** (Worldographer-compatible structure)
- Integrates **SRD terrain and environmental data**
- Aligns with **VTT Image Scale Guidelines**
- Supports **multi-resolution tile rendering**
- Works with **OpenGameArt tile assets**
- Tracks **creatures** (characters, animals, monsters), **items**, and **locations**

## Design Philosophy

**Worldographer Compatibility**: Our JSON schema mirrors Worldographer's XML structure, allowing:
- Import/export to Worldographer `.wxx` files
- Multi-level maps (World → Continent → Kingdom → Province → County → Settlement → Adventure → Combat)
- Terrain-based tiles with environmental properties
- Features (buildings, icons, POI)
- Labels, shapes, notes

**SRD Integration**: Tiles use SRD environmental rules:
- Terrain types (from SRD Gameplay Toolbox)
- Environmental hazards (extreme cold, slippery ice, etc.)
- Object properties (AC, HP, material) for structures
- Movement costs and passability

**VTT Scale System**: Each tile can exist at multiple resolutions per [VTTImageScaleGuidelines.md](../../../docs/VTTImageScaleGuidelines.md):
- Interaction: Gridless 600×600px or 6000×6000px
- Combat: 5ft squares, 60×60×3px
- Adventure: 10ft squares, 30×30×3px
- Settlement: 30ft hexes, 34×30×5px
- County: 0.1 mile hex, 610×528px
- Province: 1 mile hex, 610×528px
- Kingdom: 6 mile hex, 610×528px
- Continent: 60 mile hex, 610×528px
- World: 6,000 mile voxel, 1,155×1,000 hex

---

## Creature Types

Following the three-pack system from [CREATURE-ORGANIZATION.md](./CREATURE-ORGANIZATION.md):

1. **Characters** (Player & NPC subtypes)
   - `type: "humanoid"`
   - Subtypes: player, guard, noble, criminal, spellcaster, specialist, commoner

2. **Animals**
   - `type: "beast"`
   - Subtypes: aerial, aquatic, domesticated, mount, predator, swarm

3. **Monsters**
   - `type: aberration | celestial | construct | dragon | elemental | fey | fiend | giant | monstrosity | ooze | plant | undead`

---

## JSON Schema (Worldographer-Compatible)

### Map Structure

```typescript
interface TileMap {
  // Map metadata
  id: string;                    // UUID
  name: string;
  description?: string;
  type: ViewLevel;               // Scale level

  // Worldographer compatibility
  worldographerVersion?: string; // "1.0"
  schemaVersion: string;         // "1.0"

  // Dimensions
  width: number;                 // Number of tiles wide
  height: number;                // Number of tiles tall

  // Grid configuration
  grid: GridConfig;

  // Visual settings
  maskColor?: string;            // Fog of war color (hex)

  // Data
  tiles: Tile[];
  features: Feature[];           // Buildings, icons, POI
  labels: Label[];               // Text overlays
  shapes: Shape[];               // Borders, regions, polygons
  notes: Note[];                 // GM notes, lore
  layers: Layer[];               // Multi-layer support
  terrainDefinitions: TerrainDefinition[];

  // Containment (Foundry VTT integration)
  parentLocation?: string;       // UUID of parent location
  childLocations?: string[];     // UUIDs of child locations
  creatures?: CreatureReference[]; // Creatures present
  items?: ItemReference[];       // Items present
}

type ViewLevel =
  | 'world'
  | 'continent'
  | 'kingdom'
  | 'province'
  | 'county'
  | 'settlement'
  | 'adventure'
  | 'combat'
  | 'interaction';

interface GridConfig {
  type: 'hex' | 'square' | 'gridless';

  // Hex settings
  hexWidth?: number;             // In pixels (300 = 1 hex for Worldographer)
  hexHeight?: number;            // In pixels (300 = 1 hex)
  hexOrientation?: 'COLUMNS' | 'ROWS'; // Pointy-top | Flat-top

  // Square settings
  squareSize?: number;           // In pixels

  // Scale (from VTT Image Scale Guidelines)
  scale: ScaleConfig;

  // Projection
  mapProjection?: 'FLAT' | 'ICOSAHEDRAL';
}

interface ScaleConfig {
  level: ViewLevel;              // e.g., 'settlement'

  // Distance represented by one tile
  tileSize: string;              // e.g., "30ft", "1 mile", "6 miles"

  // Pixel-to-distance ratio
  pixelRatio: string;            // e.g., "1ft/pixel", "10ft/pixel"

  // Tile dimensions in pixels
  tileDimensions: string;        // e.g., "34x30x5" for settlement hex
}
```

### Tile Structure

```typescript
interface Tile {
  // Position
  col: number;                   // X coordinate (column)
  row: number;                   // Y coordinate (row)

  // View level (for multi-scale maps)
  viewLevel: ViewLevel;

  // Layer (optional)
  layerId?: string;

  // Terrain
  terrain: TerrainData;

  // Visibility
  gmOnly: boolean;               // Hidden from players
  explored: boolean;             // For fog of war

  // SRD Properties
  environment?: EnvironmentalData;
  structure?: StructureData;     // If tile contains a building/object

  // Resources (Worldographer-compatible, 0-7 scale)
  resources?: {
    animals?: number;
    brick?: number;
    crops?: number;
    gems?: number;
    lumber?: number;
    metals?: number;
    rock?: number;
  };

  // Custom data
  customData?: Record<string, any>;
}

interface TerrainData {
  type: string;                  // "ocean", "forest", "mountain", etc.
  elevation: number;             // Height/depth in feet
  icy: boolean;                  // Covered in ice/snow

  // SRD environmental properties
  climate?: Climate;
  passability?: PassabilityData;
  movementCost?: number;         // Multiplier (1 = normal, 2 = difficult)
}

type Climate =
  | 'temperate'
  | 'cold'
  | 'hot'
  | 'arctic'
  | 'tropical';

interface PassabilityData {
  walkable: boolean;
  swimmable: boolean;
  flyable: boolean;
  difficultTerrain: boolean;     // SRD: costs 2 feet per 1 foot
}

interface EnvironmentalData {
  // SRD hazards (from gameplaytoolbox/03-EnvironmentalEffects.md)
  hazards?: EnvironmentalHazard[];

  // Weather
  weather?: 'clear' | 'precipitation' | 'wind' | 'extreme_cold' | 'extreme_heat';

  // Altitude
  altitude?: 'sea_level' | 'high_altitude'; // ≥10,000ft
}

type EnvironmentalHazard =
  | 'deep_water'        // DC 10 CON save/hour
  | 'extreme_cold'      // ≤0°F, DC 10 CON save/hour
  | 'extreme_heat'      // ≥100°F, DC 5+ CON save/hour
  | 'frigid_water'      // CON score minutes
  | 'heavy_precipitation' // Lightly Obscured
  | 'high_altitude'     // ≥10,000ft, counts as 2 hours/hour
  | 'slippery_ice'      // Difficult Terrain, DC 10 DEX save
  | 'strong_wind'       // Disadvantage ranged attacks
  | 'thin_ice';         // 3d10×10 lbs per 10ft square

interface StructureData {
  // Structure properties (from SRD Breaking Objects)
  name?: string;

  // Dimensions
  width: number;                 // In feet
  height: number;                // In feet
  depth?: number;                // In feet (for 3D structures)
  floors?: number;

  // Material (determines AC/HP)
  material: Material;

  // Mechanical properties
  ac: number;                    // From material table
  hp: number;                    // Per section
  damageThreshold?: number;      // For large structures

  // Damage resistances
  immunities?: string[];
  resistances?: string[];

  // Features
  features?: string[];           // "door", "arrow_slits", "battlements", etc.

  // Entry points
  doors?: DoorData[];
  windows?: WindowData[];
}

type Material =
  | 'cloth'      // AC 11
  | 'paper'      // AC 11
  | 'glass'      // AC 13
  | 'ice'        // AC 13
  | 'wood'       // AC 15
  | 'stone'      // AC 17
  | 'iron'       // AC 19
  | 'steel'      // AC 19
  | 'mithral'    // AC 21
  | 'adamantine'; // AC 23

interface DoorData {
  x: number;                     // Position on structure
  y: number;
  locked: boolean;
  hp: number;
  ac: number;
  material: Material;
}

interface WindowData {
  x: number;
  y: number;
  barred: boolean;
  hp: number;
  ac: number;
}
```

### Feature Structure (Buildings, Icons, POI)

```typescript
interface Feature {
  id: string;
  featureType: string;           // e.g., "Medieval-Castle", "Elf-City-A"
  label?: string;

  // Position per view level (Worldographer multi-scale)
  positions: Partial<Record<`${ViewLevel}X` | `${ViewLevel}Y`, number>>;

  // Display
  rotation: number;              // Degrees
  scale: number;                 // Size multiplier
  opacity: number;

  // Visibility per level
  visibility: Record<`visible${Capitalize<ViewLevel>}`, boolean>;
  gmOnly: boolean;

  // Tile reference (which tile this feature is on)
  tileCol?: number;
  tileRow?: number;

  // Structure data (if building)
  structure?: StructureData;

  // Linked location (for buildings with interiors)
  linkedLocation?: string;       // UUID of child map
}
```

### Label Structure

```typescript
interface Label {
  id: string;
  text: string;

  // Position per view level
  positions: Partial<Record<`${ViewLevel}X` | `${ViewLevel}Y`, number>>;

  // Font styling
  font: {
    family: string;
    size: number;
    color: string;               // Hex color
    bold: boolean;
    italic: boolean;
  };

  // Outline
  outline?: {
    color: string;
    width: number;
  };

  // Background
  background?: {
    color: string;
    opacity: number;
  };

  // Visibility
  visibility: Record<`visible${Capitalize<ViewLevel>}`, boolean>;
  gmOnly: boolean;
}
```

### Shape Structure (Borders, Regions)

```typescript
interface Shape {
  id: string;
  name?: string;
  shapeType: 'polygon' | 'curve' | 'line';

  // Coordinates
  points: Array<{ x: number; y: number }>;

  // View level
  viewLevel: ViewLevel;

  // Stroke
  stroke: {
    color: string;
    width: number;
    style: 'solid' | 'dashed' | 'dotted';
  };

  // Fill
  fill?: {
    color: string;
    opacity: number;
    texture?: string;            // Texture asset name
  };

  // Shadow
  shadow?: {
    enabled: boolean;
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };

  gmOnly: boolean;
}
```

### Note Structure (GM Notes, Lore)

```typescript
interface Note {
  id: string;                    // UUID
  title: string;
  category?: 'nation' | 'religion' | 'timeline' | 'settlement' | 'dungeon' | 'custom';

  // Content (supports markdown/HTML)
  content: string;

  // Position (optional, if attached to location)
  position?: {
    viewLevel: ViewLevel;
    x: number;
    y: number;
  };

  // Tile reference
  tileCol?: number;
  tileRow?: number;

  gmOnly: boolean;

  createdAt: string;             // ISO date
  updatedAt: string;
}
```

### Layer Structure

```typescript
interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;               // Prevent editing
  opacity: number;               // 0-1
  order: number;                 // Z-index
}
```

### Terrain Definition

```typescript
interface TerrainDefinition {
  name: string;                  // Internal ID
  displayName: string;           // Human-readable

  // Visual
  color: string;                 // Hex color
  texture?: string;              // Asset name from OpenGameArt

  // SRD properties
  climate?: Climate;
  passability: PassabilityData;
  movementCost: number;
  defenseBonus: number;          // AC bonus for creatures on this terrain

  // Description
  description?: string;

  // Environmental hazards
  defaultHazards?: EnvironmentalHazard[];
}
```

### Creature & Item References

```typescript
interface CreatureReference {
  uuid: string;                  // Actor UUID
  creatureType: 'character' | 'animal' | 'monster';

  // Position on map
  tileCol: number;
  tileRow: number;

  // Visual
  x: number;                     // Pixel position within tile
  y: number;
  rotation: number;
  scale: number;

  // Visibility
  hidden: boolean;
  gmOnly: boolean;
}

interface ItemReference {
  uuid: string;                  // Item UUID

  // Position
  tileCol: number;
  tileRow: number;
  x?: number;                    // Pixel position (optional)
  y?: number;

  // Visibility
  hidden: boolean;
  gmOnly: boolean;
}
```

---

## SRD Terrain Types

Based on [Gameplay Toolbox - Environmental Effects](../../../data/5e/srd/split/gameplaytoolbox/03-EnvironmentalEffects.md) and common D&D terrains:

### Standard Terrain Definitions

```json
{
  "terrainDefinitions": [
    {
      "name": "ocean",
      "displayName": "Ocean",
      "color": "#0066cc",
      "climate": "temperate",
      "passability": {
        "walkable": false,
        "swimmable": true,
        "flyable": true,
        "difficultTerrain": false
      },
      "movementCost": 1,
      "defenseBonus": 0,
      "defaultHazards": ["deep_water"]
    },
    {
      "name": "deep_ocean",
      "displayName": "Deep Ocean",
      "color": "#003366",
      "climate": "temperate",
      "passability": {
        "walkable": false,
        "swimmable": true,
        "flyable": true,
        "difficultTerrain": false
      },
      "movementCost": 1,
      "defenseBonus": 0,
      "defaultHazards": ["deep_water"]
    },
    {
      "name": "coast",
      "displayName": "Coast",
      "color": "#99ccff",
      "climate": "temperate",
      "passability": {
        "walkable": true,
        "swimmable": true,
        "flyable": true,
        "difficultTerrain": false
      },
      "movementCost": 1,
      "defenseBonus": 0
    },
    {
      "name": "plains",
      "displayName": "Plains",
      "color": "#99cc66",
      "climate": "temperate",
      "passability": {
        "walkable": true,
        "swimmable": false,
        "flyable": true,
        "difficultTerrain": false
      },
      "movementCost": 1,
      "defenseBonus": 0
    },
    {
      "name": "grassland",
      "displayName": "Grassland",
      "color": "#88bb55",
      "climate": "temperate",
      "passability": {
        "walkable": true,
        "swimmable": false,
        "flyable": true,
        "difficultTerrain": false
      },
      "movementCost": 1,
      "defenseBonus": 0
    },
    {
      "name": "forest",
      "displayName": "Forest",
      "color": "#336633",
      "climate": "temperate",
      "passability": {
        "walkable": true,
        "swimmable": false,
        "flyable": false,
        "difficultTerrain": true
      },
      "movementCost": 2,
      "defenseBonus": 2,
      "description": "Light to moderate tree coverage. Difficult terrain."
    },
    {
      "name": "dense_forest",
      "displayName": "Dense Forest",
      "color": "#224422",
      "climate": "temperate",
      "passability": {
        "walkable": true,
        "swimmable": false,
        "flyable": false,
        "difficultTerrain": true
      },
      "movementCost": 2,
      "defenseBonus": 4,
      "description": "Heavy tree coverage. Difficult terrain. Heavily obscured."
    },
    {
      "name": "jungle",
      "displayName": "Jungle",
      "color": "#445533",
      "climate": "tropical",
      "passability": {
        "walkable": true,
        "swimmable": false,
        "flyable": false,
        "difficultTerrain": true
      },
      "movementCost": 2,
      "defenseBonus": 3,
      "defaultHazards": ["extreme_heat"]
    },
    {
      "name": "hills",
      "displayName": "Hills",
      "color": "#aa8866",
      "climate": "temperate",
      "passability": {
        "walkable": true,
        "swimmable": false,
        "flyable": true,
        "difficultTerrain": true
      },
      "movementCost": 2,
      "defenseBonus": 1
    },
    {
      "name": "mountains",
      "displayName": "Mountains",
      "color": "#776655",
      "climate": "cold",
      "passability": {
        "walkable": true,
        "swimmable": false,
        "flyable": true,
        "difficultTerrain": true
      },
      "movementCost": 3,
      "defenseBonus": 2,
      "defaultHazards": ["high_altitude", "extreme_cold"]
    },
    {
      "name": "desert",
      "displayName": "Desert",
      "color": "#ffdd99",
      "climate": "hot",
      "passability": {
        "walkable": true,
        "swimmable": false,
        "flyable": true,
        "difficultTerrain": false
      },
      "movementCost": 1,
      "defenseBonus": 0,
      "defaultHazards": ["extreme_heat", "strong_wind"]
    },
    {
      "name": "tundra",
      "displayName": "Tundra",
      "color": "#ddddff",
      "climate": "arctic",
      "passability": {
        "walkable": true,
        "swimmable": false,
        "flyable": true,
        "difficultTerrain": false
      },
      "movementCost": 1,
      "defenseBonus": 0,
      "defaultHazards": ["extreme_cold"]
    },
    {
      "name": "ice",
      "displayName": "Ice",
      "color": "#ffffff",
      "climate": "arctic",
      "passability": {
        "walkable": true,
        "swimmable": false,
        "flyable": true,
        "difficultTerrain": true
      },
      "movementCost": 2,
      "defenseBonus": 0,
      "defaultHazards": ["extreme_cold", "slippery_ice", "thin_ice"]
    },
    {
      "name": "swamp",
      "displayName": "Swamp",
      "color": "#667744",
      "climate": "temperate",
      "passability": {
        "walkable": true,
        "swimmable": true,
        "flyable": true,
        "difficultTerrain": true
      },
      "movementCost": 2,
      "defenseBonus": 1
    },
    {
      "name": "volcanic",
      "displayName": "Volcanic",
      "color": "#cc3333",
      "climate": "hot",
      "passability": {
        "walkable": true,
        "swimmable": false,
        "flyable": true,
        "difficultTerrain": true
      },
      "movementCost": 2,
      "defenseBonus": 0,
      "defaultHazards": ["extreme_heat"]
    }
  ]
}
```

---

## OpenGameArt Tile Integration

Each terrain type references tile assets from OpenGameArt:

```typescript
interface TileAsset {
  terrainType: string;
  viewLevel: ViewLevel;
  assetPath: string;             // Path to tile image
  dimensions: {
    width: number;               // In pixels
    height: number;
    depth?: number;              // For 3D tiles
  };

  // Multi-resolution support
  resolutions?: {
    low: string;                 // 256×256
    medium: string;              // 512×512
    high: string;                // 1024×1024
    ultra: string;               // 2048×2048
  };
}
```

### Example Asset Mapping

```json
{
  "tileAssets": [
    {
      "terrainType": "forest",
      "viewLevel": "settlement",
      "assetPath": "opengameart/tiles/forest-30ft-hex.png",
      "dimensions": { "width": 34, "height": 30, "depth": 5 },
      "resolutions": {
        "low": "opengameart/tiles/forest-30ft-hex-256.png",
        "medium": "opengameart/tiles/forest-30ft-hex-512.png",
        "high": "opengameart/tiles/forest-30ft-hex-1024.png"
      }
    },
    {
      "terrainType": "forest",
      "viewLevel": "combat",
      "assetPath": "opengameart/tiles/forest-5ft-square.png",
      "dimensions": { "width": 60, "height": 60, "depth": 3 }
    }
  ]
}
```

---

## Integration with Foundry VTT

### Scene Creation from TileMap

```typescript
// Convert TileMap to Foundry Scene
async function createSceneFromTileMap(tileMap: TileMap, journalEntryId?: string): Promise<Scene> {
  const scene = await Scene.create({
    name: tileMap.name,
    journal: journalEntryId,

    width: tileMap.width * getTilePixelWidth(tileMap.grid),
    height: tileMap.height * getTilePixelHeight(tileMap.grid),

    grid: {
      type: tileMap.grid.type === 'hex' ? CONST.GRID_TYPES.HEXODDR : CONST.GRID_TYPES.SQUARE,
      size: tileMap.grid.hexWidth || tileMap.grid.squareSize || 100
    },

    flags: {
      'foundry-core-srd-5e': {
        tileMap: {
          id: tileMap.id,
          scale: tileMap.grid.scale,
          terrainDefinitions: tileMap.terrainDefinitions
        }
      }
    }
  });

  // Create tiles as background images or tile documents
  for (const tile of tileMap.tiles) {
    await createTileOnScene(scene, tile, tileMap);
  }

  // Create features as tile documents
  for (const feature of tileMap.features) {
    await createFeatureOnScene(scene, feature, tileMap);
  }

  // Create creatures as tokens
  for (const creatureRef of tileMap.creatures || []) {
    const actor = await fromUuid(creatureRef.uuid);
    if (actor) {
      await scene.createEmbeddedDocuments('Token', [{
        actorId: actor.id,
        x: creatureRef.x,
        y: creatureRef.y,
        rotation: creatureRef.rotation,
        hidden: creatureRef.hidden
      }]);
    }
  }

  return scene;
}
```

### Journal Entry Integration

```typescript
// Add tile map reference to journal entry
await journalEntry.setFlag('foundry-core-srd-5e', 'location.tileMap', {
  mapId: tileMap.id,
  viewLevel: tileMap.type,
  sceneId: scene.id
});
```

---

## Worldographer XML Import/Export

### JSON → XML Export

```typescript
export function exportToWorldographerXML(tileMap: TileMap): string {
  // Convert JSON to Worldographer XML format
  // Compress with gzip
  // Encode as UTF-16
  // Save as .wxx file
}
```

### XML → JSON Import

```typescript
export async function importFromWorldographerXML(wxxFile: Buffer): Promise<TileMap> {
  // Decompress gzip
  // Decode UTF-16
  // Parse XML
  // Convert to JSON TileMap structure
}
```

---

## Example TileMap (Settlement Scale)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Waterdeep - Dock Ward",
  "description": "The bustling Dock Ward of Waterdeep, City of Splendors",
  "type": "settlement",
  "schemaVersion": "1.0",

  "width": 50,
  "height": 40,

  "grid": {
    "type": "hex",
    "hexWidth": 34,
    "hexHeight": 30,
    "hexOrientation": "COLUMNS",
    "scale": {
      "level": "settlement",
      "tileSize": "30ft",
      "pixelRatio": "1ft/pixel",
      "tileDimensions": "34x30x5"
    },
    "mapProjection": "FLAT"
  },

  "maskColor": "#000000",

  "tiles": [
    {
      "col": 10,
      "row": 15,
      "viewLevel": "settlement",
      "terrain": {
        "type": "urban_street",
        "elevation": 0,
        "icy": false,
        "passability": {
          "walkable": true,
          "swimmable": false,
          "flyable": true,
          "difficultTerrain": false
        },
        "movementCost": 1
      },
      "gmOnly": false,
      "explored": true
    },
    {
      "col": 11,
      "row": 15,
      "viewLevel": "settlement",
      "terrain": {
        "type": "water",
        "elevation": -10,
        "icy": false,
        "passability": {
          "walkable": false,
          "swimmable": true,
          "flyable": true,
          "difficultTerrain": false
        },
        "movementCost": 1
      },
      "gmOnly": false,
      "explored": true
    }
  ],

  "features": [
    {
      "id": "feat-001",
      "featureType": "Medieval-Tavern",
      "label": "The Yawning Portal",
      "positions": {
        "settlementX": 340,
        "settlementY": 450
      },
      "rotation": 0,
      "scale": 1.0,
      "opacity": 1.0,
      "visibility": {
        "visibleWorld": true,
        "visibleContinent": true,
        "visibleKingdom": true,
        "visibleProvince": true,
        "visibleCounty": true,
        "visibleSettlement": true,
        "visibleAdventure": true,
        "visibleCombat": true,
        "visibleInteraction": true
      },
      "gmOnly": false,
      "tileCol": 10,
      "tileRow": 15,
      "structure": {
        "name": "The Yawning Portal",
        "width": 60,
        "height": 80,
        "floors": 3,
        "material": "stone",
        "ac": 17,
        "hp": 500,
        "features": ["door", "windows", "chimney"],
        "doors": [
          {
            "x": 30,
            "y": 0,
            "locked": false,
            "hp": 18,
            "ac": 15,
            "material": "wood"
          }
        ]
      },
      "linkedLocation": "yawning-portal-interior-map-id"
    }
  ],

  "labels": [
    {
      "id": "label-001",
      "text": "Dock Ward",
      "positions": {
        "settlementX": 700,
        "settlementY": 300
      },
      "font": {
        "family": "Arial",
        "size": 24,
        "color": "#000000",
        "bold": true,
        "italic": false
      },
      "outline": {
        "color": "#ffffff",
        "width": 2
      },
      "visibility": {
        "visibleWorld": false,
        "visibleContinent": false,
        "visibleKingdom": false,
        "visibleProvince": false,
        "visibleCounty": true,
        "visibleSettlement": true,
        "visibleAdventure": true,
        "visibleCombat": true,
        "visibleInteraction": true
      },
      "gmOnly": false
    }
  ],

  "shapes": [],
  "notes": [],
  "layers": [],

  "terrainDefinitions": [
    {
      "name": "urban_street",
      "displayName": "Urban Street",
      "color": "#999999",
      "texture": "opengameart/tiles/cobblestone.png",
      "passability": {
        "walkable": true,
        "swimmable": false,
        "flyable": true,
        "difficultTerrain": false
      },
      "movementCost": 1,
      "defenseBonus": 0,
      "description": "Cobblestone streets of a city"
    },
    {
      "name": "water",
      "displayName": "Water",
      "color": "#3366cc",
      "texture": "opengameart/tiles/water.png",
      "climate": "temperate",
      "passability": {
        "walkable": false,
        "swimmable": true,
        "flyable": true,
        "difficultTerrain": false
      },
      "movementCost": 1,
      "defenseBonus": 0
    }
  ],

  "creatures": [
    {
      "uuid": "Actor.abc123",
      "creatureType": "character",
      "tileCol": 10,
      "tileRow": 15,
      "x": 17,
      "y": 15,
      "rotation": 0,
      "scale": 1.0,
      "hidden": false,
      "gmOnly": false
    }
  ],

  "items": [
    {
      "uuid": "Item.xyz789",
      "tileCol": 11,
      "tileRow": 15,
      "x": 20,
      "y": 10,
      "hidden": false,
      "gmOnly": true
    }
  ],

  "childLocations": [
    "yawning-portal-interior-map-id"
  ]
}
```

---

## Implementation Notes

### For foundry-core-srd-5e Module

1. **Define TypeScript interfaces** for all tile structures
2. **Add terrain definitions** from SRD
3. **Provide utility functions** for:
   - Creating tile maps
   - Converting to/from Foundry Scenes
   - Importing/exporting Worldographer XML
4. **NO custom rendering** - use Foundry's native tile system
5. **NO tile asset management** - defer to cfg-5e module

### For Future cfg-5e Module

1. **Tile asset library** with OpenGameArt integration
2. **Multi-resolution loading** based on zoom level
3. **Automatic terrain rendering**
4. **Worldographer import/export UI**
5. **Tile painting tools**
6. **Environmental hazard automation**

---

## References

- [VTTImageScaleGuidelines.md](../../../docs/VTTImageScaleGuidelines.md) - Multi-scale tile specifications
- [CREATURE-ORGANIZATION.md](./CREATURE-ORGANIZATION.md) - Three-pack creature system
- [LOCATION-SYSTEM.md](./LOCATION-SYSTEM.md) - Foundry Scene/Journal integration
- [Worldographer File Format](https://worldographer.com/instructions/file-format/) - Official XML specification
- [WORLDOGRAPHER_DATABASE_SCHEMA.md](../../../docs/agent/WORLDOGRAPHER_DATABASE_SCHEMA.md) - Database implementation
- [SRD Environmental Effects](../../../data/5e/srd/split/gameplaytoolbox/03-EnvironmentalEffects.md) - Environmental hazards
- [SRD Breaking Objects](../../../data/5e/srd/split/rulesglossary/rulesdefinitions/18-BreakingObjects.md) - Structure properties
