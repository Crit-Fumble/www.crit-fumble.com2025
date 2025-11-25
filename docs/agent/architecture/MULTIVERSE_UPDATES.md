# Multiverse System Updates - November 24, 2024

## Summary

Updated the Multiverse System architecture to clarify world leaping mechanics and the relationship between worlds, systems, and instances.

## Key Clarifications

### 1. World = Playable Space
- An **RpgWorld** is a self-contained playable space at any scale (Universe → Interaction)
- Each world is linked to an **RpgSystem** (via `systemName`)
- Each world contains at least one **RpgLocation** where gameplay occurs
- Worlds can exist at any scale:
  - **Universe scale**: Space opera with multiple star systems
  - **Planet scale**: Single planet campaign
  - **Building scale**: Single dungeon
  - **Interaction scale**: Card game on a tavern table

### 2. World Leaping
- Players can "world leap" between sibling worlds within the same universe
- Each world can have its own RpgSystem and rules
- When players reach world boundaries or want to change games, they select a destination world
- They play as a character compatible with that world's RpgSystem
- World leaping mechanics will be developed later; focus now is data structure

### 3. Board/Card/Sheet Relationship
**Reusable Templates:**
- **RpgBoard**: Template definition with generation rules (e.g., "D&D 5e Tavern Template")
- **RpgCard**: Reusable map section (e.g., "Tavern Common Room 20x15 grid")

**Unique Instances:**
- **RpgSheet**: Specific instance in a world (e.g., "Yawning Portal Inn in Waterdeep")

**Worldbuilder Workflow:**
1. Select RpgBoard template for location type
2. Select RpgCard(s) for map layout
3. Generate RpgSheet instance in world
4. Customize with specific creatures, things, activities

**Reusability:**
- Worldbuilders reuse RpgBoards and RpgCards when building worlds
- Each world has unique RpgSheets (instances)
- Multiple worlds can use the same templates but have different instances

### 4. World Nesting (Conceptual Organization)
- Worlds can be nested for conceptual organization
- Example: Universe → Galaxy → Star System → Planet → Continent
- Each nested level can be a separate world with its own system/rules
- Players "world leap" to navigate between sibling worlds

## Database Schema Updates

### ✅ Completed

1. **RpgWorld**: Added `containerWorldId`, `containerWorld`, `containedWorlds[]`
2. **RpgLocation**: Added `boardTemplateId`, `boardTemplate`, `mapCardIds`
3. **RpgBoard**: Added `locations[]` relation
4. **Migration SQL**: Created [MULTIVERSE_MIGRATION.sql](./MULTIVERSE_MIGRATION.sql)

### Schema Changes
```prisma
// RpgWorld - World nesting
containerWorldId String?   @map("container_world_id")
containerWorld   RpgWorld? @relation("WorldNesting", fields: [containerWorldId], references: [id], onDelete: SetNull)
containedWorlds  RpgWorld[] @relation("WorldNesting")

// RpgLocation - Template and map composition
boardTemplateId String?   @map("board_template_id")
boardTemplate   RpgBoard? @relation("LocationTemplate", fields: [boardTemplateId], references: [id], onDelete: SetNull)
mapCardIds Json @default("[]") @map("map_card_ids") @db.JsonB

// RpgBoard - Template usage tracking
locations RpgLocation[] @relation("LocationTemplate")
```

## Documentation Updates

### Updated Files
1. **[MULTIVERSE_SYSTEM.md](./MULTIVERSE_SYSTEM.md)** - Complete architecture
   - Added World Leaping Mechanics section
   - Added RpgSheet explanation
   - Updated examples with world leaping scenarios
   - Added implementation priority

2. **[MULTIVERSE_MIGRATION.sql](./MULTIVERSE_MIGRATION.sql)** - SQL migration script

3. **[docs/agent/README.md](../README.md)** - Added multiverse docs to index

## Examples

### Example 1: Fantasy Universe with World Leaping
```
Universe: "Forgotten Realms" (dnd5e)
  ├─ World: "Toril" (dnd5e) - Standard fantasy world
  ├─ World: "Sigil" (dnd5e-planar) - City of doors, planar hub
  └─ World: "Undermountain" (dnd5e) - Mega-dungeon

Players can world leap between these three worlds.
```

### Example 2: Tavern Mini-Game
```
Universe: "Baldur's Gate Campaign" (dnd5e)
  └─ World: "Card Game at Elfsong Tavern" (three-dragon-ante)
      └─ Location: "Card Table" (Interaction scale)

Players can world leap from main campaign to play a card game.
```

## Next Steps

### Implementation Priority
1. ✅ **Now:** Database schema updates (completed)
2. **Next:** Basic world/location CRUD operations
3. **Then:** Template library and card composition tools
4. **Later:** World leaping mechanics and boundary detection

### Future Development
- World leap UI and character transition
- Boundary detection and portal mechanics
- World access restrictions and requirements
- Cross-world character compatibility checks
- Visual effects for world transitions

## Notes

- Focus now is on **data-driven organization** for future tool development
- Each world should be **self-contained and playable** independently
- World leaping mechanics will be developed after core worldbuilding tools
- GM controls which worlds are accessible and when
