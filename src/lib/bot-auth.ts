import 'server-only'
import { NextRequest } from 'next/server'
import { CoreApiClient } from '@crit-fumble/core/client'

/**
 * Bot Authentication for FumbleBot
 *
 * Requires TWO headers for secure authentication:
 * 1. X-Discord-Bot-Id: The bot's Discord Application ID
 * 2. X-Bot-Secret: A shared secret known only to the bot and website
 *
 * Bots authenticated via this method are treated as admin.
 */

const CORE_API_URL = process.env.CORE_API_URL
const CORE_API_SECRET = process.env.CORE_API_SECRET
const BOT_API_SECRET = process.env.BOT_API_SECRET

/**
 * Result of bot authentication
 */
interface BotAuthResult {
  discordId: string
  isAdmin: true // Bots are always admin
}

/**
 * Verify Discord bot authentication from request headers
 * Requires both bot ID and shared secret for security
 * Returns the bot info if valid, null otherwise
 */
export function verifyBotAuth(request: NextRequest): BotAuthResult | null {
  const botDiscordId = request.headers.get('X-Discord-Bot-Id')
  const headerSecret = request.headers.get('X-Bot-Secret')

  // Require both headers
  if (!botDiscordId || !headerSecret) return null

  // Require BOT_API_SECRET to be configured
  if (!BOT_API_SECRET) {
    console.error('[bot-auth] BOT_API_SECRET not configured')
    return null
  }

  // Verify the shared secret
  if (headerSecret !== BOT_API_SECRET) {
    console.warn('[bot-auth] Invalid bot secret')
    return null
  }

  // Bot is authenticated - treat as admin
  return { discordId: botDiscordId, isAdmin: true }
}

/**
 * Get or create a service account user for bot-created content
 * Creates a user record in Core API if one doesn't exist for this bot
 */
export async function getBotServiceAccountId(discordId: string): Promise<string> {
  if (!CORE_API_URL || !CORE_API_SECRET) {
    throw new Error('CORE_API_URL and CORE_API_SECRET must be configured')
  }

  const api = new CoreApiClient({
    baseUrl: CORE_API_URL,
    apiKey: CORE_API_SECRET,
  })

  const botUserId = `bot:${discordId}`
  const botName = 'FumbleBot'

  // Check if user exists
  const existingUser = await api.authAdapter.getUser(botUserId)
  if (existingUser) {
    return existingUser.id
  }

  // Create bot user
  const newUser = await api.authAdapter.createUser({
    id: botUserId,
    name: botName,
    email: `bot-${discordId}@fumblebot.local`,
  })

  return newUser.id
}
