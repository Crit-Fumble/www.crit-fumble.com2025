# Core Concepts Implementation for D&D 5e

## Overview

This module properly implements Core Concepts for D&D 5e, separating system-specific configuration from universal game concepts.

## Architecture

### What is NOT Core Concepts (5e-Specific Config)

**Location**: `game.cfg5e.config`

D&D 5e system properties extracted from the official dnd5e system:
- Abilities (STR, DEX, CON, INT, WIS, CHA)
- Skills (Acrobatics, Athletics, etc.)
- Damage Types, Sizes, Alignments
- Creature Types, Languages, Tool Types
- Item Rarity, Currencies, Spell Schools
- And 15+ other 5e-specific categories

**Total**: 25+ categories of 5e-specific data

### What IS Core Concepts

**Location**: `game.coreConcepts`

#### 1. Rules (156 from SRD 5.2 Glossary)
**File**: `data/rules/srd-glossary.mjs`

Atomic game mechanics extracted from the official SRD 5.2 Rules Glossary:
- Advantage/Disadvantage
- Attack Roll, Saving Throw, Ability Check
- Conditions (Blinded, Charmed, Frightened, etc.)
- Area of Effect shapes (Cone, Cube, Sphere, etc.)
- Movement rules (Climbing, Swimming, Jumping, etc.)
- Combat rules (Critical Hit, Opportunity Attack, etc.)
- And 140+ more atomic rules

**Source**: `C:\Users\hobda\Projects\Crit-Fumble\Notes\dndsrd5.2_markdown\src\08_RulesGlossary.md`

**Cross-referenced with**: `C:\Users\hobda\Projects\Crit-Fumble\Notes\.data\5e\5etools-srd521\data\variantrules.json`

#### 2. Subsystems

**File**: `data/subsystems/`

Complex mechanics that use multiple rules:

**Rhythm of Play** (`rhythm-of-play.mjs`):
- The fundamental 3-step pattern of all D&D play
- Step 1: GM Describes Scene
- Step 2: Players Describe Actions
- Step 3: GM Narrates Results (loops back to step 1)
- Principle: "Exceptions Supersede General Rules"

**Action Economy** (`action-economy.mjs`):
- Governs what characters can do during their turn
- **Player Activities** (12 standard actions):
  - Attack, Dash, Disengage, Dodge
  - Help, Hide, Influence, Magic
  - Ready, Search, Study, Utilize
  - Improvise (for non-standard actions)
- **GM Activities**:
  - Describe Scene
  - Narrate Results
  - Determine DC
  - Make Rulings
- **Constraints**:
  - One action per turn
  - One bonus action per turn
  - One reaction per round

#### 3. Team Roles

**File**: `data/roles/index.mjs`

Defines who can do what in a game:

**Core Roles**:
- **Game Master** (GM/DM)
  - Describes scenes, narrates results, controls NPCs
  - Required: 1 per team, exclusive
  - Activities: GM-specific (describe, narrate, adjudicate)

- **Player Character** (PC)
  - Takes actions, interacts with world
  - Required: 1+ per team
  - Activities: All 12 standard actions + movement + rest

**Expansion Roles** (for future use):
- Captain (ship combat)
- Pilot (vehicle rules)
- Observer (spectator mode)

#### 4. Modes

**File**: `data/modes/index.mjs`

Gameplay states that activate specific subsystems:

**The 5 Pillars**:

1. **Social Interaction**
   - Subsystems: rhythm-of-play, action-economy, social-interaction
   - Activities: influence, search, study
   - Rules: ability-check, skill, attitude

2. **Exploration**
   - Subsystems: rhythm-of-play, action-economy, exploration
   - Activities: search, hide, utilize
   - Rules: passive-perception, darkvision, speed

3. **Combat**
   - Subsystems: rhythm-of-play, action-economy, initiative, conditions
   - Activities: attack, dash, dodge, magic
   - Rules: attack-roll, damage-roll, critical-hit

4. **Travel**
   - Subsystems: rhythm-of-play, travel-pace, navigation
   - Activities: navigate, forage, rest
   - Rules: speed, survival-check, exhaustion

5. **Downtime**
   - Subsystems: rhythm-of-play, crafting, training, research
   - Activities: craft-item, train, research
   - Rules: tool-proficiency, time-periods

## The Rhythm of Play Pattern

All modes follow this pattern:

```
1. GM Activity: "Describe Scene"
   ↓
2. Player Activity: Choose action (from mode's available activities)
   ↓
3. GM Activity: "Narrate Results" (may use rules/dice rolls)
   ↓
   (Loop back to step 1)
```

### Example Flow

**Social Interaction Mode**:
```
GM: "You enter the tavern. The barkeep eyes you suspiciously."
    [Activity: gm-describe-scene]

Player: "I want to convince him we're friendly."
    [Activity: influence, using Persuasion skill]

GM: "Roll a Charisma (Persuasion) check."
    [Uses Rules: ability-check, skill]
    [Player rolls: 1d20 + CHA + Proficiency]

GM: "He relaxes and offers you a drink."
    [Activity: gm-narrate-results]
    [Loops back to describe new scene]
```

## Data Flow

```
SRD 5.2 Glossary (markdown)
         ↓
extract-srd-rules.mjs
         ↓
data/rules/srd-glossary.mjs (156 rules)
         ↓
Core Concepts Rules Engine
         ↓
game.coreConcepts.rules


Manual Definitions
         ↓
data/subsystems/*.mjs
data/roles/index.mjs
data/modes/index.mjs
         ↓
Core Concepts
         ↓
game.coreConcepts.subsystems
game.coreConcepts.roles
game.coreConcepts.modes


Official dnd5e System
         ↓
DnD5eMapper.mapAll()
         ↓
5e Configuration (25+ categories)
         ↓
game.cfg5e.config
```

