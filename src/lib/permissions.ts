import 'server-only'

/**
 * Permission System
 *
 * Admin/Owner roles are determined by Discord IDs in environment variables.
 * This keeps permissions simple and out of the database.
 *
 * With database sessions, the Discord ID is available directly in the session
 * (user.id is the Discord ID since we use profile.id as the user ID).
 */

import { auth } from './auth'

export type UserRole = 'owner' | 'admin' | 'user'

/**
 * Configuration for the permission system
 */
interface PermissionConfig {
  ownerIds?: string | string[]
  adminIds?: string | string[]
}

/**
 * Parse comma-separated Discord IDs from environment variable
 */
function parseDiscordIds(envVar: string | undefined): string[] {
  if (!envVar) return []
  return envVar
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
}

/**
 * Create a permission checker with configured owner/admin IDs
 */
function createPermissions(config: PermissionConfig = {}) {
  const ownerIds = Array.isArray(config.ownerIds)
    ? config.ownerIds
    : parseDiscordIds(config.ownerIds)

  const adminIds = Array.isArray(config.adminIds)
    ? config.adminIds
    : parseDiscordIds(config.adminIds)

  function isOwnerDiscordId(discordId: string): boolean {
    return ownerIds.includes(discordId)
  }

  function isAdminDiscordId(discordId: string): boolean {
    return adminIds.includes(discordId) || isOwnerDiscordId(discordId)
  }

  function getRoleFromDiscordId(discordId: string | null): UserRole {
    if (!discordId) return 'user'
    if (isOwnerDiscordId(discordId)) return 'owner'
    if (isAdminDiscordId(discordId)) return 'admin'
    return 'user'
  }

  function canEditWiki(role: UserRole): boolean {
    return role === 'owner' || role === 'admin'
  }

  function canPublishWiki(role: UserRole): boolean {
    return role === 'owner'
  }

  function canDeleteWiki(role: UserRole): boolean {
    return role === 'owner'
  }

  return {
    ownerIds,
    adminIds,
    isOwnerDiscordId,
    isAdminDiscordId,
    getRoleFromDiscordId,
    canEditWiki,
    canPublishWiki,
    canDeleteWiki,
  }
}

// Create permissions instance with environment variables
const permissions = createPermissions({
  ownerIds: process.env.OWNER_DISCORD_IDS,
  adminIds: process.env.ADMIN_DISCORD_IDS,
})

/**
 * Early Access System
 *
 * Only admins from specific Discord guilds can access authenticated pages.
 * Everyone else sees the "Coming Soon" landing page.
 */

// Parse allowed guild IDs from environment
const allowedGuildIds = parseDiscordIds(process.env.ALLOWED_GUILD_IDS)

/**
 * Check if a user has early access based on guild admin status
 *
 * @param discordId - The user's Discord ID
 * @returns Promise<boolean> - True if user is an admin in an allowed guild
 */
export async function hasEarlyAccess(discordId: string | null): Promise<boolean> {
  // No Discord ID means no access
  if (!discordId) return false

  // Owners always have access
  if (isOwnerDiscordId(discordId)) return true

  // Site admins always have access
  if (isAdminDiscordId(discordId)) return true

  // If no allowed guilds configured, deny access (fail closed)
  if (allowedGuildIds.length === 0) {
    console.warn('[permissions] No ALLOWED_GUILD_IDS configured - denying early access')
    return false
  }

  // Check guild admin status via Core API
  try {
    const coreApiUrl = process.env.CORE_API_URL
    const coreApiSecret = process.env.CORE_API_SECRET

    if (!coreApiUrl || !coreApiSecret) {
      console.error('[permissions] Core API not configured')
      return false
    }

    // Check if user is admin in any allowed guild
    const response = await fetch(`${coreApiUrl}/api/discord/user/${discordId}/guilds`, {
      headers: {
        'X-Core-Secret': coreApiSecret,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('[permissions] Failed to fetch user guilds:', response.status)
      return false
    }

    const userGuilds = await response.json() as Array<{ id: string; isAdmin: boolean }>

    // Check if user is admin in any of the allowed guilds
    return userGuilds.some(
      (guild) => allowedGuildIds.includes(guild.id) && guild.isAdmin
    )
  } catch (error) {
    console.error('[permissions] Error checking early access:', error)
    return false
  }
}

/**
 * Check early access from session
 *
 * Use this in middleware or page components to gate access
 */
export async function checkEarlyAccess(): Promise<{ hasAccess: boolean; discordId: string | null }> {
  const session = await auth()
  const discordId = (session?.user as SessionUser | undefined)?.discordId ?? null
  const hasAccess = await hasEarlyAccess(discordId)
  return { hasAccess, discordId }
}

// Re-export permission checks
export const {
  isOwnerDiscordId,
  isAdminDiscordId,
  getRoleFromDiscordId,
  canEditWiki,
  canPublishWiki,
  canDeleteWiki,
} = permissions

/**
 * Web Roles (for display purposes)
 * - owner: Full access, site owner
 * - admin: Can edit/publish wiki, manage content
 * - member: Authenticated user, read-only access to protected content
 *
 * Note: 'user' role maps to 'member' for display
 */
export type WebRole = 'owner' | 'admin' | 'member'

export function toWebRole(role: UserRole): WebRole {
  return role === 'user' ? 'member' : role
}

/**
 * Check if user can view wiki (admins and owners only for now)
 */
export function canViewWiki(role: UserRole): boolean {
  return role === 'owner' || role === 'admin'
}

/**
 * Check if user can view activity feed (any authenticated user)
 */
export function canViewActivity(role: UserRole): boolean {
  return role === 'owner' || role === 'admin' || role === 'user'
}

/**
 * Extended session user type with discordId from session
 */
interface SessionUser {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  discordId?: string
}

/**
 * Get a user's Discord ID from the session
 *
 * With database sessions, discordId is stored on the session user.
 */
export async function getUserDiscordId(userId: string): Promise<string | null> {
  const session = await auth()
  if (!session?.user || session.user.id !== userId) return null
  return (session.user as SessionUser).discordId ?? null
}

/**
 * Get user's role from session
 *
 * Uses the discordId from the session to determine role.
 * Returns the role and Discord ID for the authenticated user.
 */
export async function getUserRole(userId: string): Promise<{ role: UserRole; discordId: string | null }> {
  const discordId = await getUserDiscordId(userId)
  const role = permissions.getRoleFromDiscordId(discordId)
  return { role, discordId }
}

/**
 * Get user's role directly from a Discord ID
 *
 * Use this when you already have the discordId (e.g., from session)
 * to avoid an extra auth() call.
 */
export function getRoleFromSession(discordId: string | null): { role: UserRole; discordId: string | null } {
  const role = permissions.getRoleFromDiscordId(discordId)
  return { role, discordId }
}

// Export createPermissions for use in bot-auth
export { createPermissions }
