# System Mapping: Core Concepts → 5e SRD → CFG 5e

## Overview

This document shows how **system-agnostic core concepts** are extended by **D&D 5e SRD** implementation, and then further extended by **CFG 5e** custom features.

## Module Hierarchy

```
foundry-core-concepts (System-Agnostic)
    ↓ extends
foundry-core-srd-5e (D&D 5e SRD Implementation)
    ↓ extends
foundry-cfg-5e (CFG Custom Features + API Integration)
```

## Core Concept Extensions

### Activity

**Core Concept** ([foundry-core-concepts/docs/ACTIVITY.md](../../foundry-core-concepts/docs/ACTIVITY.md)):
- System-agnostic activity interface
- Common activity categories (mental, social, physical, etc.)
- Base properties (intensity, duration, requirements)
- Integration points with other concepts

**5e SRD Extension** ([ACTIVITY-SYSTEM.md](ACTIVITY-SYSTEM.md)):
- Adds `interruptsRest` property (short/long)
- Adds D&D 5e-specific categories (spell casting, etc.)
- Implements SRD activities:
  - Light Activities: Reading, Talking, Eating, Standing Watch
  - Strenuous Activities: Walking, Combat, Spellcasting
- SRD-specific rules for rest interruption
- Downtime activity integration

**CFG 5e Extension** (future):
- Activity automation and tracking
- Activity history/logging UI
- Custom campaign activities
- AI-driven activity suggestions
- Activity templates for common scenarios

---

### Event

**Core Concept** ([foundry-core-concepts/docs/EVENT.md](../../foundry-core-concepts/docs/EVENT.md)):
- System-agnostic event interface
- Event categories (combat, environmental, time, etc.)
- Event lifecycle (trigger → resistance → occurrence → cascade)
- Event logging structure

**5e SRD Extension** ([EVENT-SYSTEM.md](EVENT-SYSTEM.md)):
- Adds D&D 5e damage types and amounts
- Adds 5e saving throws (ability + DC)
- Adds 5e conditions (Charmed, Frightened, etc.)
- Implements SRD events:
  - Combat Events: Initiative, Damage, Death, Unconsciousness
  - Environmental Events: Extreme Cold, Extreme Heat, Falling
  - Rest Events: Short/Long Rest completion, Interruption
  - Time Events: Spell expiration, Round/Turn end
- SRD-specific cascade relationships

**CFG 5e Extension** (future):
- Event tracking and history UI
- Event automation (auto-apply effects)
- Event notifications and alerts
- Event chains visualization
- Custom campaign events

---

### Location

**Core Concept** ([foundry-core-concepts/docs/LOCATION.md](../../foundry-core-concepts/docs/LOCATION.md)):
- System-agnostic location interface
- Scale system (interaction → world)
- Multi-resolution support
- Containment hierarchy
- Grid types (square, hex, gridless, voxel)

**5e SRD Extension** ([LOCATION-SYSTEM.md](LOCATION-SYSTEM.md), [TILE-LOCATION-SYSTEM.md](TILE-LOCATION-SYSTEM.md)):
- Adds D&D 5e terrain types
- Adds D&D 5e environmental hazards
- Adds D&D 5e climate effects
- Implements SRD locations:
  - Example structures: Instant Fortress, Generic Temple, Generic Inn
  - Wilderness Campsite with facilities
- SRD-specific environmental effects
- Worldographer compatibility (JSON/XML)

**CFG 5e Extension** (future):
- Location tracking and navigation
- Travel automation
- Random encounter generation
- Location discovery system
- Worldanvil API integration

---

### Facility

**Core Concept**: Not yet defined (could be added to core concepts)

**5e SRD Extension** ([FACILITY-SYSTEM.md](FACILITY-SYSTEM.md)):
- 15 facility types (warmth, shelter, food, water, rest, etc.)
- SRD benefit definitions
- Environmental hazard prevention
- Integration with rest mechanics
- Example facilities for each type

**CFG 5e Extension** (future):
- Facility management UI
- Facility upgrading/building
- Facility costs and maintenance
- Custom campaign facilities

---

## Core Concept Mapping Table

