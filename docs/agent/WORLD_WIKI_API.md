# World Wiki API

**Status**: ✅ Complete
**Created**: November 24, 2025
**Version**: 1.0 (Markdown-only)

---

## Overview

The World Wiki API provides CRUD operations for managing world-specific wikis. Each `RpgWorld` can have multiple wiki pages organized by category, with support for GM-only content, player content, and full revision history.

---

## Database Schema

### `RpgWorldWiki` Model

```prisma
model RpgWorldWiki {
  id        String    @id @default(uuid())
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  // Link to world
  worldId String
  world   RpgWorld @relation(fields: [worldId], references: [id], onDelete: Cascade)

  // Page identification
  slug      String  @db.VarChar(200) // URL-friendly identifier (unique per world)
  title     String  @db.VarChar(200)
  category  String? @db.VarChar(100) // 'lore', 'npcs', 'locations', 'items', 'quests', 'history'
  icon      String? @db.VarChar(50) // Emoji or icon identifier
  sortOrder Int     @default(0)

  // Content (Markdown format)
  content       String @db.Text
  gmContent     String? @db.Text // GM-only secrets
  playerContent String? @db.Text // Player-visible content
  description   String? @db.Text // Short summary for search results

  // Publishing & Visibility
  isPublished Boolean @default(false)
  isPublic    Boolean @default(false)
  publishedAt DateTime?

  // Authorship
  authorId       String
  author         CritUser @relation("AuthoredWorldWikiPages", fields: [authorId], references: [id])
  lastEditedById String?
  lastEditedBy   CritUser? @relation("EditedWorldWikiPages", fields: [lastEditedById], references: [id])

  // Metadata
  metadata Json @default("{}") @db.JsonB

  // Relations
  revisions RpgWorldWikiRevision[]

  @@unique([worldId, slug]) // Slug must be unique per world
  @@index([worldId])
  @@index([authorId])
  @@index([category])
  @@index([isPublished])
  @@index([deletedAt])
}
```

### `RpgWorldWikiRevision` Model

```prisma
model RpgWorldWikiRevision {
  id               String   @id @default(uuid())
  createdAt        DateTime @default(now())
  wikiPageId       String
  wikiPage         RpgWorldWiki @relation(fields: [wikiPageId], references: [id], onDelete: Cascade)
  versionNumber    Int
  changeNote       String? @db.Text
  content          String @db.Text
  gmContent        String? @db.Text
  playerContent    String? @db.Text
  editorId         String
  editor           CritUser @relation("WorldWikiEdits", fields: [editorId], references: [id])
  aiAssisted       Boolean @default(false)
  aiModel          String? @db.VarChar(100)
  aiPromptMetadata Json @default("{}") @db.JsonB

  @@unique([wikiPageId, versionNumber])
  @@index([wikiPageId])
  @@index([editorId])
}
```

---

## API Endpoints

### `GET /api/worlds/[worldId]/wiki`

**Purpose**: List all wiki pages for a world
**Auth**: Public (filtered by visibility)
**Rate Limit**: 200 requests/minute

**Query Parameters**:
- `category` (string, optional) - Filter by category
- `published` (boolean, optional) - Filter by published status
- `search` (string, optional) - Search in title and content (case-insensitive)

**Permission Logic**:
- **Owner**: Sees all pages (published + unpublished, public + private)
- **Authenticated Users**: Only sees published pages
- **Unauthenticated Users**: Only sees published AND public pages

**Response**:
```json
{
  "pages": [
    {
      "id": "uuid",
      "slug": "dragon-kingdom",
      "title": "The Dragon Kingdom",
      "category": "lore",
      "icon": "🐉",
      "sortOrder": 0,
      "description": "A kingdom ruled by ancient dragons",
      "isPublished": true,
      "isPublic": false,
      "publishedAt": "2025-11-24T12:00:00Z",
      "createdAt": "2025-11-20T10:00:00Z",
      "updatedAt": "2025-11-24T12:00:00Z",
      "author": {
        "id": "uuid",
        "username": "gamemaster",
        "avatarUrl": "https://..."
      },
      "lastEditedBy": {
        "id": "uuid",
        "username": "assistant_gm",
        "avatarUrl": "https://..."
      }
    }
  ],
  "total": 1
}
```

**Note**: Full content is NOT included in list view (only in individual page GET)

**Status Codes**:
- `200` - Success
- `404` - World not found
- `429` - Rate limit exceeded

