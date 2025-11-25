# World Anvil MCP Server Setup

**Status**: Complete ✅
**Date**: December 2024

---

## 🎯 What Was Built

A complete Model Context Protocol (MCP) server and CLI tooling for interacting with World Anvil API, with intelligent caching and rate limiting.

### Components Created

1. **MCP Server** (`src/packages/worldanvil/mcp/server.ts`)
   - 8 tools for World Anvil API interaction
   - Automatic rate limiting (60 requests/minute)
   - PostgreSQL-backed caching
   - Error handling and logging

2. **CLI Tool** (`src/packages/worldanvil/cli/fetch-rpg-systems.ts`)
   - Fetch RPG system data for D&D 5e, Cypher, etc.
   - Cache management
   - Multiple output formats (JSON, TypeScript)
   - Filtering by system slug

3. **Database Schema** (for caching)
   - `worldanvil_worlds`
   - `worldanvil_articles`
   - `worldanvil_characters`
   - `worldanvil_blocks` (stat blocks)
   - `worldanvil_rpg_systems` (custom table)
   - `worldanvil_sync_log`

---

## 📦 MCP Server Features

### Tools Available

1. **worldanvil_get_rpg_systems** - List all RPG systems (D&D 5e, Cypher, etc.)
2. **worldanvil_get_rpg_system** - Get specific system by ID or slug
3. **worldanvil_get_world** - Get World Anvil world details
4. **worldanvil_get_articles** - Fetch articles from a world
5. **worldanvil_get_article** - Get specific article by ID
6. **worldanvil_get_characters** - Fetch characters from a world
7. **worldanvil_get_stat_blocks** - Get stat blocks from a world
8. **worldanvil_search** - Search cached World Anvil content

### Built-in Features

- ✅ **Rate Limiting**: 60 requests/minute (configurable)
- ✅ **Caching**: PostgreSQL-backed with TTLs
- ✅ **Error Handling**: Graceful failures with error messages
- ✅ **Logging**: stderr logging for debugging

---

## 🚀 Setup Instructions

### 1. Database Migration

Add the custom `worldanvil_rpg_systems` table:

```sql
-- Run this migration
CREATE TABLE IF NOT EXISTS worldanvil_rpg_systems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    synced_at TIMESTAMP,

    worldanvil_id INTEGER UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    publisher VARCHAR(255),
    official BOOLEAN DEFAULT false,
    community_created BOOLEAN DEFAULT false,
    icon_url TEXT,
    image_url TEXT,
    data JSONB
);

CREATE INDEX idx_wa_rpgsys_worldanvil_id ON worldanvil_rpg_systems(worldanvil_id);
CREATE INDEX idx_wa_rpgsys_slug ON worldanvil_rpg_systems(slug);
CREATE INDEX idx_wa_rpgsys_synced_at ON worldanvil_rpg_systems(synced_at);
```

Or using Prisma:

```bash
# Add to schema.prisma, then:
npx prisma migrate dev --name add_worldanvil_rpg_systems
```

---

### 2. Install MCP Dependencies

```bash
cd src/packages/worldanvil/mcp
npm install @modelcontextprotocol/sdk
npm install
```

---

### 3. Set Environment Variables

In `www.crit-fumble.com/.env`:

```bash
# World Anvil API (required)
WORLDANVIL_API_KEY="your-api-key-here"

# OAuth token (optional, for authenticated requests)
WORLDANVIL_ACCESS_TOKEN="your-oauth-token"

# Database (required for caching)
DATABASE_URL="postgresql://user:password@localhost:5432/critfumble"
```

---

### 4. Build MCP Server

```bash
cd src/packages/worldanvil/mcp
npm run build
```

---

### 5. Configure Claude Desktop (Optional)

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or equivalent:

```json
{
  "mcpServers": {
    "worldanvil": {
      "command": "node",
      "args": [
        "/full/path/to/www.crit-fumble.com/src/packages/worldanvil/mcp/dist/server.js"
      ],
      "env": {
        "WORLDANVIL_API_KEY": "your-api-key",
        "DATABASE_URL": "postgresql://user:password@localhost:5432/critfumble"
      }
    }
  }
}
```

Restart Claude Desktop to load the MCP server.

---

## 🔧 Using the CLI Tools

### Fetch All RPG Systems

```bash
cd www.crit-fumble.com

# Fetch all systems
npx tsx src/packages/worldanvil/cli/fetch-rpg-systems.ts

# Output location: data/_sources/worldanvil/rpg-systems.json
```

### Fetch Specific Systems

```bash
# Only D&D 5e and Cypher System
npx tsx src/packages/worldanvil/cli/fetch-rpg-systems.ts --systems "5e,cypher-system"
```

### Use Cache

```bash
# Use cached data if available (skip API call)
npx tsx src/packages/worldanvil/cli/fetch-rpg-systems.ts --cache
```

### Output as TypeScript

```bash
# Generate TypeScript file with type-safe exports
npx tsx src/packages/worldanvil/cli/fetch-rpg-systems.ts \
  --format typescript \
  --output src/data/rpg-systems.ts
```

---

## 📊 Database Schema

### worldanvil_worlds

```prisma
model WorldAnvilWorld {
  id               String    @id @default(uuid())
  createdAt        DateTime  @default(now()) @map("created_at")
  updatedAt        DateTime  @updatedAt @map("updated_at")

  worldAnvilId     String    @unique @map("worldanvil_id")
  slug             String?
  name             String
  description      String?   @db.Text
  url              String?   @db.Text

  playerId         String?   @map("player_id")
  player           Player?   @relation(fields: [playerId], references: [id])

  apiToken         String?   @db.Text // Encrypted
  autoSync         Boolean   @default(false) @map("auto_sync")
  lastSyncedAt     DateTime? @map("last_synced_at")

  data             Json      // Full API response (JSONB)

  articles         WorldAnvilArticle[]
  characters       WorldAnvilCharacter[]
  blocks           WorldAnvilBlock[]
  syncLogs         WorldAnvilSyncLog[]

  @@index([worldAnvilId])
  @@index([playerId])
  @@map("worldanvil_worlds")
}
```

### worldanvil_articles

```prisma
model WorldAnvilArticle {
  id                String    @id @default(uuid())
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")
  syncedAt          DateTime? @map("synced_at")

  worldAnvilWorldId String    @map("worldanvil_world_id")
  world             WorldAnvilWorld @relation(fields: [worldAnvilWorldId], references: [worldAnvilId], onDelete: Cascade)

  worldAnvilId      String    @unique @map("worldanvil_id")

  title             String    @db.VarChar(500)
  slug              String?   @db.VarChar(500)
  content           String?   @db.Text
  template          String?   @db.VarChar(100)
  category          String?   @db.VarChar(255)
  url               String?   @db.Text

  isPublic          Boolean   @default(true) @map("is_public")
  isDraft           Boolean   @default(false) @map("is_draft")

  data              Json      // Full API response (JSONB)

  @@index([worldAnvilWorldId])
  @@index([worldAnvilId])
  @@index([template])
  @@map("worldanvil_articles")
}
```

### worldanvil_characters

```prisma
model WorldAnvilCharacter {
  id                String    @id @default(uuid())
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")
  syncedAt          DateTime? @map("synced_at")

  worldAnvilWorldId String    @map("worldanvil_world_id")
  world             WorldAnvilWorld @relation(fields: [worldAnvilWorldId], references: [worldAnvilId], onDelete: Cascade)

  worldAnvilId      String    @unique @map("worldanvil_id")

  name              String    @db.VarChar(255)
  title             String?   @db.VarChar(500)
  content           String?   @db.Text

  statBlockId       String?   @map("stat_block_id")

  data              Json      // Full API response (JSONB)

  @@index([worldAnvilWorldId])
  @@map("worldanvil_characters")
}
```

