/**
 * Core API Adapter for Auth.js
 *
 * Custom adapter that proxies all auth operations to the Core API.
 * This enables shared user identity and sessions across all Crit-Fumble platforms.
 *
 * Uses the @crit-fumble/core SDK for typed API calls.
 *
 * When USE_MOCK_AUTH=true, uses in-memory store instead of Core API.
 * This allows tests to run without depending on Core.
 */

import type { Adapter, AdapterUser, AdapterAccount, AdapterSession } from 'next-auth/adapters'
import { CoreApiClient } from '@crit-fumble/core/client'

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
 * Create a Core API adapter for Auth.js
 *
 * This adapter stores users, accounts, and sessions in the Core API database,
 * enabling shared identity across all Crit-Fumble platforms.
 *
 * Uses the @crit-fumble/core SDK for typed API calls.
 *
 * @example
 * import { CoreAdapter } from '@/lib/core-adapter'
 *
 * export const { auth, handlers } = NextAuth({
 *   adapter: CoreAdapter({
 *     coreApiUrl: process.env.CORE_API_URL!,
 *     coreApiSecret: process.env.CORE_API_SECRET!,
 *   }),
 *   session: { strategy: 'database' },
 *   providers: [Discord({ ... })],
 * })
 */
export function CoreAdapter(config: CoreAdapterConfig): Adapter {
  // Use mock adapter for testing (no Core API dependency)
  if (USE_MOCK_AUTH) {
    return createMockAdapter()
  }

  // Create SDK client
  const api = new CoreApiClient({
    baseUrl: config.coreApiUrl,
    apiKey: config.coreApiSecret,
  })

  return {
    // =========================================================================
    // User Operations
    // =========================================================================

    async createUser(user) {
      try {
        const result = await api.authAdapter.createUser({
          id: user.id,
          email: user.email ?? undefined,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
          emailVerified: user.emailVerified?.toISOString() ?? null,
        })
        return {
          ...result,
          emailVerified: result.emailVerified ? new Date(result.emailVerified) : null,
        } as AdapterUser
      } catch (error) {
        console.error('[core-adapter] Failed to create user:', error)
        throw new Error('Failed to create user - Core API may be unavailable')
      }
    },

    async getUser(id) {
      try {
        const result = await api.authAdapter.getUser(id)
        if (!result) return null
        return {
          ...result,
          emailVerified: result.emailVerified ? new Date(result.emailVerified) : null,
        } as AdapterUser
      } catch {
        return null
      }
    },

    async getUserByEmail(email) {
      try {
        const result = await api.authAdapter.getUserByEmail(email)
        if (!result) return null
        return {
          ...result,
          emailVerified: result.emailVerified ? new Date(result.emailVerified) : null,
        } as AdapterUser
      } catch {
        return null
      }
    },

    async getUserByAccount({ provider, providerAccountId }) {
      try {
        const result = await api.authAdapter.getUserByAccount(provider, providerAccountId)
        if (!result) return null
        return {
          ...result,
          emailVerified: result.emailVerified ? new Date(result.emailVerified) : null,
        } as AdapterUser
      } catch {
        return null
      }
    },

    async updateUser(user) {
      try {
        const result = await api.authAdapter.updateUser(user.id, {
          email: user.email ?? undefined,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
          emailVerified: user.emailVerified?.toISOString() ?? null,
        })
        return {
          ...result,
          emailVerified: result.emailVerified ? new Date(result.emailVerified) : null,
        } as AdapterUser
      } catch (error) {
        console.error('[core-adapter] Failed to update user:', error)
        throw new Error('Failed to update user')
      }
    },

    async deleteUser(userId) {
      try {
        await api.authAdapter.deleteUser(userId)
      } catch (error) {
        console.error('[core-adapter] Failed to delete user:', error)
      }
    },

    // =========================================================================
    // Account Operations (OAuth provider linking)
    // =========================================================================

    async linkAccount(account) {
      try {
        const result = await api.authAdapter.linkAccount({
          userId: account.userId,
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          refresh_token: account.refresh_token ?? undefined,
          access_token: account.access_token ?? undefined,
          expires_at: account.expires_at ?? undefined,
          token_type: account.token_type ?? undefined,
          scope: account.scope ?? undefined,
          id_token: account.id_token ?? undefined,
          session_state: typeof account.session_state === 'string' ? account.session_state : undefined,
        })
        return {
          userId: result.userId,
          type: result.type,
          provider: result.provider,
          providerAccountId: result.providerAccountId,
          refresh_token: result.refresh_token ?? null,
          access_token: result.access_token ?? null,
          expires_at: result.expires_at ?? null,
          token_type: result.token_type ?? null,
          scope: result.scope ?? null,
          id_token: result.id_token ?? null,
          session_state: result.session_state ?? null,
        } as AdapterAccount
      } catch (error) {
        console.error('[core-adapter] Failed to link account:', error)
        throw new Error('Failed to link account - Core API may be unavailable')
      }
    },

    async unlinkAccount({ provider, providerAccountId }) {
      try {
        await api.authAdapter.unlinkAccount(provider, providerAccountId)
      } catch (error) {
        console.error('[core-adapter] Failed to unlink account:', error)
      }
    },

    // =========================================================================
    // Session Operations (for database session strategy)
    // =========================================================================

    async createSession(session) {
      try {
        const result = await api.authAdapter.createSession({
          sessionToken: session.sessionToken,
          userId: session.userId,
          expires: session.expires.toISOString(),
        })
        return {
          sessionToken: result.sessionToken,
          userId: result.userId,
          expires: new Date(result.expires),
        } as AdapterSession
      } catch (error) {
        console.error('[core-adapter] Failed to create session:', error)
        throw new Error('Failed to create session - Core API may be unavailable')
      }
    },

    async getSessionAndUser(sessionToken) {
      try {
        const result = await api.authAdapter.getSessionAndUser(sessionToken)
        if (!result) return null
        return {
          session: {
            sessionToken: result.session.sessionToken,
            userId: result.session.userId,
            expires: new Date(result.session.expires),
          } as AdapterSession,
          user: {
            ...result.user,
            emailVerified: result.user.emailVerified ? new Date(result.user.emailVerified) : null,
          } as AdapterUser,
        }
      } catch {
        return null
      }
    },

    async updateSession(session) {
      try {
        const result = await api.authAdapter.updateSession(session.sessionToken, {
          expires: session.expires ? new Date(session.expires).toISOString() : undefined,
        })
        if (!result) return null
        return {
          sessionToken: result.sessionToken,
          userId: result.userId,
          expires: new Date(result.expires),
        } as AdapterSession
      } catch {
        return null
      }
    },

    async deleteSession(sessionToken) {
      try {
        await api.authAdapter.deleteSession(sessionToken)
      } catch (error) {
        console.error('[core-adapter] Failed to delete session:', error)
      }
    },

    // =========================================================================
    // Verification Token Operations (for email auth - not currently used)
    // =========================================================================

    async createVerificationToken(token) {
      try {
        const result = await api.authAdapter.createVerificationToken({
          identifier: token.identifier,
          token: token.token,
          expires: token.expires.toISOString(),
        })
        if (!result) return null
        return {
          identifier: result.identifier,
          token: result.token,
          expires: new Date(result.expires),
        }
      } catch {
        return null
      }
    },

    async useVerificationToken({ identifier, token }) {
      try {
        const result = await api.authAdapter.useVerificationToken(identifier, token)
        if (!result) return null
        return {
          identifier: result.identifier,
          token: result.token,
          expires: new Date(result.expires),
        }
      } catch {
        return null
      }
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
