# Wiki System - World Anvil Integration (Future)

**Date**: November 24, 2025
**Status**: 📋 **Planned for Future**
**Current**: Basic Markdown Wiki
**Future**: Full World Anvil BBCode Integration

---

## 🎯 Current Approach (MVP)

**For Now**: Build basic wiki with **Markdown only**

**Why Markdown First?**
1. ✅ Simple to implement
2. ✅ Widely supported (GitHub, Discord, etc.)
3. ✅ Easy to edit and preview
4. ✅ Can be converted to HTML easily
5. ✅ Familiar to developers and writers

**Current Schema**:
```prisma
model RpgWorldWiki {
  // ...
  content       String @db.Text // Markdown format
  gmContent     String? @db.Text // Markdown format
  playerContent String? @db.Text // Markdown format
}
```

---

## 🔮 Future: World Anvil Integration

### World Anvil Uses BBCode

**World Anvil Example**:
```bbcode
[h1]The City of Greyhawk[/h1]

[quote]
A bustling metropolis on the edge of the Nyr Dyv.
[/quote]

[section:Geography]
The city is divided into several districts:
[ul]
[li][url:old-city]Old City[/url] - The historic center[/li]
[li][url:river-quarter]River Quarter[/url] - Trade district[/li]
[/ul]
[/section]

[spoiler]
[h2]GM Secret[/h2]
The Thieves' Guild is secretly run by Lord Robilar.
[/spoiler]

[article:lord-robilar]Lord Robilar[/article]
```

### Conversion Strategy

**Two-Way Conversion**:
```
World Anvil (BBCode) ←→ Crit-Fumble (Markdown) ←→ HTML (Display)
```

**Storage Format**: Always store as Markdown in our DB
- World Anvil import: BBCode → Markdown
- World Anvil export: Markdown → BBCode

---

## 📦 Markdown ↔ BBCode Conversion

### Phase 1: Basic Conversion (Future)

**Libraries to Consider**:
```bash
npm install marked           # Markdown → HTML
npm install turndown         # HTML → Markdown
npm install bbcode-to-html   # BBCode → HTML
npm install html-to-bbcode   # HTML → BBCode
```

**Conversion Flow**:
```typescript
// Import from World Anvil
BBCode → HTML → Markdown → Store in DB

// Export to World Anvil
Markdown → HTML → BBCode → Send to WA API
```

### Phase 2: Advanced Features (Future)

**World Anvil Special Tags**:
- `[article:id]` - Link to another article
- `[section:name]` - Collapsible section
- `[spoiler]` - GM-only content
- `[quote]` - Pull quotes
- `[timeline]` - Timeline widget
- `[map]` - Interactive map

**Markdown Extensions Needed**:
```markdown
<!-- Crit-Fumble extensions -->
[[article:lord-robilar]] - Link to wiki page
::: section Geography - Collapsible section
::: spoiler - GM-only content
> Quote - Standard blockquote
```

---

## 🏗️ Schema Design for Future Compatibility

### Content Storage Strategy

**Option A: Dual Storage (Recommended)**
```prisma
model RpgWorldWiki {
  // Primary content (always Markdown)
  content       String @db.Text // Markdown

  // Metadata for format tracking
  metadata Json @default("{}") @db.JsonB
  // metadata.sourceFormat: 'markdown' | 'bbcode' | 'world_anvil'
  // metadata.worldAnvilId: 'article-123' (if imported from WA)
  // metadata.lastSyncedAt: timestamp
}
```

**Option B: Format Field (Alternative)**
```prisma
model RpgWorldWiki {
  content       String @db.Text
  contentFormat String @default("markdown") // 'markdown' | 'bbcode'

  // For bi-directional sync
  worldAnvilArticleId String? @unique
  lastSyncedWithWA    DateTime?
}
```

**Decision**: Use Option A (metadata JSON) for flexibility

---

## 🔄 World Anvil Sync Architecture (Future)

### Sync Flow

