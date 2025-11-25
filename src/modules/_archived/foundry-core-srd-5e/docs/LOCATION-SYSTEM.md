# Location System for foundry-core-srd-5e

## Overview

The foundry-core-srd-5e module provides **minimal location support** by leveraging Foundry VTT's native Scene and Journal Entry systems. This document defines the lightweight integration layer that unifies location concepts for D&D 5e without duplicating Foundry's built-in functionality.

## Design Philosophy

**Core SRD Module**: Lightweight, standards-based integration
- Use Foundry VTT's Scene system for maps/tiles
- Use Foundry VTT's Journal Entries for narrative content
- Use Foundry VTT's pins/notes for location markers
- Define minimal 5e-specific metadata only

**Future cfg-5e Module**: Extended functionality, campaign-specific features
- Advanced location features
- World-building tools
- Custom scale management
- Multi-scale tile rendering per [VTTImageScaleGuidelines.md](../../docs/VTTImageScaleGuidelines.md)

## Foundry VTT Native Systems

### 1. Scenes (Maps/Battlemaps)
Foundry's Scene system provides:
- Grid configuration (square/hex)
- Tile/background images
- Lighting and walls
- **Tokens** - Actor instances on the scene
- **Tiles** - Static/animated images, can represent objects
- Pins/notes for locations

**Tokens on Scene** - Foundry natively tracks:
```javascript
scene.tokens // Collection of TokenDocument instances
scene.tokens.forEach(token => {
  token.actor // Reference to Actor (creature)
  token.x, token.y // Position on scene
  token.hidden // Visibility
});
```

### 2. Journal Entries
Foundry's Journal system provides:
- Hierarchical organization (folders)
- Rich text content
- Image embedding
- Links to other documents

### 3. Pins/Notes
Foundry's Pin system provides:
- Map markers on scenes
- Links to journal entries
- Icons and tooltips
- Visibility controls

### 4. Items as Scene Objects
Foundry doesn't natively place Items on scenes, but we can track them:
- Via flags on the Scene document
- Via Journal Entry references
- Via Tile documents representing objects
- Via Token documents with attached items

## SRD Module Integration

### Location Metadata in Journal Entries

Add minimal 5e-specific metadata to journal entries via flags:

```json
{
  "name": "Waterdeep",
  "content": "<p>The City of Splendors...</p>",
  "folder": "settlements",
  "flags": {
    "foundry-core-srd-5e": {
      "location": {
        "type": "settlement",
        "subtype": "city",
        "scale": "settlement",
        "climate": "temperate",
        "terrain": "coastal",
        "population": 130000
      }
    }
  }
}
```

### Scene Metadata for Scale Integration

Add scale information to scenes for multi-resolution rendering:

```json
{
  "name": "Waterdeep - Settlement View",
  "grid": {
    "type": 1,  // Hex grid
    "size": 30  // 30ft per hex
  },
  "flags": {
    "foundry-core-srd-5e": {
      "scale": {
        "level": "settlement",
        "hexSize": "30ft",
        "pixelRatio": "1ft/pixel",
        "tileDimensions": "34x30"
      }
    }
  }
}
```

## Location Types

Based on VTT Image Scale Guidelines, define standard location types:

### Scale Hierarchy

```
world
├── continent
│   ├── kingdom
│   │   ├── province
│   │   │   ├── county
│   │   │   │   ├── settlement (city/town/village)
│   │   │   │   │   ├── location (building/dungeon/POI)
│   │   │   │   │   │   └── area (room/chamber)
│   │   │   │   └── wilderness
│   │   │   └── geographic_feature
│   │   └── sea
│   └── ocean
└── plane
```

### Location Type Definitions

