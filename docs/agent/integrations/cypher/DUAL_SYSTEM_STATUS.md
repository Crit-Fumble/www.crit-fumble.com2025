# Dual System Support Status (D&D 5e + Cypher System)

**Last Updated**: November 24, 2025
**Target**: March 2026 Release
**Status**: ✅ Foundation Complete, 🔄 Integration In Progress

---

## Executive Summary

We have successfully established the foundation for supporting both D&D 5e and Cypher System in FoundryVTT, meeting the critical March 2026 deadline requirement.

### Architecture Pattern

Both systems follow the same proven pattern:

```
Official Game System (Base Layer)
        ↓
Core Concepts (Universal Framework)
        ↓
CFG Bridge Module (System-Specific Adapter)
        ↓
Core Concepts API (Sync Engine)
        ↓
Web Platform (Database Layer)
```

This architecture ensures:
- **No duplicate effort** - Use official systems as-is
- **System-agnostic sync** - Same code handles both systems
- **Maintainability** - Updates handled upstream
- **Extensibility** - Easy to add more systems

---

## ✅ Completed Work

### 1. Foundry Core Concepts Module
**Location**: `src/modules/foundry-core-concepts/`
**Purpose**: System-agnostic TTRPG framework

**Features**:
- TypesRegistry - Universal type system
- SystemsManager - Game system detection and adapter registration
- EntityCardsManager - Character/creature cards
- BooksManager, DecksManager, ModesManager
- RulesEngine, PlayersManager, TeamsManager
- AssetsManager, RegionEventsManager

**Status**: ✅ Complete and working

### 2. Foundry Core Concepts API Module
**Location**: `src/modules/foundry-core-concepts-api/`
**Purpose**: RESTful API for sync with web platform

**Features**:
- API Server with JWT authentication
- Sync endpoints (import/export)
- Three modes: disabled, builtin, external
- System-agnostic entity mapping
- Bridge server authentication

**Status**: ✅ Complete, needs Cypher-specific endpoints

### 3. Foundry CFG 5e Bridge (Reference Implementation)
**Location**: `src/modules/foundry-cfg-5e/`
**Purpose**: D&D 5e adapter

**Pattern**:
```javascript
// init.mjs - Main entry point
- Verify game system is dnd5e
- Check for Core Concepts dependency
- Register with Core Concepts
- Initialize platform sync

// dnd5e-mapper.mjs - System adapter
- Map official dnd5e config to Core Concepts
- No duplicate SRD data
- Use CONFIG.DND5E from official system
- Export mapped abilities, skills, classes, etc.
```

**Key Insight**: D&D 5e module does NOT duplicate SRD data. It maps from the official system's `CONFIG.DND5E` object. This is the pattern we should follow for Cypher System.

**Status**: ✅ Complete and working

### 4. Foundry CFG Cypher Bridge (Initial Implementation)
**Location**: `src/modules/foundry-cfg-cypher/`
**Purpose**: Cypher System adapter

**Completed**:
- ✅ Module structure and manifest
- ✅ CSRD data extraction script
- ✅ Character sentence builder utility
- ✅ Data loader for CSRD content
- ✅ CSOL license attribution (proper)
- ✅ Platform sync skeleton code
- ✅ Core Concepts mapping framework

**Status**: 🔄 Needs refactoring to follow 5e pattern

### 5. Database Schema
**Location**: `prisma/schema.prisma`

**Multi-System Support**:
```prisma
model FoundryInstance {
  installedSystems Json @default("[]") @map("installed_systems") @db.JsonB
  // Example: ["dnd5e", "cyphersystem"]
}

model FoundryWorldSnapshot {
  gameSystem    String  @default("dnd5e") @map("game_system")
  systemVersion String? @map("system_version")

  @@index([gameSystem])
}

model RpgCreature {
  // ... existing fields ...

  metadata Json @default("{}") @db.JsonB
  // metadata.cypher stores Cypher System-specific data
  // metadata.dnd5e stores D&D 5e-specific data
}
```

**Status**: ✅ Schema supports both systems

### 6. Web API Foundation
**Location**: `src/app/api/foundry/`

**Completed**:
- ✅ `/api/foundry/instance` - Container management (start/stop)
- ✅ `/api/foundry/sync` - Proxy to Foundry bridge
- ✅ `/api/foundry/activity` - Activity tracking
- ✅ `/api/foundry/snapshot` - World snapshots
- ✅ `/api/foundry/assets` - Asset management

