# Agent Documentation

**Purpose:** Technical documentation for AI agents working on the Crit-Fumble platform.

**Target Release:** March 2026 (3 months)

**Last Updated:** November 24, 2024

---

## 🎯 March 2026 Focus

**Goal:** Working D&D 5e VTT where players can create characters, join sessions, move tokens on a battle map, and roll dice in combat.

**What We're Building:**
1. Character creation (L1-20)
2. Campaign & session management
3. Pixi.js battle map with tokens
4. Dice roller & combat tracker

**What We're NOT Building (Yet):**
- Cosmic tiers (L21-50)
- FoundryVTT integration
- World Anvil syncing
- Discord bots
- Monetization
- Hex grids
- Advanced mechanics

See [/docs/agent/future/README.md](/docs/agent/future/README.md) for the full roadmap.

---

## 📚 Quick Navigation

### Getting Started
- **[Setup](/docs/agent/setup/)** - Development environment and Vercel deployment
- **[Testing](/docs/agent/testing/)** - E2E tests and developer mode

### Current Features (Working Now)
- **[Authentication](/docs/agent/authentication/)** - NextAuth with multiple OAuth providers
- **[Features](/docs/agent/features/)** - Linked accounts, user tiers, signup flow
- **[Database](/docs/agent/database/)** - Prisma schema and production setup

### Technical Architecture
- **[Architecture](/docs/agent/architecture/)** - System design and separation of concerns
- **[Integrations](/docs/agent/integrations/)** - OAuth providers (auth-only, no data sync)

### Future Plans
- **[Future](/docs/agent/future/)** - Roadmap, deferred features, long-term vision

---

## 🏗️ Technology Stack

**Core:**
- Next.js 16.0.3 (App Router + Turbopack)
- React 19.0.0
- TypeScript 5.7.2
- Tailwind CSS 3.4.17

**Database:**
- PostgreSQL (Vercel Postgres)
- Prisma ORM 6.1.0

**Authentication:**
- Auth.js v5 (NextAuth)
- OAuth: Discord, GitHub, Twitch, Battle.net, Steam (via WA), World Anvil
- Email authentication

**Storage:**
- Vercel Blob Storage (images, assets)

**Testing:**
- Playwright (E2E tests)
- Vitest (unit tests)

**Deployment:**
- Vercel (web app, DB, storage, serverless functions)
- DigitalOcean Droplets (FoundryVTT instances only)

---

## 📁 Documentation Structure

```
docs/agent/
├── README.md (this file)
│
├── architecture/          # System architecture (4 files)
│   ├── overview.md
│   ├── separation-of-concerns.md
│   ├── TILE_ASSET_SYSTEM.md
│   └── MULTIVERSE_SYSTEM.md
│
├── authentication/        # NextAuth configuration (2 files)
│   ├── email-authentication.md
│   └── foundry-bridge-auth.md
│
├── database/              # Database setup (1 file)
│   └── setup-production-db.md
│
├── features/              # Implemented features (4 files)
│   ├── legacy-tier.md
│   ├── linked-accounts.md
│   ├── signup-flow.md
│   └── tiers-and-permissions.md
│
├── future/                # Roadmap and deferred features (15 files)
│   ├── README.md          ← 3-MONTH ROADMAP
│   ├── CHARACTER_CREATION.md
│   ├── DICE_ROLL_SYSTEM.md
│   ├── DISCORD_INTEGRATION.md (Q3 2026)
│   ├── MONETIZATION.md (Q4 2026)
│   └── ... (other future docs)
│
├── integrations/          # OAuth providers (1 file)
│   └── README.md          # Auth-only, no data sync
│
├── setup/                 # Development setup (15 files)
│   ├── cicd-and-environments.md
│   ├── database-options-comparison.md
│   ├── github-setup.md
│   ├── playwright-setup.md
│   ├── staging-environment-setup.md
│   ├── vercel-*.md
│   └── ... (other setup guides)
│
└── testing/               # Testing guides (6 files)
    ├── auth-testing-guide.md
    ├── developer-mode-guide.md
    ├── how-to-run.md
    ├── integration-testing-guide.md
    ├── mcp-integration.md
    └── test-authentication.md
```

---

## ✅ Current Implementation Status

### Fully Implemented & Working

**Authentication:**
- ✅ Multi-provider OAuth (Discord, GitHub, Twitch, Battle.net, Steam, World Anvil)
- ✅ Email authentication
- ✅ Session management
- ✅ Account linking/unlinking
- ✅ Primary account selection

**User Management:**
- ✅ User profiles (avatar, displayName, bio)
- ✅ Tier system (FREE, PATRON, ELITE, COSMIC)
- ✅ Admin panel with user search
- ✅ Linked accounts page

**Infrastructure:**
- ✅ PostgreSQL database with Prisma
- ✅ Vercel Blob Storage
- ✅ API routes for user/admin/marketplace
- ✅ Responsive UI with dark/light themes
- ✅ Playwright E2E tests

