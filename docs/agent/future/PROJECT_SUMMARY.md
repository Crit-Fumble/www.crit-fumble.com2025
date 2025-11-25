# Crit-Fumble VTT - Project Summary

## 🎯 Vision

A Discord-integrated Virtual Tabletop supporting **Levels 1-50** gameplay with **tier-based scope management**, allowing players to adventure from local dungeons to cosmic-scale multiverse exploration.

## 📦 Current Status

### ✅ Completed (Phase 0: Foundation)
1. **Next.js 15 + React 18 scaffold** with TypeScript and App Router
2. **Core dependencies installed**:
   - TailwindCSS + shadcn/ui for UI components
   - Pixi.js v8 for 2D hex map rendering
   - Puppeteer for server-side rendering (Discord Play-by-Post)
   - Socket.io for real-time multiplayer
   - Prisma ORM + PostgreSQL
   - NextAuth.js v5 for authentication
3. **Prisma schema updated** with:
   - Player roles (player/gm/spectator)
   - SheetPermission model for fine-grained access control
   - LocationSheet with role-based permissions
4. **Documentation organized** ([docs/README.md](README.md))
5. **Creature behavior system designed** (60+ CR 0-6 creatures mapped)

### 🚧 In Progress (Phase 1: Tier 1 MVP)
- [ ] Authentication system (NextAuth.js v5)
- [ ] Role-based dashboard (Player/GM/Spectator)
- [ ] Character creation UI (Levels 1-4)
- [ ] Province builder UI (1-mile hex maps)
- [ ] Pixi.js hex map renderer
- [ ] Combat tracker
- [ ] Dice roller
- [ ] Behavior script system implementation

### 📋 Planned
- **Phase 2**: Tier 2 expansion (Levels 5-10, Kingdom scale)
- **Phase 3**: Discord Play-by-Post integration
- **Phase 4**: Discord Activity (voice channel multiplayer)
- **Phase 5**: Tiers 3-5 (Levels 11-50, Continent → Cosmic scales)

---

## 🗺️ Core Systems

### 1. Tier-Based Scope Management

Players see different geographic scales based on character level:

| Tier | Levels | Scale      | Hex Size | Example Location          |
|------|--------|------------|----------|---------------------------|
| 1    | 1-4    | Province   | 1 mile   | Local dungeon, small town |
| 2    | 5-10   | Kingdom    | 6 miles  | Regional threats          |
| 3    | 11-16  | Continent  | 60 miles | Continental wars          |
| 4    | 17-20  | World      | 600 miles| Planar invasions          |
| 5    | 21-50  | Cosmic     | Light-years | Multiverse travel      |

**See**: [TIER_SCOPE_MANAGEMENT.md](game-systems/core-mechanics/TIER_SCOPE_MANAGEMENT.md)

### 2. Hex Grid System

10 hex scales from tactical combat to cosmic exploration:

- **50 ft**: Combat grid (6 seconds/round)
- **300 ft**: Building interiors (1 minute/turn)
- **1 mile**: Province exploration (10 minutes/turn)
- **6 miles**: Kingdom travel (1 hour/turn)
- **60 miles**: Continental journeys (8 hours/turn)
- **600 miles**: World maps (3 days/turn)
- **1 light-year → 60 light-years**: Cosmic scales (Mega/Tera/Ultra/Divine)

**See**: [HEX_SCALES_COMPLETE.md](game-systems/hex-grid/HEX_SCALES_COMPLETE.md) | [QUICK_REFERENCE.md](game-systems/hex-grid/QUICK_REFERENCE.md)

### 3. Creature Behavior System

**AI-free deterministic behavior scripts** for NPCs/creatures:
- Rule-based decision trees (< 1ms execution)
- Attitude system (0-100): Hostile → Neutral → Friendly → Loyal
- Alignment metrics: Lawfulness (0-100), Goodness (0-100)
- 60+ SRD creatures (CR 0-6) mapped to behaviors

