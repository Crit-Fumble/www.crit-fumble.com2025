# CFG VTT - Current Implementation Status

**Last Updated**: 2025-11-17

---

## Overview

The **Crit-Fumble Gaming (CFG) Virtual Tabletop** is a massively scalable D&D 5e-compatible VTT supporting gameplay from Levels 1-50, spanning 10 tiers of play from local heroes to true deities. The system supports cosmic-scale combat, multiverse travel, and dynamic world generation.

---

## Phase 1: Data Layer ✅ **100% Complete**

All foundational data systems, documentation, and specifications are complete and ready for implementation.

### ✅ Database Schema (Prisma)

**Status**: Complete
**Location**: [schema.prisma](c:\Users\hobda\Projects\Crit-Fumble\www.crit-fumble.com\prisma\schema.prisma)

**Key Models**:
- User, Account, Session (Auth)
- Campaign, CampaignMembership, GameSession
- PlayerCharacter, CharacterSheet
- RpgHistory, RpgAltHistory (Timeline system)
- All SRD entities (Class, Race, Spell, Item, etc.)
- CFG expansion entities (Universe, Timeline, CosmicScale)

**Database**: PostgreSQL via Vercel Postgres

---

### ✅ System Data (SRD + CFG Expansion)

**Status**: Complete
**Location**: `TTRPG-Realms-of-the-5th-system/data/`

#### SRD Data (D&D 5e)
- **Classes**: 13 classes (Barbarian, Bard, Cleric, etc.)
- **Subclasses**: 100+ subclasses
- **Races**: 20+ playable races
- **Spells**: 500+ spells (cantrips through 9th level)
- **Items**: 1,000+ items (weapons, armor, magic items)
- **Monsters**: 800+ creature stat blocks
- **Rules**: Complete SRD rules

#### CFG Expansion Data
| System | Status | File |
|--------|--------|------|
| **XP Progression (Levels 1-50)** | ✅ Complete | [xp-progression.json](c:\Users\hobda\Projects\Crit-Fumble\TTRPG-Realms-of-the-5th-system\data\datasets\cfg\core\systems\xp-progression.json) |
| **Cosmic Scales (Mega/Tera/Ultra/Divine)** | ✅ Complete | [cosmic-scales.json](c:\Users\hobda\Projects\Crit-Fumble\TTRPG-Realms-of-the-5th-system\data\datasets\cfg\core\systems\cosmic-scales.json) |
| **Timelines (Multiverse)** | ✅ Complete | [timelines.json](c:\Users\hobda\Projects\Crit-Fumble\TTRPG-Realms-of-the-5th-system\data\datasets\cfg\core\systems\timelines.json) |
| **Universes (CFG-I through CFG-XXX)** | ✅ Complete | [universes.json](c:\Users\hobda\Projects\Crit-Fumble\TTRPG-Realms-of-the-5th-system\data\datasets\cfg\core\systems\universes.json) |
| **World Damage System** | ✅ Complete | [world-damage.json](c:\Users\hobda\Projects\Crit-Fumble\TTRPG-Realms-of-the-5th-system\data\datasets\cfg\core\systems\world-damage.json) |

---

### ✅ Documentation

**Status**: Complete
**Location**: [www.crit-fumble.com/docs/](c:\Users\hobda\Projects\Crit-Fumble\www.crit-fumble.com\docs\)

| Document | Purpose |
|----------|---------|
| [COSMIC_SCALES.md](c:\Users\hobda\Projects\Crit-Fumble\www.crit-fumble.com\docs\COSMIC_SCALES.md) | Mega/Tera/Ultra/Divine scale multipliers for Tier 5-10 play |
| [TIER_SCOPE_MANAGEMENT.md](c:\Users\hobda\Projects\Crit-Fumble\www.crit-fumble.com\docs\TIER_SCOPE_MANAGEMENT.md) | Tier-based event filtering to keep storytelling manageable |
| [PLAYER_SCOPE_AND_RENDERING.md](c:\Users\hobda\Projects\Crit-Fumble\www.crit-fumble.com\docs\PLAYER_SCOPE_AND_RENDERING.md) | Hex map structure, player scope, rendering modes, dynamic layers |
| [USER_FACING_FUNCTIONALITY_REVIEW.md](c:\Users\hobda\Projects\Crit-Fumble\www.crit-fumble.com\docs\USER_FACING_FUNCTIONALITY_REVIEW.md) | Complete review of ready vs needed features |

