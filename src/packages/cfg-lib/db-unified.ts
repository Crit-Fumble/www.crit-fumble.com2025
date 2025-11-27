/**
 * Unified Database Access Layer
 *
 * Provides a consistent interface for database access that works with both:
 * - Direct Prisma access (development, single-DB setup)
 * - API-based access (production hybrid architecture)
 *
 * Usage:
 *   import { db } from '@/packages/cfg-lib/db-unified';
 *   const worlds = await db.rpg.worlds.findMany({ ownerId: userId });
 */

import { prismaMain } from './db-main';
import { rpgApi } from './db-rpg-client';

// Environment flag to determine which backend to use
const USE_RPG_API = process.env.USE_RPG_API === 'true';

// ============================================================================
// Website Database (Neon) - Always direct Prisma
// ============================================================================

export const websiteDb = {
  // User & Auth
  user: prismaMain.critUser,
  account: prismaMain.account,
  session: prismaMain.session,
  sessionLog: prismaMain.critSessionLog,

  // Economy & Payments
  coinTransaction: prismaMain.critCoinTransaction,
  storyCreditTransaction: prismaMain.critStoryCreditTransaction,
  product: prismaMain.critProduct,
  purchase: prismaMain.critPurchase,

  // Assets & Marketplace
  asset: prismaMain.critAsset,

  // API Keys
  apiKey: prismaMain.critApiKey,

  // Foundry VTT Management
  foundryLicense: prismaMain.foundryLicense,
  foundryInstance: prismaMain.foundryInstance,
  foundryWorldSnapshot: prismaMain.foundryWorldSnapshot,

  // Wiki (Core Concepts)
  wiki: prismaMain.coreConceptWiki,
  wikiRevision: prismaMain.coreConceptWikiRevision,

  // Virtual Desktop
  virtualDesktopSession: prismaMain.critVirtualDesktopSession,

  // Raw Prisma client for advanced queries
  $prisma: prismaMain,
};

// ============================================================================
// RPG Database - Conditional: API or Direct Prisma
// ============================================================================

/**
 * RPG Database access
 * Uses API client in production (USE_RPG_API=true)
 * Uses direct Prisma in development
 */
export const rpgDb = USE_RPG_API
  ? {
      // API-based access
      worlds: rpgApi.worlds,
      creatures: rpgApi.creatures,
      sessions: rpgApi.sessions,
      campaigns: rpgApi.campaigns,
      players: rpgApi.players,
      history: rpgApi.history,

      // API health check
      health: rpgApi.health,

      // Flag for conditional logic
      isApiMode: true as const,
    }
  : {
      // Direct Prisma access (wraps Prisma with similar interface)
      worlds: createPrismaWrapper(prismaMain.rpgWorld),
      creatures: createPrismaWrapper(prismaMain.rpgCreature),
      sessions: createPrismaWrapper(prismaMain.rpgSession),
      campaigns: createPrismaWrapper(prismaMain.rpgCampaign),
      players: createPrismaWrapper(prismaMain.rpgPlayer),
      history: createPrismaWrapper(prismaMain.rpgHistory),

      // Direct database health check
      health: async () => {
        await prismaMain.$queryRaw`SELECT 1`;
        return { status: 'healthy', database: 'connected' };
      },

      // Flag for conditional logic
      isApiMode: false as const,
    };

/**
 * Wrapper to make Prisma client match API client interface
 * This allows seamless switching between direct Prisma and API access
 */
function createPrismaWrapper<T extends { findMany: Function; findUnique: Function; create: Function; update: Function; delete: Function }>(
  model: T
) {
  return {
    findMany: model.findMany.bind(model),
    findUnique: model.findUnique.bind(model),
    create: model.create.bind(model),
    update: model.update.bind(model),
    delete: model.delete.bind(model),
  };
}

// ============================================================================
// Unified Database Object
// ============================================================================

export const db = {
  website: websiteDb,
  rpg: rpgDb,

  // Helper to check if using API mode
  get isRpgApiMode() {
    return USE_RPG_API;
  },

  // Raw Prisma client for website (always available)
  get $prisma() {
    return prismaMain;
  },
};

export default db;

// ============================================================================
// Cross-Database Helpers
// ============================================================================

/**
 * Get CritUser by ID with optional RpgPlayer data
 * Handles cross-database resolution
 */
export async function getUserWithRpgPlayer(userId: string) {
  const user = await websiteDb.user.findUnique({
    where: { id: userId },
    include: {
      accounts: true,
      rpgPlayer: !USE_RPG_API, // Only include if direct DB access
    },
  });

  if (!user) return null;

  // If using API, fetch RpgPlayer separately
  if (USE_RPG_API) {
    const rpgPlayer = await rpgApi.players.findByUserId(userId);
    return { ...user, rpgPlayer };
  }

  return user;
}

/**
 * Ensure RpgPlayer exists for a CritUser
 * Creates one if it doesn't exist
 */
export async function ensureRpgPlayer(userId: string, displayName?: string) {
  if (USE_RPG_API) {
    // Check via API
    let player = await rpgApi.players.findByUserId(userId);
    if (!player) {
      player = await rpgApi.players.create({
        userId,
        displayName: displayName || null,
        defaultRole: 'player',
        gameSettings: {},
      });
    }
    return player;
  } else {
    // Direct Prisma upsert
    return prismaMain.rpgPlayer.upsert({
      where: { userId },
      create: {
        userId,
        displayName,
        defaultRole: 'player',
        gameSettings: {},
      },
      update: {},
    });
  }
}

/**
 * Get worlds owned by a user
 */
export async function getUserWorlds(userId: string) {
  if (USE_RPG_API) {
    const result = await rpgApi.worlds.findMany({ ownerId: userId });
    return result.worlds;
  } else {
    return prismaMain.rpgWorld.findMany({
      where: { ownerId: userId },
      orderBy: { updatedAt: 'desc' },
    });
  }
}

/**
 * Get campaigns a user is part of
 */
export async function getUserCampaigns(userId: string) {
  if (USE_RPG_API) {
    // Get player first
    const player = await rpgApi.players.findByUserId(userId);
    if (!player) return [];

    const result = await rpgApi.campaigns.findMany({ ownerId: player.id });
    return result.campaigns;
  } else {
    // Direct query with joins
    const player = await prismaMain.rpgPlayer.findUnique({
      where: { userId },
      include: {
        ownedCampaigns: true,
        campaignMemberships: {
          include: { campaign: true },
        },
      },
    });

    if (!player) return [];

    // Combine owned and member campaigns
    const memberCampaigns = player.campaignMemberships.map(m => m.campaign);
    return [...player.ownedCampaigns, ...memberCampaigns];
  }
}
