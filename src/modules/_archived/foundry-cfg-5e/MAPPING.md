# D&D 5e Official System Mapping

This document explains how `foundry-cfg-5e` maps the official dnd5e system to Core Concepts format.

## Overview

The `DnD5eMapper` class extracts configuration from the official Foundry dnd5e system (`CONFIG.DND5E`) and transforms it into platform-agnostic Core Concepts format.

## Architecture

```
Official dnd5e System (CONFIG.DND5E)
         ↓
  DnD5eMapper.mapAll()
         ↓
Core Concepts Format (Platform-Agnostic)
         ↓
  game.coreConcepts.rules
  game.cfg5e.mappedData
```

## SRD 5.2.1 & PHB 2024 Alignment

### Species vs Race

The official dnd5e system v5.2.0+ uses **"Species"** in the UI (aligned with PHB 2024) while maintaining `race` internally for backward compatibility:

- **Internal data structure**: `race` (for compatibility)
- **UI labels**: `"TYPES.Item.race": "Species"`
- **Our mapping**: Maps to `species` in Core Concepts
- **Legacy support**: Marked with `terminology: 'PHB 2024 uses "species" not "race"'`

```javascript
// Official System (internal)
CONFIG.DND5E.races = { ... }

// UI Translation
"TYPES.Item.race": "Species"

// Core Concepts Mapping
{
  id: 'human',
  type: 'species',  // Not 'race'
  metadata: {
    terminology: 'PHB 2024 uses "species" not "race"'
  }
}
```

## Mapped Categories

### 1. Abilities

Maps from `CONFIG.DND5E.abilities`:

```javascript
{
  id: 'str',
  name: 'Strength',
  abbreviation: 'str',
  fullKey: 'strength',
  type: 'physical', // or 'mental'
  category: 'ability',
  icon: 'systems/dnd5e/icons/svg/abilities/strength.svg',
  metadata: {
    source: 'Official dnd5e System',
    systemVersion: '5.2.0',
    type: 'ability'
  }
}
```

**Abilities Mapped:**
- Strength (STR) - Physical
- Dexterity (DEX) - Physical
- Constitution (CON) - Physical
- Intelligence (INT) - Mental
- Wisdom (WIS) - Mental
- Charisma (CHA) - Mental

### 2. Skills

Maps from `CONFIG.DND5E.skills`:

```javascript
{
  id: 'acrobatics',
  name: 'Acrobatics',
  ability: 'dex',
  category: 'skill',
  icon: 'systems/dnd5e/icons/skills/...',
  metadata: {
    source: 'Official dnd5e System',
    type: 'skill'
  }
}
```

### 3. Damage Types

Maps from `CONFIG.DND5E.damageTypes`:

```javascript
{
  id: 'fire',
  name: 'Fire',
  type: 'damage-type',
  category: 'elemental', // physical, elemental, magical
  icon: '...',
  color: '#ff4500',
  isPhysical: false,
  metadata: {
    source: 'Official dnd5e System',
    type: 'damage-type'
  }
}
```

**Categories:**
- **Physical**: bludgeoning, piercing, slashing
- **Elemental**: acid, cold, fire, lightning, thunder
- **Magical**: force, necrotic, poison, psychic, radiant

### 4. Conditions

Maps from `CONFIG.DND5E.conditionTypes`:

```javascript
{
  id: 'poisoned',
  name: 'Poisoned',
  type: 'condition',
  category: 'impairment', // impairment, movement, severe, mental
  icon: '...',
  metadata: {
    source: 'Official dnd5e System',
    type: 'condition',
    pseudo: false
  }
}
```

**Categories:**
- **Impairment**: blinded, deafened, poisoned, stunned
- **Movement**: grappled, prone, restrained
- **Severe**: incapacitated, paralyzed, petrified, unconscious
- **Mental**: charmed, frightened

### 5. Species (formerly "Race")

Maps from `CONFIG.DND5E.creatureTypes` (filtered for playable):

```javascript
{
  id: 'humanoid',
  name: 'Humanoid',
  type: 'species',
  category: 'character-option',
  metadata: {
    source: 'Official dnd5e System',
    type: 'species',
    terminology: 'PHB 2024 uses "species" not "race"'
  }
}
```

