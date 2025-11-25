# Separation of Concerns - Module Architecture

**Status:** Architecture Specification
**Last Updated:** 2025-11-20

---

## Three-Layer Architecture

The Crit-Fumble platform uses a three-layer module architecture to maintain clean separation between universal game concepts, specific TTRPG systems, and our platform enhancements.

```
┌─────────────────────────────────────────────────────────────┐
│                    Layer Architecture                        │
└─────────────────────────────────────────────────────────────┘

                    CFG Expansion Module
                   (foundry-cfg-5e, etc.)
                  Defines system-specific
                  properties & types via
                    Core Concepts API
                            ↓
                    TTRPG System Module
                  (dnd5e, pathfinder2e, etc.)
                   Game-specific mechanics,
                   rules, and data structures
                            ↓
                    Core Concepts Module
                  (foundry-core-concepts)
                   Universal game schema
                  for all types of games
```

---

## Layer 1: Core Concepts Module

**Module:** `foundry-core-concepts`
**Purpose:** Provides universal schema for ALL tabletop games
**Responsibility:** Define the fundamental building blocks that apply to any game

### What It Provides

**Universal Core Concepts:**
- **Sheets** - Resource tracking, scorekeeping, info storage
- **Attributes** - Things to track (name, health, scores, etc.)
- **Types** - Complex templates (classes, creature types, item categories)
- **Dice** - Dice notation and rolling
- **Tables** - Random tables, lookup tables, roll tables
- **Books** - Collections of rules, cards, tables, systems, modes
- **Cards** - Stat blocks, spell descriptions, item definitions
- **Hands** - Subset of cards in active use
- **Decks** - Sets of cards
- **Boards** - Maps, battle grids, play areas (2D or 3D)
- **Tiles** - Single spaces on boards (square, hex, block, etc.)
- **Voxels** - Volumetric zones for abstract distance
- **Rules** - Game rules and mechanics
- **Events** - Game actions and occurrences
- **Goals** - Win conditions, objectives
- **Sessions** - Game sessions or portions thereof

**Complex Core Concepts:**
- **Modes** - Game modes (Character Creation, Combat, Exploration, Social, Travel, Downtime)
- **Systems** - Rule assemblies used by modes
- **Creatures** - All creatures including NPCs and player characters
- **Locations** - Places in the game world
- **Objects** - Non-creature entities in the world

### What It Does NOT Include

❌ D&D-specific mechanics (spell slots, class features, etc.)
❌ Pathfinder-specific mechanics (action economy, ancestry features, etc.)
❌ Any system-specific progression (XP, milestones, etc.)
❌ System-specific combat rules
❌ System-specific equipment stats

### API Example

```javascript
// Core Concepts provides universal structure
game.coreConcepts.types.register({
  id: 'creature-type-dragon',
  name: 'Dragon',
  category: 'creature',
  // Properties and attributes defined by higher layers
});

game.coreConcepts.modes.register({
  id: 'combat',
  name: 'Combat Mode',
  // Combat mechanics defined by TTRPG system layer
});
```

---

## Layer 2: TTRPG System Module

**Examples:** `dnd5e`, `pathfinder2e`, `callofcthulhu`, etc.
**Purpose:** Implement specific TTRPG rule systems
**Responsibility:** Define game-specific mechanics, rules, and data structures

### What It Provides

**System-Specific Mechanics:**
- Character creation rules
- Combat mechanics (initiative, actions, reactions)
- Progression systems (leveling, advancement)
- Equipment and inventory rules
- Skill and ability systems
- Magic/power systems
- Condition and status effect definitions

**For D&D 5e Example:**
- Spell slots and spellcasting
- Class features and abilities
- Races and racial traits
- Ability scores (STR, DEX, CON, INT, WIS, CHA)
- Saving throws and proficiencies
- Experience points and leveling
- Death saves
- Advantage/Disadvantage
- Inspiration

### What It Does NOT Include

❌ CFG platform integrations (AI agents, behavior scripts)
❌ Crit-Fumble economy features
❌ Custom platform-specific enhancements
❌ Data sync to web database

