# Cypher System Integration Plan

## Current Architecture Understanding

### Existing Modules

1. **foundry-core-concepts** (`src/modules/foundry-core-concepts/`)
   - System-agnostic TTRPG framework
   - Provides: TypesRegistry, BooksManager, RulesEngine, ModesManager, DecksManager, SystemsManager
   - Accessible via `game.coreConcepts`
   - **CRITICAL**: This is our universal data layer

2. **foundry-core-concepts-api** (`src/modules/foundry-core-concepts-api/`)
   - RESTful API plugin for Core Concepts
   - Provides sync endpoints (import/export)
   - Authenticates with bridge server
   - Three modes: disabled, builtin, external
   - Accessible via `game.coreConceptsAPI`

3. **Cypher System (Official)** (`C:\Users\hobda\Projects\Crit-Fumble\Notes\.data\C2\foundryvtt\`)
   - mrkwnzl's official Cypher System (v3.4.3)
   - Provides: Character sheets, dice, tracking, packs
   - Size: ~3.5MB
   - **USE THIS, DON'T DUPLICATE**

4. **Web API** (`src/app/api/`)
   - `/api/foundry/instance` - Container management (start/stop)
   - `/api/foundry/sync` - Proxy to Foundry bridge
   - `/api/rpg/*` - Core Concepts data endpoints

### Current Issues

1. **CSRD Data in Wrong Location**
   - Currently: `src/modules/foundry-cfg-cypher/data/*.json`
   - Should be: Use Cypher System's existing packs OR register with TypesRegistry

2. **Duplication of Effort**
   - extracting CSRD data when Cypher System already has it
   - Not leveraging TypesRegistry for character creation

3. **Missing Integration**
   - foundry-cfg-cypher doesn't use Core Concepts managers
   - Core Concepts API doesn't know about Cypher-specific sync
   - Web API doesn't track game systems per instance

---

## Proposed Architecture

### Layer 1: Official Cypher System (Base)
```
C:\Users\hobda\Projects\Crit-Fumble\Notes\.data\C2\foundryvtt\
├── system.json (v3.4.3)
├── template.json (actor/item templates)
├── packs/
│   ├── macros
│   ├── markers
│   └── scenes
```
**Purpose**: Character sheets, mechanics, dice, tracking
**DO NOT MODIFY** - Use as-is

### Layer 2: Core Concepts (Universal Framework)
```
src/modules/foundry-core-concepts/
├── scripts/
│   ├── types-registry.mjs       ← Register Cypher types here
│   ├── systems-manager.mjs      ← Game system detection
│   └── entity-cards.mjs         ← Character sentence cards
```
**Purpose**: Universal TTRPG abstractions
**ACTION**: Extend to support Cypher System types

### Layer 3: CFG Cypher Bridge (Platform Integration)
```
src/modules/foundry-cfg-cypher/
├── scripts/
│   ├── init.mjs                 ← Main entry, register with Core Concepts
│   ├── cypher-system-adapter.mjs ← Adapt Cypher to Core Concepts
│   ├── platform-sync.mjs        ← Sync to web platform
│   └── csrd-types-loader.mjs    ← Load CSRD types into TypesRegistry
```
**Purpose**: Bridge Cypher System → Core Concepts → Platform
**ACTION**: Remove duplicate data, use TypesRegistry

### Layer 4: Core Concepts API (Sync Engine)
```
src/modules/foundry-core-concepts-api/
├── scripts/
│   ├── api-server.mjs
│   ├── endpoints/
│   │   ├── sync.mjs             ← Extend for Cypher System
│   │   └── cypher.mjs           ← NEW: Cypher-specific endpoints
```
**PURPOSE**: Bidirectional sync with web platform
**ACTION**: Add Cypher System entity mapping

### Layer 5: Web Platform API (Database Layer)
```
src/app/api/
├── foundry/
│   ├── instance/route.ts        ← ADD: installedSystems tracking
│   ├── sync/route.ts            ← Already proxies to bridge
│   └── systems/route.ts         ← NEW: List/manage systems
├── rpg/
│   └── creatures/route.ts       ← Already supports metadata.cypher
```
**PURPOSE**: Web-facing API with database
**ACTION**: Track game systems per instance

---

## Implementation Plan

### Phase 1: Remove Duplication

#### 1.1 Remove Local CSRD Data Files
**Current (WRONG)**:
```
src/modules/foundry-cfg-cypher/data/
├── descriptors.json (103 entries)
├── types.json (4 entries)
└── foci.json (142 entries)
```

**Proposed (RIGHT)**:
- Delete these files
- Use Cypher System's existing data
- Register types with Core Concepts TypesRegistry

#### 1.2 Create CSRD Types Loader
**File**: `src/modules/foundry-cfg-cypher/scripts/csrd-types-loader.mjs`
```javascript
/**
 * Load CSRD types from OG-CSRD into Core Concepts TypesRegistry
 * This runs ONCE at module initialization
 */
export class CSRDTypesLoader {
  async loadIntoRegistry(typesRegistry) {
    // Load from OG-CSRD JSON (external source)
    const csrdData = await this.fetchCSRDData();

    // Register descriptors
    for (const descriptor of csrdData.descriptors) {
      typesRegistry.registerType('cypher-descriptor', {
        id: descriptor.id,
        name: descriptor.name,
        category: descriptor.category,
        tags: descriptor.tags
      });
    }

    // Register types
    for (const type of csrdData.types) {
      typesRegistry.registerType('cypher-type', {
        id: type.id,
        name: type.name,
        description: type.description,
        tags: type.tags
      });
    }

    // Register foci
    for (const focus of csrdData.foci) {
      typesRegistry.registerType('cypher-focus', {
        id: focus.id,
        name: focus.name,
        category: focus.category,
        tags: focus.tags
      });
    }
  }

  async fetchCSRDData() {
    const csrdPath = 'C:\\Users\\hobda\\Projects\\Crit-Fumble\\Notes\\.data\\C2\\og-csrd\\db\\og-csrd.json';
    // Load and parse from external source
    // This keeps CSRD data separate from module
  }
}
```

**WHY**: TypesRegistry is the single source of truth for types

### Phase 2: Integrate with Core Concepts

#### 2.1 Update foundry-cfg-cypher/init.mjs
```javascript
import { CSRDTypesLoader } from './csrd-types-loader.mjs';
import { CypherSystemAdapter } from './cypher-system-adapter.mjs';
import { CypherPlatformSync } from './platform-sync.mjs';

Hooks.once('init', async () => {
  // Wait for Core Concepts to initialize
  Hooks.once('coreConcepts.ready', async () => {
    // Load CSRD types into TypesRegistry
    const loader = new CSRDTypesLoader();
    await loader.loadIntoRegistry(game.coreConcepts.types);

    // Register Cypher System adapter
    const adapter = new CypherSystemAdapter();
    game.coreConcepts.systems.registerAdapter('cyphersystem', adapter);

    // Initialize platform sync
    game.cfgCypher = {
      adapter,
      sync: new CypherPlatformSync(),

      // Convenience methods
      getDescriptors() {
        return game.coreConcepts.types.getByCategory('cypher-descriptor');
      },

      getTypes() {
        return game.coreConcepts.types.getByCategory('cypher-type');
      },

      getFoci() {
        return game.coreConcepts.types.getByCategory('cypher-focus');
      },

      buildSentence(descriptor, type, focus) {
        return `I am a ${descriptor} ${type} who ${focus}`;
      }
    };
  });
});
```

**WHY**: Leverage Core Concepts instead of duplicating functionality

#### 2.2 Create Cypher System Adapter
**File**: `src/modules/foundry-cfg-cypher/scripts/cypher-system-adapter.mjs`
```javascript
/**
 * Adapts Cypher System to Core Concepts
 * Maps Cypher actors/items to RpgCreature/RpgItem
 */
export class CypherSystemAdapter {
  mapActorToCreature(actor) {
    // PC Actor
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
            recoveries: actor.system.combat?.recoveries,
            armor: actor.system.combat?.armor
          },
          foundryId: actor.id,
          systemName: 'cyphersystem'
        },
        tags: this.extractTags(actor)
      };
    }

    // NPC Actor
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
            damage: actor.system.combat?.damage,
            armor: actor.system.combat?.armor,
            modifications: actor.system.basic?.modifications
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
          form: item.system.basic?.form,
          effect: item.system.basic?.effect,
          depletion: item.system.basic?.depletion
        },
        foundryId: item.id
      },
      tags: this.extractTags(item)
    };
  }

  mapSceneToBoard(scene) {
    return {
      name: scene.name,
      description: scene.navName || scene.name,
      backgroundUrl: scene.background?.src,
      width: scene.width,
      height: scene.height,
      gridSize: scene.grid.size,
      gridType: scene.grid.type === 1 ? 'square' : 'hex',
      tokens: scene.tokens.contents.map(t => this.mapToken(t)),
      metadata: {
        foundryId: scene.id,
        systemName: 'cyphersystem',
        cypher: {
          sceneType: 'scene',
          tiles: scene.tiles.contents.map(t => this.mapTile(t)),
          walls: scene.walls.contents,
          lights: scene.lights.contents
        }
      },
      tags: this.extractTags(scene)
    };
  }

  extractTags(document) {
    const tags = ['cyphersystem'];
    if (document.folder) tags.push(document.folder.name);
    if (document.flags?.tags) tags.push(...document.flags.tags);
    return [...new Set(tags)];
  }
}
```

**WHY**: Adapter pattern keeps system-specific logic separate

### Phase 3: Extend Core Concepts API

#### 3.1 Add Cypher-Specific Endpoints
**File**: `src/modules/foundry-core-concepts-api/scripts/endpoints/cypher.mjs`
```javascript
/**
 * Cypher System-specific API endpoints
 */
