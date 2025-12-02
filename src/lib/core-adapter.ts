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
 *
 * When USE_MOCK_AUTH=true, uses in-memory store instead of Core API.
 * This allows tests to run without depending on Core.
 */

import type { Adapter, AdapterUser, AdapterAccount, AdapterSession } from 'next-auth/adapters'

// =============================================================================
// Mock Auth Store (for testing without Core API)
// =============================================================================

const USE_MOCK_AUTH = process.env.USE_MOCK_AUTH === 'true'

// In-memory stores for mock mode
const mockUserStore = new Map<string, AdapterUser>()
const mockAccountStore = new Map<string, AdapterAccount>()
const mockSessionStore = new Map<string, AdapterSession>()

// Mock user operations
const mockUsers = {
  create(user: AdapterUser): AdapterUser {
    mockUserStore.set(user.id, user)
    return user
  },
  get(id: string): AdapterUser | null {
    return mockUserStore.get(id) || null
  },
  getByEmail(email: string): AdapterUser | null {
    for (const user of mockUserStore.values()) {
      if (user.email === email) return user
    }
    return null
  },
  getByAccount(provider: string, providerAccountId: string): AdapterUser | null {
    const key = `${provider}:${providerAccountId}`
    const account = mockAccountStore.get(key)
    if (!account) return null
    return mockUserStore.get(account.userId) || null
  },
  update(id: string, data: Partial<AdapterUser>): AdapterUser | null {
    const user = mockUserStore.get(id)
    if (!user) return null
    const updated = { ...user, ...data } as AdapterUser
    mockUserStore.set(id, updated)
    return updated
  },
  delete(id: string): void {
    mockUserStore.delete(id)
  },
}

// Mock account operations
const mockAccounts = {
  link(account: AdapterAccount): AdapterAccount {
    const key = `${account.provider}:${account.providerAccountId}`
    mockAccountStore.set(key, account)
    return account
  },
  unlink(provider: string, providerAccountId: string): void {
    const key = `${provider}:${providerAccountId}`
    mockAccountStore.delete(key)
  },
}

// Mock session operations
const mockSessions = {
  create(session: AdapterSession): AdapterSession {
    mockSessionStore.set(session.sessionToken, session)
    return session
  },
  get(sessionToken: string): AdapterSession | null {
    const session = mockSessionStore.get(sessionToken)
    if (!session) return null
    if (new Date(session.expires) < new Date()) {
      mockSessionStore.delete(sessionToken)
      return null
    }
    return session
  },
  getWithUser(sessionToken: string): { session: AdapterSession; user: AdapterUser } | null {
    const session = this.get(sessionToken)
    if (!session) return null
    const user = mockUserStore.get(session.userId)
    if (!user) return null
    return { session, user }
  },
  update(sessionToken: string, data: Partial<AdapterSession>): AdapterSession | null {
    const session = mockSessionStore.get(sessionToken)
    if (!session) return null
    const updated = { ...session, ...data } as AdapterSession
    mockSessionStore.set(sessionToken, updated)
    return updated
  },
  delete(sessionToken: string): void {
    mockSessionStore.delete(sessionToken)
  },
}

/**
 * Parse session data, converting date strings to Date objects.
 * Core API returns dates as ISO strings, but Auth.js expects Date objects.
 */
function parseSession(session: AdapterSession): AdapterSession {
  return {
    ...session,
    expires: new Date(session.expires),
  }
}

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
 * Custom error for Core API authentication failures
 */
class CoreAuthError extends Error {
  constructor(message: string, public status: number) {
    super(message)
    this.name = 'CoreAuthError'
  }
}

/**
 * Make authenticated requests to the Core API
 */
async function coreRequest<T>(
  config: CoreAdapterConfig,
  path: string,
  options: RequestInit = {},
  throwOnAuthError = false
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

      // Authentication errors - throw specific error so Auth.js shows proper message
      if (res.status === 401 || res.status === 403) {
        const errorMsg = `[core-adapter] Authentication failed: ${res.status} - Check CORE_API_SECRET matches Core API's CORE_SECRET`
        console.error(errorMsg)
        if (throwOnAuthError) {
          throw new CoreAuthError(errorMsg, res.status)
        }
        return null
      }

      console.error(`[core-adapter] Request failed: ${res.status} ${path}`)
      return null
    }

    const text = await res.text()
    if (!text) return null
    return JSON.parse(text)
  } catch (error) {
    clearTimeout(timeoutId)
    // Re-throw CoreAuthError
    if (error instanceof CoreAuthError) throw error
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
 * import { CoreAdapter } from '@/lib/core-adapter'
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
  // Use mock adapter for testing (no Core API dependency)
  if (USE_MOCK_AUTH) {
    return createMockAdapter()
  }

  return {
    // =========================================================================
    // User Operations
    // =========================================================================

    async createUser(user) {
      const result = await coreRequest<AdapterUser>(config, '/user', {
        method: 'POST',
        body: JSON.stringify(user),
      }, true) // Throw on auth errors
      if (!result) throw new Error('Failed to create user - Core API may be unavailable')
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
      }, true) // Throw on auth errors
      if (!result) throw new Error('Failed to link account - Core API may be unavailable')
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
      }, true) // Throw on auth errors
      if (!result) throw new Error('Failed to create session - Core API may be unavailable')
      return parseSession(result)
    },

    async getSessionAndUser(sessionToken) {
      const result = await coreRequest<{ session: AdapterSession; user: AdapterUser }>(
        config,
        `/session/${encodeURIComponent(sessionToken)}`
      )
      if (!result) return null
      return {
        session: parseSession(result.session),
        user: result.user,
      }
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
      if (!result) return null
      return parseSession(result)
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

/**
 * Create a mock adapter for testing
 * Uses in-memory store instead of Core API
 */
function createMockAdapter(): Adapter {
  return {
    async createUser(user) {
      return mockUsers.create(user as AdapterUser)
    },

    async getUser(id) {
      return mockUsers.get(id)
    },

    async getUserByEmail(email) {
      return mockUsers.getByEmail(email)
    },

    async getUserByAccount({ provider, providerAccountId }) {
      return mockUsers.getByAccount(provider, providerAccountId)
    },

    async updateUser(user) {
      const result = mockUsers.update(user.id, user)
      if (!result) throw new Error('User not found')
      return result
    },

    async deleteUser(userId) {
      mockUsers.delete(userId)
    },

    async linkAccount(account) {
      return mockAccounts.link(account)
    },

    async unlinkAccount({ provider, providerAccountId }) {
      mockAccounts.unlink(provider, providerAccountId)
    },

    async createSession(session) {
      return mockSessions.create(session)
    },

    async getSessionAndUser(sessionToken) {
      return mockSessions.getWithUser(sessionToken)
    },

    async updateSession(session) {
      return mockSessions.update(session.sessionToken, session)
    },

    async deleteSession(sessionToken) {
      mockSessions.delete(sessionToken)
    },

    async createVerificationToken() {
      return null // Not used in tests
    },

    async useVerificationToken() {
      return null // Not used in tests
    },
  }
}
