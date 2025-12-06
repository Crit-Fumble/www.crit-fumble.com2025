import 'server-only'
import { NextRequest } from 'next/server'
import { type UserRole, createPermissions } from './permissions'
import { CoreApiClient } from '@crit-fumble/core/client'

/**
 * Bot Authentication for FumbleBot
 *
 * Requires TWO headers for secure authentication:
 * 1. X-Discord-Bot-Id: The bot's Discord Application ID
 * 2. X-Bot-Secret: A shared secret known only to the bot and website
 *
 * Bot service accounts are managed via Core API.
 */

const CORE_API_URL = process.env.CORE_API_URL
const CORE_API_SECRET = process.env.CORE_API_SECRET

/**
 * Headers interface for bot authentication
 */
interface BotAuthHeaders {
  get(name: string): string | null
}

/**
 * Result of bot authentication
 */
interface BotAuthResult {
  discordId: string
  role: UserRole
}

/**
 * Create a bot authentication verifier
 */
function createBotAuth(config: {
  botApiSecret: string
  ownerIds?: string | string[]
  adminIds?: string | string[]
}) {
  const { botApiSecret, ...permissionConfig } = config
  const permissions = createPermissions(permissionConfig)

  return function verifyBotAuth(headers: BotAuthHeaders): BotAuthResult | null {
    const botDiscordId = headers.get('X-Discord-Bot-Id')
    const headerSecret = headers.get('X-Bot-Secret')

    // Require both headers
    if (!botDiscordId || !headerSecret) return null

    // Verify the shared secret
    if (headerSecret !== botApiSecret) {
      return null
    }

    // Check if the bot's Discord ID is in our allowed lists
    if (permissions.isOwnerDiscordId(botDiscordId)) {
      return { discordId: botDiscordId, role: 'owner' }
    }

    if (permissions.isAdminDiscordId(botDiscordId)) {
      return { discordId: botDiscordId, role: 'admin' }
    }

    return null
  }
}

// Create bot auth verifier with environment configuration
const verifyBot = createBotAuth({
  botApiSecret: process.env.BOT_API_SECRET!,
  ownerIds: process.env.OWNER_DISCORD_IDS,
  adminIds: process.env.ADMIN_DISCORD_IDS,
})

/**
 * Verify Discord bot authentication from request headers
 * Requires both bot ID and shared secret for security
 * Returns the bot's role if valid, null otherwise
 */
export function verifyBotAuth(request: NextRequest): { discordId: string; role: UserRole } | null {
  return verifyBot(request.headers)
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
