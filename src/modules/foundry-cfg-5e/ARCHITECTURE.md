# Foundry CFG 5e Architecture

## Separation of Concerns

This module properly separates **D&D 5e-specific configuration** from **Core Concepts**.

### What Goes Where

#### D&D 5e Configuration (`game.cfg5e.config`)
**5e-specific properties and types** - NOT Core Concepts

These define the structure and properties unique to D&D 5e:

- **Abilities** (STR, DEX, CON, INT, WIS, CHA)
- **Skills** (Acrobatics, Athletics, etc.)
- **Damage Types** (Fire, Cold, Slashing, etc.)
- **Conditions** (Blinded, Charmed, etc.) - as property types
- **Sizes** (Tiny, Small, Medium, Large, etc.)
- **Alignments** (LG, NG, CG, etc.)
- **Creature Types** (Humanoid, Beast, Dragon, etc.)
- **Item Rarity** (Common, Uncommon, Rare, etc.)
- **Attunement Types**
- **Activation Types** (Action, Bonus Action, Reaction, etc.)
- **Spell Schools** (Evocation, Abjuration, etc.)
- **Spell Components** (V, S, M, R, C)
- **Currencies** (PP, GP, EP, SP, CP)
- **Weapon Masteries** (Cleave, Graze, Push, etc.)
- **Movement Types** (Walk, Burrow, Climb, Fly, Swim)
- **Senses** (Darkvision, Blindsight, etc.)
- **Languages** (Common, Elvish, etc.)
- **Tool Types**
- **Weapon Types**
- **Armor Types**
- **Facilities**

#### Core Concepts (`game.coreConcepts`)
**Universal game concepts** - Platform agnostic

These are the actual Core Concepts:

1. **Rules** (156 from SRD 5.2 glossary)
   - Atomic game mechanics
   - Example: "Advantage", "Attack Roll", "Critical Hit"
   - Source: `data/rules/srd-glossary.mjs`

2. **Cards** (entities that reference rules)
   - Spells (Fireball, Magic Missile, etc.)
   - Items (Longsword, Plate Armor, etc.)
   - Creatures (Goblin, Dragon, etc.)
   - Features (Action Surge, Rage, etc.)
   - Source: Extracted from compendiums

3. **Subsystems** (complex mechanics)
   - Chase Scenes
   - Crafting
   - Social Encounters
   - Travel
   - Downtime Activities
   - Source: `data/subsystems/`

4. **Modes** (gameplay states)
   - Interaction
   - Exploration
   - Combat
   - Travel
   - Downtime
   - Source: `data/modes/`

## Data Flow

```
Official dnd5e System (CONFIG.DND5E)
         ↓
  DnD5eMapper.mapAll()
         ↓
D&D 5e Configuration (game.cfg5e.config)
  ├─ abilities
  ├─ skills
  ├─ damageTypes
  ├─ conditions (as property types)
  ├─ sizes
  └─ ... (25+ categories)

SRD 5.2 Rules Glossary (markdown)
         ↓
  extract-srd-rules.mjs
         ↓
  data/rules/srd-glossary.mjs
         ↓
Core Concepts Rules (game.coreConcepts.rules)
  └─ 156 atomic rules

Foundry Compendiums
         ↓
  Card Extractors (TODO)
         ↓
Core Concepts Cards (game.coreConcepts.cards)
  ├─ spells
  ├─ items
  ├─ creatures
  └─ features

Manual Definitions
         ↓
  data/subsystems/ & data/modes/
         ↓
Core Concepts (game.coreConcepts)
  ├─ subsystems
  └─ modes
```

## File Structure

```
foundry-cfg-5e/
├── scripts/
│   ├── init.mjs                    # Module initialization
│   ├── dnd5e-mapper.mjs            # Extracts 5e config from official system
│   └── extract-srd-rules.mjs       # Extracts 156 rules from SRD glossary
│
├── data/
│   ├── rules/
│   │   ├── srd-glossary.mjs        # 156 SRD rules (generated)
│   │   └── index.mjs               # Rules exports
│   │
│   ├── subsystems/
│   │   └── index.mjs               # Subsystems (TODO)
│   │
│   └── modes/
│       └── index.mjs               # Modes (already defined)
│
├── ARCHITECTURE.md                 # This file
├── CORE_CONCEPTS_SCHEMA.md         # Core Concepts hierarchy
├── MAPPING.md                      # How official system maps to 5e config
└── MAPPED_DATA.md                  # Complete list of mapped 5e data
```

## Usage

### Accessing D&D 5e Configuration

```javascript
// Get 5e-specific configuration
const abilities = game.cfg5e.config.abilities;
const skills = game.cfg5e.config.skills;
const damageTypes = game.cfg5e.config.damageTypes;

// Example: Get Strength ability
const str = game.cfg5e.config.abilities.find(a => a.id === 'str');
console.log(str.name); // "Strength"
```

### Accessing Core Concepts

```javascript
// Get atomic rules (156 from SRD)
const rules = game.coreConcepts.rules.getAll();
const advantageRule = game.coreConcepts.rules.getByName('Advantage');

// Get rules by category
const combatRules = game.coreConcepts.rules.getByCategory('combat');
const d20Rules = game.coreConcepts.rules.getByTag('d20');

// Get cards (when implemented)
const spells = game.coreConcepts.cards.spells;
const fireball = spells.find(s => s.id === 'fireball');

// Get subsystems (when implemented)
const chaseScenes = game.coreConcepts.subsystems.find(s => s.id === 'chase-scenes');

// Get modes
const combatMode = game.coreConcepts.modes.find(m => m.id === 'combat');
```

## Why This Separation?

### ✅ D&D 5e Configuration is System-Specific
- Abilities, skills, damage types are **D&D 5e concepts**
- Other systems (Pathfinder, FATE, etc.) have different properties
- These don't belong in a universal "Core Concepts" framework

### ✅ Core Concepts is Universal
- Rules, Cards, Subsystems, Modes work across systems
- Platform-agnostic (Foundry, Unity, web, mobile)
- Reusable and queryable

### ✅ Clear API
- `game.cfg5e.config` - D&D 5e properties
- `game.coreConcepts` - Universal game concepts

## Next Steps

1. ✅ Extract SRD 5.2 Rules (156 rules) - **DONE**
2. ✅ Separate 5e config from Core Concepts - **DONE**
3. ⏳ Define Subsystems (chase scenes, crafting, etc.) - **IN PROGRESS**
4. ⏳ Map Modes to Subsystems
5. ⏳ Extract Cards from compendiums (spells, items, creatures)

---

**Clean architecture with proper separation of concerns!** 🎲✨
