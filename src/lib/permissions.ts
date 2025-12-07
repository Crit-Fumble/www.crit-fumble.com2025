import 'server-only'

/**
 * Permission System
 *
 * Admin status is determined by the isAdmin flag in the Core database.
 * This flag is passed through the session from the auth adapter.
 */

import { auth } from './auth'
import { CoreApiClient } from '@crit-fumble/core/client'

export type UserRole = 'admin' | 'user'

/**
 * Extended session user type with isAdmin from Core
 */
export interface SessionUser {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  discordId?: string
  isAdmin?: boolean
}

/**
 * Check if a user is an admin based on their session
 */
export function isAdmin(user: SessionUser | null | undefined): boolean {
  return user?.isAdmin === true
}

/**
 * Get user's role from their session data
 */
export function getRoleFromSession(user: SessionUser | null | undefined): UserRole {
  return isAdmin(user) ? 'admin' : 'user'
}

/**
 * Permission checks for wiki operations
 */
export function canEditWiki(role: UserRole): boolean {
  return role === 'admin'
}

export function canPublishWiki(role: UserRole): boolean {
  return role === 'admin'
}

export function canDeleteWiki(role: UserRole): boolean {
  return role === 'admin'
}

/**
 * Check if user can view wiki (admins only for now)
 */
export function canViewWiki(role: UserRole): boolean {
  return role === 'admin'
}

/**
 * Check if user can view activity feed (any authenticated user)
 */
export function canViewActivity(role: UserRole): boolean {
  return true // Any authenticated user
}

/**
 * Web Roles (for display purposes)
 */
export type WebRole = 'admin' | 'member'

export function toWebRole(role: UserRole): WebRole {
  return role === 'admin' ? 'admin' : 'member'
}

/**
 * Early Access System
 *
 * Only admins from specific Discord guilds can access authenticated pages.
 * Everyone else sees the "Coming Soon" landing page.
 */

// Parse allowed guild IDs from environment
function parseDiscordIds(envVar: string | undefined): string[] {
  if (!envVar) return []
  return envVar
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
}

const allowedGuildIds = parseDiscordIds(process.env.ALLOWED_GUILD_IDS)

/**
 * Check if a user has early access based on admin status or guild membership
 *
 * @param user - The session user
 * @returns Promise<boolean> - True if user has early access
 */
export async function hasEarlyAccess(user: SessionUser | null | undefined): Promise<boolean> {
  // No user means no access
  if (!user) return false

  // Admins always have access
  if (isAdmin(user)) return true

  // If no allowed guilds configured, deny access (fail closed)
  if (allowedGuildIds.length === 0) {
    console.warn('[permissions] No ALLOWED_GUILD_IDS configured - denying early access')
    return false
  }

  // Check guild admin status via Core API SDK
  const discordId = user.discordId
  if (!discordId) return false

  try {
    const coreApiUrl = process.env.CORE_API_URL
    const coreApiSecret = process.env.CORE_API_SECRET

    if (!coreApiUrl || !coreApiSecret) {
      console.error('[permissions] Core API not configured')
      return false
    }

    const api = new CoreApiClient({
      baseUrl: coreApiUrl,
      apiKey: coreApiSecret,
    })

    // Check if user is admin in any allowed guild
    const { guilds } = await api.discord.getGuilds(discordId)

    // Discord ADMINISTRATOR permission bit
    const ADMINISTRATOR = BigInt(0x8)

    // Check if user is admin in any of the allowed guilds
    return guilds.some((guild) => {
      if (!allowedGuildIds.includes(guild.id)) return false
      // Owner always has admin
      if (guild.owner) return true
      // Check ADMINISTRATOR permission bit
      const permissions = BigInt(guild.permissions)
      return (permissions & ADMINISTRATOR) === ADMINISTRATOR
    })
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
export async function checkEarlyAccess(): Promise<{ hasAccess: boolean; user: SessionUser | null }> {
  const session = await auth()
  const user = session?.user as SessionUser | undefined ?? null
  const hasAccess = await hasEarlyAccess(user)
  return { hasAccess, user }
}

/**
 * Get user's role from session
 *
 * Returns the role and user for the authenticated user.
 */
export async function getUserRole(): Promise<{ role: UserRole; user: SessionUser | null }> {
  const session = await auth()
  const user = session?.user as SessionUser | undefined ?? null
  const role = getRoleFromSession(user)
  return { role, user }
}
