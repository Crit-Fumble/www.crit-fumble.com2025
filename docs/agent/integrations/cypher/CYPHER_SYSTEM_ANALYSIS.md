# Cypher System Integration Analysis

**Date**: November 24, 2025
**Goal**: Support D&D 5e AND Cypher System on FoundryVTT hosting by March 2026
**Status**: Planning

---

## Overview

The Cypher System is a flexible RPG system that powers games like Numenera, The Strange, Predation, and Gods of the Fall. We need to support it alongside D&D 5e in our FoundryVTT hosting infrastructure.

**Reference System**: `cyphersystem` by Marko Wenzel (mrkwnzl)
- **Version**: 3.4.3
- **FoundryVTT Compatibility**: v13+
- **License**: Unknown (need to verify)
- **Repository**: https://github.com/mrkwnzl/cyphersystem-foundryvtt

---

## Architecture Comparison

### D&D 5e Architecture

```
┌─────────────────────────────────────────────────────┐
│        Crit-Fumble Web Platform (Next.js)           │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP API
┌──────────────────────▼──────────────────────────────┐
│              Foundry VTT Instance                   │
│  ┌──────────────────────────────────────────────┐  │
│  │  D&D 5e System (Official - 451MB)           │  │
│  └───────────────────┬──────────────────────────┘  │
│  ┌───────────────────▼──────────────────────────┐  │
│  │  Core Concepts (Universal Framework)        │  │
│  └───────────────────┬──────────────────────────┘  │
│  ┌───────────────────▼──────────────────────────┐  │
│  │  CFG 5e Bridge (Platform Sync)              │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Cypher System Architecture (Planned)

```
┌─────────────────────────────────────────────────────┐
│        Crit-Fumble Web Platform (Next.js)           │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP API
┌──────────────────────▼──────────────────────────────┐
│              Foundry VTT Instance                   │
│  ┌──────────────────────────────────────────────┐  │
│  │  Cypher System (mrkwnzl - ~3.5MB est.)      │  │
│  └───────────────────┬──────────────────────────┘  │
│  ┌───────────────────▼──────────────────────────┐  │
│  │  Core Concepts (Universal Framework)        │  │
│  └───────────────────┬──────────────────────────┘  │
│  ┌───────────────────▼──────────────────────────┐  │
│  │  CFG Cypher Bridge (Platform Sync)          │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## Cypher System Data Model

Based on `template.json` from the official Cypher System module:

### Actor Types

| Type | Description | Core Concepts Mapping |
|------|-------------|----------------------|
| `pc` | Player Character | `RpgCreature` (type: "pc") |
| `npc` | Non-Player Character | `RpgCreature` (type: "npc") |
| `companion` | Companion/follower | `RpgCreature` (type: "companion") |
| `community` | Community/organization | `RpgCreature` (type: "community") |
| `vehicle` | Vehicle | `RpgCreature` (type: "vehicle") |
| `marker` | Map marker/counter | `RpgCreature` (type: "marker") |

### Item Types

| Type | Description | Core Concepts Mapping |
|------|-------------|----------------------|
| `ability` | Character ability | `RpgItem` (type: "ability") |
| `ammo` | Ammunition | `RpgItem` (type: "ammo") |
| `armor` | Armor | `RpgItem` (type: "armor") |
| `artifact` | Artifact | `RpgItem` (type: "artifact") |
| `attack` | Attack/weapon | `RpgItem` (type: "weapon") |
| `cypher` | Cypher (temporary item) | `RpgItem` (type: "cypher") |
| `equipment` | Equipment/gear | `RpgItem` (type: "equipment") |
| `lasting-damage` | Lasting damage effect | `RpgItem` (type: "effect") |
| `material` | Crafting material | `RpgItem` (type: "material") |
| `oddity` | Oddity (flavor item) | `RpgItem` (type: "oddity") |
| `power-shift` | Power shift | `RpgItem` (type: "power-shift") |
| `recursion` | Recursion (The Strange) | `RpgItem` (type: "recursion") |
| `skill` | Skill | `RpgItem` (type: "skill") |
| `tag` | Tag modifier | `RpgItem` (type: "tag") |

