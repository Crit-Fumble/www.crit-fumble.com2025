# Future Features & Planning

**Documentation for features planned beyond current implementation**

**Target Test Release**: March 2026 (3 months)

---

## 🎯 Current Status (November 2024)

### ✅ What's Working Now

**Authentication & User Management:**
- NextAuth v5 with multiple providers (Discord, GitHub, Twitch, Battle.net)
- User accounts with linked accounts system
- Profile management (avatar, displayName, bio)
- Admin panel with user management
- Tier system (FREE, PATRON, ELITE, COSMIC)

**Database & Infrastructure:**
- PostgreSQL (Vercel Postgres) with Prisma ORM
- Vercel Blob Storage for assets
- Complete schema for campaigns, characters, sessions
- API routes for user, admin, marketplace, foundry, RPG data

**Pages & UI:**
- Landing page, dashboard, account settings
- Admin panel
- Character/campaign/world browsing (stub UI)
- Responsive design with dark/light themes
- Atomic design component structure

**Integrations (OAuth Only):**
- Discord, GitHub, Twitch, Battle.net, Steam (via World Anvil API)
- World Anvil OAuth (not yet syncing data)
- FoundryVTT linking placeholder

---

## 🎯 March 2026 Test Release Goals

### **Core Focus: Get players actually playing D&D 5e online**

The test release should enable a basic but complete D&D 5e session:
1. GM creates a campaign
2. Players create/join characters
3. Everyone sees a shared battle map
4. They can move tokens and roll dice
5. Combat works (initiative, attacks, HP tracking)

---

## 📋 Realistic 3-Month Roadmap

### Month 1: Character & Campaign Foundation (December 2024)

**Priority 1: Character Creation UI**
- [ ] Character sheet form (name, race, class, abilities)
- [ ] Ability score generation (point buy, standard array, rolling)
- [ ] Calculate modifiers automatically
- [ ] Level 1-20 only (no cosmic tiers yet)
- [ ] Save to database via API

**Priority 2: Campaign Management**
- [ ] Create campaign UI
- [ ] Invite players to campaign
- [ ] View campaign members list
- [ ] Set campaign status (planning, active, completed)

**Priority 3: Session Management**
- [ ] Create/schedule game sessions
- [ ] Join session link for players
- [ ] Basic session page (prep for VTT)

**Priority 4: Admin World Organization**
- [ ] Universes page for admins to organize worlds
- [ ] Create/edit universe functionality
- [ ] Assign worlds to universes
- [ ] Universe list and management UI
- [ ] Universe → Worlds hierarchy view

**Documentation to keep:**
- [CHARACTER_CREATION.md](CHARACTER_CREATION.md) - Reference for L1-20 only
- [USER_ROLES_AND_PERMISSIONS.md](USER_ROLES_AND_PERMISSIONS.md) - Player/GM/Admin roles

---

### Month 2: Basic VTT Rendering (January 2025)

**Priority 1: Pixi.js Canvas Setup**
- [ ] Install and configure Pixi.js v8
- [ ] Basic canvas in session page
- [ ] Pan and zoom controls
- [ ] Grid overlay (square grid only, 5ft squares)

**Priority 2: Token System**
- [ ] Upload/select token images
- [ ] Place tokens on grid
- [ ] Drag tokens to move
- [ ] Store positions in database
- [ ] Sync positions between players (WebSocket or polling)

**Priority 3: Map Backgrounds**
- [ ] Upload map image via Vercel Blob
- [ ] Display map as background layer
- [ ] Align grid to map

**Documentation to keep:**
- [DESIGN_PHILOSOPHY.md](DESIGN_PHILOSOPHY.md) - Keep it simple
- [NEXTJS_SETUP.md](NEXTJS_SETUP.md) - Tech stack reference

---

### Month 3: Combat System (February 2025)

**Priority 1: Dice Roller**
- [ ] Dice roll UI (d4, d6, d8, d10, d12, d20, d100)
- [ ] Modifiers (+/- buttons)
- [ ] Advantage/disadvantage for d20
- [ ] Show roll results to everyone
- [ ] Roll history log

**Priority 2: Combat Tracker**
- [ ] Initiative roller
- [ ] Initiative order list
- [ ] Turn indicator (whose turn is it?)
- [ ] HP tracking (current/max)
- [ ] Status effects (concentrating, prone, etc.)

**Priority 3: Basic Attacks**
- [ ] Roll to hit (d20 + modifier)
- [ ] Roll damage (weapon dice + modifier)
- [ ] Apply damage to target HP
- [ ] Critical hits (roll dice twice)

