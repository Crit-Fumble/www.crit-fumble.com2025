# Foundry Core SRD 5e

**D&D 5e System Reference Document 5.2.1 Implementation for Foundry VTT**

---

## Overview

This module implements all D&D 5e SRD 5.2.1 content as Core Concepts types, creatures, items, and systems. It serves as a **free, open replacement** for the official Wizards of the Coast Foundry modules.

**Requires:** [Foundry Core Concepts](../foundry-core-concepts) module

**Data Source:** SRD 5.2.1 (OGL 1.0a licensed content)

---

## What's Included

### Core Concepts (68 JSON Definitions)

Complete D&D 5e mechanics extracted from SRD 5.2.1:

- **[Conditions](docs/conditions/)** (15) - Blinded, Charmed, Deafened, Exhaustion, Frightened, Grappled, Incapacitated, Invisible, Paralyzed, Petrified, Poisoned, Prone, Restrained, Stunned, Unconscious
- **[Hazards](docs/hazards/)** (15) - Environmental (burning, falling, extreme weather), Poisons (5 types), Traps (mechanical & magical)
- **[Actions](docs/actions/)** (14) - Attack, Cast Spell, Dash, Disengage, Dodge, Help, Hide, Ready, Search, Study, Utilize, Grapple, Shove, Influence
- **[Damage Types](docs/damage-types/)** (13) - Physical (bludgeoning, piercing, slashing), Elemental (acid, cold, fire, lightning, thunder), Supernatural (force, necrotic, poison, psychic, radiant)
- **[Activities](docs/activities/)** (7) - Combat, Eating, Reading, Spellcasting, Standing Watch, Talking, Walking
- **[Travel Pace](docs/travel-pace/)** (4) - Slow, Normal, Fast, Forced March

Each concept includes complete mechanics, SRD references, and FoundryVTT integration examples.

### Types
- **Species** (Humanoid subtypes - uses SRD 5.2.1 terminology, not "race")
  - Dragonborn, Dwarf, Elf, Halfling, Human, Orc, Tiefling
- **Classes** (12 core classes)
  - Barbarian, Bard, Cleric, Druid, Fighter, Monk, Paladin, Ranger, Rogue, Sorcerer, Warlock, Wizard
- **Creature Types**
  - Aberration, Beast, Celestial, Construct, Dragon, Elemental, Fey, Fiend, Giant, Humanoid, Monstrosity, Ooze, Plant, Undead

### Creatures
- **300+ SRD Monsters** from Monster Manual
- Complete stat blocks with traits, actions, legendary actions
- Organized by CR and creature type

### Items
- **Weapons** (Simple and Martial)
- **Armor** (Light, Medium, Heavy, Shields)
- **Adventuring Gear**
- **Magic Items** (SRD subset)
- **Potions, Scrolls, Wands**

### Spells
- **200+ SRD Spells** (levels 0-9)
- Organized by school and class
- Complete spell descriptions

### Systems
- **Resting System**: Short rest (1 hour) and Long rest (8 hours)
- **Exhaustion System**: 6 levels with cumulative effects
- **Conditions System**: All 15 SRD conditions
- **Spellcasting System**: Spell slot tracking, concentration, ritual casting
- **Death Saves System**: 3 successes/3 failures mechanic
- **Inspiration System**: Award and track inspiration

---

## Installation

1. Install **Foundry Core Concepts** (required)
2. Install this module via Foundry's module browser
3. Enable in your world's module settings
4. **That's it!** All SRD content is pre-packaged in compendium packs

---

## Using SRD Data

### Accessing Compendia

Once the module is enabled, you'll find the following compendium packs available:

- **SRD 5e Species** - All 7 SRD species (Dragonborn, Dwarf, Elf, Halfling, Human, Orc, Tiefling)
- **SRD 5e Classes** - All 12 core classes with features
- **SRD 5e Monsters** - 300+ creatures from the SRD bestiary
- **SRD 5e Items** - Weapons, armor, adventuring gear, and magic items
- **SRD 5e Spells** - 200+ spells (levels 0-9)
- **SRD 5e Rules** - Core rules, conditions, and systems

### Importing into Your World

Simply drag and drop from the compendia into your world:

1. Open a compendium pack (e.g., "SRD 5e Monsters")
2. Search or browse for the content you need
3. Drag items/actors into your world
4. Use them in your game!

**No import process required** - everything is pre-built and ready to use.

---

## Data Sources

### JSON Data
Location: `www.crit-fumble.com/data/5e/5etools-srd521/data/`

Files:
- `races.json` - Species data
- `class/*.json` - Class data
- `bestiary/*.json` - Creature data
- `items.json` - Item data
- `spells/*.json` - Spell data
- `conditionsdiseases.json` - Conditions and diseases
- `variantrules.json` - Optional rules

### Markdown Content
Location: `www.crit-fumble.com/data/5e/srd/`

Files:
- `srd-5.2.1-cc.md` - Complete SRD text
- `split/` - Individual sections

