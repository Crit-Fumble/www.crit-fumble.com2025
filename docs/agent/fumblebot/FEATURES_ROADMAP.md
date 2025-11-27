# FumbleBot Features Roadmap

Complete overview of all FumbleBot features, including implemented and upcoming functionality.

## ✅ Core Features (Implemented)

### Discord Bot
- ✅ Discord.js v14 integration
- ✅ Slash command system
- ✅ Message commands
- ✅ Button/Select menu handlers
- ✅ Autocomplete support
- ✅ Permission management

### Database
- ✅ Prisma ORM with PostgreSQL
- ✅ Separate FumbleBot database
- ✅ Guild/member tracking
- ✅ Session management
- ✅ Dice roll history
- ✅ Command analytics

### AI Integration
- ✅ OpenAI integration
- ✅ Anthropic Claude integration
- ✅ AI service abstraction
- ✅ Scripted behavior system
- ✅ Dialogue trees
- ✅ Random tables
- ✅ Cached rules

---

## 🎙️ Voice Integration (Stubbed - Phase 1)

### Voice Client
**Location:** `src/discord/voice/`

- ✅ Join/leave voice channels
- ✅ Audio playback from URLs, files, buffers
- ✅ Connection management
- ✅ Playback queue system
- ⏸️ RPG asset sound effects
- ⏸️ Volume control
- ⏸️ Music streaming

### Voice Commands
- ✅ `/voice join` - Join voice channel
- ✅ `/voice leave` - Leave voice channel
- ✅ `/voice status` - Check connection
- ⏸️ `/voice play <asset>` - Play sound effect
- ✅ `/voice stop` - Stop playback

### RPG Asset Integration
- ⏸️ Database query for sound assets
- ⏸️ Tag-based asset filtering (`sound`, `music`, `ambient`)
- ⏸️ Autocomplete for asset selection
- ⏸️ Sound effect playback from Crit-Fumble CDN

**Requirements:**
```bash
npm install @discordjs/voice
```

**Documentation:** [voice/README.md](src/discord/voice/README.md)

---

## 📅 Discord Events (Stubbed - Phase 1)

### Event Manager
**Location:** `src/discord/events/event-manager.ts`

- ✅ Monitor Discord scheduled events
- ✅ Detect event start/end/cancel
- ✅ 5-minute pre-event warnings
- ⏸️ Auto-start Foundry VTT instances
- ⏸️ Auto-join voice channels
- ⏸️ Send event notifications
- ⏸️ Database persistence

### Event Actions
```typescript
{
  eventId: string;
  guildId: string;
  action: 'start-foundry' | 'start-voice' | 'send-notification';
  metadata: {
    worldId?: string;
    channelId?: string;
    message?: string;
  }
}
```

### Use Case
```
1. GM creates Discord event "D&D Session @ 7pm"
2. FumbleBot registers action to start Foundry instance
3. 6:55pm - Bot sends "Starting in 5 minutes" message
4. 7:00pm - Bot starts Foundry, joins voice, sends game link
5. Players join and start playing immediately
```

---

## 🎮 Discord Activities (Stubbed - Phase 1)

### Activity Server
**Location:** `src/discord/activity/`

Embedded web applications that run within Discord.

#### Available Activities

1. **Dice Roller** (`/discord/activity/dice`)
   - ✅ Basic HTML UI
   - ⏸️ Real-time synchronization
   - ⏸️ Roll history
   - ⏸️ Custom dice notation

2. **Character Sheet** (`/discord/activity/character/:id`)
   - ✅ Route stub
   - ⏸️ Character data from database
   - ⏸️ Edit attributes
   - ⏸️ Resource tracking (HP, spell slots)

3. **Map Viewer** (`/discord/activity/map`)
   - ✅ Route stub
   - ⏸️ Upload/display maps
   - ⏸️ Token placement
   - ⏸️ Annotations and measurements

4. **Initiative Tracker** (`/discord/activity/initiative`)
   - ✅ Route stub
   - ⏸️ Turn order management
   - ⏸️ HP/condition tracking
   - ⏸️ Real-time sync across party

5. **Spell Lookup** (`/discord/activity/spells`)
   - ✅ Route stub
   - ⏸️ Spell database integration
   - ⏸️ Filter by class/level
   - ⏸️ Upcast calculations

### Server
```typescript
const activityServer = new ActivityServer({
  port: 8080,
  publicUrl: 'https://fumblebot.crit-fumble.com'
});

await activityServer.start();
```

**Documentation:** [DISCORD_ACTIVITIES.md](DISCORD_ACTIVITIES.md)

---

## 🖱️ App Commands (Context Menu) (Stubbed - Phase 1)

### Message Commands
**Location:** `src/discord/commands/context/app-commands.ts`

Right-click on messages:

1. **Roll Dice from Message**
   - ✅ Extract dice notation
   - ✅ Roll automatically
   - ✅ Show results

2. **Save as Campaign Note**
   - ✅ Command stub
   - ⏸️ Database integration

3. **Add to Session Log**
   - ✅ Command stub
   - ⏸️ Session log system

4. **Parse Character Stats**
   - ✅ Command stub
   - ⏸️ AI-powered stat extraction

### User Commands

Right-click on users:

1. **View Characters**
   - ✅ Command stub
   - ⏸️ Character list from database

2. **View Dice Statistics**
   - ✅ Command stub
   - ⏸️ Dice stats from database

3. **Award Crit-Coins** (Moderators)
   - ✅ Command stub
   - ⏸️ Crit-Coin transaction system

4. **Check Gaming Activity**
   - ✅ Command stub
   - ⏸️ Activity stats from database

---

## 🎲 Foundry VTT Integration (POC Complete)

### Foundry Client
**Location:** `src/foundry/`