---

### ✅ Test Specifications

**Status**: Complete (not yet executable)
**Location**: [tests/hex-scales.test.ts](c:\Users\hobda\Projects\Crit-Fumble\www.crit-fumble.com\tests\hex-scales.test.ts)

**Test Coverage**:
- ✅ All 10 hex scales (50ft → 60 light years)
- ✅ Cosmic scale multipliers (×1,000 → ×60,000,000)
- ✅ Hex coverage calculations
- ✅ Light year distances
- ✅ Mathematical ratios
- ✅ Dynamic layer system (Layers -7 to 13)
- ✅ Layer loading strategy
- ✅ Environment types

**Note**: Tests written but not executable yet (vitest not installed)

---

## Phase 2: User-Facing Features ❌ **0% Started**

### User Roles System

**Status**: Specification complete
**Documentation**: [USER_ROLES_AND_PERMISSIONS.md](c:\Users\hobda\Projects\Crit-Fumble\www.crit-fumble.com\docs\USER_ROLES_AND_PERMISSIONS.md)

**3 Primary Roles**:

#### 1. Player
- ✅ Create Player Characters
- ✅ Join GM campaigns (with invitation)
- ✅ Play solo procedurally generated Provinces (scaled to level)
- ✅ Move tokens, roll dice, take combat actions
- ❌ Cannot create NPCs, items, creatures, locations
- ❌ Cannot create geographic scopes (Province/Kingdom/etc)

#### 2. Game Master (GM)
- ✅ Create all sheet types (NPCs, items, creatures, locations)
- ✅ Create geographic scopes (Province → Kingdom → Continent → World)
- ✅ Manage campaigns, invite players, start sessions
- ✅ Place sheets within Provinces
- ✅ Access GM tools (encounter builder, procedural generation)
- ❌ Cannot modify player characters (only view)

#### 3. Spectator
- ✅ Watch active game sessions (read-only)
- ✅ View hex map, combat tracker, chat
- ❌ Cannot move tokens, roll dice, or modify anything

**Sheet Types GMs Can Create**:
- **NPC Character Sheet** - Allies, quest givers, merchants
- **Creature Card** - Monsters, enemies (supports single/swarm/squad)
- **Item Card** - Equipment, loot, magic items
- **Location/Area Card** - Villages, dungeons, wilderness areas

---

### ❌ Frontend UI (Next.js 15 + React 19)

**Status**: Not started
**Tech Stack**:
- Next.js 15 (App Router)
- React 19 (Server Components + Client Components)
- TailwindCSS + shadcn/ui components
- NextAuth.js v5 (authentication)
- Zustand (client state management)

**Pages Needed**:
- `/` - Landing page
- `/dashboard` - User dashboard (role-based: Player/GM/Spectator)
- `/campaigns` - Campaign list
- `/campaigns/[id]` - Campaign detail
- `/campaigns/[id]/session` - Active game session
- `/characters` - Character list
- `/characters/[id]` - Character sheet
- `/characters/create` - Character builder
- `/gm/provinces` - Province builder (GM only)
- `/gm/sheets` - Sheet library (GM only)
- `/solo` - Procedurally generated solo adventure (Players)

---

### ❌ Game Session UI (VTT Interface)

**Status**: Not started
**Rendering Engine**: Three.js + React Three Fiber

**Rendering Modes** (Phase 1 - to implement):
1. **Top-Down View** (2D orthographic)
   - Hex grid overlay
   - Token placement
   - Movement tracking
   - Fog of War