export function registerCypherRoutes(app, config) {
  /**
   * GET /cypher/types
   * Get all Cypher System types (descriptors, types, foci)
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
   * GET /cypher/types/filtered
   * Get types filtered by game mode (numenera, the-strange, etc.)
   */
  app.get('/cypher/types/filtered', async (req, res) => {
    const { gameMode } = req.query;

    // Filter types based on game mode
    const filtered = game.cfgCypher.dataLoader.getFilteredOptions(gameMode);

    res.json(filtered);
  });

  /**
   * POST /cypher/sentence/build
   * Build a character sentence
   */
  app.post('/cypher/sentence/build', async (req, res) => {
    const { descriptor, type, focus } = req.body;

    const sentence = game.cfgCypher.buildSentence(descriptor, type, focus);

    res.json({ sentence });
  });
}
```

#### 3.2 Update sync.mjs to Use Adapter
**File**: `src/modules/foundry-core-concepts-api/scripts/endpoints/sync.mjs` (UPDATE)
```javascript
async function importActors(rpgWorldId, options = {}) {
  const actors = options.ids
    ? options.ids.map(id => game.actors.get(id)).filter(a => a)
    : game.actors.contents;

  const result = { count: 0, created: 0, updated: 0, errors: [] };

  for (const actor of actors) {
    try {
      // USE ADAPTER (system-agnostic)
      const adapter = game.coreConcepts.systems.getAdapter(game.system.id);
      if (!adapter) {
        throw new Error(`No adapter found for system: ${game.system.id}`);
      }

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

**WHY**: System-agnostic sync works for D&D 5e AND Cypher System

### Phase 4: Update Web API

#### 4.1 Track Game Systems per Instance
**File**: `src/app/api/foundry/instance/route.ts` (UPDATE)
```typescript
/**
 * GET /api/foundry/instance - Include installed systems
 */
export async function GET(request: NextRequest) {
  // ... existing auth code ...

  // Get instance from database
  const instance = await prisma.foundryInstance.findFirst({
    where: { userId: user.id },
    select: {
      id: true,
      installedSystems: true,
      status: true,
      url: true
    }
  });

  const isRunning = await isFoundryRunning();
  const stats = isRunning ? await getFoundryStats() : null;

  return NextResponse.json({
    isRunning,
    instance,
    stats,
    environment: isDocker ? 'docker' : 'development',
  });
}
```

#### 4.2 Create Systems Management Endpoint
**File**: `src/app/api/foundry/systems/route.ts` (NEW)
```typescript
/**
 * GET /api/foundry/systems - List available game systems
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Query Foundry instance for installed systems
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
 * POST /api/foundry/systems - Install a game system
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { systemId, version } = body;

  if (!['dnd5e', 'cyphersystem'].includes(systemId)) {
    return NextResponse.json(
      { error: 'Unsupported system' },
      { status: 400 }
    );
  }

  // Install system via Foundry bridge
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

---

## Data Flow

### Character Creation (Web → Foundry)
```
1. User visits web app: https://crit-fumble.com/characters/new
2. Web app fetches types: GET /api/foundry/systems/cypher/types
3. Web API proxies to Foundry: GET /cypher/types
4. Foundry returns types from Core Concepts TypesRegistry
5. User selects: descriptor="Clever", type="Nano", focus="Talks to Machines"
6. Web app creates character: POST /api/rpg/creatures
7. Database stores with metadata.cypher
8. Foundry sync imports: GET /api/foundry/sync?mode=export
9. Foundry creates actor using Cypher System adapter
```

### Foundry → Web Sync
```
1. GM creates character in Foundry VTT (Cypher System)
2. Foundry hook fires: createActor
3. CFG Cypher Bridge calls adapter: mapActorToCreature()
4. Adapter creates Core Concepts creature with metadata.cypher
5. Platform sync sends to web: POST https://crit-fumble.com/api/foundry/sync
6. Web API stores in PostgreSQL RpgCreature table
7. User sees character on web app
```

---

## Migration Steps

1. **Stop using local CSRD JSON files**
   - Keep `LICENSE-CSOL` for attribution
   - Remove `data/*.json` files
   - Update `module.json` to remove packs

2. **Register types with Core Concepts**
   - Load CSRD data from OG-CSRD (external source)
   - Register with TypesRegistry on module init
   - Access via `game.coreConcepts.types`

3. **Use adapters for sync**
   - Create `CypherSystemAdapter`
   - Register with `SystemsManager`
   - Update sync endpoints to use adapters

4. **Update web API**
   - Add `/api/foundry/systems` endpoint
   - Track `installedSystems` in database
   - Filter sync by game system

5. **Test multi-system support**
   - Create D&D 5e world → sync
   - Create Cypher System world → sync
   - Verify both work independently

---

## Success Criteria

- [ ] No duplicate CSRD data in module
- [ ] CSRD types loaded into Core Concepts TypesRegistry
- [ ] Character creation uses TypesRegistry
- [ ] Sync works for both D&D 5e and Cypher System
- [ ] Web API tracks `installedSystems` per instance
- [ ] Database schema supports `metadata.cypher`
- [ ] March 2026 deadline: Both systems fully functional

---

## Files to Modify

### Delete
- `src/modules/foundry-cfg-cypher/data/descriptors.json`
- `src/modules/foundry-cfg-cypher/data/types.json`
- `src/modules/foundry-cfg-cypher/data/foci.json`
- `src/modules/foundry-cfg-cypher/scripts/data-loader.mjs` (replaced by TypesRegistry)
- `src/modules/foundry-cfg-cypher/scripts/extract-csrd-data.mjs` (not needed anymore)

### Create
- `src/modules/foundry-cfg-cypher/scripts/csrd-types-loader.mjs`
- `src/modules/foundry-cfg-cypher/scripts/cypher-system-adapter.mjs`
- `src/modules/foundry-core-concepts-api/scripts/endpoints/cypher.mjs`
- `src/app/api/foundry/systems/route.ts`

### Modify
- `src/modules/foundry-cfg-cypher/scripts/init.mjs` (use Core Concepts)
- `src/modules/foundry-cfg-cypher/module.json` (remove packs)
- `src/modules/foundry-core-concepts/scripts/systems-manager.mjs` (add adapter registration)
- `src/modules/foundry-core-concepts-api/scripts/endpoints/sync.mjs` (use adapters)
- `src/app/api/foundry/instance/route.ts` (return installedSystems)
- `prisma/schema.prisma` (already has installedSystems field)

### Keep
- `src/modules/foundry-cfg-cypher/LICENSE` (MIT for module code)
- `src/modules/foundry-cfg-cypher/LICENSE-CSOL` (CSOL for CSRD attribution)
- `src/modules/foundry-cfg-cypher/scripts/character-sentence.mjs` (sentence building logic)
- `src/modules/foundry-cfg-cypher/scripts/platform-sync.mjs` (if exists)

---

## Timeline

- **Week 1**: Remove duplicate CSRD data, create CSRD types loader
- **Week 2**: Create Cypher System adapter, integrate with Core Concepts
- **Week 3**: Extend Core Concepts API with Cypher endpoints
- **Week 4**: Update web API for multi-system support
- **Week 5**: Testing and bug fixes
- **Week 6**: Documentation and deployment

**Target**: Complete by end of Week 6
**Deadline**: March 2026 (both systems fully operational)