---

### `POST /api/worlds/[worldId]/wiki`

**Purpose**: Create a new wiki page
**Auth**: Required (world owner only)
**Rate Limit**: 100 requests/minute

**Request Body**:
```json
{
  "slug": "dragon-kingdom",
  "title": "The Dragon Kingdom",
  "content": "# The Dragon Kingdom\n\nA land of ancient wyrms...",
  "category": "lore",
  "icon": "🐉",
  "sortOrder": 0,
  "description": "A kingdom ruled by ancient dragons",
  "gmContent": "**Secret**: The dragon king is actually polymorphed",
  "playerContent": "You've heard rumors of dragon riders",
  "isPublished": true,
  "isPublic": false,
  "metadata": {},
  "aiAssisted": false,
  "aiModel": null,
  "aiPromptMetadata": {}
}
```

**Required Fields**: `slug`, `title`, `content`

**Response**:
```json
{
  "success": true,
  "wikiPage": {
    "id": "uuid",
    "slug": "dragon-kingdom",
    "title": "The Dragon Kingdom",
    "content": "# The Dragon Kingdom...",
    "author": {
      "id": "uuid",
      "username": "gamemaster",
      "avatarUrl": "https://..."
    }
  }
}
```

**Status Codes**:
- `201` - Created successfully
- `400` - Missing required fields
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (not world owner)
- `404` - World not found
- `409` - Conflict (slug already exists)
- `429` - Rate limit exceeded

**Notes**:
- Creates initial revision (version 1) with change note "Initial version"
- Automatically sets `publishedAt` if `isPublished: true`
- AI metadata is tracked for transparency

---

### `GET /api/worlds/[worldId]/wiki/[slug]`

**Purpose**: Retrieve a single wiki page with full content
**Auth**: Public (filtered by visibility)
**Rate Limit**: 200 requests/minute

**Permission Logic**:
- **Owner**: Sees all content including `gmContent`
- **Authenticated Users**: Sees published pages, excluding `gmContent`
- **Unauthenticated Users**: Only sees published AND public pages, excluding `gmContent`

**Response**:
```json
{
  "id": "uuid",
  "slug": "dragon-kingdom",
  "title": "The Dragon Kingdom",
  "category": "lore",
  "icon": "🐉",
  "sortOrder": 0,
  "description": "A kingdom ruled by ancient dragons",
  "content": "# The Dragon Kingdom\n\nA land of ancient wyrms...",
  "gmContent": "**Secret**: The dragon king is polymorphed", // Owner only
  "playerContent": "You've heard rumors of dragon riders",
  "isPublished": true,
  "isPublic": false,
  "publishedAt": "2025-11-24T12:00:00Z",
  "createdAt": "2025-11-20T10:00:00Z",
  "updatedAt": "2025-11-24T12:00:00Z",
  "metadata": {},
  "author": {
    "id": "uuid",
    "username": "gamemaster",
    "avatarUrl": "https://..."
  },
  "lastEditedBy": {
    "id": "uuid",
    "username": "assistant_gm",
    "avatarUrl": "https://..."
  }
}
```

**Status Codes**:
- `200` - Success
- `401` - Unauthorized (unauthenticated user trying to access non-public page)
- `404` - Wiki page not found (or unpublished and user is not owner)
- `429` - Rate limit exceeded

---

### `PATCH /api/worlds/[worldId]/wiki/[slug]`

**Purpose**: Update an existing wiki page
**Auth**: Required (world owner only)
**Rate Limit**: 100 requests/minute

**Request Body** (all fields optional):
```json
{
  "title": "The Ancient Dragon Kingdom",
  "content": "# The Ancient Dragon Kingdom\n\nUpdated lore...",
  "category": "history",
  "icon": "🐲",
  "sortOrder": 5,
  "description": "Updated description",
  "gmContent": "Updated GM secrets",
  "playerContent": "Updated player hints",
  "isPublished": true,
  "isPublic": false,
  "metadata": {},
  "changeNote": "Updated lore based on session 5",
  "aiAssisted": false,
  "aiModel": null,
  "aiPromptMetadata": {}
}
```

**Response**:
```json
{
  "success": true,
  "wikiPage": {
    "id": "uuid",
    "slug": "dragon-kingdom",
    "title": "The Ancient Dragon Kingdom",
    ...
  }
}
```

