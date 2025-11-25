# User Roles and Permissions

**Last Updated**: 2025-11-17

---

## Overview

The CFG VTT system supports **3 primary user roles** based on SRD game data:

1. **Player** - Creates characters, joins campaigns, plays through adventures
2. **Game Master (GM)** - Creates worlds, manages campaigns, builds encounters
3. **Spectator** - Observes games without participating

Each role has different permissions and access levels to world creation, sheet management, and gameplay features.

---

## Role Definitions

### 1. Player

**Primary Function**: Create player characters, join GM worlds, play through adventures

**Permissions**:
- ✅ Create **Player Character sheets**
- ✅ Join GM-created worlds (with invitation)
- ✅ Play through procedurally generated Provinces (scaled to level)
- ✅ View own character sheets
- ✅ View campaign history (events affecting their character)
- ✅ Roll dice, move tokens, take combat actions
- ✅ Spectate games they are part of (as spectator role)
- ❌ **Cannot** create NPCs, items, creatures, or locations
- ❌ **Cannot** create Provinces, Kingdoms, Continents, or Worlds
- ❌ **Cannot** modify other players' characters
- ❌ **Cannot** access GM tools

**What Players Can Create**:
- Player Character sheets (unlimited)
- Custom equipment loadouts (from available items)
- Character notes, backstory

**What Players Can Access**:
- Own character sheets
- Campaigns they're invited to
- Campaign history (filtered to their perspective)
- Procedurally generated solo adventures

---

### 2. Game Master (GM)

**Primary Function**: Create worlds, manage campaigns, design encounters, run games

**Permissions**:
- ✅ Create **all sheet types** (NPCs, items, creatures, locations, player characters)
- ✅ Create geographic scopes: **Province → Kingdom → Continent → World**
- ✅ Manage campaigns (invite players, start sessions, track history)
- ✅ Access GM tools (encounter builder, loot tables, procedural generation)
- ✅ Place sheets within Provinces (NPCs, items, creatures, locations)
- ✅ Modify campaign settings, world state
- ✅ View all player characters in their campaigns
- ✅ Spectate any game they are GMing
- ❌ **Cannot** modify player characters (only view)
- ❌ **Cannot** access other GMs' private campaigns

**What GMs Can Create**:

#### Geographic Scopes (Province on down)
| Scope | Hex Scale | Description |
|-------|-----------|-------------|
| **Province** | 1-mile hexes | Starting scope for Tier 1 campaigns |
| **Town** | 300ft hexes | Settlements within provinces |
| **Dungeon** | 50ft hexes | Battle maps, tactical combat |
| **Location** | Any scale | Custom areas (taverns, temples, caves) |

**Note**: GMs start by creating **Provinces**. Higher scopes (Kingdom, Continent, World) can be created as campaigns progress.

#### Sheet Types
| Sheet Type | Purpose | Examples |
|------------|---------|----------|
| **NPC Character Sheet** | Non-player characters | Merchants, quest givers, allies |
| **Creature Card** | Monsters, enemies | Goblins, dragons, demons |
| **Item Card** | Equipment, loot, artifacts | Weapons, armor, magic items |
| **Location/Area Card** | Places, structures | Taverns, dungeons, temples, forests |

**GM Workflow**:
1. Create a **Province** (e.g., "Millwood Province")
2. Populate with **Location Cards** (villages, dungeons, wilderness areas)
3. Add **NPC sheets** to locations (shopkeepers, guards, quest givers)
4. Stock locations with **Item Cards** (loot, shop inventories)
5. Place **Creature Cards** in encounters (monsters, enemies)
6. Invite **Players** to join the campaign
7. Start **Game Session** and manage gameplay

---

### 3. Spectator

**Primary Function**: Observe games without interacting

**Permissions**:
- ✅ View active game sessions they're invited to
- ✅ See hex map state (token positions, visible areas)
- ✅ Read chat messages
- ✅ View combat tracker
- ✅ Follow player perspectives
- ❌ **Cannot** move tokens, roll dice, or take actions
- ❌ **Cannot** modify anything
- ❌ **Cannot** see hidden/GM-only information

**Use Cases**:
- Friends watching a game
- Streaming/broadcasting games
- Players observing when their character is inactive
- Learning how the VTT works before playing

---

## Sheet Types in Detail

### NPC Character Sheet

**Created by**: Game Masters only
**Purpose**: Non-player characters (allies, quest givers, merchants, rivals)