**Status**: ✅ Foundation complete, needs `/api/foundry/systems` endpoint

---

## 🔄 Current Issue: CSRD Data Duplication

### Problem

The current Cypher module duplicates CSRD data locally:
```
src/modules/foundry-cfg-cypher/data/
├── descriptors.json (103 entries)
├── types.json (4 entries)
└── foci.json (142 entries)
```

This violates our architecture principle: **Use official systems, don't duplicate**.

### Solution (Following 5e Pattern)

The D&D 5e module shows us the right pattern:
```javascript
// D&D 5e (CORRECT)
this.config = CONFIG.DND5E; // Use official system's config
this.mapAbilities();        // Map from official config
this.mapSkills();           // Map from official config
// NO local SRD data files!
```

For Cypher System, we should:
```javascript
// Cypher System (CORRECT)
this.config = CONFIG.CYPHERSYSTEM; // Use official system's config
this.loadCSRDFromOGCSRD();         // Load from external OG-CSRD
this.registerWithTypeRegistry();   // Register with Core Concepts
// NO local CSRD data files!
```

---

## 📋 Implementation Plan

### Phase 1: Refactor Cypher Module (Week 1)

#### 1.1 Remove Duplicate CSRD Data
- [x] Keep `LICENSE-CSOL` for attribution
- [ ] Remove `data/descriptors.json`
- [ ] Remove `data/types.json`
- [ ] Remove `data/foci.json`
- [ ] Remove `scripts/data-loader.mjs`
- [ ] Remove `scripts/extract-csrd-data.mjs`
- [ ] Update `module.json` to remove packs section

#### 1.2 Create Cypher System Adapter (Following 5e Pattern)
**File**: `src/modules/foundry-cfg-cypher/scripts/cypher-system-adapter.mjs`

```javascript
export class CypherSystemAdapter {
  constructor() {
    this.config = null;
    this.csrdTypes = {
      descriptors: [],
      types: [],
      foci: []
    };
  }

  async initialize() {
    // Get official Cypher System config
    this.config = CONFIG.CYPHERSYSTEM;

    if (!this.config) {
      console.error('Official Cypher System config not found!');
      return false;
    }

    // Load CSRD data from external source
    await this.loadCSRDFromOGCSRD();

    return true;
  }

  async loadCSRDFromOGCSRD() {
    // Load from: C:\Users\hobda\Projects\Crit-Fumble\Notes\.data\C2\og-csrd\db\og-csrd.json
    // This keeps CSRD data external to the module
    const csrdPath = 'C:\\Users\\hobda\\Projects\\Crit-Fumble\\Notes\\.data\\C2\\og-csrd\\db\\og-csrd.json';
    // Fetch and parse
    // Extract descriptors, types, foci
    // Store in this.csrdTypes
  }

  registerWithCoreСoncepts() {
    // Register types with game.coreConcepts.types
    for (const descriptor of this.csrdTypes.descriptors) {
      game.coreConcepts.types.registerType('cypher-descriptor', {
        id: descriptor.id,
        name: descriptor.name,
        category: descriptor.category,
        tags: descriptor.tags
      });
    }
    // ... same for types and foci
  }

  mapActorToCreature(actor) {
    // Map Cypher actor to Core Concepts creature
    if (actor.type === 'pc') {
      return {
        name: actor.name,
        race: actor.system.basic?.descriptor || '',
        class: actor.system.basic?.type || '',
        level: actor.system.basic?.tier || 1,
        imageUrl: actor.img,
        stats: {
          might: actor.system.pools?.might || {},
          speed: actor.system.pools?.speed || {},
          intellect: actor.system.pools?.intellect || {}
        },
        metadata: {
          cypher: {
            descriptor: actor.system.basic?.descriptor,
            type: actor.system.basic?.type,
            focus: actor.system.basic?.focus,
            tier: actor.system.basic?.tier,
            pools: actor.system.pools,
            damageTrack: actor.system.combat?.damageTrack,
            recoveries: actor.system.combat?.recoveries
          },
          foundryId: actor.id,
          systemName: 'cyphersystem'
        },
        tags: this.extractTags(actor)
      };
    }

    if (actor.type === 'npc') {
      return {
        name: actor.name,
        level: actor.system.basic?.level || 1,
        imageUrl: actor.img,
        stats: {
          health: actor.system.combat?.health || 0,
          damage: actor.system.combat?.damage || 0,
          armor: actor.system.combat?.armor || 0
        },
        metadata: {
          cypher: {
            level: actor.system.basic?.level,
            health: actor.system.combat?.health,
            damage: actor.system.combat?.damage
          },
          foundryId: actor.id,
          systemName: 'cyphersystem'
        },
        tags: this.extractTags(actor)
      };
    }

    return null;
  }

  mapItemToRpgItem(item) {
    return {
      name: item.name,
      title: item.name,
      description: item.system.description || '',
      thingType: item.type,
      properties: item.system,
      imageUrl: item.img,
      systemName: 'cyphersystem',
      metadata: {
        cypher: {
          itemType: item.type,
          level: item.system.basic?.level,
          effect: item.system.basic?.effect
        },
        foundryId: item.id
      },
      tags: this.extractTags(item)
    };
  }

  extractTags(document) {
    const tags = ['cyphersystem'];
    if (document.folder) tags.push(document.folder.name);
    return [...new Set(tags)];
  }
}
```