---

## Cypher System Core Mechanics

### Character Sentence Structure

**Format**: "I am a [DESCRIPTOR] [TYPE] who [FOCUS]"

**Example**: "I am a *Clever* *Nano* who *Talks to Machines*"

**Fields in PC Actor**:
```json
{
  "basic": {
    "descriptor": "Clever",
    "type": "Nano",
    "focus": "Talks to Machines",
    "additionalSentence": "",  // Optional extension
    "tier": 1,  // Character tier (1-6)
    "effort": 1,  // Effort stat
    "xp": 0,  // Experience points
    "gmiRange": 1  // GM Intrusion range
  }
}
```

### Stat Pools

Cypher uses 3 main pools + optional additional pool:

```json
{
  "pools": {
    "might": {
      "value": 10,  // Current
      "max": 10,    // Maximum
      "edge": 0     // Edge (reduction cost)
    },
    "speed": {
      "value": 10,
      "max": 10,
      "edge": 0
    },
    "intellect": {
      "value": 10,
      "max": 10,
      "edge": 0
    },
    "additional": {  // Optional (e.g., Sanity in horror games)
      "value": 3,
      "max": 3,
      "edge": 0
    }
  }
}
```

**Mapping to Core Concepts**:
- Store as `metadata.cypherPools` in `RpgCreature`
- Use attributes for current/max values
- Track edge separately

### Damage Track

Cypher uses a 4-state damage track instead of HP:

```json
{
  "combat": {
    "damageTrack": {
      "state": "Hale",  // Hale → Impaired → Debilitated → Dead
      "applyImpaired": true,  // Apply penalties
      "applyDebilitated": true
    }
  }
}
```

**States**:
1. **Hale** - Full health
2. **Impaired** - All tasks hindered (difficulty +1)
3. **Debilitated** - All tasks hindered (difficulty +2)
4. **Dead** - Character dies

**Mapping to Core Concepts**:
- Store as `metadata.cypherDamageTrack`
- Use attributes for state tracking

### Recovery Rolls

Cypher uses recovery rolls instead of healing:

```json
{
  "combat": {
    "recoveries": {
      "roll": "1d6+1",  // Recovery die
      "oneAction": false,     // 1 action (used)
      "oneAction2-7": false,  // Additional 1-action recoveries
      "tenMinutes": false,    // 10 minutes (used)
      "tenMinutes2": false,   // Additional 10-minute
      "oneHour": false,       // 1 hour (used)
      "tenHours": false       // 10 hours (used)
    }
  }
}
```

**Mapping to Core Concepts**:
- Store as `metadata.cypherRecoveries`
- Track which recoveries have been used

### Armor

Cypher armor reduces damage instead of AC:

```json
{
  "combat": {
    "armor": {
      "ratingTotal": 0,  // Total armor points
      "costTotal": 0     // Speed pool cost
    }
  }
}
```

**Mapping to Core Concepts**:
- Store as `metadata.cypherArmor`

### Cyphers (Temporary Items)

Cyphers are limited-use items with a carry limit:

```json
{
  "equipment": {
    "cypherLimit": 2  // Max cyphers character can carry
  }
}
```

**Item Data** (type: `cypher`):
```json
{
  "basic": {
    "level": "1d6",  // Cypher level (can be roll formula)
    "type": [0, 0],  // Category (anoetic, occultic, etc.)
    "identified": true
  },
  "settings": {
    "general": {
      "nameUnidentified": ""  // Name when not identified
    }
  },
  "description": "<p><strong>Level:</strong>&nbsp;</p><p><strong>Form:</strong>&nbsp;</p><p><strong>Effect:</strong>&nbsp;</p>"
}
```

**Mapping to Core Concepts**:
- Create `RpgItem` with type "cypher"
- Store level, type, identified status in metadata

---

## Key Differences from D&D 5e

### Mechanics

