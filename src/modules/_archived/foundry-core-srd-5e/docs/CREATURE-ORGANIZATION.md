# Creature Organization System for foundry-core-srd-5e

## Overview

This document defines the creature organization system based on D&D 5e 2024 SRD structure, which separates creatures into three distinct packs: **monsters**, **animals**, and **people** (NPCs).

## Why Three Separate Packs?

While all creatures share the same stat block structure, the SRD explicitly separates them into different sections for different gameplay purposes:

1. **Monsters** (p254-343) - Combat encounters, dungeons, wilderness threats
2. **Animals** (p344+) - Beasts, mounts, familiars, natural wildlife
3. **People** (implicit) - NPCs, guards, merchants, allies/enemies

Maintaining this separation allows:
- **Module extensibility** - Future supplements can add to specific categories
- **Filtering and search** - Players/DMs can quickly find appropriate creatures
- **Gameplay context** - Different creature types serve different narrative purposes
- **SRD compliance** - Preserves the official SRD structure

## Directory Structure

```
packs/
├── monsters/           # Combat creatures from Monsters A-Z section
│   ├── aberration/     # Mind flayers, aboleths, etc.
│   ├── celestial/      # Angels, devas, etc.
│   ├── construct/      # Golems, animated objects, etc.
│   ├── dragon/         # All dragon types
│   ├── elemental/      # Fire, water, earth, air elementals
│   ├── fey/            # Pixies, sprites, hags, etc.
│   ├── fiend/          # Demons, devils, etc.
│   ├── giant/          # Hill giants, stone giants, etc.
│   ├── monstrosity/    # Chimera, manticore, etc.
│   ├── ooze/           # Gelatinous cube, black pudding, etc.
│   ├── plant/          # Awakened shrub, shambling mound, etc.
│   └── undead/         # Zombies, vampires, liches, etc.
│
├── animals/            # Beasts from Animals section
│   ├── aerial/         # Flying beasts (eagle, hawk, owl, etc.)
│   ├── aquatic/        # Swimming beasts (octopus, shark, etc.)
│   ├── domesticated/   # Farm/pet animals (cow, goat, cat, dog, etc.)
│   ├── mount/          # Rideable animals (horse, camel, elephant, etc.)
│   ├── predator/       # Hunting animals (wolf, lion, bear, etc.)
│   └── swarm/          # Swarms of tiny creatures
│
└── people/             # Humanoid NPCs
    ├── commoner/       # Non-combat NPCs (merchants, farmers, etc.)
    ├── guard/          # Guards, soldiers, militia
    ├── noble/          # Nobles, knights, officials
    ├── criminal/       # Bandits, assassins, pirates
    ├── spellcaster/    # Mages, priests, druids (NPC versions)
    └── specialist/     # Skilled NPCs (scouts, spies, etc.)
```

## Creature Type Detection

### Primary Categorization Rules

**1. Animals (Beast type)**
- `type === "beast"`
- Source: Animals section (SRD p344+)
- Examples: Draft Horse, Riding Horse, Mastiff, Eagle

**2. People (Humanoid NPCs)**
- `type === "humanoid"`
- Generic, non-specific humanoids (not player races)
- Source: Scattered throughout Monsters A-Z
- Examples: Guard, Guard Captain, Bandit, Mage, Priest

**3. Monsters (Everything Else)**
- All other creature types
- Source: Monsters A-Z (SRD p258-343)
- Types: aberration, celestial, construct, dragon, elemental, fey, fiend, giant, monstrosity, ooze, plant, undead

### Secondary Categorization (Subcategories)

#### For Monsters
Use the `type` field directly from the stat block:
- `type === "aberration"` → `monsters/aberration/`
- `type === "dragon"` → `monsters/dragon/`
- `type === "undead"` → `monsters/undead/`
- etc.

#### For Animals
Categorize by behavior/ecology:
- **Aerial**: Can fly naturally (not magical flight)
- **Aquatic**: Primary habitat is water
- **Domesticated**: Farm animals, pets
- **Mount**: Rideable (from Mounts and Vehicles section)
- **Predator**: Carnivorous hunters
- **Swarm**: Swarm creature type

Priority order (if multiple apply):
1. Mount (explicitly in Mounts section)
2. Swarm (creature size is Tiny and in groups)
3. Aerial (has fly speed)
4. Aquatic (has swim speed, amphibious)
5. Domesticated (domestic animals)
6. Predator (default for wild beasts)

