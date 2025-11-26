# Foundry CFG Cypher Bridge

**Bridge module connecting official Cypher System to Crit-Fumble Gaming platform**

---

## Overview

The CFG Cypher Bridge is a **game-specific plugin** that sits above the official Cypher System, integrating it with the Crit-Fumble Gaming platform and Core Concepts framework.

### Architecture

```
┌─────────────────────────────────────────────────────┐
│        Crit-Fumble Web Platform (Next.js)           │
│     https://crit-fumble.com - RPG management        │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP API (Platform Sync)
                       │
┌──────────────────────▼──────────────────────────────┐
│              Foundry VTT Instance                   │
│  ┌──────────────────────────────────────────────┐  │
│  │  Cypher System (Official - mrkwnzl)         │  │
│  │  - ~3.5MB, flexible system                  │  │
│  │  - Character sheets, dice, tracking         │  │
│  └───────────────────┬──────────────────────────┘  │
│                      │                              │
│  ┌───────────────────▼──────────────────────────┐  │
│  │  Core Concepts (Universal Framework)        │  │
│  │  - System-agnostic concepts                 │  │
│  │  - Locations, Boards, Tokens                │  │
│  └───────────────────┬──────────────────────────┘  │
│                      │                              │
│  ┌───────────────────▼──────────────────────────┐  │
│  │  CFG Cypher Bridge (This Module)           │  │
│  │  - Platform sync (Cypher → web)            │  │
│  │  - Core Concepts mapping                    │  │
│  │  - Multi-game support (Numenera, Strange)   │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## Why This Architecture?

### ✅ Leverage Official System

**Don't rebuild Cypher System from scratch:**
- Official character sheets with full Cypher mechanics
- Stat pools (Might, Speed, Intellect)
- Damage track (Hale → Impaired → Debilitated → Dead)
- Recovery roll tracking
- Character sentence builder (Descriptor + Type + Focus)
- Cypher, artifact, and ability management

### ✅ Focus on Value-Add

**Build what makes us unique:**
- Platform sync to Crit-Fumble web application
- Multi-game support (Numenera, The Strange, etc.)
- Core Concepts framework integration
- Enhanced creature behaviors (future)

### ✅ Maintainability

**Let Cypher System team handle updates:**
- We maintain ~500 lines vs ~2,000+ lines
- System bugs fixed upstream
- Focus on platform integration, not mechanics

---

## Features

### 1. CSRD Data Integration (via Core Concepts)

**Cypher System Reference Document (CSRD) Content:**

This module loads content from the [Cypher System Reference Document](http://csol.montecookgames.com) published under the **Cypher System Open License (CSOL)**.

**What's Available:**
- **103 Descriptors** - Character descriptors (Clever, Tough, Mystical, etc.)
- **4 Core Types** - Warrior, Adept, Explorer, Speaker
- **142 Foci** - Character foci (Talks to Machines, Explores Dark Places, etc.)

**Data Source:**
- Loaded at runtime from [Old Gus' CSRD](https://callmepartario.github.io/og-csrd/)
- **No duplicate data** - Uses adapter pattern like D&D 5e module
- Registered with Core Concepts TypesRegistry
- Categorized by game type (core, fantasy, cyberpunk, weird-west, etc.)

**Access CSRD Data via TypesRegistry:**
```javascript
// Convenience methods (recommended)
game.cfgCypher.getDescriptors()      // All descriptors
game.cfgCypher.getDescriptors('fantasy')  // Filter by category
game.cfgCypher.getTypes()            // All types
game.cfgCypher.getFoci()             // All foci
game.cfgCypher.getFoci('cyberpunk')  // Filter by category

// Direct TypesRegistry access
game.coreConcepts.types.getByCategory('cypher-descriptor')
game.coreConcepts.types.getByCategory('cypher-type')
game.coreConcepts.types.getByCategory('cypher-focus')

