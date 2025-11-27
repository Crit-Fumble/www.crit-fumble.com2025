# Location (Core Concept)

## Overview

A **Location** is a physical space in the game world where creatures, objects, and events exist. Locations can be as small as a single pixel/voxel or as large as an entire world.

This is a **system-agnostic** core concept that can be extended by specific TTRPG system implementations.

## Definition

From [CORE-CONCEPTS.md](CORE-CONCEPTS.md):
> **locations** (at least one, can be as small as a single pixel/voxel)

### Location Characteristics
- **Spatial**: Occupies physical space (2D or 3D)
- **Scalable**: Can represent areas from inches to thousands of miles
- **Containment**: Can contain creatures, objects, and other locations
- **Hierarchical**: Locations contain smaller locations

### Location vs Board
- **Location**: A specific place in the game world (e.g., "The Rusty Dragon Inn")
- **Board**: The visual representation/map that holds multiple locations

## Core Location Properties

All TTRPG locations share these fundamental properties:

### Identity
- **Name**: What the location is called
- **Description**: What the location looks like/contains
- **Type**: Category of location (see Location Types below)

### Spatial Properties
- **Scale**: Size category (see Scale System below)
- **Dimensions**: Actual size in game world units
- **Grid Type**: Square, hex (pointy/flat), gridless, or voxel
- **Coordinates**: Position within parent location or world

### Containment
- **Parent Location**: Larger location that contains this one
- **Child Locations**: Smaller locations within this one
- **Creatures**: Creatures present at this location
- **Objects**: Objects present at this location

### Visual Representation
- **Tiles**: Visual tiles that make up the location
- **Resolution**: Available image resolutions for different zoom levels
- **Rendering**: How the location is displayed on boards

## Scale System

Based on [VTT-IMAGE-SCALE-GUIDELINES.md](VTT-IMAGE-SCALE-GUIDELINES.md), locations exist at different scales:

### Interaction Scale
- **Purpose**: Detailed object interaction
- **Grid**: Gridless
- **Tile Size**: 600×600px (0.1" per pixel) OR 6000×6000px (0.01" per pixel)
- **Examples**: Examining a scroll, lockpicking, detailed crafting

