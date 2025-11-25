# SRD 5.2.1 Data Mapping to Core Concepts

**Mapping D&D 5e SRD 5.2.1 to Foundry Core Concepts Framework**

---

## Overview

This document maps the SRD 5.2.1 data structure from 5etools to our Core Concepts framework.

**Data Sources:**
- JSON: `www.crit-fumble.com/data/5e/5etools-srd521/data/`
- Markdown: `www.crit-fumble.com/data/5e/srd/`

**Important Note:** SRD 5.2.1 uses **"species"** (not "race") as a creature sub-type for Humanoid creatures.

---

## Core Concepts Mapping

### 1. Types (from Core Concepts TypesRegistry)

#### Species Types (Humanoid subtypes)
**Source:** `races.json`
**Mapping:**
- Type Category: `species`
- Parent Type: `humanoid`
- Examples: Dragonborn, Dwarf, Elf, Halfling, Human, Orc, Tiefling

**Properties:**
- `size`: Size category (M, S, L, etc.)
- `speed`: Base movement speed
- `darkvision`: Darkvision range
- `creatureTypes`: Parent creature type (always "humanoid" for species)
- `traits`: Species-specific abilities
- `abilityScoreIncrease`: Ability score modifiers

#### Creature Types
**Source:** `bestiary/*.json`
**Mapping:**
- Type Category: `creature-type`
- Examples: aberration, beast, celestial, construct, dragon, elemental, fey, fiend, giant, humanoid, monstrosity, ooze, plant, undead

#### Class Types
**Source:** `class/*.json`
**Mapping:**
- Type Category: `class`
- Examples: Barbarian, Bard, Cleric, Druid, Fighter, Monk, Paladin, Ranger, Rogue, Sorcerer, Warlock, Wizard

**Properties:**
- `hitDice`: Hit die type (d6, d8, d10, d12)
- `primaryAbility`: Primary ability scores
- `savingThrows`: Proficient saving throws
- `spellcastingAbility`: Spellcasting ability (if any)
- `casterProgression`: full, half, none
- `features`: Class features by level

#### Item Types
**Source:** `items.json`, `items-base.json`
**Mapping:**
- Type Category: `item-type`
- Examples: Weapon, Armor, Potion, Scroll, Wondrous Item, etc.

**Properties:**
- `rarity`: Common, Uncommon, Rare, Very Rare, Legendary, Artifact
- `requiresAttunement`: Boolean
- `weaponCategory`: Simple, Martial
- `armorCategory`: Light, Medium, Heavy, Shield
- `properties`: Weapon/armor properties

---

### 2. Creatures (from Core Concepts - extends Actor)

**Source:** `bestiary/*.json`

**Mapping:**
```
SRD Creature → Foundry Actor
├── name → actor.name
├── size → actor.system.traits.size
├── type → actor.system.details.type.value
├── alignment → actor.system.details.alignment
├── ac → actor.system.attributes.ac.value
├── hp → actor.system.attributes.hp
├── speed → actor.system.attributes.movement
├── str/dex/con/int/wis/cha → actor.system.abilities
├── saves → actor.system.abilities.*.save
├── skills → actor.system.skills
├── senses → actor.system.traits.senses
├── languages → actor.system.traits.languages
├── cr → actor.system.details.cr
├── traits → actor.items (features)
├── actions → actor.items (actions)
├── legendaryActions → actor.items (legendary actions)
└── spells → actor.items (spells)
```

---

### 3. Objects/Items (from Core Concepts - extends Item)

**Source:** `items.json`, `items-base.json`

**Mapping:**
```
SRD Item → Foundry Item
├── name → item.name
├── type → item.type
├── rarity → item.system.rarity
├── value → item.system.price
├── weight → item.system.weight
├── description → item.system.description
├── properties → item.system.properties
├── damage → item.system.damage (weapons)
├── armor → item.system.armor (armor)
└── attunement → item.system.attunement
```

**Item Types:**
- Weapons (simple, martial, ammunition)
- Armor (light, medium, heavy, shields)
- Adventuring Gear
- Tools
- Mounts and Vehicles
- Trade Goods
- Magic Items
- Potions
- Scrolls
- Wands, Staffs, Rods
- Wondrous Items

---

### 4. Books (from Core Concepts BooksManager)

**Source:** Markdown files in `www.crit-fumble.com/data/5e/srd/`

**SRD Books:**
- Player's Handbook content (classes, species, spells)
- Monster Manual content (bestiary)
- Dungeon Master's Guide content (magic items, rules)

**Mapping:**
- Each major section becomes a Book (journal entry)
- Contains linked: Spells (cards), Monsters (actors), Items (items), Rules (rules)

---

### 5. Rules (from Core Concepts RulesEngine)

**Source:** `variantrules.json`, `conditionsdiseases.json`, `trapshazards.json`

**Rule Categories:**

#### Conditions
**Source:** `conditionsdiseases.json`
- Blinded, Charmed, Deafened, Exhaustion, Frightened, Grappled, Incapacitated, Invisible, Paralyzed, Petrified, Poisoned, Prone, Restrained, Stunned, Unconscious

**Mapping:**
- Type: `condition`
- Trigger: When applied to actor
- Effect: Apply mechanical changes

#### Variant Rules
**Source:** `variantrules.json`
- Optional rules from SRD
- Combat rules, exploration rules, social interaction rules

#### Diseases
**Source:** `conditionsdiseases.json`
- Cackle Fever, Sewer Plague, Sight Rot, etc.

**Mapping:**
- Type: `disease`
- Trigger: Exposure/failed save
- Effect: Apply condition over time

---

