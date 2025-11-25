# Platform Integrations

**Current implementation status and realistic scope for March 2026**

---

## ✅ Currently Working (Auth Only)

### OAuth Providers
All OAuth integrations are **authentication only** - users can link accounts but no data syncing yet.

**Implemented:**
- **Discord** - OAuth 2.0, user can link Discord account
- **GitHub** - OAuth 2.0, user can link GitHub account
- **Twitch** - OAuth 2.0, user can link Twitch account
- **Battle.net** - OAuth 2.0, user can link Battle.net account
- **Steam** - OpenID 2.0 (via World Anvil API bridge)
- **World Anvil** - OAuth 2.0, user can link World Anvil account

**Location:** [src/app/api/auth/[...nextauth]/route.ts](../../../src/app/api/auth/[...nextauth]/route.ts)

---

## 🎯 March 2026 Scope

**Focus:** Keep authentication working, don't add data syncing yet.

### What We're NOT Doing (Yet)

**FoundryVTT Integration**
❌ Syncing game state from Foundry → Crit-Fumble
❌ Importing Foundry actors/items/scenes
❌ Bi-directional sync
❌ Foundry module development

**Reason:** Building our own VTT takes priority over integrating with another VTT.

**World Anvil Integration**
❌ Syncing articles, maps, timelines
❌ Importing stat blocks and NPCs
❌ Pushing session logs back to WA

**Reason:** Content creation tools are Phase 5 (2027+), not MVP.

**Steam Integration**
❌ Fetching game libraries
❌ Showing playtime stats
❌ Game-based matchmaking

**Reason:** Social features come after core VTT works.

**Fandom/Discord Bots**
❌ Discord bot commands
❌ Fandom wiki imports
❌ Cross-platform notifications

**Reason:** Community features are Phase 3-4 (Q3-Q4 2026).

---

## 📦 Integration Roadmap

### Phase 1: Core VTT (Now → March 2026)
- ✅ Keep OAuth authentication working
- ✅ Maintain linked accounts page
- ❌ NO data syncing
- ❌ NO external API calls (except auth)

### Phase 2: Enhanced Gameplay (Q2 2026)
- Discord bot for dice rolls
- Session logging

### Phase 3: Community Features (Q3 2026)
- Steam game library matching
- Discord Rich Presence
- Cross-platform notifications

### Phase 4: Content Tools (Q4 2026)
- World Anvil article imports
- Fandom wiki integration
- Asset library sharing

### Phase 5: Advanced Sync (2027+)
- FoundryVTT bi-directional sync
- World Anvil timeline integration
- Multi-VTT compatibility layer

---

## 🔧 Maintaining OAuth Providers

### Required Environment Variables

```env
# Discord
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=

# GitHub
GITHUB_ID=
GITHUB_SECRET=

# Twitch
TWITCH_CLIENT_ID=
TWITCH_CLIENT_SECRET=

# Battle.net
BATTLENET_CLIENT_ID=
BATTLENET_CLIENT_SECRET=
BATTLENET_ISSUER=https://oauth.battle.net

# World Anvil
WORLD_ANVIL_CLIENT_ID=
WORLD_ANVIL_CLIENT_SECRET=

# NextAuth
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
```

### Testing OAuth Flow

1. Go to `/account` → Linked Accounts tab
2. Click "Connect [Platform]" button
3. Authorize on platform's OAuth page
4. Verify redirect back to Crit-Fumble
5. See linked account in list

### Troubleshooting

**"OAuth error: redirect_uri mismatch"**
- Update redirect URI in platform's developer console
- Format: `https://yourdomain.com/api/auth/callback/[provider]`

**"Account already linked"**
- User already linked this platform account
- They need to unlink first, then re-link

**"Session expired"**
- NextAuth session timed out during OAuth flow
- Refresh page and try again

---

## 📝 Implementation Notes

### Why Auth-Only?

OAuth integrations provide:
1. **Social proof** - "This person has a Discord/Twitch account"
2. **Account recovery** - Multiple ways to log in
3. **Trust signals** - Established gaming accounts
4. **Future-proofing** - Infrastructure ready for data syncing

But data syncing requires:
- Complex API rate limiting
- Data transformation logic
- Conflict resolution
- Background jobs
- Increased maintenance burden

For March 2026, **authentication only** is the right scope.

---

## 🔗 Related Documentation

**Authentication:**
- [/docs/agent/authentication/](/docs/agent/authentication/) - NextAuth configuration
- [/docs/agent/features/linked-accounts.md](/docs/agent/features/linked-accounts.md) - UI implementation

**Future Plans:**
- [/docs/agent/future/DISCORD_INTEGRATION.md](/docs/agent/future/DISCORD_INTEGRATION.md) - Bot and webhooks (Q3 2026)
- [/docs/agent/future/MONETIZATION.md](/docs/agent/future/MONETIZATION.md) - Creator marketplace (Q4 2026)

---

**Last Updated:** November 24, 2024
**Scope:** Authentication only, no data syncing
**Timeline:** Keeping current state through March 2026
