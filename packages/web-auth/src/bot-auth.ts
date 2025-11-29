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
 *   fetch('/api/core/wiki', {
 *     headers: {
 *       'X-Discord-Bot-Id': botDiscordId,
 *       'X-Bot-Secret': botApiSecret
 *     }
 *   })
 */

import { type UserRole, createPermissions, type PermissionConfig } from './permissions.js'

// Use a generic type for PrismaClient to avoid peer dependency issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaClientLike = any

/**
 * Headers interface for bot authentication
 */
export interface BotAuthHeaders {
  get(name: string): string | null
}

/**
 * Configuration for bot authentication
 */
export interface BotAuthConfig extends PermissionConfig {
  /**
   * Expected bot API secret for verification
   */
  botApiSecret: string
}

/**
 * Result of bot authentication
 */
export interface BotAuthResult {
  discordId: string
  role: UserRole
}

/**
 * Create a bot authentication verifier
 *
 * @example
 * const verifyBot = createBotAuth({
 *   botApiSecret: process.env.BOT_API_SECRET!,
 *   ownerIds: process.env.OWNER_DISCORD_IDS,
 *   adminIds: process.env.ADMIN_DISCORD_IDS,
 * })
 *
 * const botAuth = verifyBot(request.headers)
 * if (botAuth) {
 *   // Bot is authenticated with role: botAuth.role
 * }
 */
export function createBotAuth(config: BotAuthConfig) {
  const { botApiSecret, ...permissionConfig } = config
  const permissions = createPermissions(permissionConfig)

  /**
   * Verify Discord bot authentication from request headers
   * Requires both bot ID and shared secret for security
   * Returns the bot's role if valid, null otherwise
   */
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

/**
 * Get or create a service account user for bot-created content
 * Creates a user record if one doesn't exist for this bot
 *
 * @param prisma - Prisma client instance
 * @param discordId - Bot's Discord ID
 * @param botName - Display name for the bot user
 */
export async function getBotServiceAccountId(
  prisma: PrismaClientLike,
  discordId: string,
  botName: string = 'FumbleBot'
): Promise<string> {
  // Use a deterministic ID based on the bot's Discord ID
  // This ensures the same bot always gets the same user record
  const botUserId = `bot-${discordId}`

  // Check if the bot user already exists
  let botUser = await (prisma as any).user.findUnique({
    where: { id: botUserId },
  })

  if (!botUser) {
    // Create the bot user
    botUser = await (prisma as any).user.create({
      data: {
        id: botUserId,
        name: botName,
        email: `bot-${discordId}@fumblebot.local`,
      },
    })
  }

  return botUser.id
}