### Combat Scale
- **Purpose**: Tactical combat
- **Grid**: 5ft squares
- **Tile Size**: 60×60×3px (1" per pixel)
- **Examples**: Battle maps, arena, encounter areas

### Exploration Scales

#### Adventure Location
- **Purpose**: Inside buildings, dungeons, adventure locations
- **Grid**: 10ft squares
- **Tile Size**: 30×30×3px (4" per pixel)
- **Examples**: Inn interior, dungeon rooms, temple halls

#### Settlement/Wilderness
- **Purpose**: Settlements, natural features, small areas
- **Grid**: 30ft hexes
- **Tile Size**: 34×30×5px (1ft per pixel)
- **Examples**: Town, forest clearing, farm

### Travel/Minimap Scales

#### County
- **Purpose**: Local area, wilderness, small water features
- **Grid**: 0.1 mile hex (528ft)
- **Tile Size**: 610×528px (1ft per pixel)
- **Examples**: County, wilderness area, small lake

#### Province
- **Purpose**: Regional area, large water features
- **Grid**: 1 mile hex
- **Tile Size**: 610×528px (10ft per pixel)
- **Examples**: Province, large lake, small sea

#### Kingdom
- **Purpose**: Nation-sized area, seas
- **Grid**: 6 mile hex
- **Tile Size**: 610×528px (60ft per pixel)
- **Examples**: Kingdom, gulf, large sea

#### Continent
- **Purpose**: Continental area, oceans
- **Grid**: 60 mile hex
- **Tile Size**: 610×528px (600ft per pixel)
- **Examples**: Continent, ocean, island chains

### World Overview Scale
- **Purpose**: Entire world view
- **Grid**: 6,000 mile voxel
- **Tile Size**: 1,155×1,000px (6 miles per pixel)
- **Examples**: Planet, world map

## Core Location Schema

```typescript
/**
 * Location scale level
 */
type ScaleLevel =
  | 'interaction'      // 0.1" - 6" (gridless, detailed)
  | 'combat'           // 5ft squares
  | 'adventure'        // 10ft squares (dungeon/building interior)
  | 'settlement'       // 30ft hexes (town/wilderness feature)
  | 'county'           // 0.1 mile hex (528ft)
  | 'province'         // 1 mile hex
  | 'kingdom'          // 6 mile hex
  | 'continent'        // 60 mile hex
  | 'world';           // 6,000 mile voxel

/**
 * Grid type for location
 */
type GridType =
  | 'gridless'         // Measured in pixels/inches
  | 'square'           // Square grid
  | 'hex_pointy'       // Pointy-top hexagons
  | 'hex_flat'         // Flat-top hexagons
  | 'voxel';           // 3D volumetric grid

/**
 * Location type category
 */
type LocationType =
  // Natural
  | 'wilderness'       // Undeveloped natural area
  | 'water'            // Lake, river, ocean, sea
  | 'mountain'         // Mountains, hills
  | 'cave'             // Natural cave system
  | 'forest'           // Wooded area
  | 'desert'           // Arid wasteland
  | 'plains'           // Grassland, fields

  // Settled
  | 'settlement'       // Generic settled area
  | 'city'             // Large urban area
  | 'town'             // Medium urban area
  | 'village'          // Small rural community
  | 'hamlet'           // Tiny settlement
  | 'outpost'          // Frontier settlement

  // Structures
  | 'building'         // Generic structure
  | 'inn'              // Tavern, lodging
  | 'shop'             // Store, market
  | 'temple'           // Religious building
  | 'fortress'         // Military stronghold
  | 'dungeon'          // Underground complex
  | 'tower'            // Tall structure
  | 'castle'           // Fortified residence
  | 'mansion'          // Large residence
  | 'house'            // Small residence

  // Geographic/Political
  | 'region'           // Geographic or political region
  | 'kingdom'          // Nation-state
  | 'province'         // Administrative division
  | 'county'           // Local administrative area
  | 'continent'        // Continental landmass
  | 'world'            // Entire planet

  // Special
  | 'demiplane'        // Magical pocket dimension
  | 'extraplanar'      // Other plane of existence
  | 'abstract';        // Non-physical location

/**
 * Core location definition (system-agnostic)
 */
interface Location {
  id: string;
  name: string;
  description?: string;

  // Classification
  type: LocationType;
  scale: ScaleLevel;

  // Spatial Properties
  spatial: {
    gridType: GridType;
    dimensions: {
      width: number;      // In grid units
      height: number;     // In grid units
      depth?: number;     // For 3D locations
      unit: string;       // 'feet', 'miles', 'pixels', etc.
    };
    coordinates?: {
      x: number;
      y: number;
      z?: number;
    };
  };

  // Containment
  containment: {
    parentLocation?: string;      // Parent location ID
    childLocations?: string[];    // Child location IDs
    creatures?: string[];         // Creature UUIDs
    objects?: string[];           // Object/Item UUIDs
  };

  // Visual Representation
  visual?: {
    tiles?: Tile[];               // Visual tiles
    availableResolutions?: {      // Multi-resolution support
      scale: ScaleLevel;
      pixelsPerUnit: number;
      imageUrl: string;
    }[];
    defaultZoom?: number;
  };

  // Environmental Properties (system-specific)
  environment?: {
    climate?: string;
    terrain?: string;
    lighting?: 'bright' | 'dim' | 'dark';
    hazards?: string[];           // Environmental hazard IDs
  };

  // Facilities (things available at this location)
  facilities?: string[];          // Facility IDs

  // System extensions
  system?: Record<string, unknown>; // System-specific properties
}

/**
 * Tile definition (from core concepts: boards/tiles)
 */
interface Tile {
  id: string;
  col: number;                    // Column position
  row: number;                    // Row position
  layer?: number;                 // Layer (for multi-level)

  visual: {
    imageUrl?: string;
    color?: string;
    opacity?: number;
  };

  properties?: {
    passable?: boolean;
    difficult?: boolean;
    elevation?: number;
    [key: string]: unknown;       // System-specific tile properties
  };
}
```

## Location Hierarchy

Locations form a containment hierarchy:

```
World (6,000 mile voxel)
  └─ Continent (60 mile hex)
      └─ Kingdom (6 mile hex)
          └─ Province (1 mile hex)
              └─ County (0.1 mile hex)
                  └─ Settlement (30ft hex)
                      └─ Building (10ft square)
                          └─ Room (5ft square combat grid)
                              └─ Object Detail (gridless interaction)
```

### Traversing the Hierarchy

```typescript
// Get all locations within a region
function getChildLocations(locationId: string, recursive: boolean = false): Location[] {
  const location = getLocation(locationId);
  const children = location.containment.childLocations?.map(id => getLocation(id)) || [];

  if (recursive) {
    return children.flatMap(child => [child, ...getChildLocations(child.id, true)]);
  }

  return children;
}

// Get the full path from world to specific location
function getLocationPath(locationId: string): Location[] {
  const path: Location[] = [];
  let current = getLocation(locationId);

  while (current) {
    path.unshift(current);
    current = current.containment.parentLocation
      ? getLocation(current.containment.parentLocation)
      : null;
  }

  return path;
}
```

## Multi-Resolution Support

Locations support multiple image resolutions for zoom levels (from VTT-IMAGE-SCALE-GUIDELINES.md):

```typescript
const innLocation: Location = {
  id: 'location-rusty-dragon-inn',
  name: 'The Rusty Dragon Inn',
  type: 'inn',
  scale: 'adventure',
  spatial: {
    gridType: 'square',
    dimensions: {
      width: 80,
      height: 60,
      unit: 'feet'
    }
  },
  visual: {
    availableResolutions: [
      {
        scale: 'combat',
        pixelsPerUnit: 12,           // 12 pixels per 5ft (60px/5ft square)
        imageUrl: '/tiles/inn-combat.png'
      },
      {
        scale: 'adventure',
        pixelsPerUnit: 3,            // 3 pixels per 10ft (30px/10ft square)
        imageUrl: '/tiles/inn-adventure.png'
      },
      {
        scale: 'settlement',
        pixelsPerUnit: 1,            // 1 pixel per 30ft hex
        imageUrl: '/tiles/inn-settlement.png'
      }
    ]
  }
};
```

## Integration Points

### With Activity System
Locations can:
- **Enable Activities**: Workshop enables crafting activities
- **Restrict Activities**: Can't craft without appropriate location
- **Modify Activities**: Inn provides better rest than wilderness

### With Event System
Locations can:
- **Trigger Events**: Entering trapped room triggers trap event
- **Prevent Events**: Shelter location prevents exposure events
- **Modify Events**: Difficult terrain modifies movement events

### With Creature System
Locations can:
- **Track Creatures**: List of creatures at each location
- **Affect Creatures**: Environmental effects at location
- **Restrict Creatures**: Some locations impassable to certain creatures

### With Object System
Locations can:
- **Contain Objects**: Items and objects exist at locations
- **Be Objects**: Buildings are objects that are also locations
- **Store Objects**: Locations provide storage facilities

## System-Specific Extensions

TTRPG systems should extend the core Location concept with system-specific properties:

### D&D 5e Extension Example
```typescript
interface DnD5eLocation extends Location {
  system: {
    "dnd5e": {
      // 5e-specific environmental properties
      terrain?: 'arctic' | 'coast' | 'desert' | 'forest' | 'grassland' | 'mountain' | 'swamp' | 'underdark';
      climate?: 'extreme_cold' | 'extreme_heat' | 'normal';
      hazards?: ('deep_water' | 'extreme_cold' | 'extreme_heat' | 'frigid_water' | 'heavy_precipitation' | 'high_altitude' | 'slippery_ice' | 'strong_wind' | 'thin_ice')[];
      lightLevel?: 'bright' | 'dim' | 'dark';
      difficultyClass?: number;    // DC for checks in this location
      magicLevel?: 'dead' | 'low' | 'normal' | 'high' | 'wild';
    }
  }
}
```

### Pathfinder 2e Extension Example
```typescript
interface Pathfinder2eLocation extends Location {
  system: {
    "pf2e": {
      // Pathfinder 2e-specific properties
      traits?: string[];           // Location traits
      level?: number;              // Location level for hazards
      rarity?: 'common' | 'uncommon' | 'rare' | 'unique';
    }
  }
}
```

## Implementation Guidelines

### For Core Concepts Module
1. Define base Location interface
2. Provide scale system from VTT guidelines
3. Establish containment hierarchy
4. Define multi-resolution support
5. Document integration with other concepts

### For System Modules (e.g., foundry-core-srd-5e)
1. Import core Location interface
2. Extend with system-specific environmental properties
3. Implement system-specific location types
4. Define system-specific hazards and effects
5. Create location data files for SRD locations

### For Campaign Modules (e.g., foundry-cfg-5e)
1. Import system locations
2. Add campaign-specific locations
3. Implement location tracking and navigation
4. Create UI for location management
5. Support worldographer import/export

## Usage Examples

### Creating a System-Agnostic Location
```typescript
const genericDungeon: Location = {
  id: 'location-forgotten-crypt',
  name: 'The Forgotten Crypt',
  description: 'An ancient underground tomb',
  type: 'dungeon',
  scale: 'adventure',
  spatial: {
    gridType: 'square',
    dimensions: {
      width: 200,
      height: 150,
      unit: 'feet'
    }
  },
  containment: {
    parentLocation: 'location-graveyard',
    childLocations: [
      'location-crypt-entrance',
      'location-crypt-main-hall',
      'location-crypt-tomb-chamber'
    ]
  },
  environment: {
    lighting: 'dark'
  }
};
```

### Extending for D&D 5e
```typescript
const dnd5eCrypt: DnD5eLocation = {
  ...genericDungeon,
  system: {
    "dnd5e": {
      terrain: 'underdark',
      lightLevel: 'dark',
      hazards: [],
      magicLevel: 'high'
    }
  }
};
```

## Related Core Concepts

- **[Activity](ACTIVITY.md)**: What creatures do at locations
- **[Event](EVENT.md)**: What happens at locations
- **[Boards](CORE-CONCEPTS.md#boards)**: Visual representation of locations
- **[Tiles](CORE-CONCEPTS.md#tiles)**: Visual components of locations
- **[Creatures](CORE-CONCEPTS.md#creatures)**: Entities present at locations
- **[Objects](CORE-CONCEPTS.md#objects)**: Items present at locations

## See Also

- Core guidelines: [CORE-CONCEPTS.md](CORE-CONCEPTS.md)
- Scale system: [VTT-IMAGE-SCALE-GUIDELINES.md](VTT-IMAGE-SCALE-GUIDELINES.md)
- System implementations: `foundry-core-srd-5e/docs/LOCATION-SYSTEM.md`
- Tile system: `foundry-core-srd-5e/docs/TILE-LOCATION-SYSTEM.md`
- Campaign implementations: `foundry-cfg-5e/docs/LOCATION-TRACKING.md`