### 6. Systems (from Core Concepts SystemsManager)

**SRD Systems to Implement:**

#### Resting System
- **Short Rest**: 1 hour, regain Hit Dice usage, some class features
- **Long Rest**: 8 hours, regain all HP and Hit Dice, spell slots, class features

#### Exhaustion System
- 6 levels of exhaustion
- Each level has cumulative effects
- Removal: 1 level per long rest

#### Conditions System
- Apply/remove conditions
- Track condition effects
- Apply mechanical changes

#### Spellcasting System
- Spell slot tracking by level
- Spell preparation
- Concentration tracking
- Ritual casting

#### Death Saves System
- Track death saving throws (3 successes or 3 failures)
- Stabilization
- Instant death (massive damage)

#### Inspiration System
- Award/track inspiration points
- Usage for advantage on rolls

---

### 7. Spells (Deck/Cards from Core Concepts DecksManager)

**Source:** `spells/*.json`

**Mapping:**
```
SRD Spell → Card in Spell Deck
├── name → card.name
├── level → card.system.level
├── school → card.system.school
├── time → card.system.activation
├── range → card.system.range
├── components → card.system.components (V, S, M)
├── duration → card.system.duration
├── description → card.system.description
└── classes → card.system.classes
```

**Spell Decks by:**
- Level (0-9)
- School (Abjuration, Conjuration, Divination, Enchantment, Evocation, Illusion, Necromancy, Transmutation)
- Class (Bard, Cleric, Druid, Paladin, Ranger, Sorcerer, Warlock, Wizard)

---

### 8. Locations

**SRD does not contain specific locations**
- Locations are DM-created
- Can reference creature environments/lairs
- Creature lairs from bestiary can become location templates

---

## Data Structure Example

### Species (Dragonborn)
```json
{
  "type": "species",
  "category": "humanoid-subtype",
  "name": "Dragonborn",
  "source": "XPHB",
  "creatureTypes": ["humanoid"],
  "size": "M",
  "speed": 30,
  "darkvision": 60,
  "traits": {
    "draconicAncestry": {
      "name": "Draconic Ancestry",
      "description": "Choose dragon type...",
      "damageType": "varies",
      "breathWeapon": true
    },
    "breathWeapon": {
      "name": "Breath Weapon",
      "description": "...",
      "damage": "2d6",
      "saveDC": "8 + CON + proficiency"
    }
  }
}
```

### Creature (Aboleth)
```json
{
  "type": "creature",
  "name": "Aboleth",
  "creatureType": "aberration",
  "size": "L",
  "alignment": "LE",
  "cr": 10,
  "abilities": {
    "str": 21, "dex": 9, "con": 15,
    "int": 18, "wis": 15, "cha": 18
  },
  "hp": { "average": 150, "formula": "20d10+40" },
  "ac": 17,
  "speed": { "walk": 10, "swim": 40 },
  "senses": ["Darkvision 120 ft."],
  "languages": ["Deep Speech", "telepathy 120 ft."],
  "traits": [
    "Amphibious",
    "Legendary Resistance",
    "Mucus Cloud",
    "Probing Telepathy"
  ],
  "actions": ["Multiattack", "Tentacle"],
  "legendaryActions": 3
}
```

### Class (Wizard)
```json
{
  "type": "class",
  "name": "Wizard",
  "hitDice": "1d6",
  "primaryAbility": ["int"],
  "savingThrows": ["int", "wis"],
  "spellcastingAbility": "int",
  "casterProgression": "full",
  "features": [
    {
      "level": 1,
      "name": "Spellcasting",
      "description": "..."
    },
    {
      "level": 1,
      "name": "Arcane Recovery",
      "description": "..."
    }
  ],
  "subclasses": [
    "Abjuration", "Divination", "Evocation", "Illusion"
  ]
}
```

---

## Import Strategy

### Phase 1: Types
1. Import Species types from `races.json`
2. Import Creature types from bestiary
3. Import Class types from `class/*.json`
4. Import Item types from `items.json`

### Phase 2: Core Data
1. Import all creatures from `bestiary/*.json`
2. Import all items from `items.json`
3. Import all spells from `spells/*.json`

### Phase 3: Rules & Systems
1. Import conditions from `conditionsdiseases.json`
2. Import variant rules from `variantrules.json`
3. Implement SRD systems (resting, exhaustion, etc.)

### Phase 4: Books
1. Parse markdown from `www.crit-fumble.com/data/5e/srd/`
2. Create book entries
3. Link to imported creatures, items, spells

---

## File Organization

```
foundry-core-srd-5e/
├── scripts/
│   ├── init.mjs
│   ├── importers/
│   │   ├── species-importer.mjs
│   │   ├── creature-importer.mjs
│   │   ├── item-importer.mjs
│   │   ├── spell-importer.mjs
│   │   ├── class-importer.mjs
│   │   └── rules-importer.mjs
│   ├── systems/
│   │   ├── resting-system.mjs
│   │   ├── exhaustion-system.mjs
│   │   ├── conditions-system.mjs
│   │   ├── spellcasting-system.mjs
│   │   └── death-saves-system.mjs
│   └── data/
│       ├── species-types.json (generated)
│       ├── creature-types.json (generated)
│       └── class-types.json (generated)
└── docs/
    └── SRD_DATA_MAPPING.md (this file)
```

---

## Next Steps

1. Create importer scripts for each data type
2. Map SRD JSON schema to Foundry document schema
3. Generate compendium packs for creatures, items, spells
4. Implement SRD-specific systems
5. Create UI for importing SRD data into game world

---

**Last Updated:** 2025-01-19
