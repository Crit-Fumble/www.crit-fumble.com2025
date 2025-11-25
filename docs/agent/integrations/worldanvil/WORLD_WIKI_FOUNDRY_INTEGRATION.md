# World-Wiki-Foundry Integration

**Date**: November 24, 2025
**Status**: ✅ **Schema Complete** | ⏳ **Migration Pending** | ❌ **API Not Built**

---

## 🎯 Overview

Every **FoundryVTT world snapshot** is linked to an **RpgWorld**, which can have its own **world-specific wiki** for documenting lore, NPCs, locations, quests, and more.

**Key Relationships**:
```
FoundryInstance (DigitalOcean Droplet)
    └── FoundryWorldSnapshot (1:1 with RpgWorld)
            └── RpgWorld (defines world scope)
                    └── RpgWorldWiki[] (world-specific wiki pages)
```

---

## 📊 Schema Structure

### 1. FoundryWorldSnapshot → RpgWorld (1:1)

**`FoundryWorldSnapshot`** table:
```prisma
model FoundryWorldSnapshot {
  id        String   @id @default(uuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Link to RPG world (source of truth) - 1:1 relationship
  worldId String   @unique @map("world_id")
  world   RpgWorld @relation(fields: [worldId], references: [id], onDelete: Cascade)

  // Currently loaded on this Foundry instance
  instanceId String?          @map("instance_id")
  instance   FoundryInstance? @relation(fields: [instanceId], references: [id])

  // Snapshot status
  status String @default("stored") // 'stored', 'loading', 'active', 'saving'

  // Activity tracking
  lastSyncAt         DateTime
  lastActivityAt     DateTime?
  currentPlayers     Int @default(0)
  totalPlaytimeSeconds Int @default(0)

  @@map("foundry_world_snapshots")
}
```

**Key Features**:
- ✅ 1:1 relationship with RpgWorld
- ✅ Can be loaded on a Foundry instance (or stored in DB only)
- ✅ Tracks activity for auto-shutdown
- ✅ Cascade delete: If RpgWorld deleted → snapshot deleted

---

### 2. RpgWorld (World Scope Definition)

**`RpgWorld`** table:
```prisma
model RpgWorld {
  id        String   @id @default(uuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  // World info
  name        String
  description String?
  systemName  String // 'dnd5e', 'pathfinder', 'cypher', etc.

  // World scale - defines scope
  worldScale String @default("Realm")
  // Values: 'Adventure Location', 'Settlement', 'Region', 'Continent',
  //         'Realm', 'Planet', 'Orbital Space', 'Universe'

  // Ownership
  ownerId String
  owner   CritUser @relation(fields: [ownerId], references: [id])

  // World nesting (for multiverses)
  containerWorldId String?
  containerWorld   RpgWorld? @relation("WorldNesting", fields: [containerWorldId], references: [id])
  containedWorlds  RpgWorld[] @relation("WorldNesting")

  // Foundry VTT link
  foundryWorldId String? @unique // Foundry's internal world ID

  // Relations
  worldSnapshot FoundryWorldSnapshot? // 1:1 with Foundry snapshot
  wikiPages     RpgWorldWiki[]        // World-specific wiki pages ← NEW
  creatures     RpgCreature[]
  locations     RpgLocation[]
  activities    RpgActivity[]
  campaigns     RpgCampaign[]
  assets        RpgAsset[]

  @@map("rpg_worlds")
}
```

**Key Features**:
- ✅ Defines world scope (Adventure Location → Universe)
- ✅ Can be nested (Universe contains Realm contains Planet, etc.)
- ✅ Links to Foundry via `foundryWorldId`
- ✅ Has 1:1 relationship with `FoundryWorldSnapshot`
- ✅ **NEW**: Has many `RpgWorldWiki` pages

---

### 3. RpgWorldWiki (World-Specific Wiki Pages)

