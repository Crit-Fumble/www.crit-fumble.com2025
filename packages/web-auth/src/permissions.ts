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

// Use a generic type for PrismaClient to avoid peer dependency issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaClientLike = any

export type UserRole = 'owner' | 'admin' | 'user'

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
 * Configuration for the permission system
 */
export interface PermissionConfig {
  /**
   * Comma-separated list of owner Discord IDs
   * Or provide directly as an array
   */
  ownerIds?: string | string[]

  /**
   * Comma-separated list of admin Discord IDs
   * Or provide directly as an array
   */
  adminIds?: string | string[]
}

/**
 * Create a permission checker with configured owner/admin IDs
 *
 * @example
 * const permissions = createPermissions({
 *   ownerIds: process.env.OWNER_DISCORD_IDS,
 *   adminIds: process.env.ADMIN_DISCORD_IDS,
 * })
 *
 * const role = permissions.getRoleFromDiscordId(discordId)
 * if (permissions.canEditWiki(role)) { ... }
 */
export function createPermissions(config: PermissionConfig = {}) {
  const ownerIds = Array.isArray(config.ownerIds)
    ? config.ownerIds
    : parseDiscordIds(config.ownerIds)

  const adminIds = Array.isArray(config.adminIds)
    ? config.adminIds
    : parseDiscordIds(config.adminIds)

  /**
   * Check if a Discord ID is an owner
   */
  function isOwnerDiscordId(discordId: string): boolean {
    return ownerIds.includes(discordId)
  }

  /**
   * Check if a Discord ID is an admin (includes owners)
   */
  function isAdminDiscordId(discordId: string): boolean {
    return adminIds.includes(discordId) || isOwnerDiscordId(discordId)
  }

  /**
   * Get user's role based on their Discord ID
   */
  function getRoleFromDiscordId(discordId: string | null): UserRole {
    if (!discordId) return 'user'
    if (isOwnerDiscordId(discordId)) return 'owner'
    if (isAdminDiscordId(discordId)) return 'admin'
    return 'user'
  }

  /**
   * Check if a user can edit wiki pages
   * Owners and admins can edit, everyone else is read-only
   */
  function canEditWiki(role: UserRole): boolean {
    return role === 'owner' || role === 'admin'
  }

  /**
   * Check if a user can publish wiki pages
   * Only owners can publish
   */
  function canPublishWiki(role: UserRole): boolean {
    return role === 'owner'
  }

  /**
   * Check if a user can delete wiki pages
   * Only owners can delete
   */
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

/**
 * Get a user's Discord ID from their account
 *
 * @param prisma - Prisma client instance
 * @param userId - User ID from session
 */
export async function getUserDiscordId(
  prisma: PrismaClientLike,
  userId: string
): Promise<string | null> {
  const account = await (prisma as any).account.findFirst({
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
 * Get user's role from their user ID
 *
 * @param prisma - Prisma client instance
 * @param permissions - Permission checker from createPermissions
 * @param userId - User ID from session
 */
export async function getUserRole(
  prisma: PrismaClientLike,
  permissions: ReturnType<typeof createPermissions>,
  userId: string
): Promise<{ role: UserRole; discordId: string | null }> {
  const discordId = await getUserDiscordId(prisma, userId)
  const role = permissions.getRoleFromDiscordId(discordId)
  return { role, discordId }
}

// Default instance using environment variables
let defaultPermissions: ReturnType<typeof createPermissions> | null = null

/**
 * Get the default permissions instance (uses environment variables)
 * Lazily initialized to ensure env vars are available
 */
export function getDefaultPermissions(): ReturnType<typeof createPermissions> {
  if (!defaultPermissions) {
    defaultPermissions = createPermissions({
      ownerIds: process.env.OWNER_DISCORD_IDS,
      adminIds: process.env.ADMIN_DISCORD_IDS,
    })
  }
  return defaultPermissions
}
