/**
 * Core API Adapter for Auth.js
 *
 * Custom adapter that proxies all auth operations to the Core API.
 * This enables shared user identity and sessions across all Crit-Fumble platforms.
 *
 * The adapter communicates with core.crit-fumble.com via HTTPS,
 * authenticated with X-Core-Secret header.
 *
 * Supports both JWT and database session strategies.
 */

import type { Adapter, AdapterUser, AdapterAccount, AdapterSession } from 'next-auth/adapters'

export interface CoreAdapterConfig {
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
   * Request timeout in milliseconds
   * @default 10000
   */
  timeout?: number
}

/**
 * Make authenticated requests to the Core API
 */
async function coreRequest<T>(
  config: CoreAdapterConfig,
  path: string,
  options: RequestInit = {}
): Promise<T | null> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), config.timeout || 10000)

  try {
    const res = await fetch(`${config.coreApiUrl}/api/auth${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Core-Secret': config.coreApiSecret,
        ...options.headers,
      },
    })

    clearTimeout(timeoutId)

    if (!res.ok) {
      if (res.status === 404) return null
      console.error(`[core-adapter] Request failed: ${res.status} ${path}`)
      return null
    }

    const text = await res.text()
    if (!text) return null
    return JSON.parse(text)
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`[core-adapter] Request timeout: ${path}`)
    } else {
      console.error(`[core-adapter] Request error: ${path}`, error instanceof Error ? error.message : 'Unknown')
    }
    return null
  }
}

/**
 * Create a Core API adapter for Auth.js
 *
 * This adapter stores users, accounts, and sessions in the Core API database,
 * enabling shared identity across all Crit-Fumble platforms.
 *
 * @example
 * import { CoreAdapter } from '@crit-fumble/web-auth'
 *
 * export const { auth, handlers } = NextAuth({
 *   adapter: CoreAdapter({
 *     coreApiUrl: process.env.CORE_API_URL!,
 *     coreApiSecret: process.env.CORE_API_SECRET!,
 *   }),
 *   session: { strategy: 'database' }, // or 'jwt'
 *   providers: [Discord({ ... })],
 * })
 */
export function CoreAdapter(config: CoreAdapterConfig): Adapter {
  return {
    // =========================================================================
    // User Operations
    // =========================================================================

    async createUser(user) {
      const result = await coreRequest<AdapterUser>(config, '/user', {
        method: 'POST',
        body: JSON.stringify(user),
      })
      if (!result) throw new Error('Failed to create user')
      return result
    },

    async getUser(id) {
      return coreRequest<AdapterUser>(config, `/user/${encodeURIComponent(id)}`)
    },

    async getUserByEmail(email) {
      return coreRequest<AdapterUser>(config, `/user/email/${encodeURIComponent(email)}`)
    },

    async getUserByAccount({ provider, providerAccountId }) {
      return coreRequest<AdapterUser>(
        config,
        `/user/account?provider=${encodeURIComponent(provider)}&providerAccountId=${encodeURIComponent(providerAccountId)}`
      )
    },

    async updateUser(user) {
      const result = await coreRequest<AdapterUser>(config, `/user/${encodeURIComponent(user.id)}`, {
        method: 'PATCH',
        body: JSON.stringify(user),
      })
      if (!result) throw new Error('Failed to update user')
      return result
    },

    async deleteUser(userId) {
      await coreRequest(config, `/user/${encodeURIComponent(userId)}`, { method: 'DELETE' })
    },

    // =========================================================================
    // Account Operations (OAuth provider linking)
    // =========================================================================

    async linkAccount(account) {
      const result = await coreRequest<AdapterAccount>(config, '/account', {
        method: 'POST',
        body: JSON.stringify(account),
      })
      if (!result) throw new Error('Failed to link account')
      return result
    },

    async unlinkAccount({ provider, providerAccountId }) {
      await coreRequest(
        config,
        `/account?provider=${encodeURIComponent(provider)}&providerAccountId=${encodeURIComponent(providerAccountId)}`,
        { method: 'DELETE' }
      )
    },

    // =========================================================================
    // Session Operations (for database session strategy)
    // =========================================================================

    async createSession(session) {
      const result = await coreRequest<AdapterSession>(config, '/session', {
        method: 'POST',
        body: JSON.stringify(session),
      })
      if (!result) throw new Error('Failed to create session')
      return result
    },

    async getSessionAndUser(sessionToken) {
      const result = await coreRequest<{ session: AdapterSession; user: AdapterUser }>(
        config,
        `/session/${encodeURIComponent(sessionToken)}`
      )
      return result
    },

    async updateSession(session) {
      const result = await coreRequest<AdapterSession>(
        config,
        `/session/${encodeURIComponent(session.sessionToken)}`,
        {
          method: 'PATCH',
          body: JSON.stringify(session),
        }
      )
      return result
    },

    async deleteSession(sessionToken) {
      await coreRequest(config, `/session/${encodeURIComponent(sessionToken)}`, {
        method: 'DELETE',
      })
    },

    // =========================================================================
    // Verification Token Operations (for email auth - not currently used)
    // =========================================================================

    async createVerificationToken(token) {
      const result = await coreRequest<{ identifier: string; token: string; expires: Date }>(
        config,
        '/verification-token',
        {
          method: 'POST',
          body: JSON.stringify(token),
        }
      )
      return result
    },

    async useVerificationToken({ identifier, token }) {
      const result = await coreRequest<{ identifier: string; token: string; expires: Date }>(
        config,
        `/verification-token?identifier=${encodeURIComponent(identifier)}&token=${encodeURIComponent(token)}`,
        { method: 'DELETE' }
      )
      return result
    },
  }
}
