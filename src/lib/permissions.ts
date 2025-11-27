/**
 * Permission Utilities (Server-side with Database Access)
 *
 * This module re-exports all client-safe utilities from permissions-client.ts
 * and adds server-only functions that require database access.
 *
 * For client components, import from '@/lib/permissions-client' instead.
 */

import { prisma } from '@/lib/db'

// Re-export everything from the client-safe module
export * from './permissions-client'

// Import types we need for server functions
import type { UserRole, UserTier, UserPermissions } from './permissions-client'
import { parseRoles, getFeatureLimit } from './permissions-client'

/**
 * Get user's tier and role information
 */
export async function getUserPermissions(userId: string): Promise<UserPermissions | null> {
  const user = await prisma.critUser.findUnique({
    where: { id: userId },
    select: {
      id: true,
      tier: true,
      isAdmin: true,
      isOwner: true,
    },
  })

  return user
}

/**
 * Grant a role to a user
 */
export async function grantRole(userId: string, role: UserRole): Promise<void> {
  const user = await prisma.critUser.findUnique({
    where: { id: userId },
    select: { roles: true },
  })

  if (!user) throw new Error('User not found')

  const currentRoles = parseRoles(user.roles)
  if (currentRoles.includes(role)) return // Already has the role

  const newRoles = [...currentRoles, role]
  await prisma.critUser.update({
    where: { id: userId },
    data: { roles: newRoles },
  })
}

/**
 * Revoke a role from a user
 */
export async function revokeRole(userId: string, role: UserRole): Promise<void> {
  const user = await prisma.critUser.findUnique({
    where: { id: userId },
    select: { roles: true },
  })

  if (!user) throw new Error('User not found')

  const currentRoles = parseRoles(user.roles)
  const newRoles = currentRoles.filter(r => r !== role)

  await prisma.critUser.update({
    where: { id: userId },
    data: { roles: newRoles },
  })
}

/**
 * Set all roles for a user
 */
export async function setRoles(userId: string, roles: UserRole[]): Promise<void> {
  await prisma.critUser.update({
    where: { id: userId },
    data: { roles: roles },
  })
}

/**
 * Check if user has reached a limit for their tier
 */
export async function hasReachedLimit(
  userId: string,
  limitType: 'worlds' | 'storage'
): Promise<boolean> {
  const user = await getUserPermissions(userId)
  if (!user) return true

  // Owner and admin have no limits
  if (user.isOwner || user.isAdmin) return false

  switch (limitType) {
    case 'worlds': {
      const worldCount = await prisma.rpgWorld.count({
        where: { ownerId: userId },
      })
      const limit = getFeatureLimit(user.tier, 'maxWorlds')
      return worldCount >= limit
    }

    case 'storage': {
      // TODO: Implement storage calculation
      // For now, return false
      return false
    }

    default:
      return false
  }
}
