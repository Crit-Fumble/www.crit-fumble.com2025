# Foundry CFG 5e Bridge

**Bridge module connecting official D&D 5e system to Crit-Fumble Gaming platform**

---

## Overview

The CFG 5e Bridge is a **game-specific plugin** that sits above the official dnd5e game system, integrating it with the Crit-Fumble Gaming platform and Core Concepts framework.

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
│  │  D&D 5e System (Official - Atropos/Foundry) │  │
│  │  - 451MB, 409 files                         │  │
│  │  - Character sheets, combat, dice, etc.     │  │
│  └───────────────────┬──────────────────────────┘  │
│                      │                              │
│  ┌───────────────────▼──────────────────────────┐  │
│  │  Core Concepts (Universal Framework)        │  │
│  │  - Below game systems                       │  │
│  │  - Locations, Boards, Tokens                │  │
│  │  - System-agnostic concepts                 │  │
│  └───────────────────┬──────────────────────────┘  │
│                      │                              │
│  ┌───────────────────▼──────────────────────────┐  │
│  │  CFG 5e Bridge (This Module)               │  │
│  │  - Above game system                        │  │
│  │  - Platform sync (dnd5e → web)             │  │
│  │  - QR code overlays                         │  │
│  │  - Asset shortcodes                         │  │
│  │  - Core Concepts ↔ dnd5e mapping           │  │
│  │  - Enhanced creature behaviors              │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## Why This Architecture?

### ✅ Leverage Official System

**Don't rebuild 451MB of battle-tested code:**
- Official character sheets, item management, spell tracking
- Combat tracker with conditions and effects
- Custom dice rolling (D20Roll, DamageRoll)
- Canvas integration, token rendering
- Migration system for version updates
- Compatibility with other dnd5e modules

### ✅ Focus on Value-Add

**Build what makes us unique:**
- Platform sync to Crit-Fumble web application
- QR code overlays for printable assets
- Asset shortcode system for physical/digital integration
- Enhanced creature behaviors with AI
- Core Concepts framework integration

### ✅ Maintainability

**Let Foundry team handle system updates:**
- We maintain ~500 lines vs ~10,000+ lines
- System bugs fixed upstream
- API changes handled by official team
- Focus on our features, not infrastructure

---

## Features

### 1. Platform Sync

Automatically sync Foundry data to Crit-Fumble web platform:

- **Actors** → `RpgCreature` (characters, NPCs, monsters)
- **Items** → `RpgItem` (weapons, armor, magic items)
- **Scenes** → `RpgBoard`/`RpgLocation` (maps, battle scenes)
- **Assets** → `RpgAsset` (tokens, tiles, backgrounds)

**Configuration:**
```javascript
// Module settings
enablePlatformSync: false  // Toggle sync on/off
platformApiUrl: 'https://crit-fumble.com/api'
platformApiKey: ''  // Your API key from platform
```

### 2. QR Code Overlays

Add subtle QR codes to printable tokens and tiles:

- Automatic shortcode generation for all image assets
- Configurable opacity (default: 15%)
- Scan QR code → View asset details on web platform
- Download original or print-ready versions

**Configuration:**
```javascript
enableQRCodes: false  // Toggle QR system on/off
qrCodeOpacity: 0.15  // 0.0 - 1.0 (very subtle by default)
```

**How it works:**
1. Actor created with token image
2. Bridge registers asset with platform
3. Platform generates unique shortcode (e.g., "A3F9K2")
4. QR code points to `https://crit-fumble.com/asset/A3F9K2`
5. Print version includes subtle QR overlay

### 3. Asset Shortcodes

Unique 6-8 character codes for all visual assets:

- Format: `A3F9K2` (uppercase, no ambiguous chars)
- Unique constraint at database level
- Links physical prints to digital library
- Enables inventory management

### 4. Enhanced Creature Behaviors

AI-driven creature behavior system:

- Patrol routes
- Aggro detection
- Tactical positioning
- Custom behavior scripts
- Compatible with dnd5e combat system

### 5. Core Concepts Integration

Maps dnd5e data to Core Concepts framework:

- Conditions (Blinded, Charmed, etc.) → Core Concepts conditions
- Damage types (Fire, Cold, etc.) → Core Concepts damage types
- Actions (Attack, Dash, etc.) → Core Concepts actions
- Scenes → Hierarchical location system

---

## Installation

### Prerequisites

1. **Foundry VTT** v11+ (verified on v13)
2. **D&D 5e System** v5.0.0+ (verified on v5.2.0)
3. **Core Concepts Module** v0.1.0+

### Install Steps

1. Install modules in this order:
   ```
   1. D&D 5e System (if not already installed)
   2. Foundry Core Concepts module
   3. CFG 5e Bridge module (this module)
   ```

2. Enable modules in your world:
   - ✅ Foundry Core Concepts
   - ✅ CFG 5e Bridge