| Core Concept | Core Module | SRD Module | CFG Module |
|---|---|---|---|
| **Activity** | Base interface | 5e light/strenuous activities | Activity automation |
| **Event** | Base interface | 5e combat/environmental events | Event tracking UI |
| **Location** | Scale system, containment | 5e terrain/hazards | Travel automation |
| **Creature** | TBD | 5e stat blocks, types | Behavior AI |
| **Object/Item** | TBD | 5e equipment, magic items | Item generation |
| **Time** | TBD | Game time tracking | Calendar integration |
| **Sheet** | Core concept | 5e character sheet | Custom sheet templates |
| **Dice** | Core concept | d20 system | Advanced dice roller |
| **Rules** | Core concept | 5e SRD rules | Campaign house rules |
| **Mode** | Core concept | 5e modes (combat, etc.) | Mode automation |
| **System** | Core concept | 5e systems (magic, etc.) | Custom systems |

---

## Data Flow

### Activity Example: Reading

```
Core Concept (foundry-core-concepts/docs/ACTIVITY.md)
├─ Interface: Activity
├─ Category: 'mental'
├─ Intensity: 'light'
└─ Duration: { interruptible: true, resumable: true }

    ↓ extends

5e SRD (foundry-core-srd-5e)
├─ SRD Rule: Long Rest allows 2 hours max
├─ File: data/5e/srd/activities/reading.json
├─ Adds: interruptsRest: { short: false, long: false }
├─ Adds: skillsUsed: ['Investigation', 'Arcana', 'History']
└─ Adds: downtimeUses: [research, learning spells, language study]

    ↓ extends

CFG 5e (foundry-cfg-5e)
├─ UI: Activity selection dropdown
├─ Automation: Track time spent reading
├─ Integration: Auto-advance research progress
└─ Customization: Custom research topics
```

### Event Example: Extreme Cold

```
Core Concept (foundry-core-concepts/docs/EVENT.md)
├─ Interface: GameEvent
├─ Category: 'environmental'
├─ TriggerType: 'time_based'
└─ Effects: { immediate: string[], ongoing: string[] }

    ↓ extends

5e SRD (foundry-core-srd-5e)
├─ SRD Rule: DC 10 CON save, hourly
├─ File: docs/EVENT-SYSTEM.md (example)
├─ Adds: damage: { amount: '1d4', type: 'cold' }
├─ Adds: savingThrow: { ability: 'CON', dc: 10 }
└─ Adds: prevention: facilities: ['facility-warmth']

    ↓ extends

CFG 5e (foundry-cfg-5e)
├─ Automation: Auto-roll CON saves hourly
├─ UI: Environmental hazard warnings
├─ Integration: Track cold weather gear
└─ Customization: Adjust DC for campaign climate
```

### Location Example: Inn

```
Core Concept (foundry-core-concepts/docs/LOCATION.md)
├─ Interface: Location
├─ Type: 'inn'
├─ Scale: 'adventure'
└─ Containment: { childLocations, creatures, objects }

    ↓ extends

5e SRD (foundry-core-srd-5e)
├─ File: data/5e/srd/locations/generic-inn.json
├─ Adds: terrain: (not applicable for structure)
├─ Adds: facilities: ['warmth', 'shelter', 'food', 'rest', etc.]
└─ Adds: tiles with 5e grid system

    ↓ extends

CFG 5e (foundry-cfg-5e)
├─ UI: Inn interior scene with tokens
├─ Integration: NPC innkeeper with dialogue
├─ Automation: Auto-calculate room costs
└─ Customization: Custom inn events and quests
```

---

## File Organization

### foundry-core-concepts/
```
docs/
├─ CORE-CONCEPTS.md           # Base TTRPG concepts
├─ VTT-IMAGE-SCALE-GUIDELINES.md  # Multi-scale tile rendering
├─ ACTIVITY.md                # System-agnostic activity
├─ EVENT.md                   # System-agnostic event
└─ LOCATION.md                # System-agnostic location
```

