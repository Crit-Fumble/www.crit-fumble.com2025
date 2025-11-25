# Discord Activity MVP - Implementation Guide

**Created**: 2025-11-19
**Status**: Planning Phase
**Estimated Effort**: 3-5 days

## Overview

This document outlines the MVP implementation for embedding a Foundry VTT instance as a Discord Activity in voice channels. This creates an integrated experience where players can use voice chat and the VTT in a single Discord window.

---

## Architecture

```
Discord Desktop/Web Client
┌─────────────────────────────────────────────────────────┐
│  Voice Channel: "D&D Session"                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Discord Activity (Embedded App)                  │  │
│  │  https://crit-fumble.com/discord-activity         │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │  <iframe>                                   │  │  │
│  │  │    Foundry VTT Web UI                       │  │  │
│  │  │    https://crit-fumble.com/game/world-123   │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  [🔊 Voice]  [📺 Screen Share]  [🎮 Activity]          │
└─────────────────────────────────────────────────────────┘
```

---

## Implementation Checklist

### Phase 1: Discord Developer Setup (1 day)

**Tasks**:
- [ ] Create Discord Application at https://discord.com/developers/applications
- [ ] Configure Activity settings
- [ ] Enable OAuth2 for authentication
- [ ] Add redirect URLs
- [ ] Get Client ID and Client Secret
- [ ] Configure activity manifest
- [ ] Test activity in Discord test server

**Discord Application Configuration**:
```json
{
  "name": "Crit-Fumble VTT",
  "description": "Play D&D 5e and Cypher System in Discord voice channels",
  "developer_name": "Crit-Fumble Gaming",
  "activity_url": "https://crit-fumble.com/discord-activity",
  "default_orientation_lock": "landscape",
  "supported_platforms": ["desktop", "mobile"],
  "age_gate": {
    "minimum_age": 13
  },
  "scopes": ["identify", "rpc.activities.write"]
}
```

**Environment Variables**:
```bash
# Add to .env
NEXT_PUBLIC_DISCORD_CLIENT_ID=your_client_id_here
DISCORD_CLIENT_SECRET=your_client_secret_here
DISCORD_ACTIVITY_URL=https://crit-fumble.com/discord-activity
```

---

### Phase 2: Install Discord SDK (< 1 hour)

**Install Package**:
```bash
npm install @discord/embedded-app-sdk
```

**Package Details**:
- Latest version: Check https://github.com/discord/embedded-app-sdk
- TypeScript support: Built-in type definitions
- Bundle size: ~50KB minified

---

### Phase 3: Create Activity Wrapper Page (2 days)

**File**: `src/app/discord-activity/page.tsx`

```typescript
'use client';

import { DiscordSDK } from '@discord/embedded-app-sdk';
import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function DiscordActivityPage() {
  const [worldId, setWorldId] = useState<string | null>(null);
  const [discordReady, setDiscordReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discordUser, setDiscordUser] = useState<any>(null);

  useEffect(() => {
    const initializeDiscord = async () => {
      try {
        const discordSdk = new DiscordSDK(
          process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!
        );

        // Wait for Discord SDK to be ready
        await discordSdk.ready();

        // Get Discord user info
        const { user } = await discordSdk.commands.authenticate({
          scopes: ['identify'],
        });
        setDiscordUser(user);

        // Get world ID from URL parameters
        const params = new URLSearchParams(window.location.search);
        const world = params.get('world');

        if (!world) {
          setError('No world ID provided. Please start a game session.');
          return;
        }

        setWorldId(world);
        setDiscordReady(true);

        console.log('Discord Activity initialized', {
          userId: user.id,
          username: user.username,
          worldId: world,
        });
      } catch (err) {
        console.error('Failed to initialize Discord Activity:', err);
        setError('Failed to initialize Discord Activity. Please try again.');
      }
    };

    initializeDiscord();
  }, []);

  // Loading state
  if (!discordReady && !error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white">
        <Image
          src="/img/icon.png"
          alt="Crit Fumble Gaming"
          width={120}
          height={120}
          className="mb-8 animate-pulse"
        />
        <h2 className="text-2xl font-display font-bold mb-2">Loading Game...</h2>
        <p className="text-gray-400">Connecting to Foundry VTT</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white">
        <Image
          src="/img/icon.png"
          alt="Crit Fumble Gaming"
          width={120}
          height={120}
          className="mb-8 opacity-50"
        />
        <h2 className="text-2xl font-display font-bold mb-2 text-red-400">
          Error
        </h2>
        <p className="text-gray-400">{error}</p>
      </div>
    );
  }

  // Main iframe view
  return (
    <div className="relative w-screen h-screen">
      {/* Optional: Discord user indicator */}
      <div className="absolute top-2 right-2 z-10 bg-slate-800/90 backdrop-blur-sm rounded-lg px-3 py-1 text-white text-sm">
        Playing as {discordUser?.username}
      </div>

      {/* Foundry VTT iframe */}
      <iframe
        src={`https://crit-fumble.com/game/${worldId}`}
        className="w-full h-full border-0"
        allow="microphone; camera; display-capture; clipboard-read; clipboard-write"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
        title="Foundry VTT Game Session"
      />
    </div>
  );
}
```

**Additional Files**:

**File**: `src/app/discord-activity/layout.tsx`
```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Crit-Fumble VTT - Discord Activity',
  description: 'Play D&D 5e in Discord voice channels',
};