3. Configure in Module Settings:
   - Set platform API URL and key (if using sync)
   - Enable/disable QR codes
   - Configure behavior system

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
   ```

3. Reload world

**Data synced automatically:**
- Actor creation/updates → RPG creatures
- Item creation → RPG items
- Scene creation → Boards/locations
- Asset uploads → Asset registry with shortcodes

### QR Codes

**Optional - for printable assets:**

```
Enable QR Codes: ✅
QR Code Opacity: 0.15 (15% - very subtle)
```

**Usage:**
1. Create actor with token image
2. Module auto-registers asset
3. Platform generates shortcode
4. Download print version from platform API:
   ```
   GET https://crit-fumble.com/api/rpg/assets/print?id={assetId}
   ```

### Creature Behaviors

**Optional - enhanced AI:**

```
Enable CFG Systems: ✅
Enable Creature Behaviors: ✅
Behavior Update Interval: 1000ms
```

**Usage:**
1. Right-click actor in sidebar
2. Select "Manage Behaviors"
3. Check behaviors to assign:
   - Patrol
   - Aggressive
   - Defensive
   - Custom scripts

---

## API Reference

### Module API

```javascript
// Access via game object
game.cfg5e

// Platform sync API
game.cfg5e.platformSync.syncActor(actor)
game.cfg5e.platformSync.syncItem(item)
game.cfg5e.platformSync.syncScene(scene)

// QR code manager
game.cfg5e.qrCodeManager.registerAsset(url, metadata)
game.cfg5e.qrCodeManager.generatePrintVersion(assetId)

// Systems
game.cfg5e.systems  // Array of registered systems
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
src/modules/foundry-cfg-5e/
├── module.json               # Module manifest
├── README.md                 # This file
├── scripts/
│   ├── init.mjs             # Main entry point
│   └── systems/
│       └── behavior-system.mjs
├── styles/
│   └── cfg-5e.css
└── LICENSE
```

### Adding Features

**Example: Add new platform sync type**

```javascript
// In init.mjs

FoundryCFG5e.platformSync.syncJournalEntry = async (journal) => {
  const apiUrl = game.settings.get(MODULE_ID, 'platformApiUrl');
  const apiKey = game.settings.get(MODULE_ID, 'platformApiKey');

  const response = await fetch(`${apiUrl}/rpg/journals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      foundryId: journal.id,
      name: journal.name,
      content: journal.pages.map(p => p.text.content)
    })
  });

  return response.json();
};

// Hook
Hooks.on('createJournalEntry', async (journal, options, userId) => {
  if (!game.settings.get(MODULE_ID, 'enablePlatformSync')) return;
  await FoundryCFG5e.platformSync.syncJournalEntry(journal);
});
```

### Testing

1. Enable debug mode in module settings
2. Check browser console for detailed logs
3. Test sync by creating actors/items/scenes
4. Verify data appears in web platform

---

## Comparison: Before vs After

### Before (foundry-core-srd-5e)

```
❌ Tried to rebuild entire 5e system from SRD
❌ Would need 10,000+ lines of code
❌ Incompatible with official dnd5e content
❌ Missing character sheets, UI, combat tracker
❌ Massive maintenance burden
```

### After (foundry-cfg-5e bridge)

```
✅ Leverages 451MB of official dnd5e system
✅ ~500 lines of focused bridge code
✅ Works with all dnd5e modules and content
✅ Full UI, sheets, combat tracker included
✅ Minimal maintenance (focus on features)
```

---

## Roadmap

### Phase 1: Core Bridge ✅
- [x] Module structure and dependencies
- [x] System verification (dnd5e)
- [x] Settings registration
- [x] Platform sync stubs
- [x] QR code system stubs

### Phase 2: Platform Sync (In Progress)
- [ ] Actor sync implementation
- [ ] Item sync implementation
- [ ] Scene sync implementation
- [ ] Asset registration with shortcodes
- [ ] Bidirectional sync (platform → Foundry)

### Phase 3: QR Code System
- [ ] Asset shortcode generation
- [ ] QR code overlay rendering
- [ ] Print version API endpoint
- [ ] Token/tile export workflow

### Phase 4: Core Concepts Mapping
- [ ] Map dnd5e conditions → Core Concepts
- [ ] Map dnd5e damage types → Core Concepts
- [ ] Map dnd5e actions → Core Concepts
- [ ] Scene → Location hierarchy mapping

### Phase 5: Enhanced Features
- [ ] Advanced behavior system
- [ ] Tactical AI for creatures
- [ ] Custom 5e-specific systems
- [ ] Analytics and reporting

---

## License

MIT License - See LICENSE file

---

## Credits

- **Official D&D 5e System**: Atropos & Foundry VTT team
- **Core Concepts Framework**: Crit-Fumble team
- **CFG 5e Bridge**: Crit-Fumble team

---

## Support

- **Issues**: [GitHub Issues](https://github.com/crit-fumble/foundry-cfg-5e/issues)
- **Documentation**: [Platform Docs](https://docs.crit-fumble.com)
- **Discord**: [Crit-Fumble Server](https://discord.gg/crit-fumble)

---

**Smart integration beats reinvention.** 🎲✨