// Search by tag
const descriptors = game.cfgCypher.getDescriptors();
const speciesDescriptors = descriptors.filter(d => d.tags?.includes('species'));
```

### 2. Character Sentence Builder

**Build Character Sentences:**

The Cypher System uses a sentence structure: **"I am a [DESCRIPTOR] [TYPE] who [FOCUS]"**

```javascript
// Build a sentence
game.cfgCypher.buildSentence('Clever', 'Nano', 'Talks to Machines')
// → "I am a Clever Nano who Talks to Machines"

// Parse a sentence
game.cfgCypher.parseSentence('I am a Clever Nano who Talks to Machines')
// → { descriptor: 'Clever', type: 'Nano', focus: 'Talks to Machines' }

// Build from actor
game.cfgCypher.sentenceBuilder.buildFromActor(actor)

// Get HTML formatted sentence
game.cfgCypher.sentenceBuilder.buildHTML({
  descriptor: 'Clever',
  type: 'Nano',
  focus: 'Talks to Machines'
})
```

### 3. Platform Sync

Automatically sync Foundry data to Crit-Fumble web platform:

- **PC Actors** → `RpgCreature` (descriptor, type, focus, tier, pools)
- **NPC Actors** → `RpgCreature` (level, health, damage, armor)
- **Items** → `RpgItem` (abilities, cyphers, artifacts, skills)
- **Scenes** → `RpgBoard`/`RpgLocation` (maps, locations)

**Configuration:**
```javascript
// Module settings
enablePlatformSync: false  // Toggle sync on/off
platformApiUrl: 'https://crit-fumble.com/api'
platformApiKey: ''  // Your API key from platform
gameMode: 'cypher'  // 'cypher', 'numenera', 'strange', etc.
```

### 4. Cypher System Data Mapping

Maps all Cypher System data to Core Concepts:

**PC Actor Mapping:**
- Character sentence (Descriptor, Type, Focus)
- Tier (1-6) → Progression
- Stat pools (Might, Speed, Intellect, Additional)
- Damage track (Hale, Impaired, Debilitated, Dead)
- Recovery rolls (1 action, 10 min, 1 hour, 10 hours)
- Armor rating and speed cost

**NPC Actor Mapping:**
- Level
- Health pool
- Damage inflicted
- Armor rating

**Item Mapping:**
- Abilities (cost, pool)
- Cyphers (level, type, identified status)
- Artifacts (level, depletion)
- Skills (rating: Inability, Practiced, Trained, Specialized)
- Weapons (damage, modifier, range)
- Armor (rating, cost)

### 3. Multi-Game Support

Supports all major Cypher System games:

- **Generic Cypher System** - Core rulebook
- **Numenera** - Science fantasy
- **The Strange** - Multiverse exploration
- **Predation** - Dinosaurs and time travel
- **Gods of the Fall** - Divine characters
- **Unmasked** - Teen superheroes
- **Custom/Homebrew** - Your own settings

**Configuration:**
```javascript
gameMode: 'numenera'  // Tracks which game for future enhancements
```

### 4. Core Concepts Integration

Maps Cypher data to Core Concepts framework:

- Stat pools → Attributes
- Damage track states → Conditions
- Abilities → Actions
- Scenes → Hierarchical locations

---

## Installation

### Prerequisites

1. **Foundry VTT** v11+ (verified on v13)
2. **Cypher System** v3.4.0+ (verified on v3.4.3)
3. **Core Concepts Module** v0.1.0+

### Install Steps

1. Install modules in this order:
   ```
   1. Cypher System (if not already installed)
   2. Foundry Core Concepts module
   3. CFG Cypher Bridge module (this module)
   ```

2. Enable modules in your world:
   - ✅ Foundry Core Concepts
   - ✅ CFG Cypher Bridge

3. Configure in Module Settings:
   - Set platform API URL and key (if using sync)
   - Choose game mode (Cypher, Numenera, The Strange, etc.)
   - Enable/disable platform sync

---

## Configuration

### Platform Sync

**Required for platform integration:**

1. Get API key from Crit-Fumble platform:
   - Log in to https://crit-fumble.com
   - Go to Account → API Keys
   - Generate new key for your Foundry instance

2. Configure module settings:
   ```
   Enable Platform Sync: ✅
   Platform API URL: https://crit-fumble.com/api
   Platform API Key: [paste your key]
   Game Mode: Numenera (or your game)
   ```

3. Reload world

**Data synced automatically:**
- Actor creation/updates → RPG creatures
- Item creation → RPG items
- Scene creation → Boards/locations

---

## API Reference

### Module API

```javascript
// Access via game object
game.cfgCypher

