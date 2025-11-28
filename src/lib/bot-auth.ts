import 'server-only'
import { NextRequest } from 'next/server'
import { isOwnerDiscordId, isAdminDiscordId, type UserRole } from './permissions'

/**
 * Bot Authentication for FumbleBot
 *
 * Requires TWO headers for secure authentication:
 * 1. X-Discord-Bot-Id: The bot's Discord Application ID
 * 2. X-Bot-Secret: A shared secret known only to the bot and website
 *
 * The bot's Discord ID should be added to OWNER_DISCORD_IDS or ADMIN_DISCORD_IDS
 * in the environment variables.
 *
 * Environment variable required:
 * - BOT_API_SECRET: Shared secret for bot authentication
 *
 * Usage from FumbleBot:
 *   fetch('/api/wiki', {
 *     headers: {
 *       'X-Discord-Bot-Id': botDiscordId,
 *       'X-Bot-Secret': botApiSecret
 *     }
 *   })
 */

/**
 * Verify Discord bot authentication from request headers
 * Requires both bot ID and shared secret for security
 * Returns the bot's role if valid, null otherwise
 */
export function verifyBotAuth(request: NextRequest): { discordId: string; role: UserRole } | null {
  const botDiscordId = request.headers.get('X-Discord-Bot-Id')
  const botSecret = request.headers.get('X-Bot-Secret')

  // Require both headers
  if (!botDiscordId || !botSecret) return null

  // Verify the shared secret
  const expectedSecret = process.env.BOT_API_SECRET
  if (!expectedSecret || botSecret !== expectedSecret) {
    return null
  }

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