**Documentation to keep:**
- [DICE_ROLL_SYSTEM.md](DICE_ROLL_SYSTEM.md) - Basic mechanics only
- [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Simplified version

---

## 📦 Features AFTER March 2026

### Phase 2: Enhanced Gameplay (Q2 2026)
- Spell casting system (spell slots, concentration)
- Character progression (XP, leveling up)
- Inventory management
- Fog of war
- Better map tools (drawing, measuring)

### Phase 3: Discord Integration (Q3 2026)
- Discord bot for dice rolls
- Post session summaries to Discord
- Play-by-post mode (text commands)

### Phase 4: Monetization (Q4 2026)
- Stripe integration
- Crit-Coins virtual currency
- Story Credits for GMs
- Premium content marketplace

### Phase 5: World Anvil Integration (2027)
- Sync articles, stat blocks, maps
- Push session logs to World Anvil
- Import WA content to campaigns

### Phase 6: Advanced Features (Future)
- Levels 21-50 (cosmic tiers)
- Multi-scale hex grids
- Timeline/multiverse system
- AI GM assistant
- FoundryVTT interop

---

## 🚫 Explicitly NOT Doing for March 2026

**These are great ideas but too ambitious for 3 months:**

- ❌ Multi-scale hex grids (50ft → 60 light years)
- ❌ Cosmic scale combat multipliers (Mega/Tera/Ultra/Divine)
- ❌ Timeline branching and alternate histories
- ❌ Physics systems (pixel matter, weight calculations)
- ❌ Crafting and repair systems
- ❌ Harvesting and survival mechanics
- ❌ Facilities system (forges, bedrooms, etc.)
- ❌ NPC AI behaviors and needs tracking
- ❌ Downtime activities system
- ❌ Complex camera modes and view perspectives
- ❌ Discord Activities (embedded VTT in voice channels)
- ❌ World Anvil data syncing
- ❌ Donjon map imports
- ❌ On-demand CPU droplet provisioning
- ❌ Virtual Desktop sessions

**Keep these documented for future phases, but don't build them yet.**

---

## 📂 Keeping for Reference

**Deployment:**
- [DIGITALOCEAN_SETUP.md](DIGITALOCEAN_SETUP.md) - FoundryVTT droplet setup
- [DO_QUICKSTART.md](DO_QUICKSTART.md) - Quick deployment guide

**Monetization (Q4 2026):**
- [MONETIZATION.md](MONETIZATION.md) - Crit-Coins and Story Credits design
- [STRIPE_SETUP.md](STRIPE_SETUP.md) - Payment integration guide
- [WEBHOOKS.md](WEBHOOKS.md) - Discord and Stripe webhooks

**Discord (Q3 2026):**
- [DISCORD_INTEGRATION.md](DISCORD_INTEGRATION.md) - Bot and Activity modes

**Status Tracking:**
- [CURRENT_STATUS.md](CURRENT_STATUS.md) - Old detailed status doc
- [TODO.md](TODO.md) - Old comprehensive TODO list

---

## 🎯 Success Criteria for March 2026

The test release is successful if:

1. **GM can run a session:**
   - Create campaign and invite 3-5 players
   - Upload a battle map
   - Place enemy tokens on map
   - Track initiative and HP

2. **Players can play:**
   - Create Level 3 D&D 5e character
   - Join campaign and session
   - See shared map and all tokens
   - Move their token
   - Roll attacks and damage
   - See HP go down when hit

3. **Technical quality:**
   - No crashes during 2-hour session
   - Token positions sync within 2 seconds
   - Dice rolls are visible to everyone immediately
   - Mobile-responsive (tablet works, phone is OK if clunky)

---

## 📝 Development Principles

1. **Ship working features over perfect features**
   - A simple dice roller that works beats a complex one that's buggy

2. **Use existing tools**
   - Pixi.js for rendering (don't build custom engine)
   - Vercel Blob for images (don't build asset pipeline)
   - NextAuth for auth (don't build custom login)

3. **Square grids before hex grids**
   - Everyone knows square grids
   - Hex math is complex
   - Can add hex support later

4. **Levels 1-20 before cosmic tiers**
   - Standard D&D 5e is well-understood
   - Cosmic stuff is our unique value-add, but not MVP
   - Test with familiar rules first

5. **Local before global**
   - Single battle map before world maps
   - One dungeon before hex crawls
   - Tactical combat before exploration

---

## 🔗 Related Documentation

**Current Implementation:**
- [/docs/agent/README.md](/docs/agent/README.md) - Main documentation index
- [/docs/agent/features/](/docs/agent/features/) - Implemented features
- [/docs/agent/integrations/](/docs/agent/integrations/) - API integrations

**Setup Guides:**
- [/docs/agent/setup/](/docs/agent/setup/) - Development environment
- [/docs/agent/testing/](/docs/agent/testing/) - Test suite documentation

---

**Last Updated**: November 24, 2024
**Target Release**: March 2026 (3 months from now)
**Focus**: Working D&D 5e sessions with basic VTT features