**`RpgWorldWiki`** table (**NEW**):
```prisma
model RpgWorldWiki {
  id        String   @id @default(uuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  // Link to world
  worldId String
  world   RpgWorld @relation(fields: [worldId], references: [id], onDelete: Cascade)

  // Page identification
  slug      String  // URL-friendly identifier (unique per world)
  title     String
  category  String? // 'lore', 'npcs', 'locations', 'items', 'quests', 'history'
  icon      String? // Emoji or icon
  sortOrder Int @default(0)

  // Content (Markdown format)
  content       String // Main content
  gmContent     String? // GM-only secrets
  playerContent String? // Player-visible content

  // Publishing & Visibility
  isPublished Boolean @default(false) // Published in world wiki?
  isPublic    Boolean @default(false) // Visible to non-campaign members?
  publishedAt DateTime?

  // Authorship
  authorId       String
  author         CritUser @relation("AuthoredWorldWikiPages")
  lastEditedById String?
  lastEditedBy   CritUser? @relation("EditedWorldWikiPages")

  // Relations
  revisions RpgWorldWikiRevision[]

  @@unique([worldId, slug]) // Slug must be unique per world
  @@map("rpg_world_wiki_pages")
}
```

**Key Features**:
- ✅ Belongs to a specific RpgWorld
- ✅ Supports GM-only and player-only content
- ✅ Revision history tracking
- ✅ Publishing workflow (draft → published)
- ✅ Public vs private pages
- ✅ Categorization system
- ✅ Slug unique per world (different worlds can have same slug)

---

### 4. RpgWorldWikiRevision (Revision History)

**`RpgWorldWikiRevision`** table (**NEW**):
```prisma
model RpgWorldWikiRevision {
  id        String   @id @default(uuid())
  createdAt DateTime @default(now())

  // Link to parent wiki page
  wikiPageId    String
  wikiPage      RpgWorldWiki @relation(fields: [wikiPageId], references: [id], onDelete: Cascade)

  // Revision metadata
  versionNumber Int    // Incremental version counter
  changeNote    String // What changed in this revision

  // Snapshot of content at this revision
  content       String
  gmContent     String?
  playerContent String?

  // Editor info
  editorId String
  editor   CritUser @relation("WorldWikiEdits")

  // AI metadata (if AI-assisted)
  aiAssisted       Boolean @default(false)
  aiModel          String?
  aiPromptMetadata Json @default("{}")

  @@map("rpg_world_wiki_revisions")
}
```

**Key Features**:
- ✅ Full revision history
- ✅ Track who edited and when
- ✅ Tracks AI assistance (if used)
- ✅ Change notes for each revision
- ✅ Can revert to previous versions

---

## 🔗 Complete Relationship Flow

### Example: Foundry World → RpgWorld → Wiki

```typescript
// 1. User creates RpgWorld
const world = await prisma.rpgWorld.create({
  data: {
    name: "Greyhawk",
    description: "Classic D&D setting",
    systemName: "dnd5e",
    worldScale: "Realm",
    ownerId: userId
  }
});

// 2. Create Foundry snapshot linked to world
const snapshot = await prisma.foundryWorldSnapshot.create({
  data: {
    worldId: world.id, // Link to RpgWorld
    status: "stored",
    lastSyncAt: new Date()
  }
});

// 3. Add wiki pages to world
const lorePageawait prisma.rpgWorldWiki.create({
  data: {
    worldId: world.id,
    slug: "oerth-history",
    title: "History of Oerth",
    category: "lore",
    content: "# History of Oerth\n\n...",
    gmContent: "Secret: The Codex of Infinite Planes is hidden...",
    playerContent: "Oerth is a world of ancient empires...",
    isPublished: true,
    authorId: userId
  }
});

// 4. Query world with all wiki pages
const worldWithWiki = await prisma.rpgWorld.findUnique({
  where: { id: world.id },
  include: {
    wikiPages: {
      where: { isPublished: true },
      orderBy: { sortOrder: 'asc' }
    },
    worldSnapshot: true,
    campaigns: true
  }
});
```

---

## 📝 API Endpoints Needed

### World Wiki API Routes

**`/api/worlds/[worldId]/wiki`** - World wiki management

**GET** - List wiki pages for a world
```typescript
GET /api/worlds/abc123/wiki?category=npcs&published=true

Response:
{
  "pages": [
    {
      "id": "...",
      "slug": "lord-robilar",
      "title": "Lord Robilar",
      "category": "npcs",
      "content": "...",
      "isPublished": true
    }
  ]
}
```

**POST** - Create new wiki page
```typescript
POST /api/worlds/abc123/wiki

Body:
{
  "slug": "city-of-greyhawk",
  "title": "City of Greyhawk",
  "category": "locations",
  "content": "# City of Greyhawk\n\n...",
  "gmContent": "Secret passages under the city...",
  "playerContent": "A bustling metropolis...",
  "isPublished": false
}
```

