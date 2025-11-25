import { prisma } from '@/packages/cfg-lib/db'
import type { UserTier } from '@prisma/client'

/**
 * Available user roles
 */
export type UserRole = 'Player' | 'GameMaster' | 'Storyteller' | 'Worldbuilder' | 'Creator' | 'Moderator' | 'Admin'

/**
 * Role hierarchy levels (higher number = more permissions)
 */
export const ROLE_LEVELS = {
  Player: 0,
  GameMaster: 1,
  Storyteller: 2,
  Worldbuilder: 3,
  Creator: 4,
  Moderator: 5,
  Admin: 6,
} as const

/**
 * User with tier and role information
 */
export interface UserPermissions {
  id: string
  tier: UserTier
  isAdmin: boolean
  isOwner: boolean
  roles?: UserRole[]
}

/**
 * Tier hierarchy levels (higher number = more access)
 * LEGACY (-1) is admin-only and treated same as FREE for feature access
 */
export const TIER_LEVELS = {
  LEGACY: -1, // Admin-only tier, same features as FREE but grants 5 coins/month
  FREE: 0, // Default tier
  PRO: 1, // Paid tier (stubbed)
  PLUS: 2, // Paid tier (stubbed)
  MAX: 3, // Paid tier (stubbed)
} as const

/**
 * Monthly Crit-Coin allocations by tier
 * Positive values = coins granted to user each month
 * Negative values = coins cost to platform each month (paid tiers)
 */
export const MONTHLY_COINS_BY_TIER = {
  LEGACY: 5, // Legacy members (5+ years, admin-assigned) get 5 coins/month
  FREE: 0, // Free tier - no coins given
  PRO: -1, // Paid tier - costs platform (stubbed, actual amount TBD)
  PLUS: -1, // Paid tier - costs platform (stubbed, actual amount TBD)
  MAX: -1, // Paid tier - costs platform (stubbed, actual amount TBD)
} as const

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
 * Check if user has a specific tier or higher
 */
export function hasTierOrHigher(userTier: UserTier, requiredTier: UserTier): boolean {
  return TIER_LEVELS[userTier] >= TIER_LEVELS[requiredTier]
}

/**
 * Check if user is admin or owner
 */
export function isAdminOrOwner(user: { isAdmin: boolean; isOwner: boolean }): boolean {
  return user.isAdmin || user.isOwner
}

/**
 * Check if user is owner
 */
export function isOwner(user: { isOwner: boolean }): boolean {
  return user.isOwner
}

/**
 * Parse roles from JSON
 */
