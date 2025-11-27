# MCP Server + Core Concepts Integration

**Date**: 2025-11-27
**Status**: ✅ Complete

## Overview

Enhanced the FumbleBot MCP server to expose both **Anthropic Claude** models and **Core Concepts RPG data** as tools for AI agents and Discord commands.

## What Was Built

### 1. Enhanced MCP Server with Anthropic Support

**File**: `src/packages/fumblebot/src/mcp/fumblebot-server.ts`

#### New Anthropic Tools Added:

- **`anthropic_chat`**: Chat with Claude Sonnet or Haiku for general AI assistance
- **`anthropic_dm_response`**: Generate Dungeon Master responses for TTRPG scenarios
- **`anthropic_lookup_rule`**: Fast rules lookup using Claude Haiku

#### Updated OpenAI Tools:

- **`openai_chat`**: General GPT-4o chat completion
- **`openai_generate_dungeon`**: Structured dungeon generation with function calling
- **`openai_generate_encounter`**: Combat encounter generation

All AI tools now use the existing `AIService` from `src/packages/fumblebot/src/ai/service.ts`, providing consistent interfaces for both Anthropic and OpenAI models.

### 2. Core Concepts Client

**Files Created**:
- `src/packages/fumblebot/src/core-concepts/client.ts`
- `src/packages/fumblebot/src/core-concepts/index.ts`

**Purpose**: TypeScript client for accessing Core Concepts RPG data from the database.

**Capabilities**:
- Query RPG systems (D&D 5e, Pathfinder, Cypher, etc.)
- Search creatures/monsters with stats and abilities
- Search locations (worlds, planes, dungeons, cities)
- Get system attributes (stats, skills, resources)

### 3. Core Concepts MCP Tools

Added 7 new tools to the MCP server:

| Tool | Description |
|------|-------------|
| `rpg_list_systems` | List all available RPG systems |
| `rpg_get_system` | Get detailed info about a specific RPG system by systemId |
| `rpg_search_creatures` | Search for creatures/monsters by name |
| `rpg_get_creature` | Get detailed creature information by ID |
| `rpg_search_locations` | Search for locations by name |
| `rpg_get_location` | Get detailed location information by ID |
| `rpg_get_system_attributes` | Get attributes for a specific RPG system |

## Architecture

### Tool Categories in MCP Server

```
FumbleBot MCP Server
├── foundry_*    → Foundry VTT operations (screenshots, chat)
├── anthropic_*  → Claude models (Sonnet, Haiku)
├── openai_*     → OpenAI models (GPT-4o, DALL-E)
├── rpg_*        → Core Concepts RPG data
└── fumble_*     → FumbleBot utilities (dice, NPC, lore)
```

### Data Flow

```
AI Agent / Discord Command
    ↓ (MCP protocol / direct call)
FumbleBot MCP Server
    ↓
CoreConceptsClient
    ↓ (Prisma)
Core Concepts Database
    ↓
RpgSystem, RpgCreature, RpgLocation, RpgAttribute tables
```

### Integration Points

1. **MCP Server Constructor**: Accepts optional `PrismaClient` parameter
   ```typescript
   constructor(prisma?: PrismaClient)
   ```

2. **Core Concepts Client**: Initialized only when Prisma is provided
   ```typescript
   if (prisma) {
     this.coreConceptsClient = new CoreConceptsClient({ prisma });
   }
   ```

3. **Tool Handler**: Routes `rpg_*` tools to Core Concepts client
   ```typescript
   if (name.startsWith('cc_') || name.startsWith('rpg_')) {
     return await this.handleCoreConceptsTool(name, args);
   }
   ```

## Example Usage

### From MCP Client (Claude, VS Code, etc.)

```json
{
  "tool": "rpg_list_systems",
  "arguments": {
    "coreOnly": true
  }
}
```

**Response**:
```json
[
  {
    "id": "...",
    "systemId": "dnd5e",
    "name": "D&D 5e",
    "title": "Dungeons & Dragons 5th Edition",
    "description": "...",
    "version": "5.2.0",
    "isCore": true,
    "isEnabled": true
  },
  ...
]
```

### Search for Creatures

```json
{
  "tool": "rpg_search_creatures",
  "arguments": {
    "query": "dragon",
    "limit": 5
  }
}
```

**Response**: Array of creature objects with stats, abilities, CR, size, alignment.

### Get System Attributes

```json
{
  "tool": "rpg_get_system_attributes",
  "arguments": {
    "systemName": "D&D 5e"
  }
}
```