### worldanvil_blocks (Stat Blocks)

```prisma
model WorldAnvilBlock {
  id                String    @id @default(uuid())
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")
  syncedAt          DateTime? @map("synced_at")

  worldAnvilWorldId String    @map("worldanvil_world_id")
  world             WorldAnvilWorld @relation(fields: [worldAnvilWorldId], references: [worldAnvilId], onDelete: Cascade)

  worldAnvilId      String    @unique @map("worldanvil_id")

  name              String    @db.VarChar(255)
  type              String    @db.VarChar(100) // 'character', 'creature', 'vehicle'

  stats             Json      // Stat block data (varies by game system)
  data              Json      // Full API response

  @@index([worldAnvilWorldId])
  @@index([type])
  @@map("worldanvil_blocks")
}
```

### worldanvil_rpg_systems (Custom)

```sql
CREATE TABLE worldanvil_rpg_systems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    synced_at TIMESTAMP,

    worldanvil_id INTEGER UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    publisher VARCHAR(255),
    official BOOLEAN DEFAULT false,
    community_created BOOLEAN DEFAULT false,
    icon_url TEXT,
    image_url TEXT,
    data JSONB
);
```

---

## 🧪 Testing the MCP Server

### Manual Test

```bash
cd src/packages/worldanvil/mcp
npm run dev
```

In another terminal, test with `mcp-client-cli` (if installed):

```bash
mcp-client-cli call worldanvil_get_rpg_systems
```

### Test with Claude Desktop

After configuring Claude Desktop:

1. Open Claude Desktop
2. Start a new conversation
3. Ask: "Use the World Anvil MCP to fetch all RPG systems"
4. Claude will use the `worldanvil_get_rpg_systems` tool

**Example prompts**:
- "Fetch the D&D 5e system details from World Anvil"
- "Get articles from my World Anvil world 'dragon-heist'"
- "Search for 'dragon' in my World Anvil world"

---

## 📋 Next Steps

### 1. Fetch Initial RPG System Data

```bash
npx tsx src/packages/worldanvil/cli/fetch-rpg-systems.ts --systems "5e,cypher-system"
```

### 2. Verify Cache

```bash
# Check if data was cached
psql -d critfumble -c "SELECT COUNT(*) FROM worldanvil_rpg_systems;"
```

### 3. Test MCP Server

```bash
cd src/packages/worldanvil/mcp
npm run dev
```

### 4. Build FoundryVTT Module

Use the cached World Anvil data in the `crit-fumble-worldanvil-sync` FoundryVTT module.

---

## 🔍 Troubleshooting

### "WORLDANVIL_API_KEY environment variable is required"

Make sure `.env` has:
```bash
WORLDANVIL_API_KEY="your-key"
```

### Rate Limit Warnings

The MCP server automatically handles rate limiting. Warnings are normal and expected:
```
Rate limit reached. Waiting 15000ms...
```

### Database Connection Errors

Ensure PostgreSQL is running:
```bash
docker-compose up -d postgres
```

### Prisma Client Errors

Regenerate Prisma client:
```bash
npx prisma generate
```

---

## 📚 Resources

- **MCP Documentation**: https://github.com/modelcontextprotocol/specification
- **World Anvil API**: https://www.worldanvil.com/api/external/boromir
- **OpenAPI Spec**: `src/packages/worldanvil/docs/boromir/yml/openapi.yml`

---

## ✅ Summary

You now have:
- ✅ MCP server for World Anvil API
- ✅ CLI tool to fetch RPG system data
- ✅ PostgreSQL caching layer
- ✅ Rate limiting (60 req/min)
- ✅ Ready for FoundryVTT integration

**Next**: Use this MCP to populate `data/_sources/worldanvil/` with D&D 5e and Cypher System data, then integrate with FoundryVTT modules.
