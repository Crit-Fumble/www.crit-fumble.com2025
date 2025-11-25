# VTT Development TODO List

## Overview

This document tracks all tasks, features, and improvements for the Crit-Fumble VTT platform. Tasks are organized by priority and status.

**Last Updated**: 2025-11-17

---

## ✅ Completed Tasks

### Documentation

- [x] Create [TIME_SCALES.md](TIME_SCALES.md) - Time tracking for 3 pillars of play
- [x] Create [HEX_SCALES_COMPLETE.md](HEX_SCALES_COMPLETE.md) - All 5 hex scales (50ft, 300ft, 1-mile, 10-mile, 100-mile)
- [x] Update [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Quick reference for all scales
- [x] Create [SCALES_AND_SHEETS.md](SCALES_AND_SHEETS.md) - Grid scales and sheet hierarchy
- [x] Create [SHEET_HIERARCHY.md](SHEET_HIERARCHY.md) - Hierarchical sheet system
- [x] Create [HEX_TILE_FORMULAS.md](HEX_TILE_FORMULAS.md) - Mathematical formulas for hex tiles
- [x] Create [HEX_MASKING_STRATEGY.md](HEX_MASKING_STRATEGY.md) - Hexagonal transparency masks
- [x] Create [HEX_DIMENSION_CORRECTION.md](HEX_DIMENSION_CORRECTION.md) - Before/after corrections
- [x] Create [TILE_CALCULATIONS_REFERENCE.md](TILE_CALCULATIONS_REFERENCE.md) - Practical calculation examples
- [x] Create [TILE_SYSTEM_SUMMARY.md](TILE_SYSTEM_SUMMARY.md) - Complete system overview

### Hex Tile System

- [x] Define 1-mile hex dimensions (610×528 px, 1px = 10ft)
- [x] Calculate hex vertices for flat-top hexagons
- [x] Identify top edge requirement (305 cards / 3,050 feet) ✅
- [x] Verify hex height = 1.0 mile exactly ✅
- [x] Define round number scales only (305×264, 6100×5280)
- [x] Create zoom strategy (hex out, square cards in)
- [x] Identify missing intermediate scales (50 ft, 300 ft hexes)
- [x] Define all 5 hex scales (50ft, 300ft, 1-mile, 10-mile, 100-mile)

### Scripts

- [x] Create [generate-hex-mask.sh](../scripts/generate-hex-mask.sh) - Generate 1-mile hex masks (610×528, 305×264, 6100×5280)

---

## 🚧 In Progress

### Documentation

- [ ] Create comprehensive test suite documentation
- [ ] Update all existing docs with new hex scales

---

## 📋 High Priority (Next Sprint)

### Database Schema

- [ ] **Add RpgHistory table** (NEW REQUIREMENT)
  - Track in-game events with timestamps
  - Reference players and GMs responsible for events
  - Include significance factor based on tier of play / character level
  - System-agnostic design

```prisma
model RpgHistory {
  id        String   @id @default(uuid())
  createdAt DateTime @default(now()) @map("created_at")

  // Event info
  eventType        String   @db.VarChar(50)  // 'combat', 'social', 'exploration', 'quest', 'death', etc.
  eventTitle       String   @db.VarChar(500)
  eventDescription String?  @db.Text
  significance     Int      @default(1)      // 1-10 scale based on tier/level

  // In-game timestamp
  inGameTime       Json?    @map("in_game_time")  // { day, month, year, hour, minute }

  // Session reference
  rpgSessionId     String?  @map("rpg_session_id")
  rpgSession       RpgSession? @relation(fields: [rpgSessionId], references: [id])

  // Location reference
  locationSheetId  String?  @map("location_sheet_id")
  locationSheet    LocationSheet? @relation(fields: [locationSheetId], references: [id])

  // Participants (players and GMs)
  participantIds   Json     @default("[]") @map("participant_ids")  // Array of Player IDs
  gmIds            Json     @default("[]") @map("gm_ids")           // Array of GM Player IDs

  // Character references (if applicable)
  characterIds     Json     @default("[]") @map("character_ids")

  // System-specific metadata
  systemName       String?  @db.VarChar(100)  // '5e', 'pathfinder', etc.
  tierOfPlay       Int?     @map("tier_of_play")      // D&D 5e: 1-4
  characterLevel   Int?     @map("character_level")   // Average party level

  // Metadata
  metadata         Json     @default("{}")

  @@index([rpgSessionId])
  @@index([eventType])
  @@index([significance])
  @@index([systemName])
  @@map("rpg_history")
}
```

- [ ] **Update RpgTile model** for hex support
  - Add `hexScale` field ('50ft', '300ft', '1mile', '10mile', '100mile')
  - Add `hexWidth` and `hexHeight` fields
  - Add `hexPixelScale` field ('1px=1ft', '1px=10ft', etc.)
  - Add URL fields for all hex resolutions:
    - 50 ft hexes: `url58x50`, `url29x25`
    - 300 ft hexes: `url346x300`, `url173x150`
    - 1-mile hexes: `url610x528`, `url305x264`, `url6100x5280` (existing)
    - 10-mile & 100-mile reuse 610×528 dimensions

- [ ] **Update Board model** for time tracking
  - Add `timeMode` field ('combat', 'exploration', 'social_interaction', 'downtime')
  - Add `currentRound` and `currentTurn` for combat
  - Add `inGameTime` JSON field
  - Add `timeScaleConfig` JSON field for system-specific settings

- [ ] **Update RpgSession model** for time tracking
  - Add `inGameTimeStart`, `inGameTimeEnd`, `inGameTimeElapsed` JSON fields
  - Add `roundsPlayed` counter
  - Add `travelDistanceMiles` tracking

- [ ] **Add RpgHistory relation** to existing models
  - RpgSession -> RpgHistory (one-to-many)
  - LocationSheet -> RpgHistory (one-to-many)

### Hex Mask Generation

- [ ] **Generate 50 ft hex masks**
  - Base: 58×50 px
  - Small: 29×25 px (50% scale)
  - Large: 116×100 px (2× scale, optional)

- [ ] **Generate 300 ft hex masks**
  - Base: 346×300 px
  - Small: 173×150 px (50% scale)
  - Large: 692×600 px (2× scale, optional)

- [ ] **Update generate-hex-mask.sh script**
  - Support all 5 hex scales
  - Generate masks for each scale
  - Create preview images

### Systems Data Schema

- [ ] **Review time.json** for system-agnostic design
  - Ensure support for D&D 5e, Pathfinder, Call of Cthulhu, etc.
  - Add customization points for different game systems
  - Define tier of play / character level significance mappings

- [ ] **Create significance calculation system**
  - Map tier of play (1-4 for 5e) to significance factor
  - Map character level to significance factor
  - System-agnostic: support any level/tier system

Example:
```json
{
  "name": "significance",
  "title": "Event Significance",
  "description": "How significant an event is based on character level and tier of play",
  "systems": {
    "5e": {
      "tiers": [
        { "tier": 1, "levels": [1, 2, 3, 4], "baseSignificance": 1 },
        { "tier": 2, "levels": [5, 6, 7, 8, 9, 10], "baseSignificance": 3 },
        { "tier": 3, "levels": [11, 12, 13, 14, 15, 16], "baseSignificance": 6 },
        { "tier": 4, "levels": [17, 18, 19, 20], "baseSignificance": 9 }
      ],
      "eventModifiers": {
        "combat_boss": +2,
        "combat_minion": 0,
        "quest_main": +2,
        "quest_side": +1,
        "character_death": +3,
        "character_resurrection": +2
      }
    },
    "pathfinder": {
      // Similar structure for Pathfinder
    }
  }
}
```

### Testing

- [ ] **Create test suite for time scales**
  - Test combat time tracking (rounds, turns)
  - Test exploration time conversion (speed ÷ 10 = mph)
  - Test social interaction (realtime)
  - Test time mode transitions

- [ ] **Create test suite for hex scales**
  - Test hex dimension calculations for all 5 scales
  - Test hex vertex generation
  - Test hex masking application
  - Test zoom level transitions

- [ ] **Create test suite for RpgHistory**
  - Test event creation with significance calculation
  - Test participant/GM references
  - Test in-game time tracking
  - Test querying by significance, event type, etc.

---

## 📅 Medium Priority (Future Sprints)

### Image Processing

- [ ] **Process Dungeon Crawl tiles**
  - Generate all resolutions for 9,071 tiles
  - Create 2×2 compositions for 60×60 px tiles
  - Upload to DigitalOcean Spaces
  - Import to database

- [ ] **Create hex terrain tiles**
  - Forest hexes (all 5 scales)
  - Mountain hexes (all 5 scales)
  - Plains hexes (all 5 scales)
  - Water hexes (all 5 scales)
  - Desert, snow, swamp, etc.

### Donjon Import

- [ ] **Import all donjon examples**
  - 11 dungeons (21×21 to 115×115 cells)
  - Convert to LocationSheet + Board
  - Test dynamic viewport loading

- [ ] **Optimize donjon importer**
  - Batch tile creation
  - Efficient card/tile lookups
  - Progress reporting

### Frontend Development

- [ ] **Implement hex rendering**
  - Load appropriate hex scale based on zoom
  - Apply hexagonal masks
  - Support zoom transitions

- [ ] **Implement dynamic viewport**
  - Load/unload tiles as board moves
  - Recenter board on player movement
  - Optimize for 50×50×50 tile viewport

- [ ] **Implement time tracking UI**
  - Display current time mode
  - Show in-game time
  - Combat: show round/turn tracker
  - Exploration: show travel time calculator
  - Social: show realtime timer

- [ ] **Implement RpgHistory timeline UI**
  - Display events chronologically
  - Filter by significance, event type, participants
  - Show in-game timestamps
  - Export to campaign journal

### Camera Modes

- [ ] **Implement camera positioning**
  - Top-down (default)
  - Isometric
  - First-person (social interaction)
  - Third-person (social interaction)
  - Side-view

- [ ] **Implement view modes**
  - look_around (default)
  - look_up (show upper z-levels)
  - look_down (show lower z-levels)

### Elevation System

- [ ] **Implement elevation gradient**
  - 0.25, 0.5, 0.75, 1.0, 2.0 elevation levels
  - Visual representation (shading, height map)
  - Pathfinding with elevation

### Sheet Management

- [ ] **Implement lazy sheet creation**
  - Create Area sheet when card changes
  - Create Province sheet when hex card changes
  - Auto-expand sheets up to max size

- [ ] **Implement sparse storage**
  - Only store filled cards/hexes
  - Efficient querying by bounds

### API Development

- [ ] **Create TimeTrackingService**
  - Get/set time mode
  - Advance in-game time
  - Calculate travel time
  - Format in-game time for display

- [ ] **Create RpgHistoryService**
  - Create events with significance calculation
  - Query events by various filters
  - Generate campaign timeline
  - Export to PDF/Markdown

---

## 🔮 Low Priority (Backlog)

### Advanced Features

- [ ] **100-mile hexes** (continent scale)
  - Only if needed for massive campaigns
  - Same 610×528 dimensions as 1-mile hex
  - Pixel scale: 1px = 1000 feet

- [ ] **3D rendering**
  - Three.js integration
  - Isometric camera mode
  - Height-based fog of war

- [ ] **Multiplayer sync**
  - Real-time tile updates
  - Shared board state
  - Collaborative editing

- [ ] **AI integration**
  - Auto-generate hex terrain
  - Suggest event significance
  - Generate campaign timeline summaries

### Optimization

- [ ] **Image CDN**
  - DigitalOcean Spaces CDN
  - Lazy loading for images
  - Progressive image loading

- [ ] **Database optimization**
  - Partition large tables (RpgHistory, BoardTile)
  - Optimize spatial queries
  - Cache frequently accessed data

---

## 🐛 Known Issues

None currently tracked.

---

## 📊 Progress Summary

### Overall Progress

- **Documentation**: 85% complete (10/12 docs created)
- **Database Schema**: 40% complete (existing models, need hex + history updates)
- **Scripts**: 20% complete (hex mask generation for 1-mile only)
- **Testing**: 0% complete (no tests yet)
- **Frontend**: 0% complete (not started)

### Next Immediate Steps

1. **Update database schema** (RpgTile, Board, RpgSession, RpgHistory)
2. **Generate hex masks** for all 5 scales
3. **Review Systems data schema** for system-agnostic support
4. **Create test suites** for time scales and hex scales
5. **Implement RpgHistory service** with significance calculation

---

## 🎯 Current Sprint Goals (Week of 2025-11-17)

1. ✅ Document all hex scales (50ft, 300ft, 1-mile, 10-mile, 100-mile)
2. ✅ Document time scales for 3 pillars of play
3. ✅ Create comprehensive TODO.md
4. 🚧 Update database schema with hex fields and RpgHistory table
5. 🚧 Generate hex masks for all scales
6. 🚧 Review Systems data schema for significance calculation

---

## 📝 Notes

### Hex Scale Design Principles

- **528 on shorter dimension** (height) for all base scales
- **Round number dimensions** for all resolutions
- **Hexagonal transparency masks** applied to all hex images
- **Zoom strategy**: Smaller hexes/square cards when zooming in, larger hexes when zooming out

### Time Scale Design Principles

- **System-agnostic**: Support D&D 5e, Pathfinder, and any TTRPG/board game
- **Three pillars**: Combat (turn-based), Exploration (continuous), Social (realtime)
- **Flexible configuration**: Round duration, travel formulas, rest periods customizable per system

### RpgHistory Design Principles

- **Immutable**: Events are never deleted, only added
- **Significance-based**: Events ranked 1-10 based on tier/level and event type
- **System-agnostic**: Support any game system's tier/level structure
- **Auditable**: Always track participants (players and GMs) responsible for events

---

## 🔗 Related Documentation

- [TIME_SCALES.md](TIME_SCALES.md) - Time tracking for 3 pillars of play
- [HEX_SCALES_COMPLETE.md](HEX_SCALES_COMPLETE.md) - All 5 hex scales
- [SCALES_AND_SHEETS.md](SCALES_AND_SHEETS.md) - Grid scales and sheet hierarchy
- [SHEET_HIERARCHY.md](SHEET_HIERARCHY.md) - Hierarchical sheet system
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Quick reference card
- [HEX_TILE_FORMULAS.md](HEX_TILE_FORMULAS.md) - Mathematical formulas
- [HEX_MASKING_STRATEGY.md](HEX_MASKING_STRATEGY.md) - Transparency masks
- [TILE_SYSTEM_SUMMARY.md](TILE_SYSTEM_SUMMARY.md) - Complete system overview

---

**End of TODO.md** - Last updated: 2025-11-17