**Example**: Goblin uses `goblin_raider` script with pack tactics, fleeing when outnumbered 2:1.

**See**: [CREATURE_BEHAVIOR_SYSTEM.md](game-systems/core-mechanics/CREATURE_BEHAVIOR_SYSTEM.md)

### 4. Discord Integration (3 Modes)

#### Mode 1: Play-by-Post
- Text commands in Discord channel
- Server renders game state with Puppeteer
- Image posted to channel
- Asynchronous turn-based gameplay

#### Mode 2: Discord Activity (Voice Channel)
- Embedded web app in Discord voice
- Real-time multiplayer with Socket.io
- Quick character creation
- Players "jump in" to active world

#### Mode 3: Web Client
- Traditional browser-based VTT
- Full-featured desktop/mobile app
- Discord OAuth login

**See**: [DISCORD_INTEGRATION.md](integrations/DISCORD_INTEGRATION.md)

---

## 🛠️ Technology Stack

### Frontend
- **Next.js 15** (App Router)
- **React 18** + **TypeScript**
- **TailwindCSS** + **shadcn/ui**
- **Pixi.js v8** (2D/light 3D rendering)
- **Zustand** (state management)
- **Socket.io** (real-time)

### Backend
- **PostgreSQL** + **Prisma ORM**
- **NextAuth.js v5** (authentication)
- **Puppeteer** (server-side rendering)
- **Redis** (caching, rate limiting)
- **Digital Ocean Spaces** (asset CDN)

### Infrastructure
- **Docker** + **Docker Compose**
- **Digital Ocean** (staging + production)
- **GitHub Actions** (CI/CD)

**See**: [ARCHITECTURE.md](architecture/ARCHITECTURE.md)

---

## 📁 Project Structure

```
www.crit-fumble.com/
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # React UI components
│   │   └── ui/              # shadcn/ui base components
│   ├── lib/                 # Utilities (cn(), helpers)
│   ├── game/                # Game domain logic
│   │   ├── behaviors/       # NPC behavior scripts
│   │   ├── combat/          # Combat mechanics
│   │   └── dice/            # Dice rolling
│   └── hooks/               # React hooks
├── prisma/
│   └── schema.prisma        # Database schema
├── docs/                    # Documentation
│   ├── README.md            # Docs index
│   ├── ARCHITECTURE.md      # System design
│   ├── DISCORD_INTEGRATION.md
│   ├── CREATURE_BEHAVIOR_SYSTEM.md
│   ├── HEX_SCALES_COMPLETE.md
│   └── ...
└── data/
    └── creature-behavior-mappings.json  # CR 0-6 behavior assignments
```

---

## 🎮 Gameplay Features

### Character Creation (Tier 1)
- Levels 1-4 support
- Standard classes: Fighter, Wizard, Rogue, Cleric
- Quick-roll stat generation
- Equipment selection

### Hex Map Renderer (Pixi.js)
- Top-down 2D hex grid
- Light 3D capabilities (elevation, depth)
- Token placement and drag-and-drop
- Fog of war / line of sight
- Dynamic layer generation (underground → space)

### Combat Tracker
- Initiative order
- HP/AC tracking
- Turn timer
- Condition tracking
- Integrated dice roller

### Procedural Generation
- Province-scale maps (Tier 1)
- Encounter generation (CR 0-2)
- Behavior-driven NPCs
- Loot tables

**See**: [USER_FACING_FUNCTIONALITY_REVIEW.md](tools/USER_FACING_FUNCTIONALITY_REVIEW.md)

---

## 💰 Monetization

### Crit-Coins (Virtual Currency)
- Purchase with USD via Stripe
- Used for:
  - Premium content (adventures, assets)
  - Virtual Desktop sessions
  - AI generation credits
  - Tipping GMs

### Story Credits (Creator Economy)
- Earned by:
  - Running sessions as GM
  - Creating approved content (maps, assets)
  - Writing adventures
