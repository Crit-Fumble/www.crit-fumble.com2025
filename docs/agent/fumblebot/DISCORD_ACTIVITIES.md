
# Discord Activities & App Commands Setup

Complete guide for setting up Discord Activities and App Commands for FumbleBot.

## Overview

### Discord Activities
Embedded web applications that run within Discord. They appear in an iframe and support:
- Real-time collaboration
- Voice channel integration
- Screen sharing
- Rich interactions

### App Commands (Context Menu)
Right-click commands that appear on messages and users for quick actions.

---

## Discord Activities

### Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Discord Client                     │
│                                                      │
│  ┌────────────────────────────────────────────┐   │
│  │         Activity Iframe                     │   │
│  │  https://fumblebot.crit-fumble.com/        │   │
│  │          /discord/activity                  │   │
│  │                                              │   │
│  │  • Dice Roller                              │   │
│  │  • Character Sheets                         │   │
│  │  • Map Viewer                               │   │
│  │  • Initiative Tracker                       │   │
│  └────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
           ↕ WebSocket / HTTP
┌─────────────────────────────────────────────────────┐
│          FumbleBot Activity Server                   │
│          Express.js on port 8080                     │
│                                                      │
│  /discord/activity          - Landing page          │
│  /discord/activity/dice     - Dice roller           │
│  /discord/activity/map      - Map viewer            │
│  /discord/activity/character - Character sheets     │
└─────────────────────────────────────────────────────┘
```

### Setup Steps

#### 1. Register Activity in Discord Developer Portal

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your FumbleBot application
3. Navigate to **Activities** tab
4. Click **Create Activity**
5. Fill in details:
   - **Name:** FumbleBot Tools
   - **Description:** Interactive TTRPG tools for your campaigns
   - **URL Mapping:** `https://fumblebot.crit-fumble.com/discord/activity`
   - **Supported Platforms:** Desktop, Mobile
   - **Age Rating:** Everyone

#### 2. Configure Activity Settings

```json
{
  "name": "FumbleBot Tools",
  "description": "Interactive TTRPG tools",
  "url_mappings": {
    "/": "https://fumblebot.crit-fumble.com/discord/activity"
  },
  "supported_orientations": ["landscape", "portrait"],
  "requires_voice": false,
  "embeds": {
    "width": 800,
    "height": 600
  }
}
```

#### 3. Start Activity Server

```typescript
import { ActivityServer } from './discord/activity';

const activityServer = new ActivityServer({
  port: 8080,
  publicUrl: 'https://fumblebot.crit-fumble.com'
});

await activityServer.start();
```

#### 4. Add Reverse Proxy (Nginx/Caddy)

```nginx
# Nginx config
server {
  listen 443 ssl;
  server_name fumblebot.crit-fumble.com;

  location /discord/activity {
    proxy_pass http://localhost:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

### Available Activities

#### 1. Dice Roller (`/discord/activity/dice`)
- Real-time dice rolling
- Share results with party
- Roll history
- Custom dice notation

**Usage:**
```
/activity start FumbleBot Tools
→ Click "Dice Roller"
→ Roll dice together!
```

#### 2. Character Sheet (`/discord/activity/character/:id`)
- View character stats
- Edit attributes
- Track resources (HP, spell slots)
- Real-time updates

#### 3. Map Viewer (`/discord/activity/map`)
- Share battle maps
- Add tokens and markers
- Measure distances
- Fog of war (GM only)

#### 4. Initiative Tracker (`/discord/activity/initiative`)
- Track turn order
- Manage combat
- Update HP and conditions
- Synchronized across party

#### 5. Spell Lookup (`/discord/activity/spells`)
- Quick spell reference
- Filter by class/level
- Detailed descriptions
- Upcast calculations

### Discord Activity SDK Integration

```html
<!-- In your activity HTML -->
<script src="https://discord.com/assets/embedded-app-sdk.js"></script>
<script>
  const discordSDK = new DiscordSDK(CLIENT_ID);

  await discordSDK.ready();

  // Get current user
  const { user } = await discordSDK.commands.authenticate();

  // Get voice channel participants
  const participants = await discordSDK.commands.getInstanceConnectedParticipants();

  // Send activity update
  await discordSDK.commands.setActivity({
    activity: {
      type: 0, // Playing
      details: "Rolling dice",
      state: "In combat"
    }
  });
