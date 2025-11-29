import 'server-only'

/**
 * Permission System
 *
 * Re-exports from @crit-fumble/web-auth with app-specific configuration.
 *
 * With JWT sessions, the Discord ID is available directly in the session
 * (set by the jwt callback in createCoreAuth). No database query needed.
 */

import {
  createPermissions,
  type UserRole,
} from '@crit-fumble/web-auth'
import { auth } from './auth'

// Create permissions instance with environment variables
const permissions = createPermissions({
  ownerIds: process.env.OWNER_DISCORD_IDS,
  adminIds: process.env.ADMIN_DISCORD_IDS,
})

// Re-export types
export type { UserRole }

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
 * Note: 'user' role from web-auth maps to 'member' for display
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
 * Extended session user type with discordId from JWT
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
 * With JWT sessions, discordId is stored in the token and available
 * directly on the session user. No database query needed.
 */
export async function getUserDiscordId(userId: string): Promise<string | null> {
  const session = await auth()
  if (!session?.user || session.user.id !== userId) return null
  return (session.user as SessionUser).discordId ?? null
}

/**
 * Get user's role from session
 *
 * Uses the discordId from the JWT session to determine role.
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