| Type | Description | Scale Level | Grid Type |
|------|-------------|-------------|-----------|
| `world` | Planet/setting | World Overview | Hex |
| `continent` | Landmass | Continental | Hex |
| `ocean` | Large body of water | Continental | Hex |
| `kingdom` | Nation/realm | Kingdom | Hex |
| `sea` | Gulf/large sea | Kingdom | Hex |
| `province` | Large region | Province | Hex |
| `county` | Small region | County | Hex |
| `settlement` | City/town/village | Settlement | Hex |
| `wilderness` | Forest/mountain/desert | Settlement/County | Hex |
| `geographic_feature` | Mountain/river/lake | Varies | Hex |
| `location` | Building/dungeon/POI | Adventure Location | Square |
| `area` | Room/chamber | Combat/Interaction | Square |
| `encounter` | Combat area | Combat | Square |
| `plane` | Plane of existence | N/A | N/A |

## Environmental Properties (from SRD)

Reference: [Gameplay Toolbox - Environmental Effects](../../data/5e/srd/split/gameplaytoolbox/03-EnvironmentalEffects.md)

Standard environmental properties from SRD:

```json
{
  "environment": {
    "climate": "temperate|cold|hot|arctic|tropical",
    "terrain": "coastal|mountain|forest|desert|plains|swamp|underground",
    "weather": "clear|precipitation|wind|extreme_cold|extreme_heat",
    "hazards": ["deep_water", "frigid_water", "slippery_ice", "thin_ice"],
    "altitude": "sea_level|high_altitude"
  }
}
```

### Environmental Effects to Track

From SRD Gameplay Toolbox (p195):
- **Deep Water**: DC 10 CON save per hour or gain Exhaustion
- **Extreme Cold** (≤0°F): DC 10 CON save per hour or gain Exhaustion
- **Extreme Heat** (≥100°F): DC 5+ CON save per hour or gain Exhaustion
- **Frigid Water**: CON score in minutes, then DC 10 CON save per minute
- **Heavy Precipitation**: Lightly Obscured, Disadvantage on Perception
- **High Altitude** (≥10,000ft): Counts as 2 hours travel per hour
- **Slippery Ice**: Difficult Terrain, DC 10 DEX save or Prone
- **Strong Wind**: Disadvantage on ranged attacks, extinguishes flames
- **Thin Ice**: 3d10 × 10 lbs weight tolerance per 10ft square

## Minimal Schema

### Journal Entry Flags

```typescript
interface SRDLocationFlags {
  "foundry-core-srd-5e": {
    location: {
      type: LocationType;           // Required
      subtype?: string;              // Optional (city, town, village, etc.)
      scale: ScaleLevel;             // Required for scene integration
      climate?: Climate;             // Optional environmental
      terrain?: Terrain;             // Optional environmental
      population?: number;           // Optional for settlements
      hazards?: EnvironmentalHazard[]; // Optional SRD hazards

      // Containment relationships
      parentLocation?: string;       // UUID of parent location/scene
      childLocations?: string[];     // UUIDs of contained locations/scenes
      creatures?: string[];          // UUIDs of creatures present (Actor references)
      items?: string[];              // UUIDs of items present (Item references)
    }
  }
}

type LocationType =
  | "world" | "continent" | "ocean"
  | "kingdom" | "sea"
  | "province" | "county"
  | "settlement" | "wilderness" | "geographic_feature"
  | "location" | "area" | "encounter" | "plane";

type ScaleLevel =
  | "world" | "continent" | "kingdom" | "province" | "county"
  | "settlement" | "adventure" | "combat" | "interaction";

type Climate = "temperate" | "cold" | "hot" | "arctic" | "tropical";
type Terrain = "coastal" | "mountain" | "forest" | "desert" | "plains" | "swamp" | "underground";
type EnvironmentalHazard = "deep_water" | "extreme_cold" | "extreme_heat" | "frigid_water"
  | "heavy_precipitation" | "high_altitude" | "slippery_ice" | "strong_wind" | "thin_ice";
```

### Scene Flags

```typescript
interface SRDScaleFlags {
  "foundry-core-srd-5e": {
    scale: {
      level: ScaleLevel;              // Required
      hexSize?: string;               // For hex grids: "30ft", "1 mile", etc.
      squareSize?: string;            // For square grids: "5ft", "10ft"
      pixelRatio: string;             // "1ft/pixel", "10ft/pixel", etc.
      tileDimensions?: string;        // "34x30", "610x528", etc.
    }
  }
}
```

## Implementation Notes

### For SRD Module

