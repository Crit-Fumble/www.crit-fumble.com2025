# Multiverse System Architecture

**Purpose:** Define the database structure and relationships for managing universes, worlds, locations, maps, and FoundryVTT world generation.

**Last Updated:** November 24, 2024

---

## Overview

The Multiverse system allows admins (and future worldbuilders) to create hierarchical worlds at any scale. Worlds exist at any VTT scale from Universe (space opera campaigns) down to Interaction (card game on a tavern table).

### Key Concepts

**World = Playable Space:** An RpgWorld is a self-contained playable space at any scale, linked to an RpgSystem, containing locations where gameplay occurs.

**Universe:** A top-level RpgWorld (`containerWorldId: null`) that contains other worlds. Players can "world leap" between worlds within the same universe.

**World Leaping:** When players want to play a different game or reach the bounds of their current world, they perform a "world leap" - selecting a destination world within the same universe. They play as a character using that world's RpgSystem and rules.

**World Nesting:** Worlds can be nested conceptually for organization (e.g., Universe → Galaxy → Star System → Planet → Continent). Each world can have its own RpgSystem, rules, and restrictions defined by the worldbuilder.

**Scale Flexibility:**
- Universe scale: Entire space opera campaign with multiple star systems
- Planet scale: Single planet with multiple continents
- Building scale: Single dungeon or structure
- Interaction scale: Card game, chess board, or mini-game within a tavern

**Templates with RpgBoard:** Location templates with generation rules driven by game system. Worldbuilders reuse board templates when building worlds.

**Maps with RpgCard:** Reusable map sections (rooms, corridors, terrain) that can be composed into larger maps.

**Instances with RpgSheet:** Specific instances of a location within a world. RpgBoards/RpgCards define "default" templates; RpgSheets define specific placements.

**Inside-Out vs Outside-In:**
- **Inside-Out:** Start with a small location (e.g., tavern) and expand outward, placing the tavern in a town, town in a region, etc.
- **Outside-In:** Start at universe/world scale and zoom in, creating locations hierarchically.

---

## Database Models

### Core Concept: Worlds All The Way Down

**Key Insight:** A "Universe" is just a top-level RpgWorld without a parent. Worlds can contain other worlds at any scale. This eliminates the need for a separate RpgUniverse model.

### Existing Models (Use As-Is)

#### 1. **RpgWorld**
- **Purpose:** A playable game space at any VTT scale (Universe → Interaction)
- **Universe = RpgWorld with `containerWorldId: null`**
- **Key Fields:**
  - `name`, `description`, `systemName` (e.g., "dnd5e")
  - `worldScale` - VTT scale (Interaction → Universe)
  - `ownerId` - Who created this world
  - `containerWorldId` - **NEW:** Parent world (null for universes)
  - `foundryWorldId` - Link to FoundryVTT instance
  - `settings`, `metadata`, `tags`

- **Relations:**
  - `containerWorld` - **NEW:** Parent world (conceptual organization)
  - `containedWorlds[]` - **NEW:** Child worlds (e.g., universe contains worlds players can "world leap" to)
  - `locations[]` - Locations in this world (must have at least one)
  - `creatures[]`, `activities[]`, `campaigns[]`, `assets[]`

- **Important:**
  - Each world is linked to an **RpgSystem** (via systemName)
  - Each world contains at least one **RpgLocation** (where gameplay occurs)
  - Worldbuilders define rules/restrictions per world
  - Players "world leap" between sibling worlds within the same universe

**Example 1: Fantasy Universe with World Leaping**
```
Universe: "Forgotten Realms" (systemName: "dnd5e", containerWorldId: null, worldScale: "Universe")
  ├─ World: "Toril" (systemName: "dnd5e", containerWorldId: Forgotten Realms, worldScale: "Realm")
  │   └─ Location: "Waterdeep" (locationScale: "Settlement")
  ├─ World: "Sigil" (systemName: "dnd5e-planar", containerWorldId: Forgotten Realms, worldScale: "Settlement")
  │   └─ Location: "Lady's Ward" (locationScale: "County")
  └─ World: "Undermountain" (systemName: "dnd5e", containerWorldId: Forgotten Realms, worldScale: "Building")
      └─ Location: "Level 1" (locationScale: "Building")
```
Players can "world leap" between Toril, Sigil, and Undermountain within the Forgotten Realms universe.

**Example 2: Space Opera Universe**
```
Universe: "Star Wars Galaxy" (systemName: "sw5e", containerWorldId: null, worldScale: "Universe")
  ├─ World: "Core Worlds" (systemName: "sw5e", worldScale: "Galactic Arm")
  ├─ World: "Tatooine" (systemName: "sw5e", worldScale: "Planet")
  └─ World: "Death Star Interior" (systemName: "sw5e", worldScale: "Building")
```

