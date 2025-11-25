# Agent Documentation

Technical documentation for AI agents working on the Crit-Fumble platform.

**Last Updated:** November 25, 2025

See [future/README.md](future/README.md) for roadmap.

---

## Quick Navigation

### Getting Started
- [Setup](setup/) - Development environment and deployment
- [Testing](testing/) - E2E tests and developer mode

### Implementation
- [Authentication](authentication/) - NextAuth with OAuth providers
- [Features](features/) - User accounts, tiers, signup flow
- [Database](database/) - Prisma schema and setup

### Architecture & Planning
- [Architecture](architecture/) - System design
- [Planning](planning/) - Development approach and core concepts
- [Integrations](integrations/) - External service integrations
- [Future](future/) - Roadmap and deferred features

### Operations
- [Security](security/) - Security implementation and audits
- [Licensing](licensing/) - Asset licensing and project license

---

## Technology Stack

- Next.js 16 (App Router + Turbopack), React 19, TypeScript 5.7, Tailwind CSS 3.4
- PostgreSQL (Vercel Postgres), Prisma ORM 6.1
- Auth.js v5 with OAuth providers: Discord, GitHub, Twitch, Battle.net, Steam, World Anvil
- Vercel Blob Storage
- Playwright (E2E), Vitest (unit)
- Deployed on Vercel + DigitalOcean (FoundryVTT)

---

## Documentation Structure

```
docs/agent/
├── architecture/          # System design
├── authentication/        # NextAuth configuration
├── database/              # Database setup
├── examples/              # Example implementations
├── features/              # Implemented features
├── future/                # Roadmap and deferred features
├── integrations/          # External integrations
│   ├── cypher/           # Cypher System RPG
│   └── worldanvil/       # World Anvil integration
├── licensing/             # Asset licensing and project license
├── planning/              # Development approach and strategy
├── security/              # Security implementation and audits
│   └── phases/           # Implementation phases
├── setup/                 # Development environment
└── testing/               # Testing guides
```

---

## Implementation Status

### Working
- Multi-provider OAuth authentication
- User profiles and tier system (FREE, PATRON, ELITE, COSMIC)
- Admin panel
- Vercel deployment with PostgreSQL and Blob Storage
- E2E tests with Playwright

### In Progress
- Database schemas for campaigns, characters, worlds
- Pixi.js integration (not yet used)

### Planned
See [future/README.md](future/README.md) for roadmap.

---

## Key Documents

### Setup
- [Quick Fix Guide](setup/quick-fix-guide.md)
- [Vercel Database Setup](setup/vercel-database-setup.md)
- [Staging Environment](setup/staging-environment-setup.md)

### Architecture
- [Architecture Overview](architecture/overview.md)
- [Tile & Asset System](architecture/TILE_ASSET_SYSTEM.md)
- [Multiverse System](architecture/MULTIVERSE_SYSTEM.md)

### Planning
- [Core Concepts & Foundry Status](planning/CORE_CONCEPTS_AND_FOUNDRY_STATUS.md)
- [API-First Development](planning/API_FIRST_DEVELOPMENT_PLAN.md)