2. **First-Person View** (3D perspective)
   - Player camera
   - 3D hex terrain
   - Entity rendering
   - Frustum culling

**Player Scope** (per battle map):
- 16 players
- 48 NPC groups (singles/swarms/squads)
- 100+ interactive objects
- 60×60×6 hex grid = 21,600 hexes total
- Load 3 layers at a time = 10,800 active hexes

**Performance Targets**:
- 60 FPS in both rendering modes
- <100 draw calls (top-down)
- <200 draw calls (first-person)
- ~2-10 MB memory per map instance

---

### ❌ Hex Map System

**Status**: Specification complete, not implemented
**Documentation**: [PLAYER_SCOPE_AND_RENDERING.md](c:\Users\hobda\Projects\Crit-Fumble\www.crit-fumble.com\docs\PLAYER_SCOPE_AND_RENDERING.md)

**Core Features**:

#### 10 Hex Scales
| Scale | Diameter | Use Case | Tier |
|-------|----------|----------|------|
| 50ft Tactical | 50 feet | Battle maps | 1-2 |
| 300ft Local | 300 feet | Local exploration | 1-2 |
| 1-Mile Province | 1 mile | Province travel | 1 |
| 6-Mile Kingdom | 6 miles | Kingdom travel | 2 |
| 60-Mile Continent | 60 miles | Continental travel | 3 |
| 600-Mile World | 600 miles | World travel | 4 |
| 1,000-Mile Universe | 1,000 miles | Ship combat, lesser deities | 5 |
| 1 Light Year Interstellar | 1 LY | Star systems | 6 |
| 6 Light Years Ultra | 6 LY | Multi-star regions | 7 |
| 60 Light Years Divine | 60 LY | Galactic regions | 8-10 |

#### Dynamic Layer System

**6 Default Layers** (standard worlds):
- **Layer 0**: Deep Underground (-9 to -6 miles)
- **Layer 1**: Middle Underground (-6 to -3 miles)
- **Layer 2**: Upper Underground (-3 to 0 miles)
- **Layer 3**: Surface (0 miles) - **Default starting layer**
- **Layer 4**: Mountain (0 to +3 miles)
- **Layer 5**: Sky (+3 to +6 miles)

**Extended Layers** (generated dynamically):

**Going Deeper** (Layers -1 to -7):
- Layer -1: Ancient Depths (-12 to -9 miles)
- Layer -2: Primordial Caverns (-15 to -12 miles)
- Layer -3: Mantle Border (-18 to -15 miles)
- Layer -4: Upper Mantle (-21 to -18 miles)
- Layer -5: Lower Mantle (-24 to -21 miles)
- Layer -6: Outer Core (-27 to -24 miles)
- Layer -7: Inner Core (-30 to -27 miles)

**Going Higher** (Layers 6 to 13):
- Layer 6: Upper Atmosphere (+6 to +9 miles)
- Layer 7: Stratosphere (+9 to +12 miles)
- Layer 8: Mesosphere (+12 to +15 miles)
- Layer 9: Thermosphere (+15 to +18 miles)
- Layer 10: Exosphere (+18 to +50 miles)
- Layer 11: Low Orbit (+50 to +100 miles)
- Layer 12: High Orbit (+100 to +300 miles)
- Layer 13: Space (+300 miles+)

**Layer Loading Strategy**:
- Load **3 layers at once**: current + 1 above + 1 below
- **Lazy generation**: Only generate layer when player enters it
- **Auto-unload**: Unload inactive layers after 5 minutes
- **Memory efficient**: ~2 MB for 3 loaded layers

---

### ❌ API Endpoints (Next.js API Routes)

**Status**: Not started
**Tech Stack**: Next.js 15 App Router + tRPC (skipped for now)

**Core Endpoints Needed**:

#### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/session` - Get current session

#### Campaigns
- `GET /api/campaigns` - List user's campaigns
- `POST /api/campaigns` - Create campaign
- `GET /api/campaigns/[id]` - Get campaign details
- `PATCH /api/campaigns/[id]` - Update campaign
- `DELETE /api/campaigns/[id]` - Delete campaign