### Art Assets
Location: `www.crit-fumble.com/public/img/`

All art assets are **CC0 licensed** (public domain)

---

## SRD 5.2.1 Terminology

### Important Note: Species, Not Race

SRD 5.2.1 uses **"species"** to refer to humanoid subtypes (Dragonborn, Dwarf, Elf, etc.), replacing the older "race" terminology.

Our implementation correctly uses:
- Type Category: `species`
- Parent Type: `humanoid`

---

## Architecture

### Import System

```
Import Manager
├── Species Importer
│   └── Reads races.json → Creates Species types
├── Class Importer (TODO)
│   └── Reads class/*.json → Creates Class types
├── Creature Importer (TODO)
│   └── Reads bestiary/*.json → Creates Actors
├── Item Importer (TODO)
│   └── Reads items.json → Creates Items
└── Spell Importer (TODO)
    └── Reads spells/*.json → Creates Spell cards
```

### Data Flow

```
SRD JSON Data → Importer → Core Concepts Types → Foundry Documents
```

**Example:**
```
races.json (Dragonborn)
    ↓ SpeciesImporter
Core Concepts Type (species-dragonborn)
    ↓ TypesRegistry
Available for use in character creation
```

---

## Comparison to Official Modules

| Feature | Official Modules | This Module |
|---------|-----------------|-------------|
| **Cost** | $50+ | Free (OGL) |
| **Data Source** | Proprietary | SRD 5.2.1 |
| **Integration** | Standalone | Core Concepts framework |
| **Extensibility** | Limited | Full API access |
| **Updates** | Manual | Automated from JSON |
| **Art Assets** | Copyrighted | CC0 public domain |

---

## Configuration

### Module Settings

- **Enable SRD Systems**: Toggle all SRD systems on/off
- **Auto-Import SRD Data**: Import data automatically on first load
- **SRD Data Path**: Path to SRD JSON data directory
- **Debug Mode**: Enable detailed logging

### Art Asset Processing

If ImageMagick is installed:
- Automatic art asset optimization
- Thumbnail generation
- Format conversion

---

## Development

### Building Compendium Packs

The module is distributed with **pre-built compendium packs**. To rebuild them from SRD source data:

```bash
# From module directory
node scripts/build-compendia.mjs
```

This build script:
1. Reads SRD 5.2.1 JSON data from `data/5e/5etools-srd521/`
2. Filters for `srd52: true` content only
3. Converts to Foundry document format
4. Writes compendium pack files to `packs/`

**Build once, distribute everywhere** - GMs don't need to run any import process!

### Architecture

**Build Time (Developers):**
- `scripts/build-compendia.mjs` - Build script that generates compendia
- `scripts/importers/` - Helper classes for parsing SRD data
- Run once to create compendium packs

**Runtime (GMs):**
- `packs/` - Pre-built compendium packs (included in distribution)
- `scripts/init.mjs` - Module initialization
- `scripts/systems/` - Game systems (resting, exhaustion, etc.)

### Data Mapping

See [SRD_DATA_MAPPING.md](docs/SRD_DATA_MAPPING.md) for complete mapping of SRD data to Foundry documents.

---

## Roadmap

### Phase 1: Types ✅
- [x] Species importer
- [ ] Class importer
- [ ] Creature type importer
- [ ] Item type importer

### Phase 2: Core Data
- [ ] Creature/bestiary importer
- [ ] Item importer
- [ ] Spell importer

### Phase 3: Systems
- [ ] Resting system
- [ ] Exhaustion system
- [ ] Conditions system
- [ ] Spellcasting system
- [ ] Death saves system

### Phase 4: Books
- [ ] Parse markdown content
- [ ] Create book entries
- [ ] Link to imported data

---

## Legal

### OGL 1.0a License

This module contains content from the D&D 5e System Reference Document 5.2.1, which is available under the Open Game License v1.0a.

**What's Included:**
- Species (humanoid subtypes)
- Classes and subclasses
- Monsters and creatures
- Spells
- Magic items
- Game rules and mechanics

**What's NOT Included:**
- Product Identity content (Beholders, Mind Flayers, etc.)
- Non-SRD subclasses
- Campaign-specific content
- Copyrighted artwork (we use CC0 alternatives)

Full OGL text: [OGL 1.0a](https://media.wizards.com/2016/downloads/DND/SRD-OGL_V5.1.pdf)

---

## Support

- **Issues**: [GitHub Issues](https://github.com/crit-fumble/foundry-core-srd-5e/issues)
- **Documentation**: [SRD Data Mapping](docs/SRD_DATA_MAPPING.md)
- **Discord**: [Crit-Fumble Server](https://discord.gg/crit-fumble)

---

## Credits

- **SRD Content**: Wizards of the Coast (OGL 1.0a)
- **JSON Data**: 5etools community
- **Art Assets**: Various CC0 contributors
- **Module**: Crit-Fumble team

---

**Free D&D 5e content for everyone!** 🎲✨