**Behavior**:
- Updates `lastEditedById` to current user
- Sets `publishedAt` if `isPublished: true` and not previously published
- Creates new revision ONLY if `content`, `gmContent`, or `playerContent` changed
- Revision version number = `latest_version + 1`
- `changeNote` defaults to "Updated content" if not provided

**Status Codes**:
- `200` - Updated successfully
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (not world owner)
- `404` - Wiki page not found
- `429` - Rate limit exceeded

---

### `DELETE /api/worlds/[worldId]/wiki/[slug]`

**Purpose**: Soft delete a wiki page
**Auth**: Required (world owner only)
**Rate Limit**: 100 requests/minute

**Response**:
```json
{
  "success": true,
  "message": "Wiki page deleted successfully"
}
```

**Behavior**:
- **Soft delete**: Sets `deletedAt` timestamp (does NOT hard delete)
- Revisions are preserved (CASCADE on RpgWorldWiki deletion would remove them)
- Deleted pages do not appear in GET /wiki queries

**Status Codes**:
- `200` - Deleted successfully
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (not world owner)
- `404` - Wiki page not found
- `429` - Rate limit exceeded

---

## Security Features

### Rate Limiting

- **Read Operations** (GET): 200 requests/minute
- **Write Operations** (POST, PATCH, DELETE): 100 requests/minute
- Enforced via `apiRateLimiter` from `@/lib/rate-limit`
- Client identifier: `session.user.id` (authenticated) or IP address (unauthenticated)

### Authentication

- Uses `await auth()` from `@/lib/auth` (NextAuth)
- Sessions validated on every request
- JWT-based session tokens

### Authorization

- **World Owner**: Full CRUD access to all pages
- **Authenticated Users**: Read access to published pages
- **Unauthenticated Users**: Read access to published AND public pages

### Content Filtering

- `gmContent` is ONLY returned to world owners
- `playerContent` is returned to all users (if exists)
- Unpublished pages return `404` for non-owners (security through obscurity)

---

## Testing

### Unit Tests

**Location**:
- `src/app/api/worlds/[worldId]/wiki/route.test.ts`
- `src/app/api/worlds/[worldId]/wiki/[slug]/route.test.ts`

**Status**: ⚠️ Tests written but not runnable due to Next.js/Vitest module resolution issues

**Issue**: next-auth imports `next/server` before Vitest mocks can intercept, causing:
```
Error: Cannot find module 'c:\...\node_modules\next\server' imported from next-auth\lib\env.js
```

**Workaround**: Use E2E tests with Playwright instead of unit tests

### E2E Testing Approach

**Recommended**: Use Playwright for testing wiki API endpoints

**Example**:
```typescript
import { test, expect } from '@playwright/test';

test('create and retrieve wiki page', async ({ request }) => {
  // Authenticate
  const loginRes = await request.post('/api/auth/signin/email', { ... });

  // Create world
  const worldRes = await request.post('/api/worlds', { ... });
  const { worldId } = await worldRes.json();

  // Create wiki page
  const createRes = await request.post(`/api/worlds/${worldId}/wiki`, {
    data: {
      slug: 'test-page',
      title: 'Test Page',
      content: '# Test Content'
    }
  });
  expect(createRes.status()).toBe(201);

  // Retrieve wiki page
  const getRes = await request.get(`/api/worlds/${worldId}/wiki/test-page`);
  expect(getRes.status()).toBe(200);
  const page = await getRes.json();
  expect(page.title).toBe('Test Page');
});
```

---

## Usage Examples

### Creating a Wiki Page from AI

```typescript
const response = await fetch(`/api/worlds/${worldId}/wiki`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': sessionCookie
  },
  body: JSON.stringify({
    slug: 'shadowfell',
    title: 'The Shadowfell',
    content: aiGeneratedContent,
    category: 'planes',
    icon: '🌑',
    isPublished: false, // Draft until GM reviews
    aiAssisted: true,
    aiModel: 'claude-3-5-sonnet',
    aiPromptMetadata: {
      prompt: 'Generate lore for the Shadowfell plane',
      temperature: 0.8
    }
  })
});

const { wikiPage } = await response.json();
console.log(`Created wiki page: ${wikiPage.id}`);
```

### Searching Wiki Pages

```typescript
// Search for dragon-related lore
const response = await fetch(
  `/api/worlds/${worldId}/wiki?search=dragon&category=lore&published=true`
);

const { pages } = await response.json();
console.log(`Found ${pages.length} dragon lore pages`);
```

