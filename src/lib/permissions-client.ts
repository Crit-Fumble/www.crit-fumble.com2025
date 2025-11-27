/**
 * Client-safe Permission Utilities
 *
 * This file contains types and pure functions that can be safely used
 * in client components. It has NO database dependencies.
 *
 * For server-side operations that require database access,
 * import from '@/lib/permissions' instead.
 */

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
 * User tier levels (higher number = more access)
 * LEGACY (-1) is admin-only and treated same as FREE for feature access
 */
export type UserTier = 'LEGACY' | 'FREE' | 'PRO' | 'PLUS' | 'MAX'

/**
 * Tier hierarchy levels
 */
export const TIER_LEVELS = {
  LEGACY: -1,
  FREE: 0,
  PRO: 1,
  PLUS: 2,
  MAX: 3,
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
 * Monthly Crit-Coin allocations by tier
 */
export const MONTHLY_COINS_BY_TIER = {
  LEGACY: 5,
  FREE: 0,
  PRO: -1,
  PLUS: -1,
  MAX: -1,
} as const

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
export function isOwnerCheck(user: { isOwner: boolean }): boolean {
  return user.isOwner
}

/**
 * Check if user has a specific role
 */
export function hasRole(user: { roles?: UserRole[] | unknown; isOwner?: boolean }, role: UserRole): boolean {
  if (user.isOwner) return true
  const roles = parseRoles(user.roles)
  return roles.includes(role)
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(user: { roles?: UserRole[] | unknown; isOwner?: boolean }, roles: UserRole[]): boolean {
  if (user.isOwner) return true
  const userRoles = parseRoles(user.roles)
  return roles.some(role => userRoles.includes(role))
}

/**
 * Check if user has all of the specified roles
 */
export function hasAllRoles(user: { roles?: UserRole[] | unknown; isOwner?: boolean }, roles: UserRole[]): boolean {
  if (user.isOwner) return true
  const userRoles = parseRoles(user.roles)
  return roles.every(role => userRoles.includes(role))
}

/**
 * Check if user has a role with a specific level or higher
 */
export function hasRoleLevel(user: { roles?: UserRole[] | unknown; isOwner?: boolean }, minLevel: number): boolean {
  if (user.isOwner) return true
  const userRoles = parseRoles(user.roles)
  return userRoles.some(role => ROLE_LEVELS[role] >= minLevel)
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
 */
export const TIER_FEATURES = {
  maxWorlds: {
    FREE: 3,
    LEGACY: 3,
    PRO: 10,
    PLUS: 25,
    MAX: Infinity,
  },
  maxCharactersPerWorld: {
    FREE: 5,
    LEGACY: 5,
    PRO: 15,
    PLUS: 30,
    MAX: Infinity,
  },
  maxStorageMB: {
    FREE: 100,
    LEGACY: 100,
    PRO: 500,
    PLUS: 2000,
    MAX: Infinity,
  },
  canUseAdvancedFeatures: {
    FREE: false,
    LEGACY: false,
    PRO: false,
    PLUS: false,
    MAX: false,
  },
  canUseAI: {
    FREE: false,
    LEGACY: false,
    PRO: false,
    PLUS: false,
    MAX: false,
  },
  canUseCustomBranding: {
    FREE: false,
    LEGACY: false,
    PRO: false,
    PLUS: false,
    MAX: false,
  },
  canExportData: {
    FREE: false,
    LEGACY: false,
    PRO: false,
    PLUS: false,
    MAX: false,
  },
  canUseAPI: {
    FREE: false,
    LEGACY: false,
    PRO: false,
    PLUS: false,
    MAX: false,
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
 * Check if user can access a feature
 */
export function canAccessFeature(
  user: UserPermissions,
  feature: {
    minTier?: UserTier
    requiresAdmin?: boolean
    requiresOwner?: boolean
  }
): boolean {
  if (user.isOwner) return true
  if (feature.requiresOwner) return false
  if (feature.requiresAdmin && !user.isAdmin) return false
  if (feature.minTier && !hasTierOrHigher(user.tier, feature.minTier)) {
    return false
  }
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