**Fields**:
- Name, race, class, level
- Ability scores, skills, proficiencies
- HP, AC, speed
- Inventory, equipment
- Personality traits, ideals, bonds, flaws
- Quest hooks, dialogue options
- Location (which Province/Location they inhabit)

**Examples**:
- Tavern keeper in Millwood Village
- Dwarven blacksmith quest giver
- Traveling merchant with rare items
- Rival adventurer party member

---

### Creature Card

**Created by**: Game Masters only
**Purpose**: Monsters, enemies, hostile creatures

**Fields**:
- Name, type (aberration, beast, dragon, etc.)
- Size (Tiny, Small, Medium, Large, Huge, Gargantuan)
- CR (Challenge Rating)
- HP, AC, speed
- Ability scores, saving throws
- Attack actions, special abilities
- Loot table (items dropped on death)
- Terrain/environment preferences

**Examples**:
- Goblin Warrior (CR 1/4)
- Young Red Dragon (CR 10)
- Beholder (CR 13)
- Tarrasque (CR 30)

**Group Support**:
- **Single**: 1 creature, 1 token
- **Swarm**: Multiple creatures, 1 token, shared HP (e.g., 20 rats)
- **Squad**: Multiple creatures, multiple tokens, individual HP (e.g., 5 orcs)

---

### Item Card

**Created by**: Game Masters only
**Purpose**: Equipment, loot, consumables, magic items

**Fields**:
- Name, type (weapon, armor, consumable, magic item)
- Rarity (Common, Uncommon, Rare, Very Rare, Legendary, Artifact)
- Description, properties
- Cost (gold pieces)
- Weight, quantity
- Magical effects (if magic item)
- Requires attunement? (yes/no)

**Examples**:
- Longsword (+1)
- Plate Armor
- Potion of Healing
- Ring of Invisibility
- Staff of Power

**Use Cases**:
- Shop inventories
- Treasure hoards
- Quest rewards
- Starting equipment for NPCs

---

### Location/Area Card

**Created by**: Game Masters only
**Purpose**: Places, structures, geographic features

**Fields**:
- Name, type (village, dungeon, forest, temple, etc.)
- Description, history
- Size (hex count)
- NPCs present (references to NPC sheets)
- Items available (shop inventories, loot)
- Creatures present (encounters)
- Entrances/exits (connections to other locations)
- Environmental effects (lighting, weather, hazards)

**Examples**:
- Millwood Village (1-mile hex on Province map)
- The Rusty Dragon Tavern (300ft hex in village)
- Goblin Cave Dungeon (50ft hexes, 20×20 grid)
- Darkwood Forest (multiple 1-mile hexes)

**Nested Locations**:
Locations can contain other locations:
- **Province** → Contains **Villages**, **Dungeons**, **Wilderness Areas**
- **Village** → Contains **Taverns**, **Shops**, **Temples**
- **Dungeon** → Contains **Rooms**, **Corridors**, **Boss Chambers**

---

## Campaign Membership System

### Campaign Roles

Each user can have different roles in different campaigns:

```typescript
type CampaignMembership = {
  id: string
  campaignId: string
  userId: string
  role: 'gm' | 'player' | 'spectator'
  joinedAt: Date
  isActive: boolean
}
```

**Examples**:
- User A is **GM** of Campaign 1, **Player** in Campaign 2, **Spectator** in Campaign 3
- User B is **Player** in Campaign 1 and Campaign 3
- User C is **Spectator** in Campaign 1 (watching friends play)

### Role Assignment

**GM Role**:
- Assigned when user creates a campaign
- Only 1 GM per campaign (primary GM)
- Can invite co-GMs (future feature)

**Player Role**:
- Assigned when user accepts campaign invitation
- Can join multiple campaigns simultaneously
- Each campaign requires a unique character

**Spectator Role**:
- Assigned when user accepts spectator invitation
- Read-only access to active sessions
- Can switch to Player if invited

---

## Province Creation (GM Workflow)

### Step 1: Create Province

**GM Action**: Create new Province
**Required Fields**:
- Province name (e.g., "Millwood Province")
- Hex scale: 1-mile hexes (default for Tier 1)
- Grid size: 60×60 hexes (default)
- Starting layer: Surface (Layer 3)
- Terrain type: Temperate, Desert, Arctic, Tropical, etc.

**Output**: Empty 60×60 hex grid representing ~3,600 square miles