### Updating with Revision History

```typescript
const response = await fetch(`/api/worlds/${worldId}/wiki/shadowfell`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': sessionCookie
  },
  body: JSON.stringify({
    content: updatedContent,
    changeNote: 'Added details about Raven Queen\'s palace',
    isPublished: true // Publish after review
  })
});

// This creates revision version 2, 3, etc.
```

---

## Content Format

### Current: Markdown Only

**Version**: 1.0
**Storage**: All content stored as Markdown in PostgreSQL TEXT fields

**Why Markdown?**
- ✅ Simple, human-readable syntax
- ✅ Easy to parse and render
- ✅ GitHub-compatible
- ✅ Rich content support (headers, lists, tables, code blocks)
- ✅ No vendor lock-in

**Example**:
```markdown
# The Shadowfell

The **Shadowfell** is a dark reflection of the Material Plane.

## Key Locations
- The Raven Queen's palace
- The City of Gloom
- The Shadowgate

## Notable NPCs
- **The Raven Queen** - Goddess of Death
- **Shadar-kai** - Fey creatures bound to shadow
```

### Future: BBCode for World Anvil Integration

**Version**: 2.0 (planned)
**Status**: See [WIKI_WORLDANVIL_FUTURE.md](./WIKI_WORLDANVIL_FUTURE.md)

**Goal**: Bi-directional sync between Crit-Fumble (Markdown) and World Anvil (BBCode)

**Conversion Strategy**:
1. Store everything as Markdown internally
2. Use `metadata.sourceFormat` to track origin ("markdown" or "bbcode")
3. Convert Markdown ↔ BBCode on sync
4. Use turndown.js (HTML → Markdown) + marked.js (Markdown → HTML) + custom BBCode parser

---

## Migration

### Running the Migration

**Command**:
```bash
npx prisma migrate dev --name add_world_wiki --create-only
```

**Migration File**: `prisma/migrations/20251124191114_add_world_wiki/migration.sql`

**What It Creates**:
- `rpg_world_wiki_pages` table
- `rpg_world_wiki_revisions` table
- Foreign keys to `rpg_worlds` and `crit_users`
- Indexes on `worldId`, `authorId`, `category`, `isPublished`, `deletedAt`
- Unique constraint on `(worldId, slug)`

**Migration Size**: ~100 lines of SQL

---

## Performance Considerations

### Indexes

- ✅ `worldId` - Fast world lookups
- ✅ `authorId` - Fast author page listings
- ✅ `category` - Fast category filtering
- ✅ `isPublished` - Fast published/unpublished queries
- ✅ `deletedAt` - Fast soft delete filtering
- ✅ `(worldId, slug)` - Unique constraint + fast slug lookups

### Query Optimization

**List Query** (GET /wiki):
```sql
SELECT id, slug, title, category, icon, sortOrder, description,
       isPublished, isPublic, publishedAt, createdAt, updatedAt
FROM rpg_world_wiki_pages
WHERE worldId = ? AND deletedAt IS NULL AND isPublished = true
ORDER BY sortOrder ASC, title ASC;
```

**Individual Page Query** (GET /wiki/[slug]):
```sql
SELECT *
FROM rpg_world_wiki_pages
WHERE worldId = ? AND slug = ? AND deletedAt IS NULL;
```

**Performance**: Both queries use indexed columns (`worldId`, `slug`, `deletedAt`)

### Content Size

- `content`: TEXT (up to ~1 GB per page)
- `gmContent`: TEXT
- `playerContent`: TEXT
- **Recommended**: Keep individual pages under 100KB for fast rendering
- **Large Content**: Consider breaking into multiple pages

---

## Related Documentation

- [WORLD_WIKI_FOUNDRY_INTEGRATION.md](./WORLD_WIKI_FOUNDRY_INTEGRATION.md) - Integration with FoundryVTT
- [WIKI_WORLDANVIL_FUTURE.md](./WIKI_WORLDANVIL_FUTURE.md) - Future World Anvil BBCode sync
- [API_FIRST_DEVELOPMENT_PLAN.md](./API_FIRST_DEVELOPMENT_PLAN.md) - Development roadmap

---

**Last Updated**: November 24, 2025
**API Version**: 1.0
**Status**: ✅ Complete (Markdown-only, ready for UI development)