**Example 3: Tavern Mini-Game**
```
Universe: "Baldur's Gate Campaign" (systemName: "dnd5e", worldScale: "Realm")
  └─ World: "Card Game at Elfsong Tavern" (systemName: "three-dragon-ante", worldScale: "Interaction")
      └─ Location: "Card Table" (locationScale: "Interaction")
```

#### 2. **RpgLocation**
- **Purpose:** A place within a world at any VTT scale
- **Key Fields:**
  - `name`, `title`, `description`
  - `locationType` - "tavern", "cave", "city", "dungeon_room", etc.
  - `locationScale` - VTT scale (Arena → Universe)
  - `parentLocationId` - Hierarchical parent
  - `worldId` - World reference
  - `boardTemplateId` - **NEW:** RpgBoard template for generation
  - `mapCardIds` - **NEW:** Array of RpgCard IDs for map sections
  - `npcGenerationRules`, `lootGenerationRules`, `encounterRules`

- **Relations:**
  - `parentLocation`, `childLocations[]` - Hierarchy
  - `world` - Owning world
  - `boardTemplate` - **NEW:** Generation template
  - Map cards referenced by IDs in `mapCardIds` JSON

#### 3. **RpgBoard** (Repurposed for Templates)
- **Purpose:** Templates with generation rules for location types
- **Data-Driven:** Rules defined by game system (dnd5e, cypher, etc.)
- **Key Fields:**
  - `name`, `description` - e.g., "D&D 5e Tavern Template"
  - `metadata` - **Contains generation rules:**
    ```json
    {
      "generationRules": {
        "roomLayout": { "minRooms": 3, "maxRooms": 7, "patterns": ["rectangular", "irregular"] },
        "wallDensity": 0.3,
        "doorPlacement": { "minDoors": 1, "maxDoors": 3 },
        "furniture": { "tables": [2,5], "chairs": [4,12], "bar": 1 },
        "enemies": { "spawnPoints": 3, "difficultyRange": [1,5] },
        "loot": { "treasureChests": [0,2], "hiddenStash": 0.2 },
        "npcs": { "barkeep": 1, "patrons": [3,8] }
      }
    }
    ```

- **Usage:**
  - Create system-specific templates (D&D 5e Tavern vs Cypher System Tavern)
  - When creating RpgLocation with locationType "tavern", select template
  - System generates location based on template rules

#### 4. **RpgCard** (Expanded for Map Sections)
- **Purpose:** Reusable map sections (rooms, corridors, terrain features)
- **Card Type:** "location", "terrain", "structure"
- **Key Fields:**
  - `name`, `title`, `description` - e.g., "Tavern Common Room"
  - `cardType` - "location"
  - `properties` - **Contains map data:**
    ```json
    {
      "mapData": {
        "gridWidth": 20,
        "gridHeight": 15,
        "scale": "Arena",
        "gridType": "square",
        "tiles": [
          ["tile-floor-001", "tile-floor-001", ...],
          ["tile-floor-001", "tile-wall-001", ...]
        ],
        "layers": {
          "base": [[...]],
          "decoration": [[...]],
          "walls": [[...]]
        },
        "doors": [{"x": 10, "y": 0, "direction": "north"}],
        "lighting": [{"x": 5, "y": 5, "radius": 10, "intensity": 0.8}],
        "embeddedCards": [
          {"cardId": "furniture-table-001", "x": 8, "y": 7, "rotation": 90}
        ]
      }
    }
    ```
  - `imageUrl` - Preview image
  - `systemName` - System compatibility

- **Usage:**
  - Create "House Interior" card with pre-made tile layout
  - Create "Cave Entrance" card with rocky terrain
  - Compose larger maps by combining multiple cards
  - Store in RpgDeck collections by theme ("Inn Rooms", "Dungeon Corridors")

#### 5. **RpgSheet** (Instances of Locations)
- **Purpose:** Specific instance of a location within a world (actual gameplay space)
- **Relationship to Board/Card:**
  - **RpgBoard**: Template definition with generation rules (e.g., "D&D 5e Tavern Template")
  - **RpgCard**: Reusable map section (e.g., "Tavern Common Room 20x15 grid")
  - **RpgSheet**: Specific instance in a world (e.g., "Yawning Portal Inn in Waterdeep")

