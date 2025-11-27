/**
 * Shared user types for client and server components
 *
 * IMPORTANT: This file must NOT import from @prisma/client
 * These types are duplicated from Prisma schema to be safe for client-side use
 *
 * Keep in sync with: prisma/schema.prisma
 */

/**
 * User subscription/feature tier levels
 * Order: LEGACY (-1), FREE (0), PRO (1), PLUS (2), MAX (3)
 */
export type UserTier = 'LEGACY' | 'FREE' | 'PRO' | 'PLUS' | 'MAX';

/**
 * Tier information for display purposes
 */
export const USER_TIER_INFO: Record<UserTier, { name: string; order: number }> = {
  LEGACY: { name: 'Legacy', order: -1 },
  FREE: { name: 'Free', order: 0 },
  PRO: { name: 'Pro', order: 1 },
  PLUS: { name: 'Plus', order: 2 },
  MAX: { name: 'Max', order: 3 },
};