| Aspect | D&D 5e | Cypher System |
|--------|--------|---------------|
| **Core Roll** | d20 + modifiers vs DC/AC | d20 vs difficulty (target number) |
| **Health** | Hit Points (linear) | Damage Track (4 states) |
| **Resources** | Spell slots, HP, HD | Stat Pools (Might, Speed, Intellect) |
| **Difficulty** | DC 10-30 | Difficulty 0-10 (×3 = target number) |
| **Healing** | Hit Dice, spells, potions | Recovery rolls (limited uses) |
| **Armor** | AC (makes you harder to hit) | Armor Rating (reduces damage) |
| **Classes** | Rigid class system | Descriptor + Type + Focus |
| **Levels** | 1-20 | Tiers 1-6 |
| **Advancement** | XP → Level up → Fixed benefits | 4 XP → Tier advance → Choose advancement |

### Character Creation

**D&D 5e**: Choose Race + Class + Background
**Cypher**: Choose Descriptor + Type + Focus (sentence structure)

**Example**:
- **D&D**: "I am a *Half-Elf Warlock* with the *Charlatan* background"
- **Cypher**: "I am a *Clever Nano* who *Talks to Machines*"

### Items

**D&D 5e**:
- Weapons, Armor, Magic Items, Consumables
- Fixed item stats (e.g., Longsword = 1d8 damage)

**Cypher**:
- Abilities (powers from character type/focus)
- Cyphers (limited-use one-shot items)
- Artifacts (depletion-based magic items)
- Oddities (flavor items with no mechanical benefit)

### Combat

**D&D 5e**:
- Initiative (d20 + Dex)
- Attack roll (d20 + proficiency + ability)
- Damage roll (weapon die + ability mod)
- HP depletion → 0 HP → death saves

**Cypher**:
- Initiative (d20 + Speed Edge)
- Task roll (d20 vs target number based on difficulty)
- No separate attack/damage rolls
- Stat pool depletion → damage track → dead

---

## Database Schema Changes Needed

### `FoundryInstance` Model

Add support for multiple game systems:

```prisma
model FoundryInstance {
  id String @id @default(uuid())
  // ... existing fields ...

  // NEW: Game system tracking
  gameSystem String @default("dnd5e") @map("game_system")
  // Values: "dnd5e", "cyphersystem"

  systemVersion String? @map("system_version") // e.g., "5.2.0", "3.4.3"

  // NEW: System-specific metadata
  systemMetadata Json @default("{}") @map("system_metadata") @db.JsonB
  // {
  //   "cyphersystem": {
  //     "gameMode": "Cypher",  // "Cypher", "Numenera", "The Strange"
  //     "additionalPools": ["sanity"],
  //     "customSettings": {}
  //   }
  // }
}
```

### `RpgCreature` Model

Add Cypher-specific fields to metadata:

```prisma
model RpgCreature {
  id String @id @default(uuid())
  // ... existing fields ...

  metadata Json @default("{}") @db.JsonB
  // {
  //   "cypher": {
  //     "descriptor": "Clever",
  //     "type": "Nano",
  //     "focus": "Talks to Machines",
  //     "tier": 1,
  //     "effort": 1,
  //     "pools": {
  //       "might": { "value": 10, "max": 10, "edge": 0 },
  //       "speed": { "value": 10, "max": 10, "edge": 0 },
  //       "intellect": { "value": 10, "max": 10, "edge": 0 }
  //     },
  //     "damageTrack": {
  //       "state": "Hale",
  //       "applyImpaired": true,
  //       "applyDebilitated": true
  //     },
  //     "recoveries": {
  //       "roll": "1d6+1",
  //       "oneAction": false,
  //       "tenMinutes": false,
  //       "oneHour": false,
  //       "tenHours": false
  //     },
  //     "armor": {
  //       "rating": 0,
  //       "cost": 0
  //     },
  //     "cypherLimit": 2
  //   }
  // }
}
```

### `RpgItem` Model

Add Cypher-specific item types:

```prisma
model RpgItem {
  id String @id @default(uuid())
  // ... existing fields ...

  type String // "ability", "cypher", "artifact", "skill", etc.

  metadata Json @default("{}") @db.JsonB
  // {
  //   "cypher": {
  //     "level": "1d6",
  //     "cypherType": [0, 0],  // Category
  //     "identified": true,
  //     "nameUnidentified": "",
  //     "depletion": "1 in 1d6",  // For artifacts
  //     "cost": 0,  // Pool cost for abilities
  //     "pool": "Might",  // Pool used
  //     "skillRating": "Trained"  // For skills
  //   }
  // }
}
```

---

## Module Structure

Create `src/modules/foundry-cfg-cypher/` following the same pattern as `foundry-cfg-5e`:

```
src/modules/foundry-cfg-cypher/
├── module.json                 # Module manifest
├── README.md                   # Documentation
├── LICENSE                     # MIT License
├── CHANGELOG.md                # Version history
├── scripts/
│   ├── init.mjs               # Main entry point
│   ├── platform-sync.mjs      # Sync Cypher data to platform
│   ├── core-concepts-map.mjs  # Map Cypher → Core Concepts
│   └── helpers.mjs            # Utility functions
├── styles/
│   └── cfg-cypher.css         # Module styles
└── lang/
    └── en.json                # English localization
```

### `module.json`

```json
{
  "id": "foundry-cfg-cypher",
  "title": "Foundry CFG Cypher Bridge",
  "description": "Bridge module connecting Cypher System to Crit-Fumble Gaming platform",
  "version": "0.1.0",
  "compatibility": {
    "minimum": "11",
    "verified": "13"
  },
  "relationships": {
    "systems": [
      {
        "id": "cyphersystem",
        "type": "system",
        "compatibility": {
          "minimum": "3.4.0"
        }
      }
    ],
    "requires": [
      {
        "id": "foundry-core-concepts",
        "type": "module",
        "compatibility": {
          "minimum": "0.1.0"
        }
      }
    ]
  },
  "esmodules": ["scripts/init.mjs"],
  "styles": ["styles/cfg-cypher.css"],
  "languages": [
    {
      "lang": "en",
      "name": "English",
      "path": "lang/en.json"
    }
  ]
}
```

---

## Implementation Plan

### Phase 1: Module Structure (Week 1)

- [x] Analyze Cypher System data model ✅
- [ ] Create module directory structure
- [ ] Create `module.json` manifest
- [ ] Create `init.mjs` entry point
- [ ] Verify Cypher System dependency

**Deliverable**: Module loads in Foundry with Cypher System

### Phase 2: Core Concepts Mapping (Week 1-2)

- [ ] Map PC actor → `RpgCreature`
  - Character sentence (descriptor, type, focus)
  - Tier, effort, XP
  - Stat pools (might, speed, intellect, additional)
  - Damage track state
  - Recoveries
  - Armor rating

- [ ] Map NPC actor → `RpgCreature`
  - Level
  - Health pool
  - Damage
  - Armor

- [ ] Map Items → `RpgItem`
  - Abilities
  - Cyphers
  - Artifacts
  - Skills
  - Equipment

**Deliverable**: Core Concepts mapping functions

### Phase 3: Platform Sync (Week 2)

- [ ] Implement actor sync
  - `syncCypherPC(actor)` → POST `/api/rpg/creatures`
  - `syncCypherNPC(actor)` → POST `/api/rpg/creatures`
  - Handle stat pools, damage track, recoveries

- [ ] Implement item sync
  - `syncCypherAbility(item)` → POST `/api/rpg/items`
  - `syncCypherCypher(item)` → POST `/api/rpg/items`
  - `syncCypherArtifact(item)` → POST `/api/rpg/items`

- [ ] Implement scene sync
  - `syncScene(scene)` → POST `/api/rpg/boards`

**Deliverable**: Platform sync working for Cypher System

### Phase 4: Database Schema Updates (Week 2)

- [ ] Add `gameSystem` field to `FoundryInstance`
- [ ] Add `systemMetadata` field to `FoundryInstance`
- [ ] Update `RpgCreature` metadata to support Cypher
- [ ] Update `RpgItem` metadata to support Cypher
- [ ] Create migration

**Deliverable**: Database supports multi-system Foundry instances

### Phase 5: Documentation (Week 3)