- **Worldbuilder Workflow:**
  1. Select RpgBoard template for location type
  2. Select RpgCard(s) for map layout
  3. Generate RpgSheet instance in world
  4. Customize specific placement of creatures, things, activities

- **Reusability:**
  - Worldbuilders reuse **RpgBoards** and **RpgCards** when building worlds
  - Each world has its own **RpgSheets** (unique instances)
  - Multiple worlds can reference the same template/cards but have different instances

**Example:**
```
RpgBoard: "D&D 5e Tavern Template" (generation rules)
  └─ Used by RpgLocation: "The Prancing Pony"
      └─ RpgCard: "Tavern Common Room" (20x15 grid)
      └─ RpgCard: "Kitchen" (10x10 grid)
      └─ RpgCard: "Cellar" (15x15 grid with stairs)
          └─ RpgSheet: Instance in "Middle Earth" world
              - Barkeep NPC: "Barliman Butterbur"
              - Patrons: 5 hobbit NPCs
              - Quest trigger: Meet Gandalf
```

#### 6-9. **Other Models**
- **RpgCreature** - Monsters, NPCs (placed via templates or manually in sheets)
- **RpgThing** - Items, furniture, doors (placed via templates or manually in sheets)
- **RpgActivity** - Quests, encounters (triggered at locations/sheets)
- **RpgAsset** - Media files (tiles, images, audio, video)
- **RpgTile** - Multi-scale tile definitions (used by RpgCard grids)

---

## Model Updates Needed

### Update: **RpgWorld**
Add world nesting:

```prisma
// Add to RpgWorld model
containerWorldId String?    @map("container_world_id")
containerWorld   RpgWorld?  @relation("WorldNesting", fields: [containerWorldId], references: [id], onDelete: SetNull)
containedWorlds  RpgWorld[] @relation("WorldNesting")

@@index([containerWorldId])
```

### Update: **RpgLocation**
Add template and map card references:

```prisma
// Add to RpgLocation model
boardTemplateId String?   @map("board_template_id")
boardTemplate   RpgBoard? @relation("LocationTemplate", fields: [boardTemplateId], references: [id], onDelete: SetNull)

// Map cards (composable map sections)
mapCardIds Json @default("[]") @map("map_card_ids") @db.JsonB // Array of RpgCard IDs

@@index([boardTemplateId])
```

### Update: **RpgBoard**
Add relation for locations using this template:

```prisma
// Add to RpgBoard model
locations RpgLocation[] @relation("LocationTemplate")
```

---

## Removed Models (Not Needed!)

- ~~**RpgUniverse**~~ → Just use RpgWorld with `containerWorldId: null`
- ~~**RpgTilemap**~~ → Use RpgCard with cardType "location"
- ~~**RpgLocationPlacement**~~ → Use RpgBoard generation rules and RpgCard embeddedCards

---

## Data Flow Examples

### Example 1: Inside-Out Approach (Start with Tavern)

**Step 1: Create Tavern Location**
```typescript
// Create "Yawning Portal Inn" location
const tavern = await prisma.rpgLocation.create({
  data: {
    name: "Yawning Portal Inn",
    locationType: "tavern",
    locationScale: "Arena",  // 5ft grid
    worldId: null,  // Not yet placed in a world
    boardTemplateId: "template-dnd5e-tavern",  // Use D&D 5e tavern template
    mapCardIds: ["card-tavern-common-room", "card-tavern-kitchen"]
  }
});
```

**Step 2: Generate from Template**
System reads RpgBoard template and generates:
- Room layout with bar, tables, stairs
- NPCs (barkeep, patrons)
- Furniture placement
- Lighting sources
- Potential encounters

**Step 3: Expand Outward**
```typescript
// Create "Waterdeep Dock Ward" and place tavern inside
const dockWard = await prisma.rpgLocation.create({
  data: {
    name: "Dock Ward",
    locationType: "district",
    locationScale: "County",  // 0.1 mile hex
    parentLocationId: null,
    worldId: null
  }
});

// Place tavern in Dock Ward
await prisma.rpgLocation.update({
  where: { id: tavern.id },
  data: { parentLocationId: dockWard.id }
});
```

**Step 4: Create Containing World**
```typescript
// Create "Toril" world and place Dock Ward inside
const toril = await prisma.rpgWorld.create({
  data: {
    name: "Toril",
    systemName: "dnd5e",
    worldScale: "Realm",
    containerWorldId: null  // This is a top-level world (universe)
  }
});

await prisma.rpgLocation.update({
  where: { id: dockWard.id },
  data: { worldId: toril.id }
});
```

---

### Example 2: Outside-In Approach (Start with Planet)

