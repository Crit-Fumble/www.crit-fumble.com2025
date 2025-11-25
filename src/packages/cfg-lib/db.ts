/**
 * Database Client Export
 *
 * This module exports the Main CFG Database client (PostgreSQL).
 * FoundryVTT instances use their native LevelDB storage and don't need a PostgreSQL client.
 *
 * For new code, prefer importing prismaMain explicitly:
 * import { prismaMain } from '@/packages/cfg-lib/db'
 */

export { prismaMain as prisma } from './db-main'
export { prismaMain } from './db-index'

// Re-export types
export type { PrismaClient } from '@prisma/client'
