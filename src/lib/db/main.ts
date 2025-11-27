import 'server-only'

/**
 * Main Website Database Client (Neon)
 *
 * This client connects to the Crit-Fumble website database which contains:
 * - User (auth.js users)
 * - Account, Session, VerificationToken (auth.js)
 * - WikiPage, WikiPageRevision (wiki system)
 */

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prismaMain: PrismaClient | undefined
}

export const prismaMain = globalForPrisma.prismaMain ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prismaMain = prismaMain
}

export default prismaMain