#### 1.3 Update init.mjs (Following 5e Pattern)
```javascript
import { CypherSystemAdapter } from './cypher-system-adapter.mjs';
import { CharacterSentenceBuilder } from './character-sentence.mjs';

Hooks.once('init', async () => {
  // Verify game system is cyphersystem
  if (game.system.id !== 'cyphersystem') {
    ui.notifications.error('CFG Cypher Bridge requires Cypher System!');
    return;
  }

  // Check for Core Concepts dependency
  if (!game.modules.get('foundry-core-concepts')?.active) {
    ui.notifications.error('CFG Cypher Bridge requires Core Concepts module!');
    return;
  }

  // Register API on game object
  game.cfgCypher = {
    adapter: null,
    sentenceBuilder: CharacterSentenceBuilder
  };
});

Hooks.once('ready', async () => {
  // Initialize adapter
  const adapter = new CypherSystemAdapter();
  await adapter.initialize();
  await adapter.registerWithCoreСoncepts();

  // Register adapter with Core Concepts
  game.coreConcepts.systems.registerAdapter('cyphersystem', adapter);

  game.cfgCypher.adapter = adapter;

  // Convenience methods
  game.cfgCypher.getDescriptors = () => {
    return game.coreConcepts.types.getByCategory('cypher-descriptor');
  };

  game.cfgCypher.getTypes = () => {
    return game.coreConcepts.types.getByCategory('cypher-type');
  };

  game.cfgCypher.getFoci = () => {
    return game.coreConcepts.types.getByCategory('cypher-focus');
  };
});
```

### Phase 2: Extend Core Concepts API (Week 2)

#### 2.1 Add Cypher-Specific Endpoints
**File**: `src/modules/foundry-core-concepts-api/scripts/endpoints/cypher.mjs` (NEW)

```javascript
export function registerCypherRoutes(app, config) {
  /**
   * GET /cypher/types
   * Get all Cypher System types from TypesRegistry
   */
  app.get('/cypher/types', async (req, res) => {
    const { category } = req.query;

    const types = {
      descriptors: game.coreConcepts.types.getByCategory('cypher-descriptor'),
      types: game.coreConcepts.types.getByCategory('cypher-type'),
      foci: game.coreConcepts.types.getByCategory('cypher-focus')
    };

    if (category) {
      return res.json(types[category] || []);
    }

    res.json(types);
  });

  /**
   * POST /cypher/sentence/build
   * Build character sentence
   */
  app.post('/cypher/sentence/build', async (req, res) => {
    const { descriptor, type, focus } = req.body;
    const sentence = game.cfgCypher.sentenceBuilder.build({ descriptor, type, focus });
    res.json({ sentence });
  });
}
```

#### 2.2 Update sync.mjs to Use Adapters
**File**: `src/modules/foundry-core-concepts-api/scripts/endpoints/sync.mjs` (UPDATE)

Change hardcoded D&D 5e mapping to use adapters:

```javascript
async function importActors(rpgWorldId, options = {}) {
  const actors = options.ids
    ? options.ids.map(id => game.actors.get(id)).filter(a => a)
    : game.actors.contents;

  const result = { count: 0, created: 0, updated: 0, errors: [] };

  // GET ADAPTER (system-agnostic!)
  const adapter = game.coreConcepts.systems.getAdapter(game.system.id);
  if (!adapter) {
    throw new Error(`No adapter found for system: ${game.system.id}`);
  }

  for (const actor of actors) {
    try {
      // USE ADAPTER
      const creatureData = adapter.mapActorToCreature(actor);
      if (!creatureData) {
        continue; // Skip unsupported actor types
      }

      creatureData.worldId = rpgWorldId;

      // Send to platform
      await sendToCritFumbleAPI('/api/creatures', 'POST', creatureData);

      result.created++;
    } catch (error) {
      result.errors.push({ actorId: actor.id, error: error.message });
    }
    result.count++;
  }

  return result;
}
```