### Integration with Core Concepts

The TTRPG module uses Core Concepts as its foundation:

```javascript
// dnd5e module defines 5e-specific creature type
game.coreConcepts.types.register({
  id: 'creature-type-humanoid',
  name: 'Humanoid',
  category: 'creature',
  systemName: 'dnd5e',
  properties: {
    size: 'medium',
    type: 'humanoid',
    subtypes: []
  }
});

// dnd5e module defines combat mode behavior
game.coreConcepts.modes.get('combat').setRules({
  initiative: 'dexterity-check',
  actionEconomy: {
    action: 1,
    bonusAction: 1,
    reaction: 1,
    movement: true
  }
});
```

---

## Layer 3: CFG Expansion Module

**Examples:** `foundry-cfg-5e`, `foundry-cfg-pathfinder2e`, etc.
**Purpose:** Add Crit-Fumble platform features to specific TTRPG systems
**Responsibility:** Define system-specific concepts through Core Concepts' properties and types

### What It Provides

**Platform Enhancements:**
- AI agent behavior scripts
- Creature behavior axes (lawfulness, goodness, faith, courage)
- Creature needs tracking (food, water, sleep, relaxation, adventure)
- Profession systems
- NPC routines and schedules
- Relationship tracking
- Data sync to PostgreSQL database
- Bridge API integration
- Downtime activity systems (system-specific implementations)
- Simulation zones (active, distant, inactive)

**System-Specific Extensions:**
- Maps Core Concepts to system-specific implementations
- Defines how behaviors work within the system's rules
- Implements CFG features using the system's mechanics

### What It Does NOT Include

❌ Core game rules (those come from TTRPG module)
❌ Universal game structures (those come from Core Concepts)

### Integration Example

```javascript
// foundry-cfg-5e extends dnd5e using Core Concepts
game.coreConcepts.types.extend('creature-type-humanoid', {
  cfgExtensions: {
    // CFG behavior axes
    defaultBehavior: {
      lawfulness: 50,
      goodness: 50,
      faith: 50,
      courage: 50
    },
    // CFG needs system
    defaultNeeds: {
      food: 85,
      water: 90,
      sleep: 100,
      relaxation: 60,
      adventure: 100
    },
    // CFG behavior scripts
    behaviors: ['wanderer', 'merchant', 'guard']
  }
});

// CFG downtime activities use 5e mechanics
game.coreConcepts.modes.extend('downtime', {
  activities: {
    crafting: {
      skillCheck: 'tool-proficiency',
      dc: 15,
      duration: '5 days',
      // Uses 5e skill check system
    },
    training: {
      skillCheck: 'ability-check',
      dc: 10,
      duration: '10 days',
      // Uses 5e ability check system
    }
  }
});
```

---

## Data Flow

### How the Layers Interact

```
User creates a D&D 5e Goblin Character
         ↓
1. TTRPG Module (dnd5e)
   - Defines: Goblin is a Small Humanoid creature
   - Defines: Has Dexterity 14, Strength 8, etc.
   - Defines: Has Nimble Escape feature
         ↓
2. Core Concepts Module
   - Stores as: RpgCreature with type "creature"
   - Stores as: Attributes in JSONB
   - Stores as: Abilities in JSONB
   - Provides: Universal creature API
         ↓
3. CFG Expansion Module (foundry-cfg-5e)
   - Adds: Behavior axes (Chaotic: 20, Evil: 30, etc.)
   - Adds: Needs tracking (food: 85, water: 90)
   - Adds: Profession (scout, raider, etc.)
   - Adds: Behavior scripts (ambusher, coward)
   - Syncs: To PostgreSQL via Bridge API
         ↓
4. Crit-Fumble Platform
   - Stores: In rpg_creatures table
   - Enables: AI simulations using behavior scripts
   - Enables: Web UI editing when offline
   - Tracks: Ownership via playerId
```

---

## Database Schema Mapping

### Core Concepts → Database Schema

**Core Concepts defines structure, system modules define content:**