```typescript
// 1. Import from World Anvil
async function syncFromWorldAnvil(userId: string) {
  // Get user's WA token
  const waToken = await getWorldAnvilToken(userId);

  // Fetch articles from WA API
  const articles = await fetchWorldAnvilArticles(waToken);

  for (const article of articles) {
    // Convert BBCode → Markdown
    const markdown = await convertBBCodeToMarkdown(article.content);

    // Upsert wiki page
    await prisma.rpgWorldWiki.upsert({
      where: {
        worldId_slug: {
          worldId: world.id,
          slug: slugify(article.title)
        }
      },
      create: {
        worldId: world.id,
        slug: slugify(article.title),
        title: article.title,
        content: markdown,
        category: mapWACategory(article.category),
        metadata: {
          sourceFormat: 'world_anvil',
          worldAnvilId: article.id,
          lastSyncedAt: new Date().toISOString()
        },
        authorId: userId
      },
      update: {
        content: markdown,
        metadata: {
          lastSyncedAt: new Date().toISOString()
        }
      }
    });
  }
}

// 2. Export to World Anvil
async function syncToWorldAnvil(wikiPageId: string) {
  const page = await prisma.rpgWorldWiki.findUnique({
    where: { id: wikiPageId }
  });

  // Convert Markdown → BBCode
  const bbcode = await convertMarkdownToBBCode(page.content);

  // Push to WA API
  await updateWorldAnvilArticle(page.metadata.worldAnvilId, {
    title: page.title,
    content: bbcode
  });
}
```

---

## 🛠️ Conversion Library Design

### Converter Interface

```typescript
// src/lib/content-converter.ts

export interface ContentConverter {
  toBBCode(markdown: string): string;
  toMarkdown(bbcode: string): string;
  toHTML(markdown: string): string;
}

export class WorldAnvilConverter implements ContentConverter {
  // Markdown → BBCode
  toBBCode(markdown: string): string {
    // Convert standard markdown
    let bbcode = markdown
      .replace(/^# (.*$)/gm, '[h1]$1[/h1]')
      .replace(/^## (.*$)/gm, '[h2]$1[/h2]')
      .replace(/^### (.*$)/gm, '[h3]$1[/h3]')
      .replace(/\*\*(.*?)\*\*/g, '[b]$1[/b]')
      .replace(/\*(.*?)\*/g, '[i]$1[/i]')
      .replace(/\[(.*?)\]\((.*?)\)/g, '[url=$2]$1[/url]');

    // Convert Crit-Fumble extensions → WA tags
    bbcode = bbcode
      .replace(/\[\[article:(.*?)\]\]/g, '[article:$1]')
      .replace(/::: section (.*?)$/gm, '[section:$1]')
      .replace(/::: spoiler$/gm, '[spoiler]');

    return bbcode;
  }

  // BBCode → Markdown
  toMarkdown(bbcode: string): string {
    let markdown = bbcode
      .replace(/\[h1\](.*?)\[\/h1\]/g, '# $1')
      .replace(/\[h2\](.*?)\[\/h2\]/g, '## $1')
      .replace(/\[h3\](.*?)\[\/h3\]/g, '### $1')
      .replace(/\[b\](.*?)\[\/b\]/g, '**$1**')
      .replace(/\[i\](.*?)\[\/i\]/g, '*$1*')
      .replace(/\[url=(.*?)\](.*?)\[\/url\]/g, '[$2]($1)');

    // Convert WA tags → Crit-Fumble extensions
    markdown = markdown
      .replace(/\[article:(.*?)\]/g, '[[article:$1]]')
      .replace(/\[section:(.*?)\]/g, '::: section $1')
      .replace(/\[spoiler\]/g, '::: spoiler');

    return markdown;
  }

  // Markdown → HTML (for display)
  toHTML(markdown: string): string {
    // Use marked library
    return marked(markdown);
  }
}
```

---

## 📊 Migration Path

### Phase 1: Basic Wiki (Now - March 2026)
- ✅ Markdown only
- ✅ GM/Player content separation
- ✅ Basic CRUD operations
- ✅ Revision history

### Phase 2: World Anvil Import (Q2 2026)
- ⏳ BBCode → Markdown converter
- ⏳ Import WA articles (one-time)
- ⏳ Map WA categories to our categories
- ⏳ Preserve WA article IDs in metadata

### Phase 3: Bi-Directional Sync (Q3 2026)
- ⏳ Markdown → BBCode converter
- ⏳ Push changes to World Anvil
- ⏳ Pull changes from World Anvil
- ⏳ Conflict resolution
- ⏳ Sync scheduling

### Phase 4: Advanced Features (Q4 2026+)
- ⏳ World Anvil widgets (timelines, maps)
- ⏳ Article linking
- ⏳ Image sync
- ⏳ Template support

---

## 🎨 Content Format Examples

### Current (Markdown)

