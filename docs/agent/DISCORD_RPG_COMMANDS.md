# Discord RPG Commands Integration

**Date**: 2025-11-27
**Status**: ✅ Complete

## Overview

Created Discord slash commands that directly invoke MCP server tools, providing users with access to Core Concepts RPG data and AI-powered features through a unified interface.

## Architecture

```
Discord User
    ↓ (/rpg command)
Discord Command Handler
    ↓
FumbleBot MCP Server (internal call)
    ↓
CoreConceptsClient / AIService
    ↓
Database / AI APIs
```

**Key Benefit**: Discord commands and AI agents use **identical MCP tools**, ensuring consistency and reducing code duplication.

## Commands Implemented

### `/rpg systems [core-only]`

**Purpose**: List all available RPG systems

**Options**:
- `core-only` (optional): Only show core/featured systems

**Example Output**:
```
📚 Core RPG Systems
Found 3 systems

⭐ D&D 5e
ID: dnd5e
Version: 5.2.0
Platforms: Foundry VTT, Roll20

⭐ Pathfinder 2e
ID: pf2e
Version: 2.4.0
Platforms: Foundry VTT

⭐ Cypher System
ID: cyphersystem
Version: 1.5.0
Platforms: Foundry VTT
```

**MCP Tool Used**: `rpg_list_systems`

---

### `/rpg creature <name> [limit]`

**Purpose**: Search for creatures/monsters by name

**Options**:
- `name` (required): Creature name to search for
- `limit` (optional): Maximum results (1-10, default: 5)

**Example Usage**:
```
/rpg creature name:dragon limit:3
```

**Example Output**:
```
🐉 Creature Search: "dragon"
Found 3 creatures

Adult Red Dragon
Type: Dragon | CR: 17 | Size: Huge
Alignment: Chaotic Evil
A massive dragon with crimson scales that gleam like molten
lava. Its eyes burn with ancient malice...
ID: abc123...

Young Brass Dragon
Type: Dragon | CR: 6 | Size: Large
Alignment: Chaotic Good
A smaller dragon with metallic brass scales. Known for their
love of conversation and desert environments...
ID: def456...
```

**MCP Tool Used**: `rpg_search_creatures`

**Features**:
- Case-insensitive search
- Returns stats: CR, size, alignment, type
- Shows description preview
- Includes creature ID for detailed lookups

---

### `/rpg location <name> [limit]`

**Purpose**: Search for locations (worlds, dungeons, cities, planes)

**Options**:
- `name` (required): Location name to search for
- `limit` (optional): Maximum results (1-10, default: 5)

**Example Usage**:
```
/rpg location name:waterdeep
```

**Example Output**:
```
🗺️ Location Search: "waterdeep"
Found 1 location

City of Splendors - Waterdeep
Type: city | Scale: Settlement
The jewel of the Sword Coast, Waterdeep is a bustling
metropolis of commerce, intrigue, and adventure. Home to
powerful guilds, noble families, and the legendary...
ID: xyz789...
```

**MCP Tool Used**: `rpg_search_locations`

**Features**:
- Searches both name and title fields
- Shows location type and scale (28 scale levels from "Interaction" to "Universe")
- Description preview
- Hierarchical location support

---

### `/rpg lookup <query> [system]`

**Purpose**: AI-powered rules lookup using Claude Haiku

**Options**:
- `query` (required): Rule question to look up
- `system` (optional): Game system (choices: D&D 5e, Pathfinder 2e, Cypher System, Call of Cthulhu)

**Example Usage**:
```
/rpg lookup query:"How does advantage work?" system:"D&D 5e"
```

**Example Output**:
```
📖 Rules Lookup: D&D 5e
Query: How does advantage work?

Answer:
Advantage allows you to roll two d20s instead of one and take
the higher result. This applies to attack rolls, ability checks,
and saving throws. You can't benefit from advantage multiple
times on the same roll - it's binary (you either have it or you
don't). Common sources include: Help action, flanking (optional
rule), certain spells/abilities, and environmental conditions
favoring the character.

Powered by Claude AI
```

**MCP Tool Used**: `anthropic_lookup_rule`

**Features**:
- Fast, accurate AI responses using Claude Haiku
- Context-aware (knows the specific game system)
- Concise, actionable answers
- Perfect for quick rules clarification during gameplay

---

## Implementation Details

### File Structure

```
src/packages/fumblebot/src/discord/commands/
├── slash/
│   ├── rpg.ts         ← New: RPG commands
│   ├── dice.ts
│   ├── ai.ts
│   ├── foundry.ts
│   └── ...
└── registry.ts        ← Updated: Registered RPG commands
```

### Key Code Patterns

**1. MCP Server Initialization**:
```typescript
import { FumbleBotMCPServer } from '../../../mcp/fumblebot-server.js';
import { PrismaClient } from '@crit-fumble/core-concepts-api';

const prisma = new PrismaClient();
const mcpServer = new FumbleBotMCPServer(prisma);
```

**2. Calling MCP Tools Directly**:
```typescript
// Instead of duplicating logic, call MCP tool
const result = await (mcpServer as any).searchCreatures({
  query: name,
  limit
});
const creatures = JSON.parse(result.content[0].text);
```

