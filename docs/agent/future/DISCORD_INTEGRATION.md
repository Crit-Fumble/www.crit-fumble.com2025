# Discord Integration Architecture

## Overview

Crit-Fumble supports three Discord integration modes:
1. **Play-by-Post**: Asynchronous text-based gameplay with rendered images
2. **Discord Activity**: Real-time multiplayer in voice channels
3. **Web Client**: Traditional browser-based VTT (with Discord login)

---

## 1. Discord Play-by-Post Mode

### Architecture

```
Discord Channel → Bot receives command → Server processes → Puppeteer renders → Image posted to channel
```

### Flow

1. **GM sets up session** in Discord channel
2. **Players issue text commands**: `/move north`, `/attack goblin`, `/cast fireball`
3. **Server processes** command, updates game state
4. **Puppeteer renders** current map view (Pixi.js canvas)
5. **Image posted** to Discord channel with summary text
6. **GM narrates** results

### Technical Implementation

#### Command Structure
```typescript
// Discord bot commands
/cfg-start-session <location-sheet-id>  // GM only
/cfg-move <direction>                    // Player command
/cfg-attack <target>                     // Player command
/cfg-cast <spell> <target>               // Player command
/cfg-end-turn                            // Player command
/cfg-render                              // Force render current state
```

#### Puppeteer Rendering Pipeline

```typescript
// src/lib/discord/render-game-state.ts
import puppeteer from 'puppeteer'

export async function renderGameState(
  locationSheetId: string,
  viewerPlayerId: string,
  options: RenderOptions
): Promise<Buffer> {
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  // Set viewport to Discord embed size
  await page.setViewport({ width: 1200, height: 900 })

  // Navigate to headless render route
  await page.goto(`http://localhost:3000/api/render/${locationSheetId}?playerId=${viewerPlayerId}`)

  // Wait for Pixi.js to render
  await page.waitForSelector('#pixi-canvas-ready')

  // Capture screenshot
  const screenshot = await page.screenshot({ type: 'png' })

  await browser.close()
  return screenshot
}
```

#### Headless Render Route

```typescript
// src/app/api/render/[sheetId]/route.ts
export async function GET(req: Request, { params }: { params: { sheetId: string } }) {
  const { searchParams } = new URL(req.url)
  const playerId = searchParams.get('playerId')

  // Fetch game state
  const sheet = await prisma.locationSheet.findUnique({
    where: { id: params.sheetId },
    include: { cards: true, permissions: true }
  })

  // Return headless HTML with Pixi.js renderer
  return new Response(renderHeadlessHTML(sheet, playerId), {
    headers: { 'Content-Type': 'text/html' }
  })
}
```

### Storage

- **Game state**: PostgreSQL (Prisma)
- **Rendered images**: Digital Ocean Spaces (CDN)
- **Turn history**: Discord message IDs stored in `RpgHistory`

### Benefits

- **Asynchronous**: Players can take turns at their own pace
- **Low barrier**: No additional apps required
- **Mobile-friendly**: Works in Discord mobile app
- **Archival**: Full game history preserved in Discord

---

## 2. Discord Activity Mode (Voice Channel)

### Architecture

```
Discord Voice Channel → Embedded iFrame → Next.js App → Socket.io → Real-time sync
```

### Flow

1. **GM starts Discord Activity** from voice channel
2. **Players click "Join Activity"** - launches embedded web app
3. **Quick character creation/selection** modal appears
4. **Players "jump in"** to active world
5. **Real-time gameplay** with shared canvas
6. **Voice chat** for roleplay/communication

### Technical Implementation

#### Discord Activity SDK

```typescript
// src/lib/discord/activity-sdk.ts
import { DiscordSDK } from '@discord/embedded-app-sdk'

const discordSdk = new DiscordSDK(process.env.DISCORD_CLIENT_ID!)

export async function initializeDiscordActivity() {
  await discordSdk.ready()

  // Get channel info
  const channel = discordSdk.channelId
  const guildId = discordSdk.guildId

  // Authenticate user
  const { access_token } = await discordSdk.commands.authenticate({
    scopes: ['identify', 'guilds']
  })

  return { channel, guildId, access_token }
}
```

#### Quick Character Creation

```typescript
// src/components/discord/QuickCharacterModal.tsx
'use client'

import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'

