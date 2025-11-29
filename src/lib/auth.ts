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
      async session({ session, user }: { session: Session; user: User }) {
        if (session.user) {
          session.user.id = user.id
          // For Discord OAuth, the providerAccountId IS the Discord ID
          // Since we use profile.id as the user ID, user.id is the Discord ID
          ;(session.user as Record<string, unknown>).discordId = user.id
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

export const { handlers, auth, signIn, signOut } = createCoreAuth({
  coreApiUrl: process.env.CORE_API_URL!,
  coreApiSecret: process.env.CORE_API_SECRET!,
  discordClientId: process.env.DISCORD_CLIENT_ID!,
  discordClientSecret: process.env.DISCORD_CLIENT_SECRET!,
})
