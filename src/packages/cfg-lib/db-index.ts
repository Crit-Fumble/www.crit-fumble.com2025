/**
 * Database Client Exports
 *
 * This module provides access to database clients:
 *
 * 1. Website Database (Neon):
 *    - prismaMain: Direct Prisma access to Neon (auth, economy, payments)
 *
 * 2. RPG Database (Core Concepts API):
 *    - rpgApi: HTTP client for RPG data (worlds, creatures, sessions)
 *    - db.rpg: Unified interface (API in prod, direct Prisma in dev)
 *
 * 3. Unified Access:
 *    - db: Combined interface for both databases
 *    - db.website: Website data access
 *    - db.rpg: RPG data access (auto-routes to API or Prisma)
 *
 * Import examples:
 *
 * // Unified access (recommended)
 * import { db } from '@/packages/cfg-lib/db'
 * const worlds = await db.rpg.worlds.findMany({ ownerId: userId });
 *
 * // Direct RPG API client
 * import { rpgApi } from '@/packages/cfg-lib/db-rpg-client'
 *
 * // Legacy: direct Prisma (website only)
 * import { prismaMain } from '@/packages/cfg-lib/db'
 */

export { prismaMain, default as prismaMainDefault } from './db-main'

// Legacy compatibility: export prismaMain as 'prisma' for existing code
export { prismaMain as prisma } from './db-main'

// RPG API Client (for direct API calls)
export { rpgApi, RpgApiError } from './db-rpg-client'
export type { RpgWorld, RpgCreature, RpgSession, RpgCampaign, RpgPlayer, RpgHistoryEvent } from './db-rpg-client'

// Unified database access (recommended)
export { db, websiteDb, rpgDb, getUserWithRpgPlayer, ensureRpgPlayer, getUserWorlds, getUserCampaigns } from './db-unified'

// Convenience re-exports
export type { PrismaClient } from '@prisma/client'