**Step 1: Create Universe**
```typescript
const forgottenRealms = await prisma.rpgWorld.create({
  data: {
    name: "Forgotten Realms",
    systemName: "dnd5e",
    worldScale: "Universe",
    containerWorldId: null  // Top-level universe
  }
});
```

**Step 2: Create Planet Inside Universe**
```typescript
const toril = await prisma.rpgWorld.create({
  data: {
    name: "Toril",
    systemName: "dnd5e",
    worldScale: "Realm",
    containerWorldId: forgottenRealms.id
  }
});
```

**Step 3: Create Continent Location**
```typescript
const faerun = await prisma.rpgLocation.create({
  data: {
    name: "Faerûn",
    locationType: "continent",
    locationScale: "Continent",  // 60 mile hex
    worldId: toril.id
  }
});
```

**Step 4: Zoom In with Locations**
Create Kingdom → Province → County → Settlement → Building → Arena scale locations, each as child of previous.

---

## Workflow: From Template to FoundryVTT

### 1. Create Location from Template
```typescript
// Admin creates tavern using template
const location = await prisma.rpgLocation.create({
  data: {
    name: "The Prancing Pony",
    locationType: "tavern",
    locationScale: "Arena",
    worldId: "world-middle-earth",
    boardTemplateId: "template-dnd5e-tavern",
    mapCardIds: ["card-common-room", "card-kitchen", "card-cellar"]
  }
});
```

### 2. System Generates Content
Based on RpgBoard template rules:
- Generate room layout from patterns
- Place doors/windows according to rules
- Spawn NPCs (barkeep, patrons) from encounter tables
- Place furniture (tables, chairs, bar)
- Add lighting sources
- Generate loot (hidden stash probability 20%)

### 3. Compose Map from Cards
Load RpgCards and combine:
- "Common Room" card (20x15 grid)
- "Kitchen" card (10x10 grid)
- "Cellar" card (15x15 grid with stairs)

Each card contains:
- Tile grid (RpgTile IDs)
- Embedded cards (furniture)
- Lighting data
- Door/window positions

### 4. Export to FoundryVTT
```typescript
// Generate FoundryVTT snapshot
const snapshot = await generateFoundrySnapshot(worldId);

// Snapshot includes:
// - Each RpgLocation → Foundry Scene
// - Each RpgCard tile grid → Scene background image
// - Each RpgCreature → Foundry Actor (token on scene)
// - Each RpgThing → Foundry Item
// - Each RpgActivity → Foundry JournalEntry

await prisma.foundryWorldSnapshot.create({
  data: {
    worldId,
    foundryWorldId: "foundry-world-123",
    foundrySystemId: "dnd5e",
    snapshotData: snapshot
  }
});
```

---

## World Leaping Mechanics (Future Development)

**Concept:** When players reach the bounds of their current world or want to play a different game, they perform a "world leap" to another world within the same universe.

### World Leap Flow

1. **Trigger World Leap:**
   - Player reaches world boundary (e.g., travels beyond map edge)
   - Player uses portal/gate/teleportation
   - Player initiates manual world leap via UI

2. **World Selection:**
   - Display available worlds within current universe
   - Filter by RpgSystem compatibility
   - Show world rules/restrictions set by worldbuilder
   - Preview world details (scale, locations, system)

3. **Character Transition:**
   - Player selects character (or creates new one)
   - Character must be compatible with target world's RpgSystem
   - Apply world-specific rules/restrictions
   - Set spawn location in target world

4. **System Transition:**
   - Switch from current RpgSystem to target world's RpgSystem
   - Load appropriate UI/mechanics for new system
   - Initialize board/sheet for starting location
   - Notify other players if multiplayer

### Data Requirements

**World Boundary Detection:**
```typescript
// RpgWorld metadata
{
  "boundaryBehavior": "world-leap", // or "hard-stop", "wrap-around"
  "allowedDestinations": ["world-id-1", "world-id-2"], // null = all sibling worlds
  "requiredItems": ["portal-key"], // null = no requirements
  "transitionAnimation": "portal-effect" // visual effect
}
```

**World Leap Restrictions:**
```typescript
// RpgWorld settings
{
  "leapRestrictions": {
    "characterLevel": { "min": 1, "max": 20 },
    "allowedClasses": ["fighter", "wizard"], // null = all
    "allowedRaces": ["human", "elf"], // null = all
    "requiredAchievements": ["quest-1-complete"]
  }
}
```

### Implementation Notes

- World leaping will be developed after core worldbuilding tools
- Focus now: Data structure and conceptual organization
- Each world should be self-contained and playable independently
- Universe serves as container for related worlds
- GM can control which worlds are accessible and when