#### Characters
- `GET /api/characters` - List user's characters
- `POST /api/characters` - Create character
- `GET /api/characters/[id]` - Get character sheet
- `PATCH /api/characters/[id]` - Update character
- `DELETE /api/characters/[id]` - Delete character

#### Game Sessions
- `POST /api/sessions` - Start game session
- `GET /api/sessions/[id]` - Get session state
- `PATCH /api/sessions/[id]` - Update session
- `POST /api/sessions/[id]/end` - End session

#### Real-Time (Socket.io - future)
- `socket.on('token:move')` - Token movement
- `socket.on('combat:action')` - Combat actions
- `socket.on('dice:roll')` - Dice rolls
- `socket.on('chat:message')` - Chat messages

---

### ❌ Game Logic

**Status**: Not started

**Core Systems to Implement**:

1. **Character Creation**
   - Race selection
   - Class selection
   - Ability score generation
   - Starting equipment
   - Background selection

2. **Leveling System**
   - XP tracking (Levels 1-50)
   - Automatic level-up calculations
   - Spell slot progression
   - Proficiency bonus scaling
   - Cosmic scale unlocks (Tier 5+)

3. **Combat System**
   - Initiative tracking
   - Turn order management
   - Attack rolls, damage rolls
   - Saving throws
   - Death saves
   - Cosmic scale multipliers (Tier 5+)

4. **Spell System**
   - Spell slot tracking
   - Spell preparation
   - Spell casting (attack spells, save spells, utility)
   - Concentration tracking
   - Upcast spell damage scaling

5. **History Tracking**
   - Event logging to RpgHistory
   - Tier-based significance filtering
   - Geographic scope management
   - Timeline isolation (Tier 9+)

6. **Multiverse System** (Tier 9+)
   - Timeline creation
   - Timeline divergence scoring
   - Prime timeline protection
   - Cross-universe travel

---

## Implementation Roadmap

### Sprint 1: Core VTT (4-6 weeks)
**Goal**: Playable Tier 1-2 experience (Levels 1-10)

**Tasks**:
1. Set up frontend scaffold (Next.js 15 + React 19)
2. Implement authentication (NextAuth.js)
3. Build character creation UI
4. Create top-down hex map renderer (Three.js)
5. Implement token movement (drag & drop)
6. Add basic combat tracker
7. Implement dice roller
8. Build campaign management UI
9. Create session management system

**Deliverable**: Players can create characters, join campaigns, move tokens on hex maps, roll dice

---

### Sprint 2: Exploration & History (3-4 weeks)
**Goal**: Event tracking and tier-based scope management

**Tasks**:
1. Implement RpgHistory logging
2. Build significance filtering system
3. Create event feed UI
4. Add geographic scope queries
5. Implement fog of war
6. Add hex terrain types
7. Build location/NPC tracking

**Deliverable**: Events tracked automatically, filtered by tier, displayed in chronological feed

---

### Sprint 3: Tier 3-4 Support (3-4 weeks)
**Goal**: Continental and world-scale gameplay (Levels 11-20)

**Tasks**:
1. Implement 60-mile and 600-mile hex scales
2. Add continent-level event tracking
3. Build world map UI
4. Implement fast travel system
5. Add kingdom/continent sheets

**Deliverable**: Players can explore continents and worlds, events tracked at appropriate scope

---

### Sprint 4: Cosmic Scale (4-6 weeks)
**Goal**: Ship combat, deity battles, space travel (Levels 21-36)

**Tasks**:
1. Implement cosmic scale multipliers (Mega/Tera/Ultra/Divine)
2. Add 1,000-mile hex scale (Universe)
3. Add 1/6/60 light year scales (Interstellar/Ultra/Divine)
4. Build ship-to-ship combat system
5. Implement deity stat scaling
6. Add cosmic-scale damage/HP/AC calculations

**Deliverable**: Level 21+ characters can engage in ship combat and deity-level battles

---