```sql
-- RpgCreature (universal structure from Core Concepts)
CREATE TABLE rpg_creatures (
  id UUID PRIMARY KEY,

  -- Core Concepts fields (universal)
  name VARCHAR(100),

  -- System-specific data (JSONB)
  attributes JSONB,  -- { "str": 16, "dex": 14 } (5e-specific)
  abilities JSONB,   -- [{ "name": "Rage" }] (5e-specific)
  inventory JSONB,   -- System-specific item structure

  -- CFG Expansion fields
  lawfulness INT,    -- CFG behavior system
  goodness INT,      -- CFG behavior system
  profession VARCHAR(50), -- CFG profession system

  -- Player ownership (CFG platform)
  player_id UUID,    -- NULL for NPCs, set for PCs
  approval_status VARCHAR(20) -- CFG approval workflow
);
```

**Separation in Practice:**

| Field | Layer | Description |
|-------|-------|-------------|
| `id`, `name`, `createdAt` | Core Concepts | Universal to all games |
| `attributes`, `abilities` | TTRPG Module | System-specific (stored as JSONB) |
| `lawfulness`, `goodness`, `profession` | CFG Expansion | Platform enhancements |
| `playerId`, `approvalStatus` | CFG Platform | Ownership & workflow |

---

## Benefits of This Architecture

### 1. System Agnostic Core
- Core Concepts works with ANY tabletop game
- Can add new TTRPG systems without changing core
- Database schema remains universal

### 2. Clean Dependencies
```
foundry-cfg-5e
  ├── Requires: foundry-core-concepts ✅
  ├── Requires: dnd5e ✅
  └── Does NOT require: pathfinder2e ❌
```

### 3. Flexible Data Storage
- System-specific data in JSONB fields
- CFG enhancements as explicit columns
- Core structure remains stable

### 4. Maintainability
- Bug in D&D 5e rules? Fix in `dnd5e` module
- Need new CFG feature? Add to `foundry-cfg-5e`
- Core Concepts rarely needs changes

---

## Examples by Layer

### Core Concepts Responsibility

✅ **Yes - Core Concepts defines:**
- A creature has a name
- A creature can have attributes
- A creature can be in a location
- Events can be recorded
- Dice can be rolled

❌ **No - NOT Core Concepts:**
- A creature has 6 ability scores (that's D&D 5e)
- A creature has a Dexterity modifier (that's D&D 5e)
- A creature gains XP for kills (that's D&D 5e)

### TTRPG Module Responsibility

✅ **Yes - TTRPG Module defines:**
- D&D 5e has 6 ability scores (STR, DEX, CON, INT, WIS, CHA)
- Spell slots by level
- How saving throws work
- Combat action economy

❌ **No - NOT TTRPG Module:**
- AI behavior scripts (that's CFG)
- Needs tracking (that's CFG)
- Data sync to web (that's CFG)

### CFG Expansion Responsibility

✅ **Yes - CFG Expansion defines:**
- Creatures have behavior axes
- Creatures have needs (food, water, sleep)
- Downtime activities for this system
- How to sync this system's data to PostgreSQL
- How AI agents interact with this system

❌ **No - NOT CFG Expansion:**
- Core game rules (TTRPG module handles this)
- How spell slots work (TTRPG module handles this)

---

## Summary

| Layer | Module | Responsibility |
|-------|--------|----------------|
| **1. Core** | `foundry-core-concepts` | Universal game schema, works for all TTRPGs |
| **2. System** | `dnd5e`, `pathfinder2e` | Specific TTRPG rules and mechanics |
| **3. CFG** | `foundry-cfg-5e`, `foundry-cfg-pathfinder2e` | Platform features via properties & types |

**Key Principle:** Each layer builds on the previous layer without breaking abstraction. Core Concepts never knows about D&D 5e. D&D 5e never knows about CFG platform features. CFG modules glue everything together using the Core Concepts API.

This architecture ensures:
- ✅ Clean separation of concerns
- ✅ Easy to add new TTRPG systems
- ✅ Platform features don't pollute game rules
- ✅ Database schema remains universal
- ✅ Each module has a single, clear purpose
