import 'server-only'
import { NextRequest } from 'next/server'
import { isOwnerDiscordId, isAdminDiscordId, type UserRole } from './permissions'

/**
 * Bot Authentication for FumbleBot
 *
 * Allows the Discord bot to authenticate with the API using its Discord Bot User ID.
 * The bot's Discord ID should be added to OWNER_DISCORD_IDS or ADMIN_DISCORD_IDS
 * in the environment variables.
 *
 * Usage from FumbleBot:
 *   fetch('/api/wiki', {
 *     headers: { 'X-Discord-Bot-Id': botDiscordId }
 *   })
 */

/**
 * Verify Discord bot authentication from request header
 * Returns the bot's role if valid, null otherwise
 */
export function verifyBotAuth(request: NextRequest): { discordId: string; role: UserRole } | null {
  const botDiscordId = request.headers.get('X-Discord-Bot-Id')

  if (!botDiscordId) return null

  // Check if the bot's Discord ID is in our allowed lists
  if (isOwnerDiscordId(botDiscordId)) {
    return { discordId: botDiscordId, role: 'owner' }
  }

  if (isAdminDiscordId(botDiscordId)) {
    return { discordId: botDiscordId, role: 'admin' }
  }

  return null
}

/**
 * Get a service account ID for bot-created content
 * Uses the bot's Discord ID prefixed to identify bot authorship
 */
export function getBotServiceAccountId(discordId: string): string {
  return `bot:${discordId}`
}