**`/api/worlds/[worldId]/wiki/[slug]`** - Individual wiki page

**GET** - Get wiki page by slug
```typescript
GET /api/worlds/abc123/wiki/city-of-greyhawk

Response:
{
  "id": "...",
  "slug": "city-of-greyhawk",
  "title": "City of Greyhawk",
  "content": "...",
  "gmContent": "...", // Only if user is GM
  "revisions": [...] // If include=revisions
}
```

**PATCH** - Update wiki page
```typescript
PATCH /api/worlds/abc123/wiki/city-of-greyhawk

Body:
{
  "content": "Updated content...",
  "changeNote": "Added section on the Thieves' Guild"
}
```

**DELETE** - Soft delete wiki page
```typescript
DELETE /api/worlds/abc123/wiki/city-of-greyhawk
```

---

## 🎯 Use Cases

### 1. Foundry Session with World Wiki

**Scenario**: GM runs Foundry session, players reference world wiki

```typescript
// GM loads Foundry world
const snapshot = await loadFoundryWorld(worldId);

// Players view world wiki during session
const wikiPages = await prisma.rpgWorldWiki.findMany({
  where: {
    worldId,
    isPublished: true,
    OR: [
      { isPublic: true },
      { world: { campaigns: { some: { players: { some: { id: playerId } } } } } }
    ]
  }
});
```

### 2. Syncing Foundry Journal Entries → Wiki

**Scenario**: Auto-sync Foundry journal entries to world wiki

```typescript
// During Foundry sync
const foundryJournals = await foundryClient.getJournalEntries();

for (const journal of foundryJournals) {
  await prisma.rpgWorldWiki.upsert({
    where: {
      worldId_slug: {
        worldId: world.id,
        slug: slugify(journal.name)
      }
    },
    create: {
      worldId: world.id,
      slug: slugify(journal.name),
      title: journal.name,
      content: journal.content,
      category: 'journal',
      authorId: gmUserId
    },
    update: {
      content: journal.content,
      updatedAt: new Date()
    }
  });
}
```

### 3. World Lore Browser

**Scenario**: Public world lore browseable by anyone

```typescript
// Public worlds can have public wiki pages
const publicLore = await prisma.rpgWorldWiki.findMany({
  where: {
    isPublic: true,
    isPublished: true
  },
  include: {
    world: {
      select: { name: true, description: true }
    },
    author: {
      select: { username: true, avatarUrl: true }
    }
  },
  orderBy: { createdAt: 'desc' }
});
```

---

## 🔒 Security & Permissions

### Permission Levels

| Role | Can View | Can Edit | Can Publish | Can Delete |
|------|----------|----------|-------------|------------|
| **World Owner** | All pages | All pages | Yes | Yes |
| **Campaign GM** | Published + drafts | Assigned pages | No | No |
| **Campaign Player** | Published only | No | No | No |
| **Public User** | Public pages only | No | No | No |

### Permission Check Function

```typescript
// src/lib/world-wiki-permissions.ts

export async function canViewWikiPage(
  userId: string,
  wikiPage: RpgWorldWiki
): Promise<boolean> {
  // Public pages: anyone can view
  if (wikiPage.isPublic && wikiPage.isPublished) {
    return true;
  }

  // Get world with owner info
  const world = await prisma.rpgWorld.findUnique({
    where: { id: wikiPage.worldId },
    include: {
      campaigns: {
        include: {
          players: true,
          gameMasters: true
        }
      }
    }
  });

  // World owner: can view everything
  if (world.ownerId === userId) {
    return true;
  }

  // Campaign GM or player: can view published pages
  const isInCampaign = world.campaigns.some(campaign =>
    campaign.players.some(p => p.id === userId) ||
    campaign.gameMasters.some(gm => gm.id === userId)
  );

  if (isInCampaign && wikiPage.isPublished) {
    return true;
  }

  return false;
}

export async function canEditWikiPage(
  userId: string,
  wikiPage: RpgWorldWiki
): Promise<boolean> {
  const world = await prisma.rpgWorld.findUnique({
    where: { id: wikiPage.worldId }
  });

  // Only world owner can edit
  return world.ownerId === userId;
}
```

---

## 📋 Migration Steps

### Step 1: Create Migration

