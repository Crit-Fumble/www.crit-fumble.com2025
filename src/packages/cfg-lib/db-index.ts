/**
 * Database Client Exports
 *
 * This module provides access to the Main CFG Database (PostgreSQL):
 * - prismaMain: Main CFG Database (auth, economy, campaigns)
 *
 * Note: FoundryVTT instances use their native LevelDB storage (no PostgreSQL client needed).
 *
 * Import examples:
 *
 * // Get main database client
 * import { prismaMain } from '@/packages/cfg-lib/db'
 *
 * // Legacy compatibility
 * import { prisma } from '@/packages/cfg-lib/db'
 */

export { prismaMain, default as prismaMainDefault } from './db-main'

// Legacy compatibility: export prismaMain as 'prisma' for existing code
export { prismaMain as prisma } from './db-main'

// Convenience re-exports
export type { PrismaClient } from '@prisma/client'