- [ ] Write `README.md` for `foundry-cfg-cypher`
- [ ] Document Cypher System mapping
- [ ] Create migration guide for users
- [ ] Update platform docs

**Deliverable**: Complete documentation

---

## Testing Plan

### Unit Tests

```typescript
// Test Cypher PC → RpgCreature mapping
describe('Cypher PC Mapping', () => {
  it('should map character sentence', () => {
    const actor = {
      type: 'pc',
      system: {
        basic: {
          descriptor: 'Clever',
          type: 'Nano',
          focus: 'Talks to Machines'
        }
      }
    };

    const creature = mapCypherPCToCreature(actor);
    expect(creature.metadata.cypher.descriptor).toBe('Clever');
    expect(creature.metadata.cypher.type).toBe('Nano');
    expect(creature.metadata.cypher.focus).toBe('Talks to Machines');
  });

  it('should map stat pools', () => {
    const actor = {
      type: 'pc',
      system: {
        pools: {
          might: { value: 10, max: 10, edge: 1 },
          speed: { value: 8, max: 10, edge: 0 },
          intellect: { value: 12, max: 12, edge: 2 }
        }
      }
    };

    const creature = mapCypherPCToCreature(actor);
    expect(creature.metadata.cypher.pools.might.value).toBe(10);
    expect(creature.metadata.cypher.pools.might.edge).toBe(1);
  });

  it('should map damage track', () => {
    const actor = {
      type: 'pc',
      system: {
        combat: {
          damageTrack: {
            state: 'Impaired',
            applyImpaired: true
          }
        }
      }
    };

    const creature = mapCypherPCToCreature(actor);
    expect(creature.metadata.cypher.damageTrack.state).toBe('Impaired');
  });
});
```

### Integration Tests

```typescript
// Test platform sync
describe('Cypher Platform Sync', () => {
  it('should sync PC to platform', async () => {
    const actor = createMockCypherPC();
    const response = await syncCypherPC(actor);

    expect(response.status).toBe(201);
    expect(response.data.type).toBe('pc');
    expect(response.data.metadata.cypher).toBeDefined();
  });
});
```

### E2E Tests (Playwright)

```typescript
test('create Cypher PC in Foundry and verify platform sync', async ({ page }) => {
  // Navigate to Foundry instance
  await page.goto('http://foundry-instance:30000');

  // Create PC actor
  await page.click('[data-action="create-actor"]');
  await page.fill('[name="name"]', 'Test Nano');
  await page.selectOption('[name="type"]', 'pc');
  await page.click('[data-action="submit"]');

  // Verify creature appears in platform
  const response = await fetch('http://localhost:3000/api/rpg/creatures');
  const creatures = await response.json();

  expect(creatures.some(c => c.name === 'Test Nano')).toBe(true);
});
```

---

## Migration Guide for Users

### For Existing D&D 5e Users

**No changes required** - existing D&D 5e Foundry instances continue to work as before.

### For New Cypher System Users

1. **Create Foundry Instance**:
   ```typescript
   POST /api/foundry/instance
   {
     "name": "My Numenera Game",
     "gameSystem": "cyphersystem",
     "systemVersion": "3.4.3"
   }
   ```

2. **Install Modules** (automatic):
   - Cypher System v3.4.3+
   - Foundry Core Concepts v0.1.0+
   - CFG Cypher Bridge v0.1.0+

3. **Configure Module**:
   - Enable Platform Sync
   - Set API key
   - Choose game mode (Cypher, Numenera, The Strange, etc.)

4. **Create Characters**:
   - Use Cypher System character sheets
   - Data automatically syncs to platform

---

## Security Considerations

### API Authentication

- Use same NextAuth session-based auth as D&D 5e
- Verify world ownership before sync
- Rate limit API calls

### Data Validation

```typescript
// Validate Cypher PC data before sync
function validateCypherPC(actor: any): boolean {
  if (!actor.type === 'pc') return false;
  if (!actor.system.basic.descriptor) return false;
  if (!actor.system.basic.type) return false;
  if (!actor.system.basic.focus) return false;
  if (!actor.system.pools) return false;
  return true;
}
```

