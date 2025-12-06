/**
 * NextAuth Configuration
 *
 * Uses Core API adapter for shared user identity.
 * User accounts are stored in core.crit-fumble.com.
 * Sessions are handled via database strategy.
 */

import NextAuth from 'next-auth'
import Discord from 'next-auth/providers/discord'
import type { NextAuthConfig, Session, User } from 'next-auth'
import { CoreAdapter } from './core-adapter'

/**
 * Configuration options for Core API auth mode
 */
interface CoreAuthConfig {
  coreApiUrl: string
  coreApiSecret: string
  discordClientId: string
  discordClientSecret: string
  trustHost?: boolean
  sessionMaxAge?: number
}

/**
 * Create an Auth.js configuration with Core API adapter (database sessions)
 */
function createCoreAuthConfig(config: CoreAuthConfig): NextAuthConfig {
  const {
    coreApiUrl,
    coreApiSecret,
    discordClientId,
    discordClientSecret,
    trustHost = true,
    sessionMaxAge = 30 * 24 * 60 * 60, // 30 days
  } = config

  return {
    trustHost,
    adapter: CoreAdapter({
      coreApiUrl,
      coreApiSecret,
    }),
    providers: [
      Discord({
        clientId: discordClientId,
        clientSecret: discordClientSecret,
        // Use Discord ID as the user ID for consistent identity
        profile(profile) {
          return {
            id: profile.id,
            name: profile.username,
            email: profile.email,
            image: profile.avatar
              ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
              : null,
          }
        },
      }),
    ],
    callbacks: {
      async session({ session, user }) {
        // For database strategy, user comes from the adapter
        console.log('[auth] Session callback:', {
          hasSession: !!session,
          hasUser: !!user,
          userId: user?.id ? `${user.id.slice(0, 4)}...` : 'none',
        })
        if (session.user && user) {
          session.user.id = user.id
          // For Discord OAuth, the providerAccountId IS the Discord ID
          // Since we use profile.id as the user ID, user.id is the Discord ID
          ;(session.user as unknown as Record<string, unknown>).discordId = user.id
        }
        return session
      },
    },
    session: {
      strategy: 'database',
      maxAge: sessionMaxAge,
    },
  }
}

/**
 * Create a fully configured Auth.js instance with Core API
 */
function createCoreAuth(config: CoreAuthConfig) {
  return NextAuth(createCoreAuthConfig(config))
}

// Validate required environment variables at startup
const requiredEnvVars = {
  CORE_API_URL: process.env.CORE_API_URL,
  CORE_API_SECRET: process.env.CORE_API_SECRET,
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
} as const

const missingVars = Object.entries(requiredEnvVars)
  .filter(([, value]) => !value)
  .map(([key]) => key)

if (missingVars.length > 0) {
  console.error(`[auth] Missing required environment variables: ${missingVars.join(', ')}`)
}

export const { handlers, auth, signIn, signOut } = createCoreAuth({
  coreApiUrl: requiredEnvVars.CORE_API_URL || '',
  coreApiSecret: requiredEnvVars.CORE_API_SECRET || '',
  discordClientId: requiredEnvVars.DISCORD_CLIENT_ID || '',
  discordClientSecret: requiredEnvVars.DISCORD_CLIENT_SECRET || '',
})
