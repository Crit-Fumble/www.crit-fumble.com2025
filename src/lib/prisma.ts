/**
 * Legacy prisma.ts export
 * @deprecated Use '@/lib/db' instead for explicit client imports
 *
 * Import pattern:
 * import { prismaMain } from '@/lib/db'        // Website database
 * import { prismaConcepts } from '@/lib/db'    // Core Concepts database
 */
export { prismaMain as prisma, prismaMain, prismaConcepts } from './db'
