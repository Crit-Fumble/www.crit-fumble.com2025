# Agent Documentation

Technical documentation for AI agents working on the Crit-Fumble platform.

**Last Updated:** November 29, 2025

---

## Quick Navigation

### Getting Started
- [Setup](setup/) - Development environment and deployment

### Architecture

**Authentication:**
- Uses Auth.js v5 with Discord OAuth
- Core API adapter proxies auth operations to `core.crit-fumble.com`
- Database sessions stored in Core API (shared identity across platforms)

**Key Files:**
- `src/lib/auth.ts` - NextAuth configuration with Core API adapter
- `src/lib/core-adapter.ts` - Auth.js adapter for Core API
- `src/lib/permissions.ts` - Role-based permissions (owner/admin/user)
- `src/lib/bot-auth.ts` - FumbleBot authentication

---

## Technology Stack

- **Framework:** Next.js 16 (App Router + Turbopack), React 19, TypeScript 5.7
- **Styling:** Tailwind CSS 3.4
- **Auth:** Auth.js v5 with Discord OAuth, Core API adapter
- **Testing:** Playwright (E2E), Vitest (unit)
- **Deployment:** Vercel

---

## Documentation Structure

```
docs/agent/
├── setup/                 # Development environment setup
│   ├── vercel-env-setup.md
│   ├── vercel-free-tier-setup.md
│   ├── vercel-preview-environment.md
│   ├── vercel-private-repo-deployment.md
│   ├── staging-environment-setup.md
│   ├── playwright-setup.md
│   ├── github-setup.md
│   ├── git-hooks-deployment.md
│   ├── cicd-and-environments.md
│   └── quick-fix-guide.md
├── DEPLOYMENT.md          # Self-hosting guide
└── README.md              # This file
```

---

## Implementation Status

### Working
- Multi-provider OAuth authentication (Discord)
- Core API integration for shared identity
- Admin/owner permissions via Discord IDs
- Wiki system with markdown editor
- Storybook component library
- E2E tests with Playwright
- Unit tests with Vitest (97%+ coverage)

### In Progress
- FumbleBot web chat integration

---

## Key Documents

### Setup
- [Quick Fix Guide](setup/quick-fix-guide.md)
- [Staging Environment](setup/staging-environment-setup.md)
- [Vercel Environment Setup](setup/vercel-env-setup.md)

---

## Environment Variables

**Required:**
```env
# Core API
CORE_API_URL=https://core.crit-fumble.com
CORE_API_SECRET=<shared secret>

# Discord OAuth
DISCORD_CLIENT_ID=<from Discord Developer Portal>
DISCORD_CLIENT_SECRET=<from Discord Developer Portal>

# Auth.js
AUTH_SECRET=<random 32+ char string>

# Permissions (comma-separated Discord IDs)
OWNER_DISCORD_IDS=<discord_id_1,discord_id_2>
ADMIN_DISCORD_IDS=<discord_id_3,discord_id_4>
```

**Optional:**
```env
# FumbleBot integration
BOT_API_SECRET=<shared secret for bot auth>
FUMBLEBOT_API_URL=<bot HTTP API endpoint>
```