**Pages:**
- ✅ Landing page (`/`)
- ✅ Dashboard (`/dashboard`)
- ✅ Account settings (`/account`)
- ✅ Admin panel (`/admin`)
- ✅ Linked accounts (`/linked-accounts`)
- ✅ Login/signup flows

### Partially Implemented

**VTT Rendering:**
- ⚠️ Pixi.js installed but not used yet
- ⚠️ No battle map, tokens, or grid

**Campaign System:**
- ⚠️ Database schema exists
- ⚠️ No UI for creating/managing campaigns

**Character System:**
- ⚠️ Database schema exists
- ⚠️ No character creation UI

### Not Implemented (3-Month Priority)

**Month 1 (December 2024):**
- ❌ Character creation UI
- ❌ Campaign management UI
- ❌ Session scheduling

**Month 2 (January 2025):**
- ❌ Pixi.js battle map
- ❌ Token placement and movement
- ❌ Map upload

**Month 3 (February 2025):**
- ❌ Dice roller UI
- ❌ Combat tracker (initiative, HP)
- ❌ Attack/damage rolls

### Not Implemented (Future Phases)

- ❌ Spell casting system
- ❌ Inventory management
- ❌ Character progression (XP, leveling)
- ❌ Fog of war
- ❌ Discord bot integration
- ❌ Monetization (Crit-Coins, Story Credits)
- ❌ FoundryVTT data sync
- ❌ World Anvil article imports
- ❌ Cosmic tiers (L21-50)

---

## 🚀 Development Priorities

### High Priority (Now → March 2026)
1. Character creation UI
2. Campaign & session management
3. Pixi.js VTT renderer
4. Token system
5. Dice roller
6. Combat tracker

### Medium Priority (Q2 2026)
7. Spell casting
8. Character progression
9. Inventory
10. Fog of war

### Low Priority (Q3-Q4 2026+)
11. Discord bot
12. Monetization
13. World Anvil sync
14. FoundryVTT integration
15. Advanced mechanics

---

## 📝 Documentation Standards

### File Naming
- Use kebab-case: `feature-name.md`
- Be descriptive: `character-creation.md` not `chars.md`
- Group by domain: `foundry-*.md`, `vercel-*.md`

### Content Structure
1. Brief description at top
2. "Last Updated" date
3. Clear section headers
4. Code examples where applicable
5. Links to source code

### Keep It Current
- Remove docs for abandoned features
- Update docs when code changes
- Mark future/speculative features clearly
- Move outdated docs to `/docs/agent/future/`

### Cross-Reference
- Link to related docs
- Link to source code: `[file.ts](../../src/path/file.ts)`
- Use relative paths

---

## 🔗 Essential Reading for New Developers

### 1. Setup & Configuration
- [Quick Fix Guide](/docs/agent/setup/quick-fix-guide.md) - Common issues
- [GitHub Setup](/docs/agent/setup/github-setup.md) - Repository config
- [Vercel Database Setup](/docs/agent/setup/vercel-database-setup.md) - DB config
- [Staging Environment Setup](/docs/agent/setup/staging-environment-setup.md) - Staging deploy

### 2. Testing
- [How to Run Tests](/docs/agent/testing/how-to-run.md) - E2E test guide
- [Developer Mode Guide](/docs/agent/testing/developer-mode-guide.md) - Test users
- [Auth Testing Guide](/docs/agent/testing/auth-testing-guide.md) - OAuth testing

### 3. Features (Current)
- [Linked Accounts](/docs/agent/features/linked-accounts.md) - Multi-provider linking
- [Signup Flow](/docs/agent/features/signup-flow.md) - User onboarding
- [Tiers and Permissions](/docs/agent/features/tiers-and-permissions.md) - User roles

### 4. Architecture
- [Architecture Overview](/docs/agent/architecture/overview.md) - System design
- [Separation of Concerns](/docs/agent/architecture/separation-of-concerns.md) - Code organization
- [Tile & Asset System](/docs/agent/architecture/TILE_ASSET_SYSTEM.md) - Multi-scale VTT tile system
- [Multiverse System](/docs/agent/architecture/MULTIVERSE_SYSTEM.md) - World nesting, world leaping, location templates

### 5. Roadmap
- [Future Features](/docs/agent/future/README.md) - **← START HERE FOR ROADMAP**
- [Character Creation Plan](/docs/agent/future/CHARACTER_CREATION.md) - Month 1
- [Dice System Plan](/docs/agent/future/DICE_ROLL_SYSTEM.md) - Month 3

---

## 🛠️ Contributing

When working on the project:

1. **Before implementing:**
   - Check `/docs/agent/future/README.md` for roadmap
   - Check if feature docs exist
   - Verify feature is in 3-month scope

2. **During implementation:**
   - Update docs to reflect changes
   - Add code comments for complex logic
   - Write/update tests

3. **After implementation:**
   - Verify docs match implementation
   - Update `/docs/agent/future/README.md` checklist
   - Remove "not implemented" warnings

4. **When removing features:**
   - Delete or move docs to `/docs/agent/future/`
   - Update README.md status sections

---

## 📄 License

Proprietary - All Rights Reserved
