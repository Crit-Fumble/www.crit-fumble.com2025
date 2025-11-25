/**
 * Admin Utilities
 *
 * Functions for checking admin access based on Discord IDs and developer privileges
 */

import { isDeveloper } from '@/packages/cfg-lib/developer-privileges'
import type { CritUser } from '@prisma/client'
import { prisma } from '@/lib/db'

/**
 * Get the list of Discord Admin IDs from environment
 */
export function getAdminDiscordIds(): string[] {
  const adminIds = process.env.DISCORD_ADMIN_IDS
  if (!adminIds) return []

  try {
    // Parse the JSON array from env var
    // Format: ['id1','id2','id3']
    const parsed = JSON.parse(adminIds)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error('Failed to parse DISCORD_ADMIN_IDS:', error)
    return []
  }
}

/**
 * Check if a user should have admin access based on env vars
 *
 * Admin access is granted if:
 * 1. User has developer privileges (verified fields match DEV_ env vars), OR
 * 2. User's verified Discord ID is in DISCORD_ADMIN_IDS
 *
 * @param user - The user to check
 * @returns true if user should have admin access
 */
export function checkAdminStatus(user: CritUser | null | undefined): boolean {
  if (!user) return false

  // Check developer privileges first
  if (isDeveloper(user)) {
    return true
  }

  // Check if user's Discord ID (either verified or OAuth-linked) is in admin list
  const adminIds = getAdminDiscordIds()
  if (user.verifiedDiscord && adminIds.includes(user.verifiedDiscord)) {
    return true
  }
  if (user.discordId && adminIds.includes(user.discordId)) {
    return true
  }

  return false
}

/**
 * Sync user's admin status in the database with env var checks
 * ONE-WAY FLAG: If env vars grant admin, set isAdmin=true in DB
 * Once admin, user stays admin (doesn't get revoked if env vars change)
 *
 * @param userId - The user ID to sync
 * @returns The updated admin status
 */
export async function syncAdminStatus(userId: string): Promise<boolean> {
  const user = await prisma.critUser.findUnique({
    where: { id: userId },
    select: {
      id: true,
      verifiedPhone: true,
      verifiedEmail: true,
      verifiedDiscord: true,
      discordId: true,
      isAdmin: true,
    },
  })

  if (!user) return false

  // If already admin, keep them admin (one-way flag)
  if (user.isAdmin) return true

  // Check if they should be granted admin
  const shouldBeAdmin = checkAdminStatus(user)

  // Only set to true, never unset
  if (shouldBeAdmin && !user.isAdmin) {
    await prisma.critUser.update({
      where: { id: userId },
      data: { isAdmin: true },
    })
    return true
  }

  return user.isAdmin
}

/**
 * Check if a user is an admin
 * Uses the persisted isAdmin field from the database
 *
 * @param user - The user to check
 * @returns true if user has admin access
 */
export function isAdmin(user: CritUser | null | undefined): boolean {
  if (!user) return false

  // Use persisted admin status
  return user.isAdmin
}

/**
 * Get the list of Owner emails from environment
 * Owners are the 4 founders who have access to Core Concepts management
 */
export function getOwnerEmails(): string[] {
  const ownerEmails = process.env.OWNER_EMAILS
  if (!ownerEmails) return []

  try {
    // Parse the JSON array from env var
    // Format: ['email1@example.com','email2@example.com','email3@example.com','email4@example.com']
    const parsed = JSON.parse(ownerEmails)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error('Failed to parse OWNER_EMAILS:', error)
    return []
  }
}

/**
 * Get the list of Owner Discord IDs from environment
 * Owners are the 4 founders who have access to Core Concepts management
 */
export function getOwnerDiscordIds(): string[] {
  const ownerIds = process.env.DISCORD_OWNER_IDS
  if (!ownerIds) return []

  try {
    // Parse the JSON array from env var
    // Format: ['id1','id2','id3','id4']
    const parsed = JSON.parse(ownerIds)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error('Failed to parse DISCORD_OWNER_IDS:', error)
    return []
  }
}

/**
 * Check if a user is one of the 4 owners
 * Owners have access to Core Concepts management and other founder-only features
 *
 * @param user - The user to check
 * @returns true if user is an owner
 */
export function isOwner(user: CritUser | null | undefined): boolean {
  if (!user) return false

  // Check if user's email is in owner emails list
  const ownerEmails = getOwnerEmails()
  if (user.email && ownerEmails.includes(user.email)) {
    return true
  }

  // Check if user's Discord ID is in owner list
  const ownerIds = getOwnerDiscordIds()
  if (user.verifiedDiscord && ownerIds.includes(user.verifiedDiscord)) {
    return true
  }
  if (user.discordId && ownerIds.includes(user.discordId)) {
    return true
  }

  return false
}

/**
 * Get the Discord server ID from environment
 */
export function getDiscordServerId(): string | null {
  return process.env.DISCORD_SERVER_ID || null
}