```bash
npx prisma migrate dev --name add_world_wiki
```

This will create:
- `rpg_world_wiki_pages` table
- `rpg_world_wiki_revisions` table
- Foreign key to `rpg_worlds.id`
- Foreign key to `crit_users.id` (author, editor)

### Step 2: Update CritUser Relations

Already added in schema:
```prisma
model CritUser {
  // ... existing fields ...

  // World-specific Wiki
  authoredWorldWikiPages   RpgWorldWiki[]         @relation("AuthoredWorldWikiPages")
  lastEditedWorldWikiPages RpgWorldWiki[]         @relation("EditedWorldWikiPages")
  worldWikiRevisions       RpgWorldWikiRevision[] @relation("WorldWikiEdits")
}
```

### Step 3: Seed Example Data (Optional)

```typescript
// prisma/seed.ts

async function seedWorldWiki() {
  const user = await prisma.critUser.findFirst();
  const world = await prisma.rpgWorld.findFirst();

  if (!user || !world) return;

  // Create example wiki pages
  await prisma.rpgWorldWiki.createMany({
    data: [
      {
        worldId: world.id,
        slug: "welcome",
        title: "Welcome to the World",
        category: "meta",
        content: "# Welcome\n\nThis is the world wiki...",
        isPublished: true,
        authorId: user.id
      },
      {
        worldId: world.id,
        slug: "npcs",
        title: "Notable NPCs",
        category: "npcs",
        content: "# Notable NPCs\n\n## Lord Blackthorn\n...",
        isPublished: true,
        authorId: user.id
      },
      {
        worldId: world.id,
        slug: "secrets",
        title: "GM Secrets",
        category: "lore",
        gmContent: "# Secret Information\n\nThe BBEG is...",
        isPublished: false,
        authorId: user.id
      }
    ]
  });
}
```

---

## 🎨 UI Mockups (Future)

### World Wiki Homepage

```
┌─────────────────────────────────────────────┐
│ 🌍 Greyhawk Wiki                            │
├─────────────────────────────────────────────┤
│                                             │
│ 📚 Categories:                              │
│   • Lore (5)                                │
│   • NPCs (12)                               │
│   • Locations (8)                           │
│   • Items (3)                               │
│   • Quests (6)                              │
│                                             │
│ 📄 Recent Pages:                            │
│   • City of Greyhawk                        │
│   • Lord Robilar                            │
│   • The Temple of Elemental Evil            │
│                                             │
│ [+ New Page]                                │
└─────────────────────────────────────────────┘
```

### Wiki Page View

```
┌─────────────────────────────────────────────┐
│ [← Back to Wiki]                [Edit]      │
├─────────────────────────────────────────────┤
│                                             │
│ 🏰 City of Greyhawk                         │
│ Category: Locations                         │
│                                             │
│ [Player View] [GM View] [History]           │
│                                             │
│ ─── Player Content ───                      │
│ The City of Greyhawk is a bustling...      │
│                                             │
│ ─── GM Content (Secret) ───                 │
│ The Thieves' Guild secretly controls...     │
│                                             │
│ Last edited by: @username (2 days ago)      │
│ Revisions: 5                                │
└─────────────────────────────────────────────┘
```

---

## ✅ Summary

**Schema Complete**:
- ✅ `RpgWorldWiki` - World-specific wiki pages
- ✅ `RpgWorldWikiRevision` - Revision history
- ✅ Relations to `RpgWorld` and `CritUser`
- ✅ 1:1 relationship: `FoundryWorldSnapshot` ↔ `RpgWorld`

**Next Steps**:
1. Run Prisma migration: `npx prisma migrate dev --name add_world_wiki`
2. Build API routes for wiki CRUD operations
3. Add permission checking middleware
4. Build UI for wiki management
5. Implement Foundry journal sync

**Benefits**:
- ✅ Every Foundry world has a wiki
- ✅ GMs can document lore, NPCs, locations
- ✅ Players can reference wiki during sessions
- ✅ Foundry journal entries can auto-sync to wiki
- ✅ Public worlds can share lore with community
- ✅ Full revision history with AI tracking

---

**Status**: ✅ **Schema Complete**
**Migration**: ⏳ **Ready to Run**
**API**: ❌ **Not Built Yet**
**UI**: ❌ **Not Built Yet**

**Last Updated**: November 24, 2025
