# Foundry VTT Module Architecture

**Crit-Fumble Platform Integration with FoundryVTT**

---

## Module Ecosystem

The Crit-Fumble platform extends FoundryVTT through a modular architecture with one core module, two data modules, and multiple TTRPG system modules:

```
foundry-core-concepts (CORE)
    ↓ required by
    ├── foundry-api-control (Data Module)
    ├── foundry-core-srd-5e (TTRPG System Module)
    └── foundry-cfg-5e (TTRPG System Module)
            ↑ requires
            foundry-core-srd-5e
```

---

## Module Descriptions

### 1. Foundry Core Concepts (CORE)

**Purpose:** Foundation module providing unified TTRPG concepts

**Location:** `src/modules/foundry-core-concepts/`

**Features:**
- **Types Registry**: Unified type definitions (classes, creature types, item types)
- **Books Manager**: Enhanced journals with cards, tables, rules, actors
- **Rules Engine**: Formal rules system with triggers and effects
- **Modes Manager**: Game mode system (Combat, Exploration, Social, Travel, Downtime, Character Creation)
- **Decks Manager**: Deck and hand management for cards
- **Systems Manager**: Extensible game systems framework (Weather, Travel, etc.)

**Dependencies:** None (core module)

**API:**
```javascript
game.coreConcepts.types      // TypesRegistry
game.coreConcepts.books      // BooksManager
game.coreConcepts.rules      // RulesEngine
game.coreConcepts.modes      // ModesManager
game.coreConcepts.decks      // DecksManager
game.coreConcepts.systems    // SystemsManager
```

---

### 2. Foundry API Control (DATA MODULE)

**Purpose:** RESTful API endpoints for external integration

**Location:** `src/modules/foundry-api-control/`

**Features:**
- Socket-based API server
- Authentication with bearer tokens
- Rate limiting
- CRUD operations for actors, items, scenes, journal
- Core Concepts API endpoints
- 5e System API endpoints

**Dependencies:**
- Requires: `foundry-core-concepts`

**API Endpoints:**
```
GET  /health
GET  /world
GET  /actors
GET  /actors/:id
POST /actors
PATCH /actors/:id
DELETE /actors/:id
GET  /items
GET  /items/:id
GET  /scenes
GET  /scenes/:id
GET  /journal
GET  /journal/:id
GET  /types
GET  /books
GET  /rules
GET  /modes
POST /modes/set
GET  /systems
GET  /behaviors
GET  /actors/:id/behaviors
```

---

### 3. Foundry PostgreSQL Storage (DATA MODULE)

**Purpose:** PostgreSQL database synchronization

**Location:** `src/modules/foundry-postgresql-storage/`

**Features:**
- Real-time sync to PostgreSQL
- Full and incremental sync modes
- Configurable sync intervals
- Schema auto-initialization
- Selective sync (actors, items, scenes, etc.)

**Dependencies:**
- Requires: `foundry-core-concepts`
- Recommends: `foundry-api-control`

**Database Schema:**
```sql
-- Core Foundry tables
actors (id, name, type, data, created_at, updated_at)
items (id, name, type, data, created_at, updated_at)
scenes (id, name, active, data, created_at, updated_at)
journal_entries (id, name, data, created_at, updated_at)

-- Core Concepts tables
types (id, name, category, data, created_at, updated_at)
books (id, name, data, created_at, updated_at)
rules (id, name, trigger, data, created_at, updated_at)
modes (id, name, data, created_at, updated_at)
systems (id, name, enabled, data, created_at, updated_at)

-- Behaviors tables (from cfg-5e)
behaviors (id, name, type, data, created_at, updated_at)
actor_behaviors (actor_id, behavior_id, created_at)
```

---

### 4. Foundry Core SRD 5e (TTRPG SYSTEM MODULE)

**Purpose:** D&D 5e System Reference Document implementation

**Location:** `src/modules/foundry-core-srd-5e/`

**Features:**
- Resting System (short rest, long rest)
- Exhaustion System (6 levels)
- Conditions System (blinded, charmed, etc.)
- Spellcasting System (spell slots, concentration)
- Death Saves System
- Inspiration System

**Dependencies:**
- Requires: `foundry-core-concepts`

**Systems Provided:**
All SRD systems are registered with the Core Concepts Systems Manager and available via:
```javascript
game.coreConcepts.systems.getSystem('srd-resting')
game.coreConcepts.systems.getSystem('srd-exhaustion')
// etc.
```

