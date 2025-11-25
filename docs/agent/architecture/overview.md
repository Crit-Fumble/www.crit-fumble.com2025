# Crit-Fumble Platform Architecture

**Unified TTRPG Platform with Foundry VTT Integration**

---

## Overview

Crit-Fumble is a full-stack TTRPG platform combining a Next.js web application with deep Foundry VTT integration. The architecture is designed around clean separation of concerns with **game-agnostic APIs** at the core.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│               Crit-Fumble Web Platform                      │
│                    (Next.js 15 + Vercel)                    │
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Frontend (React Server Components)               │    │
│  │  - Admin dashboard                                 │    │
│  │  - Asset management                                │    │
│  │  - Core Concepts UI                               │    │
│  │  - Account linking (OAuth providers)              │    │
│  └────────────────────┬───────────────────────────────┘    │
│                       │                                     │
│  ┌────────────────────▼───────────────────────────────┐    │
│  │  API Routes (src/app/api/*)                       │    │
│  │                                                     │    │
│  │  /api/rpg/*        - RPG data (creatures, items)   │    │
│  │  /api/foundry/*    - Foundry integration          │    │
│  │  /api/auth/*       - OAuth providers              │    │
│  │  /api/linked-accounts/* - Account linking         │    │
│  └────────────────────┬───────────────────────────────┘    │
│                       │                                     │
│  ┌────────────────────▼───────────────────────────────┐    │
│  │  Shared Libraries (src/lib/*)                     │    │
│  │  - asset-utils.ts  - Asset management             │    │
│  │  - qr-utils.ts     - QR code generation           │    │
│  │  - foundry-api.ts  - Foundry integration          │    │
│  │  - admin.ts        - Admin utilities              │    │
│  └────────────────────┬───────────────────────────────┘    │
│                       │                                     │
│  ┌────────────────────▼───────────────────────────────┐    │
│  │  Database (Prisma + PostgreSQL/Neon)              │    │
│  │  - RpgCreature, RpgItem, RpgAsset, etc.           │    │
│  │  - CritUser (platform users)                      │    │
│  │  - RpgPlayer (in-game characters)                 │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          │ HTTP/WebSocket
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                   Foundry VTT Instance                      │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Game System (e.g., dnd5e)                          │  │
│  │  - Official implementation (451MB, 409 files)       │  │
│  │  - Character sheets, combat, dice, etc.             │  │
│  └───────────────────┬──────────────────────────────────┘  │
│                      │                                      │
│  ┌───────────────────▼──────────────────────────────────┐  │
│  │  Core Concepts (Universal Framework)                │  │
│  │  - Game-agnostic concepts                          │  │
│  │  - Below game systems                               │  │
│  │  - Locations, Boards, Tokens                        │  │
│  └───────────────────┬──────────────────────────────────┘  │
│                      │                                      │
│  ┌───────────────────▼──────────────────────────────────┐  │
│  │  Core Concepts API (HTTP Server)                    │  │
│  │  - Game-agnostic endpoints                          │  │
│  │  - Asset registration & QR codes                    │  │
│  │  - Sync with platform                               │  │
│  └───────────────────┬──────────────────────────────────┘  │
│                      │                                      │
│  ┌───────────────────▼──────────────────────────────────┐  │
│  │  Game-Specific Bridges (e.g., CFG 5e)              │  │
│  │  - Above game system                                │  │
│  │  - Hooks into dnd5e events                         │  │
│  │  - Calls Core Concepts API                         │  │
│  │  - Enhanced behaviors                               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Design Principles

### 1. **Game-Agnostic APIs**

QR codes, asset management, and core functionality live in the **Core Concepts API** layer, not in game-specific modules.

**Benefits:**
- ✅ Works with dnd5e, PF2e, CoC, any system
- ✅ Single implementation shared across games
- ✅ Easy to test and maintain

### 2. **No Redundant Packages**

With Vercel's architecture, we consolidate APIs into Next.js:

```
❌ OLD: Separate npm packages
src/packages/
├── ttrpg-core-concepts-bridge-api/
└── ttrpg-core-concepts-web-api/

✅ NEW: Next.js API routes
src/app/api/
├── rpg/*       ← Web-accessible RPG APIs
└── foundry/*   ← Foundry-specific endpoints
```

**Benefits:**
- ✅ No build/publish step for packages
- ✅ Vercel handles deployment
- ✅ Shared types across routes
- ✅ Better tree-shaking

### 3. **Leverage Official Systems**

Instead of rebuilding game systems from SRD data:

```
❌ OLD: foundry-core-srd-5e
- Attempted to rebuild entire 5e system
- Would need 10,000+ lines
- Incompatible with official content

✅ NEW: foundry-cfg-5e (bridge)
- Leverages official dnd5e system (451MB, 409 files)
- ~500 lines of bridge code
- Works with all dnd5e content
```

**Benefits:**
- ✅ Full character sheets, combat tracker, etc.
- ✅ Compatible with other dnd5e modules
- ✅ Minimal maintenance burden

---

## Module Layering

```
┌─────────────────────────────────────────┐
│  Game-Specific Bridges                  │  ← Above systems
│  - foundry-cfg-5e (dnd5e)              │     (game-specific plugins)
│  - foundry-cfg-pf2e (PF2e)             │
│  - foundry-cfg-coc (Call of Cthulhu)   │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  Core Concepts API (HTTP Server)        │  ← API layer
│  - Game-agnostic endpoints              │     (system-independent)
│  - /assets/*  - Asset management        │
│  - /actors/*  - Actor CRUD              │
│  - /sync/*    - Platform sync           │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  Core Concepts (Framework)              │  ← Below systems
│  - Universal game concepts              │     (system-agnostic)
│  - Locations, Boards, Tokens            │
│  - No game-specific rules               │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  Game Systems                           │  ← Foundation
│  - dnd5e (official)                     │     (game rules)
│  - pf2e (official)                      │
│  - etc.                                 │
└─────────────────────────────────────────┘
```

**Benefits:**
- Core Concepts works with ANY system
- Game bridges add system-specific features
- APIs are reusable across all games

---

## Data Flow Examples

### Example 1: Asset Registration with QR Code

```
1. User creates Actor in Foundry (dnd5e system)
   ↓
2. foundry-cfg-5e hook fires (createActor)
   ↓
3. Bridge extracts token image URL
   ↓
4. Bridge calls Core Concepts API:
   POST http://localhost:3001/assets/register
   ↓
5. Core Concepts API forwards to platform:
   POST https://crit-fumble.com/api/rpg/assets
   ↓
6. Platform generates shortcode (e.g., "A3F9K2")
   ↓
7. Platform stores asset in database
   ↓
8. Response returns shortcode to Foundry
   ↓
9. Print version available:
   GET https://crit-fumble.com/api/rpg/assets/print?id=xxx
```

### Example 2: Platform Sync

```
1. GM updates NPC stats in Foundry
   ↓
2. foundry-cfg-5e hook fires (updateActor)
   ↓
3. Bridge calls Core Concepts API:
   POST http://localhost:3001/sync/actor
   ↓
4. Core Concepts API forwards to platform:
   PUT https://crit-fumble.com/api/rpg/creatures/{id}
   ↓
5. Platform updates database
   ↓
6. Players see updated stats on web
```

---

## File Structure

```
www.crit-fumble.com/
├── src/
│   ├── app/                        # Next.js 15 App Router
│   │   ├── api/                   # API routes (Vercel serverless)
│   │   │   ├── rpg/              # RPG data APIs
│   │   │   │   ├── assets/       # Asset management
│   │   │   │   ├── creatures/    # Creature CRUD
│   │   │   │   └── items/        # Item CRUD
│   │   │   ├── foundry/          # Foundry integration
│   │   │   │   ├── sync/         # Bidirectional sync
│   │   │   │   └── snapshot/     # World snapshots
│   │   │   ├── auth/             # OAuth providers
│   │   │   └── linked-accounts/  # Account linking
│   │   ├── admin/                # Admin dashboard
│   │   ├── asset/[shortcode]/    # Asset lookup by QR scan
│   │   └── linked-accounts/      # Account management
│   ├── lib/                       # Shared utilities
│   │   ├── asset-utils.ts        # Asset management
│   │   ├── qr-utils.ts           # QR code generation
│   │   ├── foundry-api.ts        # Foundry integration
│   │   └── admin.ts              # Admin utilities
│   ├── modules/                   # Foundry VTT modules
│   │   ├── foundry-core-concepts/        # Universal framework
│   │   ├── foundry-core-concepts-api/    # HTTP API server
│   │   │   └── scripts/endpoints/
│   │   │       ├── assets.mjs            # Asset/QR endpoints
│   │   │       └── sync.mjs              # Sync endpoints
│   │   ├── foundry-cfg-5e/               # D&D 5e bridge
│   │   ├── foundry-game-tictactoe/       # Example game
│   │   └── _archived/
│   │       └── foundry-core-srd-5e/      # Archived SRD module
│   └── packages/                  # Shared packages (legacy)
│       ├── cfg-lib/              # Core library
│       ├── worldanvil/           # World Anvil integration
│       └── ... (other integrations)
├── prisma/
│   └── schema.prisma             # Database schema
└── docs/
    ├── ARCHITECTURE.md           # This file
    ├── ASSET_SHORTCODE_SYSTEM.md # QR code docs
    └── ... (other docs)
```

---

## Technology Stack

### Web Platform
- **Framework**: Next.js 15 (App Router)
- **Hosting**: Vercel (serverless)
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Auth**: NextAuth.js (OAuth providers)
- **Styling**: Tailwind CSS

### Foundry VTT
- **Core**: Foundry VTT v11-v13
- **Modules**: ESM (`.mjs`)
- **API**: Express.js (HTTP server in Foundry)
- **Sync**: HTTP + WebSocket

### Integrations
- **World Anvil**: Playwright (Cloudflare bypass)
- **Steam**: OpenID 2.0
- **Discord/GitHub/Twitch**: OAuth 2.0

---

## API Endpoints

### Web Platform APIs

#### RPG Data
- `GET /api/rpg/creatures` - List creatures
- `POST /api/rpg/creatures` - Create creature
- `GET /api/rpg/assets` - List assets
- `POST /api/rpg/assets` - Upload asset
- `GET /api/rpg/assets/print?id=xxx` - Print with QR

#### Foundry Integration
- `POST /api/foundry/sync` - Sync world data
- `GET /api/foundry/snapshot` - Get world snapshot

#### Auth
- `GET /api/auth/[...nextauth]` - OAuth flows
- `POST /api/linked-accounts/worldanvil/link` - Link World Anvil

### Foundry API (Core Concepts API)

#### Asset Management
- `POST /assets/register` - Register asset with platform
- `GET /assets/lookup?shortcode=ABC123` - Lookup by shortcode
- `GET /assets/print?id=xxx` - Generate print version

#### Sync
- `POST /sync/actor` - Sync actor to platform
- `POST /sync/item` - Sync item to platform
- `POST /sync/scene` - Sync scene to platform

#### Foundry Control
- `GET /actors` - List actors
- `POST /actors` - Create actor
- `GET /scenes` - List scenes
- `POST /chat` - Send chat message
- `POST /combats/:id/start` - Start combat

---

## Future Enhancements

### Phase 1: Asset System ✅
- [x] Shortcode generation
- [x] QR code overlay
- [x] Print API endpoint
- [x] Asset lookup page

### Phase 2: Platform Sync (In Progress)
- [ ] Bidirectional sync (Foundry ↔ Platform)
- [ ] Real-time updates via WebSocket
- [ ] Conflict resolution
- [ ] Offline support

### Phase 3: Multi-System Support
- [ ] Pathfinder 2e bridge module
- [ ] Call of Cthulhu bridge module
- [ ] Generic/OSR bridge module

### Phase 4: Advanced Features
- [ ] AI-driven creature behaviors
- [ ] Procedural content generation
- [ ] Cross-platform campaigns
- [ ] Mobile companion app

---

## Development Workflow

### Local Development

```bash
# Start web platform
npm run dev

# Build Foundry modules
cd src/modules/foundry-cfg-5e
# ... copy to Foundry data/modules/
```

### Deployment

```bash
# Web platform (automatic via Vercel)
git push origin main

# Foundry modules (manual packaging)
npm run build:modules
```

---

## Design Decisions

### Why not rebuild game systems?

The official dnd5e system is **451MB** with **409 files** of battle-tested code. Rebuilding this would be:
- Massive development effort
- Difficult to maintain
- Incompatible with existing content
- Missing many features

**Instead:** Build bridges that enhance official systems.

### Why consolidate packages into Next.js?

With Vercel's serverless architecture:
- No need for separate npm packages
- Automatic deployment
- Shared types and utilities
- Better performance (tree-shaking)

### Why game-agnostic APIs?

Putting QR codes and asset management in the Core Concepts API means:
- One implementation works for all game systems
- Easy to test and maintain
- Game-specific modules stay focused

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

---

## License

MIT License - See [LICENSE](../LICENSE) file

---

**Smart architecture for the modern TTRPG platform.** 🎲✨
