# Core Concepts Schema Architecture

## Overview

Core Concepts uses a hierarchical structure to organize game data:

```
Rules (atomic mechanics)
    ↓
Cards (entities that reference rules)
    ↓
Subsystems (complex mechanics using multiple rules/tables)
    ↓
Modes (gameplay states using specific subsystems)
```

## 1. Rules (Atomic Game Mechanics)

**Definition:** Single, atomic game mechanics from the SRD 5.2 Rules Glossary

**Source:** `dndsrd5.2_markdown/src/08_RulesGlossary.md` (156 rules)

**Examples:**
- Ability Check
- Advantage/Disadvantage
- Attack Roll
- Concentration
- Critical Hit
- Damage Types
- Conditions (Blinded, Charmed, etc.)
- Cover
- Grappling
- Hiding
- Initiative
- Proficiency Bonus
- Saving Throw
- Speed

**Structure:**
```javascript
{
  id: 'advantage',
  name: 'Advantage',
  type: 'rule',
  category: 'd20-test',
  description: 'Roll two d20s and use the higher roll',
  tags: ['d20', 'dice', 'core'],
  reference: 'SRD 5.2 Rules Glossary',
  relatedRules: ['disadvantage', 'd20-test']
}
```

**What is NOT a rule:**
- ❌ Individual spells (those are cards)
- ❌ Specific monsters (those are cards)
- ❌ Complex systems like "Crafting" (those are subsystems)
- ❌ Gameplay phases like "Combat" (those are modes)

---

## 2. Cards (Entities)

**Definition:** Specific instances of game entities that **reference** rules but aren't rules themselves

**Types:**
- **Spell Cards** - Individual spells
- **Item Cards** - Weapons, armor, magic items
- **Creature Cards** - Monsters, NPCs
- **Feature Cards** - Class features, racial traits
- **Background Cards** - Character backgrounds

**Examples:**
- Fireball (spell card)
- Longsword (item card)
- Adult Red Dragon (creature card)
- Action Surge (feature card)

**Structure:**
```javascript
{
  id: 'fireball',
  name: 'Fireball',
  type: 'card',
  cardType: 'spell',
  category: 'evocation',
  level: 3,

  // Cards REFERENCE rules, they don't define them
  usesRules: [
    'spell-attack',
    'saving-throw',
    'damage-roll',
    'area-of-effect-sphere'
  ],

  // Cards have specific data
  data: {
    castingTime: '1 action',
    range: '150 feet',
    components: ['V', 'S', 'M'],
    duration: 'Instantaneous',
    damage: '8d6',
    damageType: 'fire',
    saveType: 'dex',
    saveDC: 'spell-save-dc',
    areaShape: 'sphere',
    areaSize: '20 feet'
  },

  description: 'A bright streak flashes...',
  reference: 'PHB 2024 p. 287'
}
```

---

## 3. Subsystems (Complex Mechanics)

**Definition:** Complex game mechanics that involve multiple rules, tables, and procedures

**Examples:**
- Chase Scenes (tables, complications, success/failure tracking)
- Crafting (time, costs, proficiencies, tables)
- Social Encounters (attitudes, influence, reaction tables)
- Skill Challenges (success/failure tracking, group checks)
- Mass Combat (units, morale, commander actions)
- Strongholds (construction, income, events)
- Travel (pace, navigation, foraging, encounters)
- Downtime Activities (carousing, training, research)

**Structure:**
```javascript
{
  id: 'chase-scenes',
  name: 'Chase Scenes',
  type: 'subsystem',
  category: 'tactical',

  // Subsystems USE multiple rules
  usesRules: [
    'dash-action',
    'ability-check',
    'initiative',
    'speed',
    'difficult-terrain'
  ],

  // Subsystems have procedures
  procedure: {
    setup: 'Determine starting distance, set complication DC',
    rounds: 'Each participant makes check, track success/failure',
    complications: 'Roll on complications table each round',
    resolution: 'Chase ends when quarry escapes or is caught'
  },

  // Subsystems have tables
  tables: [
    {
      name: 'Urban Chase Complications',
      rollDice: '1d20',
      entries: [
        { roll: '1-5', result: 'Crowd: DC 10 Dex (Acrobatics) or speed halved' },
        { roll: '6-8', result: 'Obstacle: DC 15 Str (Athletics) or Dex (Acrobatics)' },
        // ... more entries
      ]
    }
  ],

  reference: 'DMG p. 252-255'
}
```

---

## 4. Modes (Gameplay States)

**Definition:** Major phases of gameplay that activate specific subsystems and use specific rules

**The 5 Core Modes (PHB 2024):**

### Mode 1: Interaction
**Purpose:** Roleplaying conversations, negotiations, social encounters

**Active Subsystems:**
- Social Encounters (attitudes, influence)
- Skill Challenges (group persuasion, etc.)

**Primary Rules:**
- Ability Checks (Persuasion, Deception, Insight, Intimidation)
- Advantage/Disadvantage
- Passive Perception
- Help Action

**UI:**
- NPC Tracker
- Attitude Meters
- Faction Relations

---