### Sprint 5: Multiverse Travel (3-4 weeks)
**Goal**: Timeline system and universe hopping (Levels 37-50)

**Tasks**:
1. Implement RpgAltHistory (alternate timelines)
2. Build timeline creation system
3. Add divergence scoring
4. Create timeline UI (timeline selector, divergence indicator)
5. Implement cross-universe portals
6. Build universe catalog UI

**Deliverable**: Level 40+ characters can travel between universes and timelines

---

## Technical Specifications

### Hex Map Data Model

```typescript
type HexMapInstance = {
  id: string
  name: string

  // Grid configuration
  gridWidth: number   // 60 hexes (default)
  gridDepth: number   // 60 hexes (default)

  // Dynamic layer system
  minLayer: number    // Lowest generated layer (e.g., -7)
  maxLayer: number    // Highest generated layer (e.g., 13)
  defaultLayer: number // 3 (surface)

  // Active loading
  activeLayer: number
  loadedLayers: number[] // [activeLayer - 1, activeLayer, activeLayer + 1]

  // Hexes organized by layer
  layers: Map<number, HexTile[]>

  // Layer metadata
  layerConfigs: LayerConfig[]
}

type LayerConfig = {
  layerIndex: number              // -7 to 13 (or beyond)
  name: string                    // "Surface", "Ancient Depths", etc.
  description: string
  heightRange: { min: number, max: number } // in miles
  environmentType: 'core' | 'underground' | 'surface' | 'mountain' | 'sky' | 'atmosphere' | 'orbit' | 'space'

  // Dynamic generation tracking
  isDefault: boolean              // true for Layers 0-5
  isGenerated: boolean            // true for dynamically created layers
  generatedAt?: Date
  lastAccessedAt?: Date
}

type HexTile = {
  x: number
  y: number
  z: number // layer index
  terrainType: string
  elevation: number
  isBlocked: boolean
  hasExit?: {
    direction: 'up' | 'down'
    targetLayer: number
  }
}
```

---

### Entity Token System

```typescript
type EntityToken = {
  id: string
  position: { x: number, y: number, z: number }
  type: 'player' | 'npc' | 'enemy' | 'ally'
  name: string

  // Group/Swarm Support
  isGroup: boolean
  groupType?: 'swarm' | 'squad'
  groupCount?: number
  groupMembers?: GroupMember[]

  // Combat stats
  hp: number
  maxHp: number
  ac: number
  initiative?: number

  // Rendering
  tokenImage: string
  facing: number // degrees
}

type GroupMember = {
  id: string
  position: { x: number, y: number, z: number }
  hp: number
  maxHp: number
  isAlive: boolean
  facing: number
}
```

**NPC Group Types**:
1. **Single**: 1 creature, 1 token
2. **Swarm**: Multiple creatures, 1 token, shared HP (e.g., 20 rats)
3. **Squad**: Multiple creatures, multiple tokens, individual HP (e.g., 5 orcs)

---

## Summary

### ✅ Ready for Implementation
- Database schema (Prisma)
- SRD data (classes, races, spells, items, monsters)
- CFG expansion data (XP, cosmic scales, timelines, universes)
- Complete documentation
- Test specifications

### ❌ Not Yet Started
- Frontend UI (Next.js 15 + React 19)
- Hex map renderer (Three.js)
- API endpoints
- Game logic (character creation, combat, spells, history tracking)
- Real-time multiplayer (Socket.io)

### Estimated Timeline
- **MVP (Tier 1-2 VTT)**: 8-12 weeks
- **Full implementation (Tier 1-10)**: 20-30 weeks

---

## Next Steps

1. **Install test framework** (vitest)
2. **Run tests** to validate hex scale calculations
3. **Begin Sprint 1**: Set up Next.js 15 frontend scaffold
4. **Implement authentication** with NextAuth.js
5. **Build character creation UI**
6. **Create top-down hex renderer** with Three.js

---

**This document reflects the current state as of 2025-11-17. All foundational systems are complete and ready for UI/API implementation.**