#### For People
Categorize by role/archetype:
- **Commoner**: CR 0, no combat focus
- **Guard**: Military, law enforcement
- **Noble**: High status, leadership
- **Criminal**: Outlaws, bandits
- **Spellcaster**: Primary feature is spellcasting
- **Specialist**: Scouts, spies, skilled professionals

## Stat Block Structure

All creatures share the same Foundry VTT Actor structure:

```json
{
  "name": "Creature Name",
  "type": "npc",
  "system": {
    "details": {
      "type": {
        "value": "beast",        // aberration, beast, celestial, etc.
        "subtype": "",
        "swarm": ""
      },
      "alignment": "unaligned",
      "cr": 0.25,
      "xp": {
        "value": 50
      },
      "source": {
        "book": "XPHB",
        "page": 344
      }
    },
    "attributes": {
      "ac": { "value": 10 },
      "hp": { "value": 15, "max": 15, "formula": "2d10+4" },
      "movement": {
        "walk": 40,
        "swim": 0,
        "fly": 0
      },
      "init": { "bonus": 0 }
    },
    "abilities": {
      "str": { "value": 18 },
      "dex": { "value": 10 },
      "con": { "value": 15 },
      "int": { "value": 2 },
      "wis": { "value": 11 },
      "cha": { "value": 7 }
    },
    "traits": {
      "size": "lg",              // sm, med, lg, huge, grg
      "languages": { "value": [] },
      "senses": "Passive Perception 10"
    }
  },
  "items": [],                   // Actions, features, spells
  "flags": {
    "foundry-core-srd-5e": {
      "_srdData": {
        "name": "Draft Horse",
        "source": "XPHB",
        "page": 344,
        "type": "beast",
        "size": "L",
        "alignment": "U"
      }
    }
  }
}
```

## Key Properties for Categorization

### Required Properties (All Creatures)
- `name` - Creature name
- `type` - Always "npc" for Foundry (actor type)
- `system.details.type.value` - Creature type (beast, humanoid, dragon, etc.)
- `system.details.cr` - Challenge Rating
- `system.details.alignment` - Alignment
- `system.attributes.ac` - Armor Class
- `system.attributes.hp` - Hit Points
- `system.abilities` - Six ability scores
- `flags['foundry-core-srd-5e']._srdData` - SRD metadata

### Optional Properties
- `system.details.type.subtype` - For specific subtypes (e.g., "shapechanger")
- `system.details.type.swarm` - Size of creatures in swarm
- `system.attributes.movement.fly` - Flying speed
- `system.attributes.movement.swim` - Swimming speed
- `system.traits.languages` - Languages spoken
- `system.traits.senses` - Special senses (darkvision, etc.)
- `items[]` - Actions, traits, legendary actions (embedded items)

## Mount-Creature Relationship

As documented in [ITEM-ORGANIZATION.md](./ITEM-ORGANIZATION.md), mounts exist in TWO places:

1. **Item** (purchasable): `packs/items/gear/mount/`
   - Price, carrying capacity, speed
   - Reference: `flags._srdData.type = "MNT|XPHB"`

2. **Creature** (stat block): `packs/animals/mount/`
   - AC, HP, abilities, attacks
   - Reference: `system.details.type.value = "beast"`

They link by **exact name match**:
- Item: `"Riding Horse"` → Creature: `"Riding Horse"`

## Implementation Notes

### Creating the Packs

1. **Create directory structure** for all three packs
2. **Parse creature stat blocks** from SRD markdown
3. **Detect creature category** (monster/animal/people) using `type` field
4. **Detect subcategory** using type + behavior/ecology
5. **Convert to Foundry VTT Actor JSON** format
6. **Validate** all required properties present

### Validation Requirements

All creatures must have:
- Valid creature type (aberration, beast, celestial, construct, dragon, elemental, fey, fiend, giant, humanoid, monstrosity, ooze, plant, undead)
- Valid size (Tiny, Small, Medium, Large, Huge, Gargantuan)
- Valid alignment or "unaligned"
- Numeric CR value
- Numeric ability scores
- At least one action/attack

### Future Expansion

When adding creatures from other sources:
- **Volo's Guide to Monsters** → Add to appropriate monster/ subcategories
- **Mordenkainen's Tome of Foes** → Add to appropriate monster/ subcategories
- **Custom campaigns** → Use the same categorization system
- **Homebrew** → Create new subcategories as needed

## Sources

- D&D 5e 2024 SRD: Monsters (p254-343), Animals (p344+)
- 5etools data: `bestiary/` directory
- Foundry VTT: Actor data model (type: "npc")