1. **Define TypeScript interfaces** for location/scale flags
2. **Add helper functions** to set/get location metadata
3. **Provide constants** for valid types, scales, climates, terrains, hazards
4. **Document environmental effects** from SRD Gameplay Toolbox
5. **NO custom UI** - use Foundry's native editors
6. **NO scene rendering** - use Foundry's native scene system
7. **NO tile management** - defer to cfg-5e module

### For Future cfg-5e Module

1. **Multi-scale tile rendering** per VTTImageScaleGuidelines.md
2. **Automatic zoom level switching** with resolution loading
3. **Hierarchical location browser**
4. **Location-based encounter tables**
5. **Environmental hazard automation**
6. **Travel time calculation**
7. **World-building UI tools**

## Example Usage

### Creating a Settlement Journal Entry

```javascript
// Use Foundry's native JournalEntry.create()
const waterdeep = await JournalEntry.create({
  name: "Waterdeep",
  content: "<h1>Waterdeep - The City of Splendors</h1><p>...</p>",
  folder: "settlements",
  flags: {
    "foundry-core-srd-5e": {
      location: {
        type: "settlement",
        subtype: "city",
        scale: "settlement",
        climate: "temperate",
        terrain: "coastal",
        population: 130000
      }
    }
  }
});
```

### Creating a Settlement Scene

```javascript
// Use Foundry's native Scene.create()
const waterdeepMap = await Scene.create({
  name: "Waterdeep - Settlement View",
  width: 4000,
  height: 4000,
  grid: {
    type: 1,  // CONST.GRID_TYPES.HEXODDR
    size: 34  // 34 pixels = 30ft hex at 1ft/pixel
  },
  background: {
    src: "tiles/settlement/waterdeep-30ft-hex.webp"
  },
  flags: {
    "foundry-core-srd-5e": {
      scale: {
        level: "settlement",
        hexSize: "30ft",
        pixelRatio: "1ft/pixel",
        tileDimensions: "34x30"
      }
    }
  }
});
```

### Adding Environmental Hazards

```javascript
// Add hazards to a journal entry
await location.setFlag("foundry-core-srd-5e", "location.hazards", [
  "extreme_cold",
  "slippery_ice"
]);

// Future cfg-5e module can read these and apply automatic effects
```

### Tracking Containment Relationships

```javascript
// Create a dungeon location
const dungeon = await JournalEntry.create({
  name: "Tomb of Horrors - Level 1",
  content: "<p>The entrance hall...</p>",
  flags: {
    "foundry-core-srd-5e": {
      location: {
        type: "location",
        subtype: "dungeon",
        scale: "adventure",
        parentLocation: "Scene.xyz123", // UUID of the region scene
        childLocations: [], // Will contain room UUIDs
        creatures: [],      // Will be populated from scene tokens
        items: []           // Loot/objects present
      }
    }
  }
});

// Create a scene for this location
const dungeonScene = await Scene.create({
  name: "Tomb of Horrors - Level 1",
  journal: dungeon.id, // Link back to journal entry
  grid: { type: 1, size: 30 }, // 10ft squares at 30px
  flags: {
    "foundry-core-srd-5e": {
      scale: {
        level: "adventure",
        squareSize: "10ft",
        pixelRatio: "4in/pixel"
      }
    }
  }
});

// Add creatures to the scene (Foundry native)
const skeleton = await Actor.create({
  name: "Skeleton Guard",
  type: "npc"
});
const skeletonToken = await dungeonScene.createEmbeddedDocuments("Token", [{
  name: "Skeleton Guard",
  actorId: skeleton.id,
  x: 100,
  y: 100
}]);

// Track the creature in location metadata (optional redundancy)
await dungeon.setFlag("foundry-core-srd-5e", "location.creatures", [
  skeleton.uuid
]);

// Add items to location (tracked in flags since no native placement)
const sword = await Item.create({
  name: "Rusty Longsword",
  type: "weapon"
});
await dungeon.setFlag("foundry-core-srd-5e", "location.items", [
  sword.uuid
]);

// Create child location (specific room)
const throneRoom = await JournalEntry.create({
  name: "Throne Room",
  content: "<p>A dusty throne sits...</p>",
  flags: {
    "foundry-core-srd-5e": {
      location: {
        type: "area",
        subtype: "room",
        scale: "combat",
        parentLocation: dungeon.uuid, // Parent is the dungeon
        creatures: [], // Specific creatures in this room
        items: []
      }
    }
  }
});

// Update parent to reference child
const currentChildren = dungeon.getFlag("foundry-core-srd-5e", "location.childLocations") || [];
await dungeon.setFlag("foundry-core-srd-5e", "location.childLocations", [
  ...currentChildren,
  throneRoom.uuid
]);
```