export default function DiscordActivityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="discord-activity">{children}</div>;
}
```

---

### Phase 4: Configure Foundry for iframe Embedding (1 day)

#### 4.1: Foundry VTT Configuration

**File**: `foundry/Config/options.json` (or Foundry's config.json)

```json
{
  "hostname": "crit-fumble.com",
  "port": 443,
  "sslCert": "/path/to/fullchain.pem",
  "sslKey": "/path/to/privkey.pem",
  "routePrefix": "/game",
  "allowOrigins": [
    "https://crit-fumble.com",
    "https://discord.com",
    "https://*.discord.com"
  ],
  "proxySSL": true
}
```

#### 4.2: Next.js Security Headers

**File**: `next.config.js`

Add security headers to allow Discord embedding:

```javascript
module.exports = {
  async headers() {
    return [
      {
        // Allow Discord to embed our activity page
        source: '/discord-activity',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://discord.com https://*.discord.com",
          },
          {
            key: 'X-Frame-Options',
            value: 'ALLOW-FROM https://discord.com',
          },
        ],
      },
      {
        // Allow our activity page to iframe Foundry
        source: '/game/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://crit-fumble.com https://discord.com https://*.discord.com",
          },
        ],
      },
    ];
  },
};
```

#### 4.3: CORS Configuration

**File**: `src/middleware.ts` (create if doesn't exist)

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Allow Discord to make requests to our activity
  if (request.nextUrl.pathname.startsWith('/discord-activity')) {
    response.headers.set('Access-Control-Allow-Origin', 'https://discord.com');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  return response;
}

export const config = {
  matcher: '/discord-activity/:path*',
};
```

---

### Phase 5: Testing & Deployment (1 day)

#### 5.1: Local Testing

**Prerequisites**:
- Discord desktop client or web browser
- Test Discord server with voice channel
- Foundry VTT instance running locally or on staging

**Steps**:
1. Start Next.js dev server: `npm run dev`
2. Start Foundry VTT instance
3. Open Discord Developer Portal
4. Use "Test with Discord" button
5. Join voice channel in test server
6. Launch activity
7. Verify iframe loads Foundry
8. Test basic interactions (token movement, dice rolling)
9. Test with multiple users in voice channel

#### 5.2: Production Deployment

**Pre-deployment Checklist**:
- [ ] Discord Application approved by Discord
- [ ] SSL certificates configured
- [ ] Environment variables set in production
- [ ] Foundry VTT configured for production domain
- [ ] Security headers tested
- [ ] Performance testing completed

**Deployment Steps**:
1. Deploy Next.js application with activity page
2. Verify HTTPS is working
3. Update Discord Application with production URL
4. Submit for Discord Activity verification (if required)
5. Test in production Discord server
6. Monitor logs for errors

---

## User Flow

### GM Starting a Session

1. GM creates or joins Discord voice channel
2. GM clicks "Activities" button in voice channel
3. GM selects "Crit-Fumble VTT" from activity list
4. GM prompted to select which campaign/world to load
5. Activity launches with Foundry VTT iframe
6. GM invites players to join voice channel
7. Players automatically see the same game session

### Player Joining

1. Player joins Discord voice channel
2. Player sees active "Crit-Fumble VTT" activity
3. Player clicks to join activity
4. Foundry VTT loads in iframe
5. Player authenticates (if needed)
6. Player can control their character

---

## Performance Considerations

### Discord Activity Constraints

- **Max iframe size**: ~1920x1080
- **Memory limits**: ~200MB on desktop, ~100MB on mobile
- **CPU limits**: Shared with Discord client
- **Network**: Uses user's bandwidth

### Optimization Strategies

