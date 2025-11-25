/**
 * Main CFG Database Client (Digital Ocean Managed PostgreSQL)
 *
 * This client connects to the centralized Main CFG Database containing:
 * - User accounts, authentication, sessions
 * - Economy system (Crit-Coins, Story Credits, purchases)
 * - Campaign metadata, paid session tracking
 * - Premium content catalog
 * - Audit logs (immutable financial/security records)
 *
 * Environment variable: DATABASE_URL
 */

import { PrismaClient } from '@prisma/client'

const globalForPrismaMain = globalThis as unknown as {
  prismaMain: PrismaClient | undefined
}

export const prismaMain = globalForPrismaMain.prismaMain ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrismaMain.prismaMain = prismaMain
}

// Export as default for convenience
export default prismaMain