### Querying Location Contents

```javascript
// Helper function to get all creatures in a location
async function getLocationCreatures(location) {
  const creatureUUIDs = location.getFlag("foundry-core-srd-5e", "location.creatures") || [];
  const creatures = await Promise.all(
    creatureUUIDs.map(uuid => fromUuid(uuid))
  );
  return creatures.filter(c => c); // Filter out any null/undefined
}

// Helper function to get all items in a location
async function getLocationItems(location) {
  const itemUUIDs = location.getFlag("foundry-core-srd-5e", "location.items") || [];
  const items = await Promise.all(
    itemUUIDs.map(uuid => fromUuid(uuid))
  );
  return items.filter(i => i);
}

// Helper function to get all child locations
async function getChildLocations(location) {
  const childUUIDs = location.getFlag("foundry-core-srd-5e", "location.childLocations") || [];
  const children = await Promise.all(
    childUUIDs.map(uuid => fromUuid(uuid))
  );
  return children.filter(c => c);
}

// Usage
const dungeon = game.journal.getName("Tomb of Horrors - Level 1");
const creatures = await getLocationCreatures(dungeon);
const items = await getLocationItems(dungeon);
const rooms = await getChildLocations(dungeon);

console.log(`${dungeon.name} contains:`);
console.log(`- ${creatures.length} creatures`);
console.log(`- ${items.length} items`);
console.log(`- ${rooms.length} sub-locations`);
```

### Scene Token Integration

```javascript
// When a token is added to a scene, optionally track it in the location
Hooks.on("createToken", async (tokenDocument, options, userId) => {
  const scene = tokenDocument.parent;
  const journalEntry = scene.journal; // If scene is linked to journal

  if (journalEntry && tokenDocument.actor) {
    const creatures = journalEntry.getFlag("foundry-core-srd-5e", "location.creatures") || [];
    if (!creatures.includes(tokenDocument.actor.uuid)) {
      await journalEntry.setFlag("foundry-core-srd-5e", "location.creatures", [
        ...creatures,
        tokenDocument.actor.uuid
      ]);
    }
  }
});

// When a token is removed, remove from tracking
Hooks.on("deleteToken", async (tokenDocument, options, userId) => {
  const scene = tokenDocument.parent;
  const journalEntry = scene.journal;

  if (journalEntry && tokenDocument.actor) {
    const creatures = journalEntry.getFlag("foundry-core-srd-5e", "location.creatures") || [];
    const updated = creatures.filter(uuid => uuid !== tokenDocument.actor.uuid);
    await journalEntry.setFlag("foundry-core-srd-5e", "location.creatures", updated);
  }
});
```

## Compatibility

This minimal approach ensures:
- **Foundry VTT compatibility** - Uses native document types
- **Module interoperability** - Standard flags namespace
- **Future extensibility** - Can be enhanced without breaking changes
- **No duplication** - Leverages Foundry's robust systems
- **Standards compliance** - Follows SRD environmental rules

## References

- [VTTImageScaleGuidelines.md](../../docs/VTTImageScaleGuidelines.md) - Multi-scale tile rendering specifications
- [SRD Gameplay Toolbox - Environmental Effects](../../data/5e/srd/split/gameplaytoolbox/03-EnvironmentalEffects.md) - Official environmental hazard rules
- Foundry VTT Scene Documentation: https://foundryvtt.com/api/Scene.html
- Foundry VTT Journal Documentation: https://foundryvtt.com/api/JournalEntry.html