</script>
```

---

## App Commands (Context Menu)

### Message Commands

Right-click on any message to access:

#### 1. **Roll Dice from Message**
Automatically finds dice notation (1d20, 2d6+3) in message and rolls them.

```typescript
// Example usage:
User posts: "I attack with my sword! 1d20+5 to hit, 1d8+3 damage"
→ Right-click → "Roll Dice from Message"
→ Bot rolls: 1d20+5 = 18, 1d8+3 = 9
```

#### 2. **Save as Campaign Note**
Saves important messages to campaign notes.

```typescript
// Saves to database for later reference
// Useful for clues, NPC info, quest details
```

#### 3. **Add to Session Log**
Adds message to current session's play-by-play log.

```typescript
// Creates chronological record of session
// Great for session recaps
```

#### 4. **Parse Character Stats**
Uses AI to extract character stats from message.

```typescript
// Example:
User posts: "My character is Thorin, Level 5 Fighter. STR 16, DEX 14, CON 15..."
→ Right-click → "Parse Character Stats"
→ Bot extracts stats and offers to create character sheet
```

### User Commands

Right-click on any user to access:

#### 1. **View Characters**
Shows all characters owned by that user in the server.

#### 2. **View Dice Statistics**
Shows dice rolling stats:
- Total rolls
- Natural 20s and 1s
- Average rolls
- Lucky/unlucky streaks

#### 3. **Award Crit-Coins** (Moderators only)
Award Crit-Coins to players for:
- Great roleplay
- Creative solutions
- Helping others
- Contributing to campaign

#### 4. **Check Gaming Activity**
View user's activity:
- Active campaigns
- Session attendance
- Characters played
- Total playtime

### Register App Commands

```typescript
import { appCommands } from './discord/commands/context/app-commands';

// Register all message commands
for (const command of Object.values(appCommands.message)) {
  await client.application.commands.create(command.data);
}

// Register all user commands
for (const command of Object.values(appCommands.user)) {
  await client.application.commands.create(command.data);
}
```

---

## Implementation Checklist

### Activities
- [x] Activity server with Express
- [x] Landing page with activity list
- [x] Dice roller stub
- [x] Character sheet stub
- [x] Map viewer stub
- [x] Initiative tracker stub
- [x] Spell lookup stub
- [ ] Discord Activity SDK integration
- [ ] Real-time synchronization (WebSocket)
- [ ] Session state management
- [ ] Database persistence

### App Commands
- [x] Message context menu commands
- [x] User context menu commands
- [ ] Register commands in Discord
- [ ] Database integration
- [ ] AI-powered stat parsing
- [ ] Crit-Coin transactions

### Infrastructure
- [ ] Deploy activity server to production
- [ ] Configure reverse proxy
- [ ] SSL certificates
- [ ] Rate limiting
- [ ] Error monitoring

---

## Testing

### Test Activity Locally

```bash
# Start activity server
cd src/packages/fumblebot
npm run activity:dev

# Open in browser
http://localhost:8080/discord/activity
```

### Test in Discord

1. Enable Developer Mode in Discord
2. Right-click your server → Copy ID
3. Visit: `https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&scope=applications.commands%20applications.activities.read%20applications.activities.write&guild_id=YOUR_GUILD_ID`
4. Launch activity from voice channel

### Test App Commands

1. Register commands:
```bash
npm run commands:register
```

2. Right-click on a message or user
3. Select FumbleBot command
4. Verify response

---

## Security Considerations

### Activity Server
- ✅ CORS restricted to discord.com
- ✅ X-Frame-Options header set
- ✅ Content-Security-Policy configured
- ⚠️ TODO: Rate limiting per user
- ⚠️ TODO: Session token validation
- ⚠️ TODO: Input sanitization

### App Commands
- ✅ Permission checks on sensitive commands
- ✅ Ephemeral responses for private data
- ⚠️ TODO: Rate limiting
- ⚠️ TODO: Audit logging

---

## Resources

- [Discord Activities Documentation](https://discord.com/developers/docs/activities/overview)
- [Discord Activity SDK](https://github.com/discord/embedded-app-sdk)
- [Context Menu Commands](https://discord.com/developers/docs/interactions/application-commands#context-menu-commands)
- [FumbleBot Activity Server](./src/discord/activity/server.ts)
- [FumbleBot App Commands](./src/discord/commands/context/app-commands.ts)