```markdown
# The City of Greyhawk

> A bustling metropolis on the edge of the Nyr Dyv.

## Geography

The city is divided into several districts:
- [[article:old-city|Old City]] - The historic center
- [[article:river-quarter|River Quarter]] - Trade district

::: spoiler
## GM Secret
The Thieves' Guild is secretly run by [[article:lord-robilar|Lord Robilar]].
:::
```

### Future (World Anvil BBCode)

```bbcode
[h1]The City of Greyhawk[/h1]

[quote]A bustling metropolis on the edge of the Nyr Dyv.[/quote]

[section:Geography]
The city is divided into several districts:
[ul]
[li][article:old-city]Old City[/article] - The historic center[/li]
[li][article:river-quarter]River Quarter[/article] - Trade district[/li]
[/ul]
[/section]

[spoiler]
[h2]GM Secret[/h2]
The Thieves' Guild is secretly run by [article:lord-robilar]Lord Robilar[/article].
[/spoiler]
```

---

## 🔐 World Anvil API Access

### Prerequisites

**World Anvil API**:
- Requires World Anvil account
- OAuth authentication (already implemented)
- API endpoint: `https://www.worldanvil.com/api/v1/`

### API Endpoints Needed

```typescript
// Fetch user's worlds
GET /api/v1/user/worlds

// Fetch articles from world
GET /api/v1/world/{worldId}/articles

// Get specific article
GET /api/v1/article/{articleId}

// Create article
POST /api/v1/world/{worldId}/article

// Update article
PUT /api/v1/article/{articleId}
```

### Authentication

Already have World Anvil OAuth:
```prisma
model CritUser {
  worldAnvilId           String?
  worldAnvilUsername     String?
  worldAnvilToken        String? // Encrypted
  worldAnvilRefreshToken String? // Encrypted
  worldAnvilTokenExpires DateTime?
}
```

---

## 🎯 Current Implementation Plan

### Step 1: Basic Wiki (This Week)

**Build**:
- ✅ Schema complete
- ⏳ API routes for CRUD
- ⏳ Markdown parsing (using `marked`)
- ⏳ Unit tests

**No World Anvil integration yet** - just basic wiki functionality

### Step 2: Markdown Renderer (This Week)

```typescript
// src/lib/markdown-renderer.ts

import { marked } from 'marked';

export function renderMarkdown(content: string): string {
  // Configure marked for security
  marked.setOptions({
    headerIds: false,
    mangle: false
  });

  // Render markdown
  let html = marked(content);

  // Process Crit-Fumble extensions
  html = processWikiLinks(html);
  html = processSpoilers(html);

  return html;
}

function processWikiLinks(html: string): string {
  // Convert [[article:slug]] to <a href="/worlds/{worldId}/wiki/{slug}">
  return html.replace(
    /\[\[article:(.*?)\]\]/g,
    '<a href="#" data-article="$1">$1</a>'
  );
}

function processSpoilers(html: string): string {
  // Convert ::: spoiler to <details> tag
  return html.replace(
    /::: spoiler/g,
    '<details class="gm-spoiler"><summary>GM Only</summary>'
  );
}
```

### Step 3: Future - World Anvil Converter (Q2 2026)

```typescript
// src/lib/world-anvil-converter.ts

export class WorldAnvilConverter {
  // Will be implemented in Q2 2026
  async importArticle(articleId: string): Promise<RpgWorldWiki> {
    // Fetch from WA API
    // Convert BBCode → Markdown
    // Store in database
  }

  async exportArticle(wikiPageId: string): Promise<void> {
    // Load from database
    // Convert Markdown → BBCode
    // Push to WA API
  }
}
```

---

## 📝 Summary

**Current Scope (Now)**:
- ✅ Markdown-only wiki
- ✅ GM/Player content separation
- ✅ Basic CRUD operations
- ✅ Simple markdown rendering

**Future Scope (Q2-Q4 2026)**:
- ⏳ BBCode ↔ Markdown conversion
- ⏳ World Anvil import
- ⏳ Bi-directional sync
- ⏳ Advanced WA widgets

**Design Decisions**:
- Store everything as Markdown internally
- Use metadata.sourceFormat to track origin
- Build converter layer for World Anvil BBCode
- Keep schema flexible for future sync features

---

**Status**: 📋 **Design Complete**
**Implementation**: ⏳ **Basic Wiki First, WA Integration Later**
**Timeline**: Basic Wiki (Now) → WA Import (Q2 2026) → Bi-directional Sync (Q3 2026)

**Last Updated**: November 24, 2025