## Usage Examples

### Accessing Rules

```javascript
// Get all 156 SRD rules
const rules = game.coreConcepts.rules.getAll();

// Get specific rule
const advantage = game.coreConcepts.rules.getByName('Advantage');

// Get rules by category
const combatRules = game.coreConcepts.rules.getByCategory('combat');
const d20Rules = game.coreConcepts.rules.getByTag('d20');
```

### Accessing Subsystems

```javascript
// Get rhythm of play
const rhythm = game.coreConcepts.subsystems.find(s => s.id === 'rhythm-of-play');

// Get action economy
const actions = game.coreConcepts.subsystems.find(s => s.id === 'action-economy');

// Get all player activities
const playerActivities = actions.activities;
// [attack, dash, dodge, help, hide, influence, magic, ready, search, study, utilize, improvise]

// Get GM activities
const gmActivities = actions.gmActivities;
// [gm-describe-scene, gm-narrate-results, gm-determine-dc, gm-improvise-ruling]
```

### Accessing Roles

```javascript
// Get all roles
const roles = game.coreConcepts.roles;

// Get Game Master role
const gmRole = roles.find(r => r.id === 'game-master');
console.log(gmRole.activities);
// ['gm-describe-scene', 'gm-narrate-results', 'gm-determine-dc', ...]

// Get Player Character role
const pcRole = roles.find(r => r.id === 'character');
console.log(pcRole.activities);
// ['attack', 'dash', 'dodge', 'help', 'hide', ...]
```

### Accessing Modes

```javascript
// Get combat mode
const combatMode = game.coreConcepts.modes.find(m => m.id === 'combat');

// See what subsystems are active
console.log(combatMode.subsystems);
// ['rhythm-of-play', 'action-economy', 'initiative', 'conditions']

// See what activities are available
console.log(combatMode.activities.player);
// ['attack', 'dash', 'dodge', 'magic', ...]

console.log(combatMode.activities.gm);
// ['gm-describe-scene', 'gm-narrate-results', ...]

// See what rules are primary
console.log(combatMode.primaryRules);
// ['attack-roll', 'damage-roll', 'critical-hit', 'initiative', ...]
```

### Accessing 5e Configuration

```javascript
// Get 5e-specific data (NOT Core Concepts)
const abilities = game.cfg5e.config.abilities;
const skills = game.cfg5e.config.skills;
const damageTypes = game.cfg5e.config.damageTypes;

// Example: Get Strength ability
const str = abilities.find(a => a.id === 'str');
console.log(str);
// { id: 'str', name: 'Strength', type: 'physical', ... }
```

## Benefits

### ✅ Clean Separation
- 5e config stays in `game.cfg5e.config`
- Core Concepts in `game.coreConcepts`
- Clear API boundaries

### ✅ Platform Agnostic
- Pure JSON data structures
- No Foundry-specific code
- Works in Unity, web, mobile, etc.

### ✅ Role-Based Activities
- Activities linked to roles
- GMs do GM things, Players do Player things
- Supports expansions (captain, pilot, etc.)

### ✅ Follows Official SRD Structure
- 156 rules from SRD 5.2 glossary
- Subsystems based on SRD sections
- Modes follow 3 pillars of play

### ✅ Rhythm of Play Integration
- All modes use GM → Player → GM pattern
- Activities have defined inputs/outputs
- Natural game flow

## File Structure

```
foundry-cfg-5e/
├── data/
│   ├── rules/
│   │   ├── srd-glossary.mjs        # 156 SRD rules (generated)
│   │   └── index.mjs               # Exports
│   │
│   ├── subsystems/
│   │   ├── rhythm-of-play.mjs      # Core 3-step pattern
│   │   ├── action-economy.mjs      # Actions, bonus actions, reactions
│   │   └── index.mjs               # Exports (TODO)
│   │
│   ├── roles/
│   │   └── index.mjs               # Team roles (GM, PC, etc.)
│   │
│   └── modes/
│       └── index.mjs               # 5 game modes
│
├── scripts/
│   ├── dnd5e-mapper.mjs            # Extracts 5e config
│   ├── extract-srd-rules.mjs       # Extracts 156 rules
│   └── init.mjs                    # Module initialization
│
└── docs/
    ├── ARCHITECTURE.md             # System separation
    ├── CORE_CONCEPTS_IMPLEMENTATION.md  # This file
    ├── CORE_CONCEPTS_SCHEMA.md     # Hierarchy explanation
    ├── MAPPING.md                  # 5e config mapping
    └── MAPPED_DATA.md              # Complete 5e data list
```

## Next Steps

1. ✅ Extract 156 SRD rules - **DONE**
2. ✅ Separate 5e config from Core Concepts - **DONE**
3. ✅ Define Rhythm of Play subsystem - **DONE**
4. ✅ Define Action Economy subsystem - **DONE**
5. ✅ Define Team Roles (GM, PC, etc.) - **DONE**
6. ⏳ Update all 5 modes to reference subsystems - **IN PROGRESS**
7. ⏳ Extract Cards from compendiums (spells, items, creatures) - **TODO**
8. ⏳ Define remaining subsystems (exploration, combat, travel, downtime) - **TODO**

---

**Clean Core Concepts implementation with proper separation!** 🎲✨
