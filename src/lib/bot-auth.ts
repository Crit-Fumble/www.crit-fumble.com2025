import 'server-only'
import { NextRequest } from 'next/server'
import { createBotAuth } from '@crit-fumble/web-auth/bot-auth'
import type { UserRole } from './permissions'

/**
 * Bot Authentication for FumbleBot
 *
 * Uses @crit-fumble/web-auth for bot authentication.
 * Bot service accounts are managed via Core API.
 */

const CORE_API_URL = process.env.CORE_API_URL
const CORE_API_SECRET = process.env.CORE_API_SECRET

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

  const botUserId = `bot:${discordId}`
  const botName = 'FumbleBot'

  // Check if user exists
  const existingRes = await fetch(`${CORE_API_URL}/api/auth/user/${encodeURIComponent(botUserId)}`, {
    headers: {
      'Content-Type': 'application/json',
      'X-Core-Secret': CORE_API_SECRET,
    },
  })

  if (existingRes.ok) {
    const user = await existingRes.json()
    if (user) return user.id
  }

  // Create bot user
  const createRes = await fetch(`${CORE_API_URL}/api/auth/user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Core-Secret': CORE_API_SECRET,
    },
    body: JSON.stringify({
      id: botUserId,
      name: botName,
      email: `bot-${discordId}@fumblebot.local`,
    }),
  })

  if (!createRes.ok) {
    throw new Error(`Failed to create bot service account: ${createRes.status}`)
  }

  const newUser = await createRes.json()
  return newUser.id
}
