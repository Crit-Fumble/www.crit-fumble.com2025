# CFG Website TODO

## Architecture Overview

The CFG platform now uses **Foundry VTT** as the gameplay engine. The website's role is:
- User authentication and management
- Campaign/world orchestration
- Module configuration and deployment
- Data persistence (PostgreSQL backend)
- API integration (WorldAnvil, OpenAI, Anthropic)

## Current Status

### ✅ Completed
- User authentication (Discord SSO)
- Basic user/player database schema
- Module architecture established:
  - `foundry-core-concepts` - System-agnostic TTRPG concepts
  - `foundry-core-srd-5e` - D&D 5e SRD implementation
  - `foundry-cfg-5e` - CFG custom features
  - `foundry-api-control` - API integration
  - `foundry-postgresql-storage` - Data persistence

### 🔄 In Progress
- Core concept documentation (Activity, Event, Location, etc.)
- 5e SRD data mapping
- Facility system
- Activity system
- Event system

---

## Sprint Plan (Website Focus)

### Sprint 1: User Management & Module Configuration
**Focus**: Website manages users, Foundry modules handle gameplay

**Website Components**:
- [x] Player Login with Discord SSO
- [x] User/session persistence in PostgreSQL
- [ ] Role selection UI (Player Character, Storyteller, Spectator)
- [ ] Settings page
  - [ ] Dark mode toggle
  - [ ] API token management (WorldAnvil, OpenAI, Anthropic)
  - [ ] Foundry VTT connection settings
- [ ] User dashboard showing:
  - Active campaigns
  - Available worlds
  - Character list
  - Module status

**Foundry Integration**:
- [ ] Launch Foundry VTT instances for campaigns
- [ ] Configure foundry-core-srd-5e module
- [ ] Configure foundry-cfg-5e module
- [ ] Pass user API tokens to Foundry modules

---

### Sprint 2: Campaign & World Management
**Focus**: Website orchestrates campaigns, Foundry renders them

**Website Components**:
- [ ] Campaign creation/management
  - Campaign metadata (name, description, system)
  - World selection (or create new)
  - Module selection and configuration
  - Player invitations
- [ ] World management
  - World metadata
  - World-level settings
  - Calendar configuration
  - Time tracking settings
- [ ] Module marketplace/catalog
  - Browse available modules
  - Install/update modules
  - Module dependencies

**Foundry Integration**:
- [ ] Create Foundry VTT worlds for campaigns
- [ ] Configure foundry-core-srd-5e with campaign settings
- [ ] Enable/disable modules per campaign
- [ ] Import/export world data

---

### Sprint 3: Character Sheet (Data Management)
**Focus**: Website stores character data, Foundry renders/plays

**Website Components**:
- [ ] Character creation wizard (data only)
  - Class selection (Fighter, Cleric, Rogue, Wizard level 1)
  - Species selection (Human, Elf, Dwarf)
  - Background selection (all SRD)
  - Origin feat selection (all SRD)
  - Starting gear assignment
- [ ] Character data storage (PostgreSQL)
- [ ] Character list/management
- [ ] Character sharing/permissions

**Foundry Integration**:
- [ ] Sync character data to Foundry VTT
- [ ] Foundry renders character sheet using foundry-core-srd-5e
- [ ] Bidirectional sync (changes in Foundry → PostgreSQL)
- [ ] Character token/portrait management

---

### Sprint 4: Location & Map Data Management
**Focus**: Website stores location data, Foundry renders maps

**Website Components**:
- [ ] Location data management
  - Location metadata (name, type, scale)
  - Parent/child location hierarchy
  - Terrain/environment properties
- [ ] Map upload and processing
  - Parse images into tiles by scale
  - GM layer vs Player layer
  - Grid overlay preview
- [ ] Location import
  - Donjon JSON import
  - Worldographer import
  - 5e.tools import

**Foundry Integration**:
- [ ] Export location data to Foundry scenes
- [ ] Tile-based rendering in Foundry (using foundry-core-concepts scale system)
- [ ] Multi-scale map support (combat → world)
- [ ] Location data stored in PostgreSQL, cached in Foundry

---

### Sprint 5: Creature & Object Data Management
**Focus**: Website manages stat blocks, Foundry handles gameplay

**Website Components**:
- [ ] Creature/NPC database
  - Import from 5e.tools format
  - Custom creature creation
  - Creature organization (Animals, Monsters, People packs)
- [ ] Object/Item database
  - SRD items
  - Custom items
  - Magic items
- [ ] WorldAnvil integration
  - Link stat blocks to WorldAnvil articles
  - Sync descriptions and lore

**Foundry Integration**:
- [ ] Sync creatures to Foundry actors (using foundry-core-srd-5e)
- [ ] Sync items to Foundry items
- [ ] Drag-and-drop from website to Foundry
- [ ] Behavior AI integration (foundry-cfg-5e)

---

### Sprint 6: Session & Event Tracking
**Focus**: Website tracks meta-game, Foundry tracks in-game

**Website Components**:
- [ ] Session management
  - Schedule sessions
  - Session notes/summary
  - Session replay/review
  - Associate time ranges with sessions
- [ ] Event log (stored in PostgreSQL)
  - All game events from Foundry
  - Event search and filtering
  - Event timeline visualization
- [ ] Goal tracking
  - Campaign goals
  - Character goals
  - Goal progress tracking
  - Goal completion celebration

