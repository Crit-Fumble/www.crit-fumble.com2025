import 'server-only'

/**
 * Permission System
 *
 * Admin/Owner roles are determined by Discord IDs in environment variables.
 * This keeps permissions simple and out of the database.
 *
 * Environment variables:
 * - OWNER_DISCORD_IDS: Comma-separated Discord user IDs with full access
 * - ADMIN_DISCORD_IDS: Comma-separated Discord user IDs with admin access
 */

// Parse comma-separated Discord IDs from env
function parseDiscordIds(envVar: string | undefined): string[] {
  if (!envVar) return []
  return envVar.split(',').map(id => id.trim()).filter(Boolean)
}

// Get owner and admin IDs from environment
const OWNER_IDS = parseDiscordIds(process.env.OWNER_DISCORD_IDS)
const ADMIN_IDS = parseDiscordIds(process.env.ADMIN_DISCORD_IDS)

export type UserRole = 'owner' | 'admin' | 'user'

/**
 * Get a user's Discord ID from their account
 */
export async function getUserDiscordId(userId: string): Promise<string | null> {
  const { prisma } = await import('./db')

  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider: 'discord',
    },
    select: {
      providerAccountId: true,
    },
  })

  return account?.providerAccountId ?? null
}

/**
 * Check if a Discord ID is an owner
 */
export function isOwnerDiscordId(discordId: string): boolean {
  return OWNER_IDS.includes(discordId)
}

/**
 * Check if a Discord ID is an admin
 */
export function isAdminDiscordId(discordId: string): boolean {
  return ADMIN_IDS.includes(discordId) || isOwnerDiscordId(discordId)
}

/**
 * Get user's role based on their Discord ID
 */
export function getRoleFromDiscordId(discordId: string | null): UserRole {
  if (!discordId) return 'user'
  if (isOwnerDiscordId(discordId)) return 'owner'
  if (isAdminDiscordId(discordId)) return 'admin'
  return 'user'
}

/**
 * Check if a user can edit wiki pages
 * Owners and admins can edit, everyone else is read-only
 */
export function canEditWiki(role: UserRole): boolean {
  return role === 'owner' || role === 'admin'
}

/**
 * Check if a user can publish wiki pages
 * Only owners can publish
 */
export function canPublishWiki(role: UserRole): boolean {
  return role === 'owner'
}

/**
 * Check if a user can delete wiki pages
 * Only owners can delete
 */
export function canDeleteWiki(role: UserRole): boolean {
  return role === 'owner'
}

/**
 * Get user's role from session
 * Returns the role and Discord ID for the authenticated user
 */
export async function getUserRole(userId: string): Promise<{ role: UserRole; discordId: string | null }> {
  const discordId = await getUserDiscordId(userId)
  const role = getRoleFromDiscordId(discordId)
  return { role, discordId }
}