---

### 5. Foundry CFG 5e (TTRPG SYSTEM MODULE)

**Purpose:** Crit-Fumble Gaming 5e-compatible systems and enhancements

**Location:** `src/modules/foundry-cfg-5e/`

**Features:**
- **Creature Behaviors System**: AI-driven autonomous NPC behaviors
  - Patrol behavior
  - Flee behavior (planned)
  - Guard behavior (planned)
  - Per-actor state management
  - Behavior priority system
- Advanced Combat System (planned)
- Skill Challenges System (planned)
- Social Encounters System (planned)
- Crafting System (planned)
- Reputation System (planned)

**Dependencies:**
- Requires: `foundry-core-concepts`
- Requires: `foundry-core-srd-5e`

**Systems Provided:**
```javascript
// Behavior System
const behaviorSystem = game.coreConcepts.systems.getSystem('cfg-behaviors');
behaviorSystem.manager.getAllBehaviors();
behaviorSystem.manager.assignBehaviorToActor(behavior, actor);
behaviorSystem.manager.getActorBehaviors(actor);
```

---

## Data Flow

### Normal Operation

```
Foundry VTT
    ↓ (hooks)
Core Concepts
    ↓ (manages)
Types, Books, Rules, Modes, Decks, Systems
    ↓ (provides)
SRD 5e Systems (resting, exhaustion, etc.)
    ↓ (extends)
CFG 5e Systems (behaviors, crafting, etc.)
    ↓ (sync)
PostgreSQL Storage → PostgreSQL Database
    ↑ (query)
API Control ← External Applications
```

### External Integration

```
External App (e.g., Crit-Fumble Web Platform)
    ↓ (REST API)
API Control Module
    ↓ (reads/writes)
Core Concepts + Foundry Data + SRD 5e + CFG 5e
    ↓ (persisted to)
PostgreSQL Database
    ↑ (analytics/reports)
External Analytics Service
```

---

## Installation Order

1. **Install Core** (required)
   ```
   foundry-core-concepts
   ```

2. **Install Data Modules** (optional for external integration)
   ```
   foundry-api-control
   foundry-postgresql-storage
   ```

3. **Install TTRPG System Modules** (choose your game system)
   ```
   foundry-core-srd-5e (D&D 5e SRD)
   foundry-cfg-5e (requires srd-5e)
   ```

---

## Configuration

### Core Concepts Settings
- Enable Types System
- Enable Books System
- Enable Rules Engine
- Enable Game Modes
- Debug Mode
- Crit-Fumble API Token

### API Control Settings
- Enable API Server
- API Port
- API Authentication Token
- Enable CORS
- Enable Rate Limiting
- Rate Limit (requests/minute)
- Debug Mode

### PostgreSQL Storage Settings
- Enable Database Sync
- Database Host/Port/Name/User/Password
- Sync Interval (seconds)
- Sync Actors/Items/Scenes/Journal
- Sync Core Concepts
- Sync Behaviors (from CFG 5e)
- Debug Mode

### SRD 5e Settings
- Enable SRD Systems
- Debug Mode

### CFG 5e Settings
- Enable CFG Systems
- Enable Creature Behaviors
- Behavior Update Interval (ms)
- Debug Mode

---

## Development

### Adding a New System to CFG 5e

1. Create system file in `src/modules/foundry-cfg-5e/scripts/systems/`
2. Export a class that implements the system interface
3. Register in `init.mjs`:

```javascript
// In registerCFGSystems()
try {
  const { MySystem } = await import('./systems/my-system.mjs');
  const mySystem = new MySystem();
  systemsManager.registerSystem(mySystem);
  FoundryCFG5e.systems.push(mySystem);
  console.log(`${MODULE_TITLE} | Registered My System`);
} catch (error) {
  console.error(`${MODULE_TITLE} | Failed to load My System:`, error);
}
```

### Adding a New Behavior

1. Create behavior file in `src/modules/foundry-cfg-5e/scripts/systems/behaviors/`
2. Extend the `Behavior` base class
3. Register in `behavior-manager.mjs`:

```javascript
// In loadBuiltInBehaviors()
try {
  const { MyBehavior } = await import('./behaviors/my-behavior.mjs');
  this.registerBehavior(new MyBehavior());
} catch (error) {
  console.log('Behavior Manager | My behavior not available (optional)');
}
```