// CSRD Data API (via Core Concepts TypesRegistry)
game.cfgCypher.getDescriptors(category)  // Get descriptors (optional category filter)
game.cfgCypher.getTypes(category)        // Get types (optional category filter)
game.cfgCypher.getFoci(category)         // Get foci (optional category filter)

// Direct TypesRegistry access
game.coreConcepts.types.getByCategory('cypher-descriptor')
game.coreConcepts.types.getByCategory('cypher-type')
game.coreConcepts.types.getByCategory('cypher-focus')

// Character Sentence API
game.cfgCypher.buildSentence(descriptor, type, focus)
game.cfgCypher.parseSentence(sentence)

// Adapter API (for advanced usage)
game.cfgCypher.adapter                   // CypherSystemAdapter instance
game.cfgCypher.adapter.mapActorToCreature(actor)
game.cfgCypher.adapter.mapItemToRpgItem(item)
game.cfgCypher.adapter.mapSceneToBoard(scene)

// System integration
game.coreConcepts.systems.getAdapter('cyphersystem')  // Get registered adapter
```

### Hooks

The module listens to these Foundry hooks:

```javascript
// Actor lifecycle
Hooks.on('createActor', async (actor, options, userId) => { ... })
Hooks.on('updateActor', async (actor, changes, options, userId) => { ... })

// Item lifecycle
Hooks.on('createItem', async (item, options, userId) => { ... })

// Scene lifecycle
Hooks.on('createScene', async (scene, options, userId) => { ... })
```

---

## Development

### Project Structure

```
src/modules/foundry-cfg-cypher/
├── module.json                      # Module manifest
├── README.md                        # This file
├── LICENSE                          # MIT License (module code)
├── LICENSE-CSOL                     # CSOL License (CSRD content)
├── CHANGELOG.md                     # Version history
├── scripts/
│   ├── init.mjs                    # Main entry point (adapter pattern)
│   ├── cypher-system-adapter.mjs   # System adapter (maps to Core Concepts)
│   └── character-sentence.mjs      # Character sentence builder utility
└── styles/
    └── cfg-cypher.css               # Module styles
