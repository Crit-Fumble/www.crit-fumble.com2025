# Changelog

All notable changes to the Foundry CFG Cypher Bridge module will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- Numenera-specific features (numenera tracking)
- The Strange recursion support
- GM Intrusion automation
- Recovery roll tracking UI
- Cypher limit warnings

---

## [0.2.0] - 2025-11-24

### Changed - Major Refactoring to Adapter Pattern
- **BREAKING**: Removed all local CSRD data files (descriptors.json, types.json, foci.json)
- **BREAKING**: Removed `data-loader.mjs` and `extract-csrd-data.mjs`
- **BREAKING**: Completely rewrote `init.mjs` to use adapter pattern (following D&D 5e module pattern)
- **BREAKING**: Changed API from `game.cfgCypher.data` to Core Concepts TypesRegistry integration
- CSRD data now loaded at runtime from external OG-CSRD source
- Created `CypherSystemAdapter` class for system-agnostic mapping
- Registered CSRD types with Core Concepts TypesRegistry
- Updated module.json to remove packs section

### Added
- **CypherSystemAdapter** (`scripts/cypher-system-adapter.mjs`)
  - Maps official Cypher System config to Core Concepts
  - Loads CSRD data from external source with fallback
  - Registers 103 descriptors, 4 types, 142 foci with TypesRegistry
  - Provides system-agnostic actor/item/scene mapping
- New convenience methods:
  - `game.cfgCypher.getDescriptors(category)` - Get descriptors from TypesRegistry
  - `game.cfgCypher.getTypes(category)` - Get types from TypesRegistry
  - `game.cfgCypher.getFoci(category)` - Get foci from TypesRegistry
- Adapter registered with Core Concepts SystemsManager
- CSRD data filtering by game mode (numenera, the-strange, etc.)

### Improved
- **No data duplication**: CSRD data loaded from external OG-CSRD source, not bundled
- **Better architecture**: Follows same adapter pattern as D&D 5e module
- **Core Concepts integration**: All types registered with TypesRegistry
- **Maintainability**: Reduced module size, cleaner separation of concerns

### Migration Guide
**For users upgrading from 0.1.0:**

Old API (no longer available):
```javascript
game.cfgCypher.data.descriptors  // ❌ No longer exists
game.cfgCypher.dataLoader.getDescriptors('fantasy')  // ❌ Removed
```

New API (use TypesRegistry):
```javascript
// Get all descriptors
game.cfgCypher.getDescriptors()

// Get by category
game.cfgCypher.getDescriptors('fantasy')

// Get all types
game.cfgCypher.getTypes()

// Get all foci
game.cfgCypher.getFoci()

// Access TypesRegistry directly
game.coreConcepts.types.getByCategory('cypher-descriptor')
game.coreConcepts.types.getByCategory('cypher-type')
game.coreConcepts.types.getByCategory('cypher-focus')
```

---

## [0.1.0] - 2025-11-24

### Added
- Initial module structure
- Platform sync for PC actors (descriptor, type, focus, tier, stat pools)
- Platform sync for NPC actors (level, health, damage, armor)
- Platform sync for all item types (abilities, cyphers, artifacts, skills, equipment)
- Platform sync for scenes → RpgBoard
- Core Concepts mapping for all Cypher System data
- Multi-game support (Cypher, Numenera, The Strange, Predation, Gods of the Fall, Unmasked)
- Module settings (enable/disable sync, API URL/key, game mode, debug mode)
- Foundry hooks for automatic sync (createActor, updateActor, createItem, createScene)
- Comprehensive damage track mapping (Hale, Impaired, Debilitated, Dead)
- Recovery roll tracking (1 action, 10 min, 1 hour, 10 hours)
- Stat pool mapping (Might, Speed, Intellect, Additional)
- Armor rating and speed cost tracking
- Cypher limit tracking

### CSRD Integration
- CSRD data extraction from OG-CSRD (Old Gus' Cypher System Reference Document)
- 103 character descriptors with categorization (core, fantasy, cyberpunk, weird-west, etc.)
- 4 core character types (Warrior, Adept, Explorer, Speaker)
- 142 character foci with categorization and tagging
- Data loader with filtering, search, and game mode support
- Character sentence builder ("I am a [DESCRIPTOR] [TYPE] who [FOCUS]")
- CSOL license attribution (Cypher System Open License)
- Data exposed via `game.cfgCypher.data` API
- Sentence builder utilities with HTML formatting
- Category and tag-based filtering for game modes

### Documentation
- README with architecture overview
- Installation instructions
- Configuration guide
- API reference
- Comparison with D&D 5e module

### Dependencies
- Requires FoundryVTT v11+
- Requires Cypher System v3.4.0+
- Requires Foundry Core Concepts v0.1.0+

---

## Version History

- `0.1.0` - Initial release (November 24, 2025)
