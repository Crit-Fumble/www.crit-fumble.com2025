/**
 * Core Concepts Database Client (DigitalOcean)
 *
 * This client connects to the Core Concepts RPG/game database which contains:
 * - RpgPlayer (independent player/user identity)
 * - Auth.js tables (Account, Session, VerificationToken)
 * - All RPG models (Campaigns, Worlds, Sheets, Sessions, etc.)
 * - NO references to website database (CritUser)
 */

import { PrismaClient } from '@prisma/client-concepts'

const globalForPrisma = globalThis as unknown as {
  prismaConcepts: PrismaClient | undefined
}

export const prismaConcepts = globalForPrisma.prismaConcepts ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prismaConcepts = prismaConcepts
}

export default prismaConcepts
