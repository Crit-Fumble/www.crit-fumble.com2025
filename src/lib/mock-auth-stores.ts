/**
 * Mock Auth Stores
 *
 * In-memory stores for testing authentication without Core API.
 * Used when USE_MOCK_AUTH=true.
 *
 * These stores are shared between:
 * - core-auth.ts (session validation)
 * - test-auth route (creating test users/sessions)
 */

/**
 * Mock user type (simplified from AdapterUser)
 */
export interface MockUser {
  id: string
  email: string | null
  emailVerified: Date | null
  name: string | null
  image: string | null
  isAdmin?: boolean
}

/**
 * Mock account type (simplified from AdapterAccount)
 */
export interface MockAccount {
  userId: string
  type: string
  provider: string
  providerAccountId: string
  access_token?: string
  token_type?: string
  scope?: string
}

/**
 * Mock session type (simplified from AdapterSession)
 */
export interface MockSession {
  sessionToken: string
  userId: string
  expires: Date
}

// In-memory stores
const mockUserStore = new Map<string, MockUser>()
const mockAccountStore = new Map<string, MockAccount>()
const mockSessionStore = new Map<string, MockSession>()

// Mock user operations
const mockUsers = {
  create(user: MockUser): MockUser {
    mockUserStore.set(user.id, user)
    return user
  },
  get(id: string): MockUser | null {
    return mockUserStore.get(id) || null
  },
  getByEmail(email: string): MockUser | null {
    for (const user of mockUserStore.values()) {
      if (user.email === email) return user
    }
    return null
  },
  getByAccount(provider: string, providerAccountId: string): MockUser | null {
    const key = `${provider}:${providerAccountId}`
    const account = mockAccountStore.get(key)
    if (!account) return null
    return mockUserStore.get(account.userId) || null
  },
  update(id: string, data: Partial<MockUser>): MockUser | null {
    const user = mockUserStore.get(id)
    if (!user) return null
    const updated = { ...user, ...data }
    mockUserStore.set(id, updated)
    return updated
  },
  delete(id: string): void {
    mockUserStore.delete(id)
  },
}

// Mock account operations
const mockAccounts = {
  link(account: MockAccount): MockAccount {
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
  create(session: MockSession): MockSession {
    mockSessionStore.set(session.sessionToken, session)
    return session
  },
  get(sessionToken: string): MockSession | null {
    const session = mockSessionStore.get(sessionToken)
    if (!session) return null
    if (new Date(session.expires) < new Date()) {
      mockSessionStore.delete(sessionToken)
      return null
    }
    return session
  },
  getWithUser(sessionToken: string): { session: MockSession; user: MockUser } | null {
    const session = this.get(sessionToken)
    if (!session) return null
    const user = mockUserStore.get(session.userId)
    if (!user) return null
    return { session, user }
  },
  update(sessionToken: string, data: Partial<MockSession>): MockSession | null {
    const session = mockSessionStore.get(sessionToken)
    if (!session) return null
    const updated = { ...session, ...data }
    mockSessionStore.set(sessionToken, updated)
    return updated
  },
  delete(sessionToken: string): void {
    mockSessionStore.delete(sessionToken)
  },
}

/**
 * Shared mock auth stores
 * Used by both core-auth.ts and test-auth route
 */
export const mockAuthStores = {
  users: mockUsers,
  accounts: mockAccounts,
  sessions: mockSessions,
  // Direct store access for cleanup
  clearAll() {
    mockUserStore.clear()
    mockAccountStore.clear()
    mockSessionStore.clear()
  },
}
