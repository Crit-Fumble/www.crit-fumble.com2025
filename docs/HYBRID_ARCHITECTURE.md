# Hybrid Database Architecture

## Overview

Crit-Fumble uses a hybrid database architecture to optimize for cost and scalability:

| Database | Purpose | Provider | Cost |
|----------|---------|----------|------|
| **Website DB** | Auth, payments, platform | Neon Free Tier | $0/mo |
| **Core Concepts DB** | Worlds, creatures, sessions | DO Managed Postgres | $15/mo |
| **Core Concepts API** | RPG data access layer | DO App Platform | $5-12/mo |
| **Staging** | Dev/preview environment | DO Droplet + Docker | $6/mo |

**Total: $26-33/month** (vs ~$156/mo for all-Neon at 100GB)

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PRODUCTION                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────┐                                                    │
│  │   Vercel (Website)  │                                                    │
│  │   Next.js App       │                                                    │
│  └──────────┬──────────┘                                                    │
│             │                                                               │
│      ┌──────┴──────┐                                                        │
│      ▼             ▼                                                        │
│  ┌────────┐   ┌────────────────────┐                                       │
│  │ Neon   │   │ DO App Platform    │                                       │
│  │ Free   │   │ Core Concepts API  │                                       │
│  │        │   │ (Express.js)       │                                       │
│  │ Auth   │   └─────────┬──────────┘                                       │
│  │ Users  │             │                                                   │
│  │ Coins  │             ▼                                                   │
│  │ Payments│  ┌────────────────────┐     ┌─────────────────────┐           │
│  └────────┘  │ DO Managed Postgres │     │ Foundry Droplets    │           │
│              │ core-concepts-prod  │◄────│ (VPC Internal)      │           │
│              │                     │     └─────────────────────┘           │
│              │ Worlds, Creatures   │                                       │
│              │ Sessions, History   │                                       │
│              └────────────────────┘                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              STAGING                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────┐           │
│  │                    DO Droplet ($6/mo)                        │           │
│  │  ┌─────────────────────┐    ┌─────────────────────────┐     │           │
│  │  │  Docker: API        │    │  Docker: Postgres       │     │           │
│  │  │  Port 3001          │───▶│  Port 5432              │     │           │
│  │  └─────────────────────┘    └─────────────────────────┘     │           │
│  └─────────────────────────────────────────────────────────────┘           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## File Structure

```
packages/
└── core-concepts-api/          # Standalone Express.js API
    ├── src/
    │   ├── server.ts           # Main entry point
    │   ├── routes/             # API route handlers
    │   ├── middleware/         # Auth, logging, errors
    │   └── services/           # Database & business logic
    ├── prisma/
    │   └── schema.prisma       # RPG-only schema
    ├── Dockerfile              # Production container
    ├── docker-compose.staging.yml
    ├── docker-compose.dev.yml
    └── package.json

src/packages/cfg-lib/
├── db-main.ts                  # Prisma client for Neon (website)
├── db-rpg-client.ts            # HTTP client for Core Concepts API
├── db-unified.ts               # Unified facade (auto-routes to API or Prisma)
└── db-index.ts                 # Re-exports

.github/workflows/
├── deploy-api-staging.yml      # Deploy API to staging droplet
└── deploy-api-prod.yml         # Deploy API to App Platform
```

## Environment Variables

### Website (.env)

```bash
# Existing Neon connection
DATABASE_URL="postgresql://..."

# Core Concepts API
USE_RPG_API="true"                    # Enable API-based RPG access
CORE_CONCEPTS_API_URL="https://api.crit-fumble.com"
CORE_CONCEPTS_API_SECRET="shared-jwt-secret"
```

### Core Concepts API (.env)

```bash
PORT=3001
DATABASE_URL="postgresql://..."       # DO Managed Postgres
JWT_SECRET="shared-jwt-secret"
INTERNAL_API_SECRET="vpc-secret"
CORS_ORIGINS="https://crit-fumble.com,https://staging.crit-fumble.com"
```