### Mode 2: Exploration
**Purpose:** Investigating environments, searching for secrets, interacting with world

**Active Subsystems:**
- Dungeon Delving (traps, secret doors, room-by-room)
- Environmental Hazards
- Resting (short rest, long rest)

**Primary Rules:**
- Ability Checks (Investigation, Perception, Survival)
- Passive Perception
- Vision & Light (Darkvision, Bright Light, Dim Light, Darkness)
- Speed & Movement
- Search Action
- Hide Action
- Help Action

**UI:**
- Marching Order
- Light Sources
- Passive Scores
- Map Reveal

---

### Mode 3: Combat
**Purpose:** Tactical turn-based encounters

**Active Subsystems:**
- Initiative Order
- Action Economy (action, bonus action, reaction)
- Opportunity Attacks
- Grappling & Shoving
- Cover
- Conditions Management

**Primary Rules:**
- Initiative
- Attack Roll
- Damage Roll
- Saving Throw
- Armor Class
- Hit Points
- Speed & Movement
- Advantage/Disadvantage
- Critical Hit
- All Actions (Attack, Dash, Dodge, Disengage, Help, Hide, Ready, etc.)
- All Conditions

**UI:**
- Combat Tracker
- Turn Order
- Initiative
- Conditions Display
- Range/Movement Grid

---

### Mode 4: Travel
**Purpose:** Overland journeys between locations

**Active Subsystems:**
- Travel Pace (fast/normal/slow)
- Navigation
- Foraging & Hunting
- Random Encounters
- Weather System
- Exhaustion from Forced March

**Primary Rules:**
- Speed (travel pace modifiers)
- Ability Checks (Survival for navigation/foraging)
- Passive Perception (spotting encounters)
- Exhaustion
- Food & Water (Carrying Capacity)

**UI:**
- World Map
- Travel Log
- Supplies Tracker
- Pace Selector

---

### Mode 5: Downtime
**Purpose:** Long-term activities between adventures

**Active Subsystems:**
- Crafting (time, costs, checks)
- Training (learning tools/languages)
- Research (libraries, arcana)
- Running a Business (income, complications)
- Carousing (contacts, complications)
- Building Strongholds

**Primary Rules:**
- Ability Checks (craft checks, research, etc.)
- Time Periods (days, weeks, months)
- Tool Proficiencies
- Gold Costs

**UI:**
- Calendar
- Activity Queue
- Resources Tracker
- Income/Expenses

---

## Data Organization

### In Core Concepts

```javascript
game.coreConcepts = {
  // 156 atomic rules from SRD glossary
  rules: RulesEngine,          // getByType('rule')

  // Entities that reference rules
  cards: {
    spells: [],                // Fireball, Magic Missile, etc.
    items: [],                 // Longsword, Plate Armor, etc.
    creatures: [],             // Goblin, Dragon, etc.
    features: []               // Action Surge, Rage, etc.
  },

  // Complex mechanics
  subsystems: SubsystemsManager, // Chase Scenes, Crafting, etc.

  // Gameplay states
  modes: ModesManager          // Interaction, Exploration, Combat, Travel, Downtime
}
```

### Mode → Subsystem → Rule Hierarchy

```
Combat Mode
  ├─ Initiative Subsystem
  │   ├─ Initiative (rule)
  │   ├─ Dexterity Check (rule)
  │   └─ Surprise (rule)
  ├─ Action Economy Subsystem
  │   ├─ Action (rule)
  │   ├─ Bonus Action (rule)
  │   └─ Reaction (rule)
  └─ Conditions Subsystem
      ├─ Blinded (rule)
      ├─ Charmed (rule)
      └─ ... (all conditions)

Travel Mode
  ├─ Navigation Subsystem
  │   ├─ Survival Check (rule)
  │   ├─ Passive Perception (rule)
  │   └─ Difficult Terrain (rule)
  └─ Foraging Subsystem
      ├─ Survival Check (rule)
      ├─ Food & Water (rule)
      └─ Time (rule)
```

## Mapping Strategy

### From Official dnd5e System

1. **Extract Rules** (156 from SRD glossary)
   - Parse `08_RulesGlossary.md`
   - Map to `game.coreConcepts.rules`

2. **Extract Cards** (from compendiums)
   - Spells → `dnd5e.spells` compendium
   - Items → `dnd5e.items` compendium
   - Creatures → `dnd5e.monsters` compendium

3. **Define Subsystems** (10-15 major subsystems)
   - Chase Scenes
   - Crafting
   - Social Encounters
   - Etc.

4. **Define Modes** (5 core modes)
   - Map which subsystems are active
   - Map which rules are primary
   - Map UI requirements

## Benefits

✅ **Clear Separation**: Rules ≠ Cards ≠ Subsystems ≠ Modes
✅ **Reusable**: Same rule referenced by multiple cards/subsystems
✅ **Platform Agnostic**: Pure data structures
✅ **Queryable**: `getRulesByMode('combat')`, `getCardsUsingRule('advantage')`
✅ **Extensible**: Easy to add homebrew rules, subsystems, or modes

---

**This architecture ensures Core Concepts is truly modular and reusable across any platform!** 🎲✨