1. **Reduce Foundry Assets**:
   - Use compressed images
   - Limit animated effects
   - Disable heavy modules for Discord sessions

2. **Client-Side Rendering**:
   - Let Foundry handle rendering
   - Minimize wrapper page overhead
   - Use lightweight Discord SDK integration

3. **Session Management**:
   - Auto-disconnect after inactivity
   - Clear cache on session end
   - Limit concurrent users per session

---

## Security Considerations

### iframe Sandbox

```html
<iframe
  sandbox="
    allow-same-origin
    allow-scripts
    allow-forms
    allow-popups
    allow-modals
  "
/>
```

**What Each Permission Does**:
- `allow-same-origin`: Required for Foundry WebSocket connections
- `allow-scripts`: Required for Foundry JavaScript
- `allow-forms`: Required for character sheets and forms
- `allow-popups`: Required for Foundry dialogs
- `allow-modals`: Required for Foundry modal windows

**Security Risks Mitigated**:
- Cross-origin attacks limited by CSP headers
- Discord SDK validates activity origin
- Foundry session tokens are separate from main site

### Authentication Flow

**MVP**: Direct authentication in Foundry iframe
- User authenticates via Foundry's native login
- No additional authentication bridge needed
- Session tokens managed by Foundry

**Future Enhancement**: Discord user linking
- Auto-login based on Discord user ID
- Map Discord users to Foundry users
- Single sign-on experience

---

## Troubleshooting

### Common Issues

**Issue**: iframe doesn't load
- **Check**: CSP headers are set correctly
- **Check**: Foundry `allowOrigins` includes Discord domains
- **Check**: SSL certificates are valid

**Issue**: Discord SDK fails to initialize
- **Check**: Client ID is correct in environment variables
- **Check**: Activity is enabled in Discord Application
- **Check**: User has required permissions

**Issue**: Performance is poor
- **Check**: Foundry map size and complexity
- **Check**: Number of active modules
- **Check**: User's device capabilities

**Issue**: Voice chat conflicts with Foundry audio
- **Check**: Discord voice activity detection settings
- **Check**: Foundry audio settings (mute if needed)
- **Check**: User's audio device configuration

---

## Success Metrics

**Technical Metrics**:
- [ ] Activity loads in < 3 seconds
- [ ] iframe renders Foundry correctly
- [ ] WebSocket connections stable
- [ ] No CSP errors in console
- [ ] Works on desktop and web Discord clients

**User Experience Metrics**:
- [ ] Players can join without confusion
- [ ] Voice + VTT work simultaneously
- [ ] No lag during gameplay
- [ ] Session persists entire game duration

---

## Future Enhancements (Post-MVP)

### Phase 2 Features

1. **Discord User Integration**:
   - Auto-login via Discord ID
   - Avatar sync
   - Username sync

2. **Rich Presence**:
   - Show current campaign in Discord status
   - Display party composition
   - Show current scene/location

3. **Voice Integration**:
   - Proximity voice chat based on token position
   - Auto-mute when dead/unconscious
   - Whisper channels for secret messages

4. **Performance Optimization**:
   - Lazy-load Foundry modules
   - Progressive image loading
   - Adaptive quality based on connection

5. **Mobile Support**:
   - Optimized UI for mobile Discord
   - Touch-friendly controls
   - Reduced feature set for mobile

---

## Resources

### Documentation
- [Discord Embedded App SDK](https://discord.com/developers/docs/activities/overview)
- [Foundry VTT Web Server](https://foundryvtt.com/article/installation/)
- [Next.js iframe Embedding](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)

### Related Files
- [FOUNDRY_CLIENT_OPTIONS.md](FOUNDRY_CLIENT_OPTIONS.md) - Full client connectivity options
- [FOUNDRY_ARCHITECTURE_V2.md](FOUNDRY_ARCHITECTURE_V2.md) - Hybrid storage architecture
- [CURRENT_STATUS.md](CURRENT_STATUS.md) - Overall project status

---

## Conclusion

**Estimated Total Effort**: 3-5 days for MVP

**Benefits**:
- ✅ Integrated Discord voice + VTT experience
- ✅ Easy onboarding for Discord users
- ✅ Social discovery through Discord activities
- ✅ No additional infrastructure needed

**Next Steps**:
1. Create Discord Application
2. Install `@discord/embedded-app-sdk`
3. Build activity wrapper page
4. Configure security headers
5. Test in Discord test server
6. Deploy to production

---

**Last Updated**: 2025-11-19
**Status**: Ready for Implementation