**Response**: Array of attributes (Strength, Dexterity, HP, AC, etc.) with types and constraints.

## Database Schema

### Core Tables Accessed

**RpgSystem**:
- `systemId`: Unique identifier (e.g., "dnd5e", "pf2e")
- `name`, `title`, `description`
- `platforms`: JSON with Foundry VTT, Roll20 data
- `isEnabled`, `isCore`: Flags for system availability

**RpgCreature**:
- `name`, `creatureType`, `description`
- `stats`: JSON with abilities, AC, HP, CR
- `abilities`: Array of special abilities
- Supports search by name (case-insensitive)

**RpgLocation**:
- `name`, `title`, `description`
- `locationType`: underground, city, plane, etc.
- `locationScale`: 28 scales from "Interaction" to "Universe"
- `parentLocationId`: Hierarchical relationships

**RpgAttribute**:
- `systemName`: Links to RPG system
- `name`, `title`, `category`
- `dataType`: number, string, boolean, json
- `minValue`, `maxValue`: Constraints

## Dependencies Updated

**`src/packages/fumblebot/package.json`**:
```json
"dependencies": {
  "@crit-fumble/core-concepts-api": "workspace:*",
  ...
}
```

This links FumbleBot to the Core Concepts API package in the monorepo.

## Future Enhancements

### Phase 1 (Immediate)
- [ ] Add Discord slash commands that call MCP tools directly
  - `/rpg systems` → List RPG systems
  - `/rpg creature <name>` → Search for creature
  - `/rpg lookup <rule>` → Rules lookup via Anthropic

### Phase 2 (Near-term)
- [ ] Add more Core Concepts tools:
  - `rpg_search_spells`: Search for spells by name/level/school
  - `rpg_search_items`: Search for magic items and equipment
  - `rpg_search_classes`: Search for character classes and features
  - `rpg_search_feats`: Search for feats and abilities

### Phase 3 (Advanced)
- [ ] Semantic search using embeddings
  - "Find creatures vulnerable to fire"
  - "Show me spells that control the weather"
- [ ] Cross-system comparisons
  - "Compare fireball in D&D 5e vs Pathfinder 2e"
- [ ] AI-enhanced lookups
  - Combine database results with Claude for interpretation
  - "Explain how advantage works" → DB lookup + Claude explanation

## Benefits

### For AI Agents
- Direct access to structured RPG data without hallucination
- Fast lookups for rules, creatures, and game mechanics
- Integration with Claude and GPT models for enhanced responses

### For Discord Users
- Accurate creature stats and rules lookups
- No need to switch between platforms
- Real-time access to Core Concepts database

### For Developers
- Unified tool interface (MCP protocol)
- Type-safe client with Prisma
- Reusable tools across AI agents and Discord commands
- Clean separation of concerns (data access, AI logic, Discord UI)

## Testing

To test the MCP server with Core Concepts:

```bash
# Build FumbleBot
cd src/packages/fumblebot
npm run build

# Initialize Prisma client (from core-concepts-api)
cd ../../../packages/core-concepts-api
npx prisma generate

# Run MCP server (requires DATABASE_URL)
cd ../../src/packages/fumblebot
export DATABASE_URL="postgresql://..."
node dist/mcp/fumblebot-server.js
```

## Files Modified/Created

### Created:
- `src/packages/fumblebot/src/core-concepts/client.ts`
- `src/packages/fumblebot/src/core-concepts/index.ts`
- `MCP_CORE_CONCEPTS_INTEGRATION.md` (this file)

### Modified:
- `src/packages/fumblebot/src/mcp/fumblebot-server.ts`
  - Added Anthropic tools (anthropic_chat, anthropic_dm_response, anthropic_lookup_rule)
  - Added Core Concepts tools (rpg_* tools)
  - Integrated CoreConceptsClient
  - Updated constructor to accept Prisma client
  - Refactored to use existing AIService methods
- `src/packages/fumblebot/package.json`
  - Added `@crit-fumble/core-concepts-api` dependency

## Summary

The MCP server now provides a comprehensive toolkit for AI agents and Discord commands:

- **20+ tools** across 5 categories
- **Dual AI providers**: Anthropic (Claude) and OpenAI (GPT)
- **Direct database access**: Core Concepts RPG data
- **Type-safe**: Full TypeScript support
- **Reusable**: Same tools for AI agents and Discord

Next step: Create Discord commands that invoke these MCP tools for seamless user experience.

---

**Ready for Discord command integration and testing.**