export function parseRoles(rolesJson: unknown): UserRole[] {
  if (!rolesJson) return []
  if (Array.isArray(rolesJson)) return rolesJson as UserRole[]
  if (typeof rolesJson === 'string') {
    try {
      const parsed = JSON.parse(rolesJson)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

/**
 * Check if user has a specific role
 */
export function hasRole(user: { roles?: UserRole[] | unknown; isOwner?: boolean }, role: UserRole): boolean {
  // Owners have all roles by default
  if (user.isOwner) return true

  const roles = parseRoles(user.roles)
  return roles.includes(role)
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(user: { roles?: UserRole[] | unknown; isOwner?: boolean }, roles: UserRole[]): boolean {
  // Owners have all roles by default
  if (user.isOwner) return true

  const userRoles = parseRoles(user.roles)
  return roles.some(role => userRoles.includes(role))
}

/**
 * Check if user has all of the specified roles
 */
export function hasAllRoles(user: { roles?: UserRole[] | unknown; isOwner?: boolean }, roles: UserRole[]): boolean {
  // Owners have all roles by default
  if (user.isOwner) return true

  const userRoles = parseRoles(user.roles)
  return roles.every(role => userRoles.includes(role))
}

/**
 * Check if user has a role with a specific level or higher
 */
export function hasRoleLevel(user: { roles?: UserRole[] | unknown; isOwner?: boolean }, minLevel: number): boolean {
  // Owners have all roles by default
  if (user.isOwner) return true

  const userRoles = parseRoles(user.roles)
  return userRoles.some(role => ROLE_LEVELS[role] >= minLevel)
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
 * Get role display information
 */
export function getRoleInfo(role: UserRole): { name: string; color: string; description: string } {
  const roleInfo: Record<UserRole, { name: string; color: string; description: string }> = {
    Player: {
      name: 'Player',
      color: 'bg-gray-600 text-white',
      description: 'Can join and play in campaigns',
    },
    GameMaster: {
      name: 'Game Master',
      color: 'bg-blue-600 text-white',
      description: 'Can run campaigns and manage game sessions',
    },
    Storyteller: {
      name: 'Storyteller',
      color: 'bg-green-600 text-white',
      description: 'Can create and edit world histories and lore',
    },
    Worldbuilder: {
      name: 'Worldbuilder',
      color: 'bg-purple-600 text-white',
      description: 'Can create and manage worlds and universes',
    },
    Creator: {
      name: 'Creator',
      color: 'bg-orange-600 text-white',
      description: 'Can create and publish tiles, assets, and collections',
    },
    Moderator: {
      name: 'Moderator',
      color: 'bg-yellow-600 text-white',
      description: 'Can moderate content and manage community',
    },
    Admin: {
      name: 'Admin',
      color: 'bg-crit-purple-600 text-white',
      description: 'Can access admin panel and manage platform settings',
    },
  }
  return roleInfo[role]
}

/**
 * Check if user can access a feature
 * Features can require a minimum tier, admin, or owner status
 */
export function canAccessFeature(
  user: UserPermissions,
  feature: {
    minTier?: UserTier
    requiresAdmin?: boolean
    requiresOwner?: boolean
  }
): boolean {
  // Owner has access to everything
  if (user.isOwner) return true

  // Check owner requirement
  if (feature.requiresOwner) return false

  // Check admin requirement
  if (feature.requiresAdmin && !user.isAdmin) return false

  // Check tier requirement
  if (feature.minTier && !hasTierOrHigher(user.tier, feature.minTier)) {
    return false
  }

  return true
}

/**
 * Get tier display name
 */
export function getTierDisplayName(tier: UserTier): string {
  const names: Record<UserTier, string> = {
    FREE: 'Free',
    LEGACY: 'Legacy',
    PRO: 'Pro',
    PLUS: 'Plus',
    MAX: 'Max',
  }
  return names[tier]
}

/**
 * Get monthly coin allocation for a tier
 */
export function getMonthlyCoins(tier: UserTier): number {
  return MONTHLY_COINS_BY_TIER[tier]
}

/**
 * Get tier color for UI (Tailwind classes)
 */
export function getTierColor(tier: UserTier): {
  bg: string
  text: string
  border: string
} {
  const colors: Record<
    UserTier,
    { bg: string; text: string; border: string }
  > = {
    FREE: {
      bg: 'bg-gray-100 dark:bg-gray-800',
      text: 'text-gray-700 dark:text-gray-300',
      border: 'border-gray-300 dark:border-gray-600',
    },
    LEGACY: {
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-300 dark:border-amber-600',
    },
    PRO: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-300 dark:border-blue-600',
    },
    PLUS: {
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-300 dark:border-purple-600',
    },
    MAX: {
      bg: 'bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30',
      text: 'text-orange-700 dark:text-orange-300',
      border: 'border-orange-300 dark:border-orange-600',
    },
  }
  return colors[tier]
}

/**
 * Get role badge text and color
 */
export function getRoleBadge(user: {
  isAdmin: boolean
  isOwner: boolean
}): { text: string; color: string } | null {
  if (user.isOwner) {
    return {
      text: 'Owner',
      color: 'bg-red-600 text-white',
    }
  }
  if (user.isAdmin) {
    return {
      text: 'Admin',
      color: 'bg-crit-purple-600 text-white',
    }
  }
  return null
}

/**
 * Tier feature limits
 * Define what each tier can do
 * Note: LEGACY has same features as FREE, but gets monthly coins
 * PRO/PLUS/MAX features are stubbed out (TBD when features are implemented)
 */
export const TIER_FEATURES = {
  // Max number of worlds a user can create
  maxWorlds: {
    FREE: 3,
    LEGACY: 3, // Same as FREE
    PRO: 10, // TBD - stubbed for future
    PLUS: 25, // TBD - stubbed for future
    MAX: Infinity, // TBD - stubbed for future
  },
  // Max number of characters per world
  maxCharactersPerWorld: {
    FREE: 5,
    LEGACY: 5, // Same as FREE
    PRO: 15, // TBD - stubbed for future
    PLUS: 30, // TBD - stubbed for future
    MAX: Infinity, // TBD - stubbed for future
  },
  // Max storage for assets (in MB)
  maxStorageMB: {
    FREE: 100,
    LEGACY: 100, // Same as FREE
    PRO: 500, // TBD - stubbed for future
    PLUS: 2000, // TBD - stubbed for future
    MAX: Infinity, // TBD - stubbed for future
  },
  // Can use advanced features (TBD)
  canUseAdvancedFeatures: {
    FREE: false,
    LEGACY: false,
    PRO: false, // TBD
    PLUS: false, // TBD
    MAX: false, // TBD
  },
  // Can access AI features (TBD)
  canUseAI: {
    FREE: false,
    LEGACY: false,
    PRO: false, // TBD
    PLUS: false, // TBD
    MAX: false, // TBD
  },
  // Can use custom branding (TBD)
  canUseCustomBranding: {
    FREE: false,
    LEGACY: false,
    PRO: false, // TBD
    PLUS: false, // TBD
    MAX: false, // TBD
  },
  // Can export data (TBD)
  canExportData: {
    FREE: false,
    LEGACY: false,
    PRO: false, // TBD
    PLUS: false, // TBD
    MAX: false, // TBD
  },
  // Can use API (TBD)
  canUseAPI: {
    FREE: false,
    LEGACY: false,
    PRO: false, // TBD
    PLUS: false, // TBD
    MAX: false, // TBD
  },
} as const

/**
 * Get feature limit for a user's tier
 */
export function getFeatureLimit<K extends keyof typeof TIER_FEATURES>(
  tier: UserTier,
  feature: K
): (typeof TIER_FEATURES)[K][UserTier] {
  return TIER_FEATURES[feature][tier] as (typeof TIER_FEATURES)[K][UserTier]
}

/**
 * Check if user can perform an action based on their tier
 */
export function canPerformAction(
  tier: UserTier,
  action: keyof typeof TIER_FEATURES
): boolean {
  const value = TIER_FEATURES[action][tier]
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value > 0
  return true
}

/**
 * Get tier pricing information (placeholder - implement with Stripe)
 */
export function getTierPricing(tier: UserTier): {
  price: number
  interval: 'month' | 'year'
  features: string[]
} | null {
  const pricing: Record<UserTier, { price: number; interval: 'month' | 'year'; features: string[] } | null> = {
    FREE: null,
    LEGACY: null,
    PRO: {
      price: 9.99,
      interval: 'month' as const,
      features: [
        'Up to 10 worlds',
        'Up to 15 characters per world',
        '500 MB storage',
        'Advanced features',
        'Data export',
        'API access',
      ],
    },
    PLUS: {
      price: 19.99,
      interval: 'month' as const,
      features: [
        'Up to 25 worlds',
        'Up to 30 characters per world',
        '2 GB storage',
        'All Pro features',
        'AI-powered tools',
        'Priority support',
      ],
    },
    MAX: {
      price: 49.99,
      interval: 'month' as const,
      features: [
        'Unlimited worlds',
        'Unlimited characters',
        'Unlimited storage',
        'All Plus features',
        'Custom branding',
        'White-label options',
        'Dedicated support',
      ],
    },
  }

  return pricing[tier]
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