```

**Architecture:**
- **No duplicate data**: CSRD loaded from external OG-CSRD at runtime
- **Adapter pattern**: `CypherSystemAdapter` maps official Cypher System to Core Concepts
- **TypesRegistry integration**: All CSRD types registered with Core Concepts
- **SystemsManager**: Adapter registered as 'cyphersystem' system

### Testing

1. Enable debug mode in module settings
2. Check browser console for detailed logs
3. Test sync by creating actors/items/scenes
4. Verify data appears in web platform

---

## Comparison: D&D 5e vs Cypher System

| Aspect | D&D 5e | Cypher System |
|--------|--------|---------------|
| **Module** | `foundry-cfg-5e` | `foundry-cfg-cypher` |
| **Base System** | dnd5e (Foundry official, 451MB) | cyphersystem (mrkwnzl, ~3.5MB) |
| **Core Mechanic** | d20 + mod vs DC/AC | d20 vs difficulty × 3 |
| **Character Progression** | Levels 1-20 | Tiers 1-6 |
| **Resources** | HP, spell slots, hit dice | Stat pools, recovery rolls |
| **Health** | Hit Points (linear) | Damage Track (4 states) |
| **Armor** | AC (makes you harder to hit) | Armor Rating (reduces damage) |
| **Character Creation** | Race + Class + Background | Descriptor + Type + Focus |
| **Sync Complexity** | High (many subsystems) | Medium (simpler mechanics) |

---

## Roadmap

### Phase 1: Core Bridge ✅
- [x] Module structure and dependencies
- [x] System verification (Cypher System)
- [x] Settings registration
- [x] Platform sync implementation
- [x] Core Concepts mapping via adapter pattern
- [x] CSRD data integration (103 descriptors, 4 types, 142 foci)
- [x] Character sentence builder
- [x] CypherSystemAdapter (runtime data loading, no duplication)
- [x] TypesRegistry integration (all CSRD types registered)
- [x] SystemsManager integration (adapter registered)

### Phase 2: Multi-Game Support (Q2 2026)
- [ ] Numenera-specific features (numenera, oddities)
- [ ] The Strange recursion support
- [ ] Predation companion tracking
- [ ] Game mode UI enhancements

### Phase 3: Enhanced Features (Q3 2026)
- [ ] Advanced behavior system
- [ ] GM Intrusion automation
- [ ] Recovery roll tracking UI
- [ ] Cypher limit warnings

---

## License

### Module Code - MIT License

The **module code** (JavaScript, CSS, HTML templates) is licensed under the **MIT License**.

See [LICENSE](LICENSE) file for details.

**This applies to:**
- `scripts/` - Module JavaScript code
- `styles/` - Module CSS
- `templates/` - Module templates (if any)

### CSRD Content - Cypher System Open License (CSOL)

The **CSRD content** (descriptors, types, foci) is from the **Cypher System Reference Document (CSRD)** published under the **Cypher System Open License (CSOL)**.

See [LICENSE-CSOL](LICENSE-CSOL) file for details.

**CSOL Information:**
- **License URL**: http://csol.montecookgames.com
- **Publisher**: Monte Cook Games, LLC
- **Source**: [Old Gus' Cypher System Reference Document (OG-CSRD)](https://callmepartario.github.io/og-csrd/)

**CSRD data in this module:**
- Loaded at runtime from external OG-CSRD source
- 103 character descriptors registered with TypesRegistry
- 4 core character types registered with TypesRegistry
- 142 character foci registered with TypesRegistry
- **No local data files** - uses adapter pattern to avoid duplication

**Independent Production:**

This product is an **independent production** and is **not affiliated with Monte Cook Games, LLC**.

It is published under the Cypher System Open License, found at http://csol.montecookgames.com.

**Cypher System Compatible:**

This module is compatible with the **Cypher System**.

The Cypher System and its logo are trademarks of Monte Cook Games, LLC in the U.S.A. and other countries. All Monte Cook Games characters and character names, and the distinctive likenesses thereof, are trademarks of Monte Cook Games, LLC.

**Support Monte Cook Games!** Consider buying their excellent products:
- [Cypher System Rulebook (2019)](https://www.montecookgames.com/store/product/cypher-system-rulebook-2/)
- [Numenera Discovery & Destiny](https://www.montecookgames.com/store/product-category/numenera/)
- [The Strange](https://www.montecookgames.com/store/product-category/the-strange/)

---

## Credits

- **Official Cypher System**: Marko Wenzel (mrkwnzl)
- **Core Concepts Framework**: Crit-Fumble team
- **CFG Cypher Bridge**: Crit-Fumble team
- **OG-CSRD**: Old Gus (partario.flynn@gmail.com)
- **Cypher System**: Monte Cook Games, LLC

---

## Support

- **Issues**: [GitHub Issues](https://github.com/crit-fumble/foundry-cfg-cypher/issues)
- **Documentation**: [Platform Docs](https://docs.crit-fumble.com)
- **Discord**: [Crit-Fumble Server](https://discord.gg/crit-fumble)

---

**Smart integration beats reinvention.** 🎲✨
