/**
 * Core Concepts Database Client (DigitalOcean)
 *
 * This client connects to the Core Concepts RPG/game database which contains:
 * - RpgPlayer (independent player/user identity)
 * - Auth.js tables (Account, Session, VerificationToken)
 * - All RPG models (Campaigns, Worlds, Sheets, Sessions, etc.)
 * - NO references to website database (CritUser)
 *
 * NOTE: This is an optional dependency. The website will function even if
 * Core Concepts database is unavailable. All queries should handle errors gracefully.
 */

import { PrismaClient } from '@prisma/client-concepts'

const globalForPrisma = globalThis as unknown as {
  prismaConcepts: PrismaClient | undefined
  coreConceptsAvailable: boolean | undefined
}

// Check if Core Concepts database URL is configured
const CORE_CONCEPTS_DB_URL = process.env.CORE_CONCEPTS_DATABASE_URL

let prismaConcepts: PrismaClient | null = null
let coreConceptsAvailable = false

if (CORE_CONCEPTS_DB_URL) {
  try {
    prismaConcepts = globalForPrisma.prismaConcepts ?? new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })

    coreConceptsAvailable = globalForPrisma.coreConceptsAvailable ?? true

    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prismaConcepts = prismaConcepts
      globalForPrisma.coreConceptsAvailable = true
    }
  } catch (error) {
    console.warn('Core Concepts database unavailable:', error)
    coreConceptsAvailable = false
  }
} else {
  console.info('Core Concepts database URL not configured - RPG features will be unavailable')
}

/**
 * Helper function to safely execute Core Concepts queries
 * Returns null if database is unavailable or query fails
 */
export async function safeCoreConceptsQuery<T>(
  queryFn: () => Promise<T>
): Promise<T | null> {
  if (!prismaConcepts || !coreConceptsAvailable) {
    return null
  }

  try {
    return await queryFn()
  } catch (error) {
    console.error('Core Concepts query failed:', error)
    return null
  }
}

export { prismaConcepts, coreConceptsAvailable }
export default prismaConcepts
