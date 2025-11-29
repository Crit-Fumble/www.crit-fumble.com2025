/**
 * @crit-fumble/web-auth
 *
 * Auth.js configuration and utilities for Crit-Fumble websites.
 * Provides Discord OAuth authentication with Core API adapter.
 *
 * Uses Core API for shared user identity across all Crit-Fumble platforms.
 */

import NextAuth from 'next-auth'
import Discord from 'next-auth/providers/discord'
import type { NextAuthConfig, Session, User } from 'next-auth'
import { CoreAdapter, type CoreAdapterConfig } from './core-adapter.js'

/**
 * Configuration options for Core API auth mode
 */
export interface CoreAuthConfig {
  /**
   * Base URL of the Core API
   * @example "https://core.crit-fumble.com"
   */
  coreApiUrl: string

  /**
   * Shared secret for authenticating with the Core API
   */
  coreApiSecret: string

  /**
   * Discord OAuth client ID
   */
  discordClientId: string

  /**
   * Discord OAuth client secret
   */
  discordClientSecret: string

  /**
   * Trust the host header (required for proxied environments)
   * @default true
   */
  trustHost?: boolean

  /**
   * Session max age in seconds
   * @default 2592000 (30 days)
   */
  sessionMaxAge?: number
}

/**
 * Create an Auth.js configuration with Core API adapter (database sessions)
 *
 * This mode stores users, accounts, and sessions in the Core API database,
 * enabling shared identity across all Crit-Fumble platforms.
 *
 * @param config - Configuration options
 * @returns Auth.js configuration object
 */
export function createCoreAuthConfig(config: CoreAuthConfig): NextAuthConfig {
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
          ;(session.user as any).discordId = user.id
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
 *
 * Uses database sessions stored in the Core API.
 * This enables shared user identity across all Crit-Fumble platforms.
 *
 * @param config - Configuration options
 * @returns Auth.js instance with handlers, auth, signIn, signOut
 *
 * @example
 * import { createCoreAuth } from '@crit-fumble/web-auth'
 *
 * export const { handlers, auth, signIn, signOut } = createCoreAuth({
 *   coreApiUrl: process.env.CORE_API_URL!,
 *   coreApiSecret: process.env.CORE_API_SECRET!,
 *   discordClientId: process.env.DISCORD_CLIENT_ID!,
 *   discordClientSecret: process.env.DISCORD_CLIENT_SECRET!,
 * })
 */
export function createCoreAuth(config: CoreAuthConfig) {
  return NextAuth(createCoreAuthConfig(config))
}

// Re-export types that consumers might need
export type { Session, User } from 'next-auth'
export type { NextAuthConfig }

// Re-export Core adapter
export { CoreAdapter, type CoreAdapterConfig } from './core-adapter.js'

// Re-export permissions module
export * from './permissions.js'