### foundry-core-srd-5e/
```
docs/
├─ ACTIVITY-SYSTEM.md         # 5e activity implementation
├─ EVENT-SYSTEM.md            # 5e event implementation
├─ LOCATION-SYSTEM.md         # 5e location (minimal)
├─ TILE-LOCATION-SYSTEM.md    # 5e tile/worldographer integration
├─ FACILITY-SYSTEM.md         # 5e facility types
├─ CREATURE-ORGANIZATION.md   # 5e creature packs
├─ ITEM-ORGANIZATION.md       # 5e item organization
└─ SYSTEM-MAPPING.md          # This file

data/5e/srd/
├─ activities/
│   ├─ reading.json
│   ├─ talking.json
│   ├─ eating.json
│   └─ standing-watch.json
├─ locations/
│   ├─ instant-fortress.json
│   ├─ generic-temple.json
│   ├─ generic-inn.json
│   └─ wilderness-campsite.json
└─ split/                     # SRD markdown files
    ├─ rulesglossary/
    ├─ spells/
    ├─ magicitems/
    └─ ...
```

### foundry-cfg-5e/ (future)
```
docs/
├─ ACTIVITY-TRACKING.md       # CFG activity automation
├─ EVENT-TRACKING.md          # CFG event logging/UI
└─ LOCATION-TRACKING.md       # CFG location management

src/
├─ activities/                # Activity automation code
├─ events/                    # Event tracking code
└─ locations/                 # Location management code
```

---

## Implementation Checklist

### Phase 1: Core Concepts (Complete)
- [x] ACTIVITY.md - System-agnostic activity interface
- [x] EVENT.md - System-agnostic event interface
- [x] LOCATION.md - System-agnostic location interface
- [x] CORE-CONCEPTS.md - Base TTRPG concepts
- [x] VTT-IMAGE-SCALE-GUIDELINES.md - Multi-scale rendering

### Phase 2: 5e SRD Implementation (In Progress)
- [x] ACTIVITY-SYSTEM.md - 5e activity rules
- [x] EVENT-SYSTEM.md - 5e event types
- [x] LOCATION-SYSTEM.md - 5e location basics
- [x] TILE-LOCATION-SYSTEM.md - 5e tile system
- [x] FACILITY-SYSTEM.md - 5e facility types
- [x] Light activity JSON files (4/4)
- [ ] Combat activities
- [ ] Exploration activities
- [ ] Social activities
- [ ] Downtime activities
- [ ] More example locations

### Phase 3: CFG 5e Extension (Future)
- [ ] Activity automation and tracking
- [ ] Event logging and UI
- [ ] Location navigation
- [ ] Campaign-specific features
- [ ] API integration
- [ ] Worldanvil integration

---

## Extension Pattern

### For System Developers (e.g., Pathfinder 2e)

1. Import core concepts from `foundry-core-concepts`
2. Extend interfaces with system-specific properties
3. Implement system-specific rules
4. Create data files for system content
5. Document system extensions

Example:
```typescript
import { Activity } from '@foundry-core-concepts/Activity';

interface Pathfinder2eActivity extends Activity {
  system: {
    "pf2e": {
      actions: number;              // 1-3 actions
      traits: string[];             // Activity traits
      trigger?: string;             // For reactions
    }
  }
}
```

### For Campaign Developers (e.g., Custom Campaigns)

1. Import system implementation (e.g., `foundry-core-srd-5e`)
2. Add campaign-specific custom activities/events/locations
3. Implement automation and UI
4. Integrate with external APIs (Worldanvil, etc.)
5. Document campaign extensions

---

## Benefits of This Architecture

1. **Reusability**: Core concepts work across all TTRPG systems
2. **Consistency**: All systems use same base interfaces
3. **Extensibility**: Easy to add new systems or campaigns
4. **Maintainability**: Changes to core benefit all systems
5. **Interoperability**: Systems can share tools and utilities
6. **Clarity**: Clear separation between generic and system-specific

---

## See Also

- [WIP-FoundryVTT.md](../../../todo/WIP-FoundryVTT.md) - Module architecture overview
- [Core Concepts](../../foundry-core-concepts/docs/CORE-CONCEPTS.md)
- [Module Architecture](../../MODULE_ARCHITECTURE.md)