export function QuickCharacterModal({ onComplete }: { onComplete: (char: Character) => void }) {
  const [name, setName] = useState('')
  const [characterClass, setClass] = useState<CharacterClass>('fighter')
  const [level, setLevel] = useState(1)

  const handleQuickRoll = () => {
    // Use standard array or quick roll for stats
    const character = {
      name,
      class: characterClass,
      level,
      stats: generateQuickStats(),
      hp: getClassHP(characterClass, level),
      ac: getClassAC(characterClass)
    }

    onComplete(character)
  }

  return (
    <Dialog open>
      <DialogContent>
        <h2>Quick Character Creation</h2>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Character Name" />
        <select value={characterClass} onChange={(e) => setClass(e.target.value as CharacterClass)}>
          <option value="fighter">Fighter</option>
          <option value="wizard">Wizard</option>
          <option value="rogue">Rogue</option>
          <option value="cleric">Cleric</option>
        </select>
        <button onClick={handleQuickRoll}>Roll Character & Join!</button>
      </DialogContent>
    </Dialog>
  )
}
```

#### Socket.io Event System

```typescript
// src/lib/socket/game-events.ts
export const GAME_EVENTS = {
  // Player actions
  PLAYER_JOINED: 'player:joined',
  PLAYER_LEFT: 'player:left',
  PLAYER_MOVED: 'player:moved',
  PLAYER_ATTACKED: 'player:attacked',

  // Game state
  STATE_SYNC: 'state:sync',
  TURN_CHANGED: 'turn:changed',
  COMBAT_STARTED: 'combat:started',
  COMBAT_ENDED: 'combat:ended',

  // Chat
  CHAT_MESSAGE: 'chat:message',
  DICE_ROLL: 'dice:roll'
}
```

```typescript
// src/app/api/socket/route.ts (Next.js 15 Socket.io handler)
import { Server } from 'socket.io'

export async function GET(req: Request) {
  const io = new Server({
    cors: { origin: '*' }
  })

  io.on('connection', (socket) => {
    console.log('Player connected:', socket.id)

    socket.on(GAME_EVENTS.PLAYER_JOINED, (data) => {
      socket.join(data.sessionId)
      socket.to(data.sessionId).emit(GAME_EVENTS.PLAYER_JOINED, data)
    })

    socket.on(GAME_EVENTS.PLAYER_MOVED, (data) => {
      // Update game state
      // Broadcast to all players in session
      io.to(data.sessionId).emit(GAME_EVENTS.STATE_SYNC, updatedState)
    })
  })
}
```

### Benefits

- **Real-time**: Instant updates for all players
- **Social**: Voice chat + visual gameplay
- **Accessible**: No additional software to install
- **Drop-in**: Players can join mid-session

---

## 3. Web Client Mode

### Standard VTT Experience

- Full-featured browser application
- Desktop and mobile responsive
- NextAuth.js with Discord OAuth
- Most powerful and flexible mode

---

## Implementation Roadmap

### Phase 1: Core Infrastructure ✅
- [x] Next.js 15 + Pixi.js setup
- [x] Prisma schema with roles
- [x] shadcn/ui components

### Phase 2: Web Client (Tier 1 MVP)
- [ ] Authentication with Discord OAuth
- [ ] Character creation UI
- [ ] Province hex map renderer
- [ ] Basic combat tracker
- [ ] Dice roller

### Phase 3: Discord Play-by-Post
- [ ] Discord bot commands
- [ ] Puppeteer rendering pipeline
- [ ] Image upload to Discord
- [ ] Turn-based command processing

### Phase 4: Discord Activity
- [ ] Discord Activity SDK integration
- [ ] Socket.io real-time sync
- [ ] Quick character creation modal
- [ ] Drop-in player support

---

## Environment Variables

```bash
# Discord OAuth (for web client)
DISCORD_CLIENT_ID="..."
DISCORD_CLIENT_SECRET="..."
DISCORD_BOT_TOKEN="..."

# Discord Activity
DISCORD_ACTIVITY_APP_ID="..."
DISCORD_ACTIVITY_PUBLIC_KEY="..."

# Rendering
PUPPETEER_EXECUTABLE_PATH="/usr/bin/chromium"  # Production
RENDER_BASE_URL="http://localhost:3000"        # Local dev
```

---

## Security Considerations

1. **Rate limiting**: Prevent command spam in Discord
2. **Permission checks**: Verify player has access to sheet/session
3. **Input validation**: Sanitize all Discord commands
4. **Authentication**: Verify Discord signatures on webhooks
5. **Rendering timeout**: Kill Puppeteer processes after 10s

---

## Performance Optimizations

1. **Render caching**: Cache rendered images for 5 minutes
2. **Headless pool**: Reuse Puppeteer browser instances
3. **CDN delivery**: Serve images from Digital Ocean Spaces
4. **Socket.io rooms**: Isolate sessions to prevent cross-talk
5. **Delta updates**: Only send changed game state, not full state
