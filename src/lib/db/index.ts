/**
 * Database Clients Export
 *
 * This project uses a hybrid database architecture:
 * - Main Website DB (Neon): Platform users, payments, website features
 * - Core Concepts DB (DigitalOcean): RPG data, game sessions, independent player system
 *
 * The databases are completely independent. The only connection is a one-way
 * reference from CritUser.coreConceptsPlayerId → RpgPlayer.id
 *
 * NOTE: Core Concepts is optional - the website will function even if it's unavailable.
 */

export { prismaMain } from './main'
export { prismaConcepts, coreConceptsAvailable, safeCoreConceptsQuery } from './core-concepts'

// Legacy export for backward compatibility (points to main database)
export { prismaMain as prisma } from './main'