---

## Module Structure

```
src/modules/
├── foundry-core-concepts/        # Core module
│   ├── scripts/
│   │   ├── init.mjs
│   │   ├── types-registry.mjs
│   │   ├── books-manager.mjs
│   │   ├── rules-engine.mjs
│   │   ├── modes-manager.mjs
│   │   ├── decks-manager.mjs
│   │   ├── systems-manager.mjs
│   │   └── systems/
│   │       ├── base-system.mjs
│   │       └── weather-system.mjs
│   ├── styles/
│   └── docs/
│
├── foundry-api-control/          # Data module
│   ├── scripts/
│   │   ├── init.mjs
│   │   ├── api-server.mjs
│   │   └── endpoints/
│   └── styles/
│
├── foundry-postgresql-storage/   # Data module
│   ├── scripts/
│   │   ├── init.mjs
│   │   ├── db-connector.mjs
│   │   └── sync/
│   └── styles/
│
├── foundry-core-srd-5e/          # TTRPG system module
│   ├── scripts/
│   │   ├── init.mjs
│   │   └── systems/
│   │       ├── resting-system.mjs
│   │       ├── exhaustion-system.mjs
│   │       └── conditions-system.mjs
│   ├── styles/
│   └── docs/
│
└── foundry-cfg-5e/               # TTRPG system module
    ├── scripts/
    │   ├── init.mjs
    │   └── systems/
    │       ├── behavior-system.mjs
    │       └── behaviors/
    │           ├── behavior-manager.mjs
    │           ├── behavior.mjs
    │           └── patrol-behavior.mjs
    ├── styles/
    └── docs/
```

---

## Testing

### Manual Testing
1. Enable all modules in Foundry
2. Check browser console for initialization messages
3. Verify module dependencies load in correct order
4. Test each system's functionality
5. Verify data sync (if postgres enabled)
6. Test API endpoints (if API control enabled)

### Module Dependencies Check
```javascript
// Check if core concepts is loaded
game.modules.get('foundry-core-concepts')?.active

// Check if SRD 5e is loaded
game.modules.get('foundry-core-srd-5e')?.active

// Check if CFG 5e is loaded
game.modules.get('foundry-cfg-5e')?.active

// Check API availability
game.coreConcepts !== undefined
game.srd5e !== undefined
game.cfg5e !== undefined
game.foundryAPI !== undefined
game.foundryPostgres !== undefined
```

---

## Deployment

### Module Packaging
Each module is independently packaged:
```
foundry-core-concepts.zip
foundry-api-control.zip
foundry-postgresql-storage.zip
foundry-core-srd-5e.zip
foundry-cfg-5e.zip
```

### Version Compatibility
- All modules are versioned together
- Extension modules declare minimum core concepts version
- CFG 5e requires specific SRD 5e version
- Breaking changes require major version bump

---

## Roadmap

### Core Concepts
- [ ] Visual type editor
- [ ] Rule debugging tools
- [ ] Mode transition animations
- [ ] Custom card deck editor

### SRD 5e
- [ ] Multiclassing system
- [ ] Feats system
- [ ] Backgrounds system
- [ ] Equipment rules
- [ ] Magic items system

### CFG 5e
- [ ] Behavior tree editor
- [ ] Visual waypoint editor
- [ ] Advanced combat system
- [ ] Skill challenges system
- [ ] Crafting system
- [ ] Reputation system

### API Control
- [ ] WebSocket support
- [ ] GraphQL endpoint
- [ ] API documentation generator
- [ ] Request logging/analytics

### PostgreSQL Storage
- [ ] Conflict resolution
- [ ] Offline mode
- [ ] Schema migration tools
- [ ] Data versioning

---

## Support

- **Documentation**: See README.md in each module
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Discord**: Crit-Fumble Server

---

**Architecture Version:** 2.0.0
**Last Updated:** 2025-01-19

**Changes from 1.0.0:**
- Renamed `foundry-behaviors` → `foundry-cfg-5e`
- Renamed `foundry-postgres-plugin` → `foundry-postgresql-storage`
- Created `foundry-core-srd-5e` module
- Behaviors now a system within CFG 5e (not standalone module)
- CFG 5e now depends on SRD 5e
- Clear distinction between Data Modules and TTRPG System Modules