**WHY**: This makes sync work for BOTH D&D 5e and Cypher System with the same code!

### Phase 3: Web API Updates (Week 3)

#### 3.1 Create Systems Management Endpoint
**File**: `src/app/api/foundry/systems/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isOwner } from '@/lib/admin';

const FOUNDRY_BRIDGE_URL = process.env.FOUNDRY_BRIDGE_URL || 'http://localhost:30000';
const FOUNDRY_API_TOKEN = process.env.FOUNDRY_API_TOKEN;

/**
 * GET /api/foundry/systems
 * List installed game systems
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Query Foundry instance
  const response = await fetch(`${FOUNDRY_BRIDGE_URL}/systems/list`, {
    headers: {
      'Authorization': `Bearer ${FOUNDRY_API_TOKEN}`
    }
  });

  const systems = await response.json();

  return NextResponse.json({
    systems,
    supported: ['dnd5e', 'cyphersystem']
  });
}

/**
 * POST /api/foundry/systems
 * Install a game system
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.critUser.findUnique({
    where: { id: session.user.id }
  });

  if (!user || !isOwner(user)) {
    return NextResponse.json(
      { error: 'Forbidden - Owner access required' },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { systemId, version } = body;

  if (!['dnd5e', 'cyphersystem'].includes(systemId)) {
    return NextResponse.json(
      { error: 'Unsupported system' },
      { status: 400 }
    );
  }

  // Install via Foundry bridge
  const response = await fetch(`${FOUNDRY_BRIDGE_URL}/systems/install`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${FOUNDRY_API_TOKEN}`
    },
    body: JSON.stringify({ systemId, version })
  });

  const result = await response.json();

  // Update database
  await prisma.foundryInstance.updateMany({
    where: { userId: session.user.id },
    data: {
      installedSystems: {
        push: systemId
      }
    }
  });

  return NextResponse.json(result);
}
```

#### 3.2 Update Instance Endpoint
**File**: `src/app/api/foundry/instance/route.ts` (UPDATE)

Add installed systems to GET response:

```typescript
export async function GET(request: NextRequest) {
  // ... existing auth code ...

  // Get instance from database
  const instance = await prisma.foundryInstance.findFirst({
    where: { userId: user.id },
    select: {
      id: true,
      installedSystems: true, // ADD THIS
      status: true,
      url: true
    }
  });

  const isRunning = await isFoundryRunning();

  return NextResponse.json({
    isRunning,
    instance, // Now includes installedSystems
    stats,
    environment: isDocker ? 'docker' : 'development'
  });
}
```

### Phase 4: Testing (Week 4)

#### 4.1 Unit Tests
- [ ] Test Cypher System adapter mapping
- [ ] Test character sentence builder
- [ ] Test TypesRegistry integration

#### 4.2 Integration Tests
- [ ] Create D&D 5e world → sync
- [ ] Create Cypher System world → sync
- [ ] Verify both systems work independently
- [ ] Verify database correctly stores metadata.cypher vs metadata.dnd5e

#### 4.3 E2E Tests
- [ ] Full workflow: Create world, campaign, character (both systems)
- [ ] Verify Foundry bridge correctly routes requests
- [ ] Test system installation via web API

---

## Success Criteria

### March 2026 Release Requirements

✅ **Foundation**:
- [x] Core Concepts module (system-agnostic)
- [x] Core Concepts API (sync engine)
- [x] Multi-system database schema
- [x] CFG 5e Bridge (reference implementation)
- [x] CFG Cypher Bridge (initial implementation)

🔄 **Integration** (In Progress):
- [ ] Cypher adapter follows 5e pattern
- [ ] No duplicate CSRD data
- [ ] TypesRegistry integration
- [ ] System-agnostic sync endpoints
- [ ] Web API system management

❌ **Testing** (Not Started):
- [ ] Both systems work in parallel
- [ ] Database correctly stores system-specific metadata
- [ ] Web UI for system selection

---

## Data Flow Examples

### D&D 5e Character Creation
```
1. GM creates world (system: dnd5e)
2. Player creates character in Foundry
3. Foundry hook fires: createActor
4. CFG 5e adapter: mapActorToCreature()
5. Creates creature with metadata.dnd5e = { class, race, level, hp, ac, ... }
6. Platform sync: POST /api/foundry/sync
7. Web stores in RpgCreature table
8. Player sees character on web
```

### Cypher Character Creation
```
1. GM creates world (system: cyphersystem)
2. Player creates character in Foundry
3. Foundry hook fires: createActor
4. CFG Cypher adapter: mapActorToCreature()
5. Creates creature with metadata.cypher = { descriptor, type, focus, tier, pools, ... }
6. Platform sync: POST /api/foundry/sync
7. Web stores in RpgCreature table
8. Player sees character on web
```

**Key**: Same database table, different metadata field!

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│           Crit-Fumble Web Platform              │
│        (PostgreSQL + Next.js + Prisma)          │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │         RpgCreature Table                │  │
│  │  ┌────────────────────────────────────┐  │  │
│  │  │ metadata: {                        │  │  │
│  │  │   dnd5e: { class, race, hp, ... }, │  │  │
│  │  │   cypher: { descriptor, type, ... }│  │  │
│  │  │ }                                   │  │  │
│  │  └────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────┘
                      │ HTTP API (sync)
                      │
┌─────────────────────▼───────────────────────────┐
│         Foundry Core Concepts API               │
│          (RESTful sync engine)                  │
│                                                  │
│  ┌─────────────────┬──────────────────────────┐ │
│  │ Sync Endpoints  │  Cypher Endpoints        │ │
│  │ (System-agnostic│  (Cypher-specific)       │ │
│  │  via adapters)  │  /cypher/types, etc.     │ │
│  └─────────────────┴──────────────────────────┘ │
└─────────────────────┬───────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────┐
│        Foundry Core Concepts Module             │
│         (System-agnostic framework)             │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │  TypesRegistry  SystemsManager  etc.    │  │
│  └──────────────────────────────────────────┘  │
└──────────┬────────────────────────────┬─────────┘
           │                            │
┌──────────▼──────────┐    ┌────────────▼────────┐
│  CFG 5e Bridge      │    │ CFG Cypher Bridge   │
│  (D&D 5e adapter)   │    │ (Cypher adapter)    │
│                     │    │                     │
│  DnD5eMapper        │    │ CypherSystemAdapter │
│  mapActorToCreature │    │ mapActorToCreature  │
└──────────┬──────────┘    └────────────┬────────┘
           │                            │
┌──────────▼──────────┐    ┌────────────▼────────┐
│ Official D&D 5e     │    │ Official Cypher     │
│ System (Foundry)    │    │ System (mrkwnzl)    │
│                     │    │                     │
│ CONFIG.DND5E        │    │ CONFIG.CYPHERSYSTEM │
│ 451MB, v5.2.0       │    │ ~3.5MB, v3.4.3      │
└─────────────────────┘    └─────────────────────┘
```