---

## Performance Considerations

### Sync Frequency

- **Real-time sync**: On actor/item create/update
- **Batch sync**: On world snapshot creation
- **Rate limiting**: 100 req/min (same as D&D 5e)

### Data Size

Cypher System data is generally smaller than D&D 5e:
- **PC Actor**: ~5KB (vs ~15KB for D&D 5e)
- **NPC Actor**: ~2KB (vs ~10KB for D&D 5e)
- **Item**: ~1-3KB (vs ~5-10KB for D&D 5e)

**Reason**: Simpler stat blocks, fewer mechanical options

---

## Future Enhancements

### Phase 2 (Q2 2026)

- [ ] Cypher System compendiums (types, foci, descriptors)
- [ ] GM Intrusion automation
- [ ] Recovery roll tracking
- [ ] Tier advancement UI

### Phase 3 (Q3 2026)

- [ ] Support for The Strange (recursions)
- [ ] Support for Numenera (artifacts, oddities)
- [ ] Support for Predation (dinosaur companions)
- [ ] Custom descriptor/type/focus builder

---

## Comparison: D&D 5e vs Cypher System Support

| Feature | D&D 5e | Cypher System |
|---------|--------|---------------|
| **Module Name** | `foundry-cfg-5e` | `foundry-cfg-cypher` |
| **Base System** | dnd5e (Foundry official) | cyphersystem (mrkwnzl) |
| **System Size** | 451MB, 409 files | ~3.5MB est. |
| **Actor Types** | 1 (character/npc) | 6 (pc, npc, companion, community, vehicle, marker) |
| **Item Types** | ~15 (weapon, armor, spell, etc.) | 14 (ability, cypher, artifact, etc.) |
| **Core Mechanic** | d20 + mod vs DC/AC | d20 vs difficulty × 3 |
| **Character Progression** | Levels 1-20 | Tiers 1-6 |
| **Sync Complexity** | High (many subsystems) | Medium (simpler mechanics) |
| **Implementation Time** | 4 weeks | 3 weeks (simpler) |

---

## Questions to Resolve

### 1. License Verification

**Question**: What is the license for `cyphersystem` by mrkwnzl?
**Action**: Check GitHub repository for LICENSE file
**Blocker**: No - can implement and verify later

### 2. Game Mode Support

**Question**: Do we support all Cypher System games (Numenera, The Strange, etc.) or just generic Cypher?
**Recommendation**: Support generic Cypher first, add game-specific features later
**Rationale**: Simpler MVP, can expand in Q2 2026

### 3. Multi-System Instances

**Question**: Can a single Foundry instance host both D&D 5e and Cypher worlds?
**Answer**: Yes - Foundry supports multiple worlds with different systems
**Implementation**: Track `gameSystem` per world, not per instance

---

## Success Criteria

### March 2026 Deadline

**Must Have**:
- ✅ Cypher System installed on Foundry instances
- ✅ PC/NPC actors sync to platform
- ✅ Items (abilities, cyphers, artifacts) sync to platform
- ✅ Scenes sync to platform
- ✅ Database supports multi-system tracking

**Nice to Have**:
- ⚠️ Cypher-specific UI enhancements
- ⚠️ GM Intrusion automation
- ⚠️ Recovery roll tracking

**Not Required**:
- ❌ Game-specific compendiums (Numenera, The Strange)
- ❌ Custom descriptor/type/focus builder
- ❌ Advanced automation

---

## Related Documentation

- [foundry-core-concepts README](../../../src/modules/foundry-core-concepts/README.md)
- [foundry-cfg-5e README](../../../src/modules/foundry-cfg-5e/README.md)
- [Foundry Integration Summary](./foundry-integration-summary.md)
- [Cypher System Official](https://github.com/mrkwnzl/cyphersystem-foundryvtt)

---

**Status**: ✅ Analysis Complete
**Next Step**: Create `foundry-cfg-cypher` module structure
**Owner**: Development Team
**Timeline**: 3 weeks (Weeks 1-3 of March 2026 sprint)