## Usage

### Unified Database Access (Recommended)

```typescript
import { db } from '@/packages/cfg-lib/db';

// Website data (always direct Prisma)
const user = await db.website.user.findUnique({ where: { id } });

// RPG data (auto-routes to API or Prisma based on USE_RPG_API)
const worlds = await db.rpg.worlds.findMany({ ownerId: userId });
```

### Direct API Client

```typescript
import { rpgApi } from '@/packages/cfg-lib/db-rpg-client';

const worlds = await rpgApi.worlds.findMany({ ownerId: userId });
const creature = await rpgApi.creatures.upsert({ foundryId: '...', name: '...' });
```

### Cross-Database Queries

```typescript
import { getUserWithRpgPlayer, ensureRpgPlayer } from '@/packages/cfg-lib/db';

// Get user with RPG player data (handles API vs direct access)
const user = await getUserWithRpgPlayer(userId);

// Ensure RpgPlayer exists for a user
const player = await ensureRpgPlayer(userId, 'Display Name');
```

## DigitalOcean Setup

### 1. Managed Postgres (Production Core Concepts DB)

1. Go to DigitalOcean → Databases → Create
2. **Engine**: PostgreSQL 16
3. **Name**: `core-concepts-prod`
4. **Plan**: Basic ($15/mo) - 1 vCPU, 1GB RAM, 10GB storage
5. **Region**: Same as App Platform
6. **VPC**: Select or create VPC for internal access
7. **Database name**: `core_concepts`

Copy the connection string for the API's `DATABASE_URL`.

### 2. App Platform (Production API)

1. Go to DigitalOcean → App Platform → Create App
2. **Source**: GitHub → `packages/core-concepts-api`
3. **Type**: Web Service
4. **Plan**: Basic ($5/mo) or Pro ($12/mo)
5. **Environment Variables**:
   - `DATABASE_URL`: Connection string from Managed Postgres
   - `JWT_SECRET`: Same as NEXTAUTH_SECRET
   - `INTERNAL_API_SECRET`: Generate a secure secret
   - `CORS_ORIGINS`: Your domains
6. **Health Check**: `/health/live`

### 3. Staging Droplet

1. Go to DigitalOcean → Droplets → Create
2. **Image**: Docker from Marketplace
3. **Name**: `core-concepts-staging`
4. **Plan**: Basic ($6/mo) - 1 vCPU, 1GB RAM
5. **Region**: Same VPC
6. SSH in and:

```bash
# Clone repo
git clone https://github.com/your-org/www.crit-fumble.com2025.git /opt/core-concepts-api
cd /opt/core-concepts-api/packages/core-concepts-api

# Create .env
cp .env.example .env
# Edit .env with your values

# Start services
docker compose -f docker-compose.staging.yml up -d

# Run migrations
docker compose -f docker-compose.staging.yml exec api npx prisma migrate deploy
```

## GitHub Secrets Required

```
# For staging deployment
STAGING_DROPLET_IP=<droplet-ip>
STAGING_SSH_KEY=<ssh-private-key>

# For production deployment
DIGITALOCEAN_ACCESS_TOKEN=<do-api-token>
DO_APP_ID=<app-platform-app-id>
```

## Migration Path

### Phase 1: Setup Infrastructure
- [ ] Create DO Managed Postgres cluster
- [ ] Create staging droplet
- [ ] Deploy Core Concepts API to staging

### Phase 2: Data Migration
- [ ] Run `prisma migrate deploy` on new RPG database
- [ ] Migrate existing RPG data from Neon to DO Postgres
- [ ] Verify data integrity

### Phase 3: Cutover
- [ ] Deploy API to App Platform (production)
- [ ] Set `USE_RPG_API=true` in Vercel
- [ ] Monitor for errors
- [ ] Archive old RPG tables in Neon (don't delete yet)

### Phase 4: Cleanup
- [ ] Remove RPG tables from Neon after 30 days
- [ ] Update documentation