---

## Key Takeaways

1. **Follow the 5e Pattern**: D&D 5e module shows us the right way - no duplicate data, use adapters
2. **External Data Sources**: CSRD data should be loaded from OG-CSRD at runtime, not bundled
3. **TypesRegistry is Key**: All types (descriptors, classes, races, etc.) go through TypesRegistry
4. **Adapters Enable Multi-System**: Same sync code works for all systems via adapter pattern
5. **Database Schema is Ready**: `metadata.cypher` and `metadata.dnd5e` coexist peacefully

---

## Next Actions

1. **Immediate** (This Week):
   - [ ] Remove duplicate CSRD data files from cypher module
   - [ ] Create CypherSystemAdapter following 5e pattern
   - [ ] Update init.mjs to use adapter and TypesRegistry

2. **Short Term** (Next 2 Weeks):
   - [ ] Extend Core Concepts API with Cypher endpoints
   - [ ] Update sync.mjs to use adapters (system-agnostic)
   - [ ] Add web API /api/foundry/systems endpoint

3. **Testing** (Week 4):
   - [ ] Test both systems in parallel
   - [ ] Verify database metadata separation
   - [ ] E2E tests for character creation

4. **March 2026 Release**:
   - [ ] Web UI for system selection
   - [ ] Documentation for admins/GMs
   - [ ] Performance testing with both systems

---

**Status**: Foundation is solid. Integration work in progress. On track for March 2026 release.