- Redeemed for:
  - Cash payout (Stripe Connect)
  - Crit-Coins conversion
  - Platform perks

**See**: [MONETIZATION.md](monetization/MONETIZATION.md)

---

## 🚀 Development Roadmap

### Phase 1: Tier 1 MVP (Levels 1-4) [Current]
- [ ] Authentication + role-based dashboard
- [ ] Character creation UI
- [ ] Province hex map renderer (Pixi.js)
- [ ] Token placement + drag-and-drop
- [ ] Combat tracker
- [ ] Dice roller
- [ ] Behavior scripts (CR 0-2)
- [ ] Procedural Province generator
- [ ] Event logging

**Target**: Solo playable Tier 1 adventure

### Phase 2: Tier 2 Expansion (Levels 5-10)
- [ ] Expand character creation (Levels 5-10)
- [ ] Kingdom hex scale (6 miles)
- [ ] Behavior scripts (CR 3-6)
- [ ] Procedural Kingdom generator
- [ ] Multi-party support

### Phase 3: Discord Play-by-Post
- [ ] Discord bot commands
- [ ] Puppeteer rendering pipeline
- [ ] Turn-based command processing
- [ ] Image upload to Discord

### Phase 4: Discord Activity
- [ ] Discord Activity SDK integration
- [ ] Socket.io real-time sync
- [ ] Quick character creation modal
- [ ] Drop-in player support

### Phase 5: Tiers 3-5 (Levels 11-50)
- [ ] Continent scale (60 miles)
- [ ] World scale (600 miles)
- [ ] Cosmic scales (light-years)
- [ ] Multiverse/timeline system
- [ ] Epic-tier threats

**See**: [TODO.md](getting-started/TODO.md) | [CURRENT_STATUS.md](getting-started/CURRENT_STATUS.md)

---

## 📚 Key Documentation

### Getting Started
- [GETTING_STARTED.md](getting-started/GETTING_STARTED.md) - Setup guide
- [ARCHITECTURE.md](architecture/ARCHITECTURE.md) - System design
- [DATABASE_SCHEMA.md](architecture/DATABASE_SCHEMA.md) - Prisma schema

### Game Systems
- [CREATURE_BEHAVIOR_SYSTEM.md](game-systems/core-mechanics/CREATURE_BEHAVIOR_SYSTEM.md) - NPC AI
- [HEX_SCALES_COMPLETE.md](game-systems/hex-grid/HEX_SCALES_COMPLETE.md) - All 10 hex scales
- [TIER_SCOPE_MANAGEMENT.md](game-systems/core-mechanics/TIER_SCOPE_MANAGEMENT.md) - Level → scope mapping
- [TIME_SCALES.md](game-systems/core-mechanics/TIME_SCALES.md) - Combat/exploration time

### Integration
- [DISCORD_INTEGRATION.md](integrations/DISCORD_INTEGRATION.md) - 3 Discord modes
- [WEBHOOKS.md](integrations/WEBHOOKS.md) - Discord/Stripe webhooks

### Deployment
- [DEPLOYMENT.md](deployment/DEPLOYMENT.md) - Production deployment
- [DIGITALOCEAN_SETUP.md](deployment/DIGITALOCEAN_SETUP.md) - DO infrastructure

---

## 🔐 Environment Setup

```bash
# Database
DATABASE_URL="postgresql://..."
REDIS_URL="redis://..."

# Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."

# Discord OAuth
DISCORD_CLIENT_ID="..."
DISCORD_CLIENT_SECRET="..."
DISCORD_BOT_TOKEN="..."

# Discord Activity
DISCORD_ACTIVITY_APP_ID="..."

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Rendering
PUPPETEER_EXECUTABLE_PATH="/usr/bin/chromium"
```

**See**: [.env.example](.env.example) | [GETTING_STARTED.md](GETTING_STARTED.md)

---

## 🤝 Contributing

This is a personal project, but documentation and bug reports are welcome!

## 📄 License

Proprietary - All Rights Reserved (for now)