---

### Step 2: Place Locations

**GM Action**: Add Location Cards to Province
**Location Types**:
- **Villages**: 1-3 hexes (300ft scale internally)
- **Dungeons**: 1-5 hexes (50ft scale internally)
- **Wilderness**: 5-20 hexes (forests, mountains, swamps)
- **Points of Interest**: 1 hex (ruins, shrines, caves)

**Example**:
- Millwood Village (hex 30, 45) - 1-mile hex with 300ft internal map
- Goblin Cave (hex 15, 20) - 1-mile hex with 50ft dungeon map
- Darkwood Forest (hexes 10-15, 30-40) - 10 hexes of forest terrain

---

### Step 3: Populate Locations

**GM Action**: Add NPCs, Creatures, and Items to Locations

**Millwood Village**:
- **NPCs**: Tavern keeper, blacksmith, merchant, guard captain
- **Items**: Shop inventories (weapons, armor, supplies)
- **Creatures**: None (peaceful village)

**Goblin Cave**:
- **NPCs**: Kidnapped villager (rescue quest)
- **Creatures**: 10 Goblins, 1 Goblin Boss
- **Items**: Treasure chest (100 GP, +1 Shortsword)

**Darkwood Forest**:
- **Creatures**: Wolves, giant spiders, bandits
- **Items**: Scattered loot from previous adventurers

---

### Step 4: Invite Players

**GM Action**: Send campaign invitations
**Invitation includes**:
- Campaign name
- Starting level (recommended)
- Role assignment (Player or Spectator)

**Players Accept**: Create character for this campaign

---

### Step 5: Start Session

**GM Action**: Launch game session
**Session State**:
- Active hex map (Province view)
- Player tokens spawned at starting location
- NPCs, creatures loaded
- Combat tracker ready
- Dice roller active

---

## Procedurally Generated Provinces (Player Mode)

### Solo Play Option

**Feature**: Players can generate solo adventures without a GM

**Workflow**:
1. Player selects **"Solo Adventure"** from dashboard
2. System asks for **character level** (1-50)
3. System generates **Province** scaled to character level:
   - Appropriate CR creatures
   - Level-appropriate loot
   - Difficulty-scaled encounters
4. Player explores generated Province
5. History tracked automatically

**Procedural Generation Rules**:
- **Level 1-4**: Village with goblin/bandit threats, simple dungeon
- **Level 5-10**: Kingdom-scale threats, multi-level dungeons
- **Level 11-16**: Continental-scale conflicts, ancient ruins
- **Level 17-20**: World-threatening events, planar incursions
- **Level 21+**: Cosmic-scale adventures, spaceship battles

**Use Cases**:
- Learning the VTT
- Practicing character builds
- Solo campaigns
- Testing high-level mechanics

---

## Sheet Placement System

### GM Sheet Management

**Where GMs Can Place Sheets**:

#### NPCs
- Assigned to **Location Cards**
- Example: "Bartender Bob" assigned to "Rusty Dragon Tavern"
- Appears when players enter that location

#### Creatures
- Placed on **hex tiles** within locations
- Example: 5 Goblins placed in Goblin Cave (hexes 10, 11, 12, 13, 14)
- Appears as tokens on battle map

#### Items
- Assigned to **NPCs** (shop inventories)
- Placed on **hex tiles** (loot, treasure chests)
- Assigned to **Creatures** (loot drops on death)

#### Locations
- Placed on **Province hex tiles**
- Example: "Millwood Village" placed at hex (30, 45)
- Players can zoom into location to see 300ft internal map

---

### Sheet Access Control

```typescript
type SheetPermissions = {
  sheetId: string
  creatorId: string // User who created the sheet
  campaignId?: string // If sheet is campaign-specific
  isPublic: boolean // If sheet is visible to all players
  visibleTo: string[] // User IDs who can see this sheet
}
```

**Examples**:

**Public NPC** (visible to all players):
```json
{
  "sheetId": "npc-bartender-bob",
  "creatorId": "gm-user-123",
  "campaignId": "campaign-millwood",
  "isPublic": true,
  "visibleTo": []
}
```

**Hidden Creature** (GM-only until encounter starts):
```json
{
  "sheetId": "creature-goblin-boss",
  "creatorId": "gm-user-123",
  "campaignId": "campaign-millwood",
  "isPublic": false,
  "visibleTo": ["gm-user-123"]
}
```