---

## API Endpoints Needed

### Worlds (Universes)
- `POST /api/multiverse/worlds` - Create world/universe
- `GET /api/multiverse/worlds` - List worlds (query: isUniverse=true for top-level)
- `GET /api/multiverse/worlds/:id` - Get world details + contained worlds
- `PATCH /api/multiverse/worlds/:id` - Update world
- `DELETE /api/multiverse/worlds/:id` - Delete world

### Locations
- `POST /api/multiverse/locations` - Create location
- `GET /api/multiverse/locations` - List locations (with hierarchy query)
- `GET /api/multiverse/locations/:id` - Get location details
- `POST /api/multiverse/locations/:id/generate` - Generate from template
- `PATCH /api/multiverse/locations/:id` - Update location
- `DELETE /api/multiverse/locations/:id` - Delete location

### Templates (RpgBoard)
- `POST /api/multiverse/templates` - Create template
- `GET /api/multiverse/templates` - List templates (filter by system, locationType)
- `GET /api/multiverse/templates/:id` - Get template details
- `PATCH /api/multiverse/templates/:id` - Update template
- `DELETE /api/multiverse/templates/:id` - Delete template

### Map Cards (RpgCard)
- `POST /api/multiverse/cards` - Create map card
- `GET /api/multiverse/cards` - List cards (filter by cardType, systemName)
- `GET /api/multiverse/cards/:id` - Get card details
- `PATCH /api/multiverse/cards/:id` - Update card
- `DELETE /api/multiverse/cards/:id` - Delete card

### Export
- `POST /api/multiverse/worlds/:id/export` - Generate FoundryVTT snapshot
- `GET /api/multiverse/worlds/:id/snapshot` - Get latest snapshot
- `POST /api/multiverse/worlds/:id/sync` - Sync changes to existing snapshot

---

## UI Components Needed

### 1. **World/Universe Manager**
- Tree view of nested worlds
- Create top-level universe or nested world
- Set scale, system, metadata

### 2. **Location Hierarchy Tree**
- Nested location view
- Drag-and-drop to reorganize
- Breadcrumb navigation
- Click to edit

### 3. **Template Library**
- Browse RpgBoard templates by system and type
- Preview generation rules
- Create/edit/duplicate templates
- Test generation

### 4. **Map Card Library**
- Browse RpgCard map sections
- Visual preview of tile grids
- Create/edit cards with tile editor
- Organize in RpgDeck collections

### 5. **Location Editor**
- Select template
- Compose map from cards
- Override generated content
- Place additional creatures/things
- Preview final result

### 6. **Export Dialog**
- Preview FoundryVTT snapshot structure
- Configure export options
- Download or push to instance

---

## Summary

**Simplified Architecture:**
- **No RpgUniverse** - Just RpgWorld with nesting
- **No RpgTilemap** - Use RpgCard for map sections
- **No RpgLocationPlacement** - Use RpgBoard generation rules and RpgSheet instances
- **World = Playable Space** - Self-contained at any scale (Universe → Interaction)
- **World Nesting** - Organize worlds conceptually within universes
- **World Leaping** - Players transition between sibling worlds in same universe
- **Templates** - RpgBoard with system-specific generation rules (reusable)
- **Composable Maps** - RpgCard sections combined into locations (reusable)
- **Instances** - RpgSheet represents specific location instance in a world (unique per world)

**Key Benefits:**
- ✅ Reuse existing models (RpgWorld, RpgBoard, RpgCard, RpgSheet, RpgLocation)
- ✅ Data-driven by game system (RpgSystem via systemName)
- ✅ Composable map sections (worldbuilders reuse boards/cards)
- ✅ Template-based generation (create once, use many times)
- ✅ Inside-out or outside-in workflows
- ✅ World leaping between different game systems/worlds
- ✅ Scale flexibility (universe to interaction)
- ✅ Clean export to FoundryVTT

**Core Relationships:**
- **RpgWorld** → Contains RpgLocations, links to RpgSystem
- **RpgLocation** → Uses RpgBoard template, references RpgCard sections
- **RpgBoard** → Defines generation rules (reusable template)
- **RpgCard** → Defines map sections with tile grids (reusable)
- **RpgSheet** → Specific instance of location in world (unique)
- **Universe** → Container for worlds players can "world leap" between

**Implementation Priority:**
1. **Now:** Database schema updates (✅ completed)
2. **Next:** Basic world/location CRUD operations
3. **Then:** Template library and card composition tools
4. **Later:** World leaping mechanics and boundary detection