**Foundry Integration**:
- [ ] Event stream from Foundry → PostgreSQL
- [ ] Session time tracking in Foundry
- [ ] Event playback in Foundry
- [ ] Goal status sync

---

### Sprint 7: Activity & Downtime Management
**Focus**: Website manages downtime activities, Foundry handles gameplay

**Website Components**:
- [ ] Activity catalog browser
  - View all activities by mode
  - Activity prerequisites and effects
  - Activity duration calculator
- [ ] Downtime activity planner
  - Schedule downtime activities
  - Track progress (crafting, training, etc.)
  - Calculate costs and time
- [ ] Facility browser
  - View facilities available at locations
  - Facility benefits and costs

**Foundry Integration**:
- [ ] Activity definitions from foundry-core-srd-5e
- [ ] Activity execution in Foundry
- [ ] Downtime automation (foundry-cfg-5e)
- [ ] Activity completion → website notification

---

### Sprint 8: API Integrations
**Focus**: Website coordinates external services

**Website Components**:
- [ ] WorldAnvil integration
  - OAuth authentication
  - Article sync
  - Map import
  - Campaign linking
- [ ] OpenAI integration
  - NPC dialogue generation
  - Quest generation
  - Description enhancement
- [ ] Anthropic (Claude) integration
  - DM assistant
  - Rule lookup
  - Strategy suggestions

**Foundry Integration**:
- [ ] Pass API tokens to Foundry modules
- [ ] Use APIs from foundry-cfg-5e
- [ ] Cache API responses in PostgreSQL

---

### Sprint 9: Advanced Features
**Focus**: Website enables advanced workflows

**Website Components**:
- [ ] World generator
  - Generate continents, kingdoms, settlements
  - Use seed-based generation
  - Export to Foundry
- [ ] Campaign analytics
  - Play statistics
  - Character progression charts
  - Event frequency analysis
- [ ] Module development tools
  - Module template generator
  - Module testing sandbox
  - Module publishing

**Foundry Integration**:
- [ ] Load generated worlds into Foundry
- [ ] Analytics from Foundry event data
- [ ] Custom module loading

---

## Module Responsibility Matrix

| Feature | Website | foundry-core-concepts | foundry-core-srd-5e | foundry-cfg-5e |
|---------|---------|----------------------|-------------------|---------------|
| **User Auth** | ✓ Manages | | | Uses |
| **Data Storage** | ✓ PostgreSQL | | | Syncs to |
| **Core Concepts** | Uses | ✓ Defines | Extends | Extends |
| **5e Rules** | Displays | | ✓ Implements | Uses |
| **Gameplay** | Observes | | | ✓ Executes |
| **Character Sheets** | Stores data | | ✓ Renders | Enhances |
| **Maps/Locations** | Stores data | ✓ Scale system | ✓ SRD terrain | Renders |
| **Combat** | Tracks events | | ✓ SRD rules | ✓ Executes |
| **Activities** | Plans downtime | ✓ Base concept | ✓ SRD activities | Automates |
| **Events** | Logs all | ✓ Base concept | ✓ SRD events | Generates |
| **API Integration** | ✓ Manages tokens | | | Uses tokens |
| **AI Features** | | | | ✓ Implements |

---

## Data Flow Examples

### Character Creation
```
1. User creates character in website UI
2. Website stores in PostgreSQL (character table)
3. Website calls Foundry API to create actor
4. foundry-core-srd-5e renders character sheet
5. Changes in Foundry sync back to PostgreSQL
```

### Combat Encounter
```
1. User drags creatures from website to Foundry scene
2. foundry-core-srd-5e loads creature stat blocks
3. Combat starts in Foundry
4. foundry-cfg-5e executes combat automation
5. All events stream to PostgreSQL event log
6. Website displays event summary in session notes
```

### Downtime Activity
```
1. User plans crafting activity in website
2. Website calculates time/cost using foundry-core-srd-5e rules
3. User confirms, activity syncs to Foundry
4. foundry-cfg-5e auto-advances time
5. Completion event → PostgreSQL → website notification
```

---

## Technology Stack

### Website (Next.js)
- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, tRPC
- **Database**: PostgreSQL (via Prisma)
- **Auth**: NextAuth.js (Discord OAuth)
- **Deployment**: Vercel or self-hosted

### Foundry VTT Modules
- **Language**: TypeScript
- **Build**: Vite
- **Testing**: Vitest, Playwright
- **Distribution**: npm packages or Foundry module format

### Integration
- **API**: REST + WebSocket for real-time events
- **Data Sync**: Bidirectional (PostgreSQL ↔ Foundry)
- **Event Stream**: Foundry → PostgreSQL → Website

---

## Migration Notes

**Old Approach** (custom VTT in website):
- Website rendered maps using Pixi.js
- Website handled all game logic
- Monolithic architecture

**New Approach** (Foundry VTT integration):
- Foundry VTT handles all gameplay and rendering
- Website manages data, users, and orchestration
- Modular architecture with clear separation of concerns

**Benefits**:
- ✅ Leverage Foundry's mature VTT platform
- ✅ Focus website development on unique features
- ✅ Better separation of concerns
- ✅ Easier to test and maintain
- ✅ Community can create compatible modules

---

## Next Steps

1. **Immediate**: Complete foundry-core-concepts documentation
2. **Short-term**: Implement foundry-core-srd-5e data mapping
3. **Medium-term**: Build website ↔ Foundry integration layer
4. **Long-term**: Launch beta with Sprint 1-3 features