**3. Rich Discord Embeds**:
```typescript
const embed = new EmbedBuilder()
  .setColor(0xff0000)
  .setTitle(`🐉 Creature Search: "${name}"`)
  .setDescription(`Found ${creatures.length} creatures`)
  .addFields(/* creature data */)
  .setTimestamp();
```

### Error Handling

All commands include:
- Try-catch blocks for graceful error handling
- User-friendly error messages
- Console logging for debugging
- Deferred replies for long-running operations

**Example**:
```typescript
try {
  await interaction.deferReply();
  // ... MCP tool call
  await interaction.editReply({ embeds: [embed] });
} catch (error) {
  console.error('Error in /rpg creature:', error);
  await interaction.editReply({
    content: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
  });
}
```

## Benefits

### For Users
- **No context switching**: Access RPG data directly in Discord
- **Rich formatting**: Embeds with colors, emojis, structured fields
- **AI assistance**: Instant rules lookup without leaving Discord
- **Consistent data**: Same database as web platform

### For Developers
- **Code reuse**: MCP tools shared between Discord and AI agents
- **Type safety**: Full TypeScript support end-to-end
- **Easy maintenance**: Single source of truth for business logic
- **Testable**: MCP tools can be tested independently

### For AI Agents
- **Identical interface**: AI agents can call the same MCP tools
- **Structured data**: JSON responses for easy parsing
- **Extensible**: New tools automatically available to both Discord and AI

## Database Schema Used

The commands query these Core Concepts tables:

- **RpgSystem**: Game systems (D&D 5e, Pathfinder, etc.)
- **RpgCreature**: Monsters, NPCs, player characters
- **RpgLocation**: Worlds, planes, dungeons, cities
- **RpgAttribute**: Stats, skills, resources (future use)

See `packages/core-concepts-api/prisma/schema.prisma` for full schema.

## Usage Examples

### GM During Game Session
```
Player: "I want to attack the dragon with advantage"
GM: /rpg lookup query:"advantage rules"
[Claude provides instant explanation]

Player: "What's the dragon's AC?"
GM: /rpg creature name:"adult red dragon"
[Shows full stat block]
```

### World Building
```
DM: /rpg location name:"shadowfell"
[Shows planar information]

DM: /rpg systems
[Sees all available systems for campaign setup]
```

### New Players
```
New Player: /rpg lookup query:"What is armor class?" system:"D&D 5e"
[Gets beginner-friendly explanation]
```

## Future Enhancements

### Phase 1 (Near-term)
- [ ] `/rpg spell <name>` - Search for spells
- [ ] `/rpg item <name>` - Search for magic items
- [ ] `/rpg class <name>` - Search for character classes
- [ ] `/rpg feat <name>` - Search for feats

### Phase 2 (Advanced)
- [ ] Autocomplete for creature/location names
- [ ] Pagination for large result sets
- [ ] Detail view: `/rpg creature-detail <id>`
- [ ] Favorites: Save frequently used creatures/locations
- [ ] Comparison: `/rpg compare <creature1> <creature2>`

### Phase 3 (AI-Enhanced)
- [ ] `/rpg generate encounter` - AI-generated encounters
- [ ] `/rpg generate npc` - AI-generated NPCs
- [ ] `/rpg dm-assist <scenario>` - AI DM suggestions
- [ ] Semantic search: "Find fire-immune creatures"

## Testing

To test the commands:

```bash
# 1. Build FumbleBot
cd src/packages/fumblebot
npm run build

# 2. Set environment variables
export DATABASE_URL="postgresql://..."
export DISCORD_TOKEN="..."
export ANTHROPIC_API_KEY="..."

# 3. Start bot
npm start

# 4. In Discord, use commands:
/rpg systems
/rpg creature name:goblin
/rpg location name:waterdeep
/rpg lookup query:"grapple rules"
```

## Dependencies

**New**:
- `@crit-fumble/core-concepts-api` (workspace package)
- Uses existing `@anthropic-ai/sdk` for AI lookups

**Updated**:
- `src/packages/fumblebot/package.json` - Added Core Concepts API dependency
- `src/packages/fumblebot/src/discord/commands/registry.ts` - Registered RPG commands

## Permissions

All `/rpg` commands:
- **Guild-only**: Cannot be used in DMs (`setDMPermission(false)`)
- **Public**: All server members can use (no special permissions required)
- **Rate-limited**: Discord's built-in rate limiting applies

## Files Modified/Created

### Created:
- `src/packages/fumblebot/src/discord/commands/slash/rpg.ts`
- `DISCORD_RPG_COMMANDS.md` (this file)

### Modified:
- `src/packages/fumblebot/src/discord/commands/registry.ts`

## Summary

Discord users now have direct access to:
- **RPG System Database**: Browse all supported systems
- **Creature/Monster Data**: Search by name, view stats
- **Location Database**: Worlds, dungeons, cities, planes
- **AI Rules Lookup**: Claude-powered instant answers

All powered by the same MCP tools that AI agents use, ensuring consistency and maintainability across the platform.

---

**Next Steps**: Add spell, item, class, and feat commands for complete RPG data coverage in Discord.