### 6. Classes

Maps from static list (SRD 5.2.1):

```javascript
{
  id: 'wizard',
  name: 'Wizard',
  type: 'class',
  category: 'character-option',
  hitDie: 'd6',
  primaryAbility: 'int',
  metadata: {
    source: 'SRD 5.2.1',
    type: 'class'
  }
}
```

**Classes:**
- Barbarian (d12, STR)
- Bard (d8, CHA)
- Cleric (d8, WIS)
- Druid (d8, WIS)
- Fighter (d10, STR)
- Monk (d8, DEX)
- Paladin (d10, STR)
- Ranger (d10, DEX)
- Rogue (d8, DEX)
- Sorcerer (d6, CHA)
- Warlock (d8, CHA)
- Wizard (d6, INT)

### 7. Movement Types

Maps from `CONFIG.DND5E.movementTypes`:

```javascript
{
  id: 'walk',
  name: 'Walking',
  type: 'movement',
  category: 'attribute'
}
```

**Types**: walk, burrow, climb, fly, swim

### 8. Senses

Maps from `CONFIG.DND5E.senses`:

```javascript
{
  id: 'darkvision',
  name: 'Darkvision',
  type: 'sense',
  category: 'attribute'
}
```

**Types**: blindsight, darkvision, tremorsense, truesight

### 9. Languages

Maps from `CONFIG.DND5E.languages`:

```javascript
{
  id: 'common',
  name: 'Common',
  type: 'language',
  category: 'trait',
  children: []
}
```

### 10. Tools

Maps from `CONFIG.DND5E.toolTypes`:

```javascript
{
  id: 'alchemist',
  name: "Alchemist's Supplies",
  type: 'tool',
  category: 'item'
}
```

### 11. Weapons

Maps from `CONFIG.DND5E.weaponTypes` and `CONFIG.DND5E.weaponProperties`:

```javascript
{
  id: 'simple',
  name: 'Simple Weapon',
  type: 'weapon',
  category: 'item'
},
{
  id: 'property-finesse',
  name: 'Finesse',
  type: 'weapon-property',
  category: 'item-property'
}
```

### 12. Armor

Maps from `CONFIG.DND5E.armorTypes`:

```javascript
{
  id: 'light',
  name: 'Light Armor',
  type: 'armor',
  category: 'item'
}
```

### 13. Spell Schools

Maps from `CONFIG.DND5E.spellSchools`:

```javascript
{
  id: 'evo',
  name: 'Evocation',
  type: 'spell-school',
  category: 'magic',
  icon: '...'
}
```

## Usage

### In Foundry VTT

```javascript
// Mapper runs automatically on module init
// Access mapped data:
const abilities = game.cfg5e.mappedData.abilities;
const species = game.cfg5e.mappedData.species;

// Query Core Concepts
const conditions = game.coreConcepts.rules.getByType('condition');
const fireSpells = game.coreConcepts.rules.getByTag('fire');
```

### Export to Platform

```javascript
const mapper = new DnD5eMapper();
await mapper.initialize();
await mapper.mapAll();

// Get Core Concepts format
const coreConceptsData = mapper.exportToCoreConceptsFormat();

// Sync to platform
await fetch('/api/rpg/rules', {
  method: 'POST',
  body: JSON.stringify(coreConceptsData)
});
```

## Platform Agnostic

All mapped data is **pure JSON** with no Foundry-specific APIs. This means the same data can be used in:

- ✅ Foundry VTT (current)
- ✅ Unity/Unreal game clients
- ✅ Web-based VTT alternatives
- ✅ Mobile apps
- ✅ Next.js web platform

## Versioning

The mapper tracks which version of the official dnd5e system was used:

```javascript
metadata: {
  source: 'Official dnd5e System',
  systemVersion: '5.2.0' // From game.system.version
}
```

This ensures compatibility tracking across updates.

## Future Enhancements

- [ ] Extract spell data from compendium packs
- [ ] Map monster stat blocks
- [ ] Extract feats and features
- [ ] Map equipment with prices/weights
- [ ] Support for homebrew content
- [ ] Automatic sync when official system updates

---

**Aligned with SRD 5.2.1 & PHB 2024** 🎲✨