- ✅ HTTP client for Foundry API
- ✅ Health check / connectivity
- ✅ Screenshot capture (Playwright)
- ⏸️ Chat read/write
- ⏸️ Authentication

### Foundry Commands
- ✅ `/foundry test` - Test connection
- ✅ `/foundry screenshot` - Capture screenshots
- ⏸️ `/foundry start <world>` - Start instance
- ⏸️ `/foundry stop <world>` - Stop instance
- ⏸️ `/foundry status` - Instance status
- ⏸️ `/foundry chat <message>` - Send chat

### Foundry Module
**Location:** `src/modules/foundry-fumblebot/`

- ✅ Module manifest (v0.1.0)
- ✅ Socket.io ready
- ⏸️ REST API endpoints
- ⏸️ Bot user account creation
- ⏸️ API key authentication

**Documentation:** [FOUNDRY_FUMBLEBOT_POC.md](../../FOUNDRY_FUMBLEBOT_POC.md)

---

## 🛠️ Core Concepts Integration

### Core Concepts Module
**Location:** `src/modules/foundry-core-concepts/`

- ✅ System-agnostic TTRPG framework
- ✅ MIT + CC BY 4.0 licensed
- ✅ Socket.io integration
- ✅ Optional API sync

### Features
- Unified attribute system
- Type system for entities
- Dice, tables, books
- Cards, boards, tokens
- Events, goals, sessions

**Should it be included?**
- ✅ Keep as **optional** per RPG system
- ✅ Inject via Docker volume mount
- ✅ Configure in RPG Systems UI

---

## 📊 Database Schema (TODO)

### New Tables Needed

#### FumbleBot Event Actions
```sql
CREATE TABLE fumblebot_event_actions (
  id UUID PRIMARY KEY,
  event_id VARCHAR(255) NOT NULL,
  guild_id VARCHAR(255) NOT NULL,
  action VARCHAR(50) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);
```

#### Voice Sessions
```sql
CREATE TABLE fumblebot_voice_sessions (
  id UUID PRIMARY KEY,
  guild_id VARCHAR(255) NOT NULL,
  channel_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  duration_seconds INTEGER
);
```

#### Activity Sessions
```sql
CREATE TABLE fumblebot_activity_sessions (
  id UUID PRIMARY KEY,
  guild_id VARCHAR(255) NOT NULL,
  channel_id VARCHAR(255) NOT NULL,
  activity_type VARCHAR(50) NOT NULL,
  state JSONB,
  participants JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP
);
```

#### Campaign Notes
```sql
CREATE TABLE fumblebot_campaign_notes (
  id UUID PRIMARY KEY,
  guild_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  message_id VARCHAR(255),
  content TEXT NOT NULL,
  tags VARCHAR(50)[],
  created_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);
```

---

## 🚀 Implementation Phases

### Phase 1: Voice & Events (Next)
1. Add `@discordjs/voice` dependency
2. Implement RPG asset database queries
3. Complete voice command handlers
4. Implement event manager database persistence
5. Integrate with Foundry server API

### Phase 2: Activities
1. Deploy activity server to production
2. Register activities in Discord
3. Implement Discord Activity SDK
4. Build interactive frontends (React/Vue)
5. Add real-time synchronization

### Phase 3: App Commands
1. Register context menu commands
2. Implement database queries
3. Build AI stat parser
4. Integrate Crit-Coin system
5. Add audit logging

### Phase 4: Foundry Deep Integration
1. Complete Foundry module REST API
2. Implement bot user accounts
3. Add event hooks (combat, scenes, chat)
4. Real-time notifications to Discord
5. Bidirectional WebSocket communication

---

## 📝 Files Created

### Voice Integration
- ✅ `src/discord/voice/client.ts`
- ✅ `src/discord/voice/types.ts`
- ✅ `src/discord/voice/sound-service.ts`
- ✅ `src/discord/voice/index.ts`
- ✅ `src/discord/voice/README.md`
- ✅ `src/discord/commands/slash/voice.ts`

### Event Management
- ✅ `src/discord/events/event-manager.ts`

### Discord Activities
- ✅ `src/discord/activity/server.ts`
- ✅ `src/discord/activity/types.ts`
- ✅ `src/discord/activity/index.ts`
- ✅ `DISCORD_ACTIVITIES.md`

### App Commands
- ✅ `src/discord/commands/context/app-commands.ts`

### UI Integration
- ✅ Updated `src/components/organisms/FumbleBotSettingsForm.tsx`
  - Voice enabled toggle
  - Default volume slider

---

## 🎯 Next Steps

1. **Add Dependencies**
   ```bash
   npm install @discordjs/voice express
   ```

2. **Register Commands**
   - Voice commands (`/voice`)
   - App commands (context menu)

3. **Deploy Activity Server**
   - Set up reverse proxy
   - Configure SSL
   - Register in Discord Developer Portal

4. **Implement Database Queries**
   - RPG asset lookup
   - Event action persistence
   - Activity session management

5. **Test End-to-End**
   - Voice integration with sound effects
   - Event auto-start for Foundry
   - Activities in Discord client
   - Context menu commands

---

## 📚 Documentation

- [Voice Integration](src/discord/voice/README.md)
- [Discord Activities & App Commands](DISCORD_ACTIVITIES.md)
- [Foundry Integration POC](../../FOUNDRY_FUMBLEBOT_POC.md)
- [Deployment Guide](DEPLOYMENT.md)

---

## 🤝 Contributing

All features are stubbed and ready for implementation! Check the TODO comments in each file for specific next steps.

**Key Areas:**
- Database integration (Prisma queries)
- Discord Activity SDK integration
- AI-powered features
- Real-time synchronization
- Frontend development (React/Vue)

Ready to make FumbleBot the best TTRPG Discord bot ever! 🎲🎉