**Secret Item** (only visible when discovered):
```json
{
  "sheetId": "item-magic-sword",
  "creatorId": "gm-user-123",
  "campaignId": "campaign-millwood",
  "isPublic": false,
  "visibleTo": ["player-user-456"] // Player who found it
}
```

---

## Database Schema Updates

### New Tables/Fields Needed

#### CampaignMembership (already exists)
```prisma
model CampaignMembership {
  id         String   @id @default(cuid())
  campaignId String
  userId     String
  role       String   // 'gm' | 'player' | 'spectator'
  joinedAt   DateTime @default(now())
  isActive   Boolean  @default(true)

  campaign   Campaign @relation(fields: [campaignId], references: [id])
  user       User     @relation(fields: [userId], references: [id])
}
```

#### SheetPermissions (new table)
```prisma
model SheetPermissions {
  id         String   @id @default(cuid())
  sheetId    String   // Generic sheet ID (works for any sheet type)
  sheetType  String   // 'npc' | 'creature' | 'item' | 'location'
  creatorId  String
  campaignId String?
  isPublic   Boolean  @default(false)
  visibleTo  String[] // Array of user IDs

  creator    User     @relation(fields: [creatorId], references: [id])
  campaign   Campaign? @relation(fields: [campaignId], references: [id])
}
```

#### LocationSheet (new table)
```prisma
model LocationSheet {
  id           String   @id @default(cuid())
  name         String
  locationType String   // 'village' | 'dungeon' | 'forest' | 'temple' | etc.
  description  String?
  hexX         Int
  hexY         Int
  hexZ         Int      // Layer index
  provinceId   String
  creatorId    String

  npcs         NpcSheet[]      @relation("LocationNPCs")
  creatures    CreatureSheet[] @relation("LocationCreatures")
  items        ItemSheet[]     @relation("LocationItems")

  creator      User            @relation(fields: [creatorId], references: [id])
}
```

---

## UI Components Needed

### GM Dashboard

**Sections**:
- **My Campaigns**: List of campaigns where user is GM
- **My Provinces**: List of created Provinces
- **Sheet Library**: NPCs, Creatures, Items, Locations
- **Tools**: Encounter builder, loot generator, Province generator

**Actions**:
- Create Campaign
- Create Province
- Create Sheet (NPC, Creature, Item, Location)
- Invite Players
- Start Session

---

### Player Dashboard

**Sections**:
- **My Characters**: List of player characters
- **Campaigns**: List of campaigns where user is Player
- **Solo Adventures**: Start procedurally generated Province

**Actions**:
- Create Character
- Join Campaign (with invite code)
- Start Solo Adventure
- View Campaign History

---

### Spectator Dashboard

**Sections**:
- **Watching**: List of campaigns where user is Spectator
- **Live Sessions**: Currently active sessions

**Actions**:
- Join Session (spectator mode)
- Switch camera view (follow different players)

---

## Summary

### Role Breakdown

| Feature | Player | Game Master | Spectator |
|---------|--------|-------------|-----------|
| Create Player Characters | ✅ | ✅ | ❌ |
| Create NPCs | ❌ | ✅ | ❌ |
| Create Creatures | ❌ | ✅ | ❌ |
| Create Items | ❌ | ✅ | ❌ |
| Create Locations | ❌ | ✅ | ❌ |
| Create Provinces | ❌ | ✅ | ❌ |
| Join Campaigns | ✅ | ✅ | ✅ |
| Play Solo Adventures | ✅ | ✅ | ❌ |
| Start Game Sessions | ❌ | ✅ | ❌ |
| Move Tokens | ✅ | ✅ | ❌ |
| Roll Dice | ✅ | ✅ | ❌ |
| View Hidden Sheets | ❌ | ✅ | ❌ |
| Spectate Sessions | ✅* | ✅ | ✅ |

*Players can spectate sessions they're part of

---

### Next Steps

1. Update Prisma schema with:
   - SheetPermissions table
   - LocationSheet table
   - CampaignMembership role field
2. Create UI wireframes for:
   - GM Dashboard (Province builder, sheet library)
   - Player Dashboard (character list, solo adventures)
   - Spectator view (read-only session view)
3. Implement role-based access control (RBAC) in API
4. Build sheet creation UIs for NPCs, Creatures, Items, Locations
5. Build Province creation workflow

---

**This document defines the complete role system for CFG VTT. All data layer work is complete; UI/API implementation can begin.**
