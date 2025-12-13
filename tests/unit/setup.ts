import { vi, beforeEach } from 'vitest'

// =============================================================================
// Mock Session Types
// =============================================================================

export interface MockSessionUser {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  discordId?: string
  isAdmin?: boolean
}

export interface MockSession {
  user: MockSessionUser
  expires: string
}

// =============================================================================
// Mock Session Factories
// =============================================================================

/**
 * Create a mock session for testing
 */
export function createMockSession(overrides: Partial<MockSession> = {}): MockSession {
  return {
    user: {
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
      image: null,
      discordId: 'test-discord-id',
      isAdmin: false,
      ...overrides.user,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  }
}

/**
 * Create a mock owner session (deprecated - use admin)
 */
export function createOwnerSession(discordId = 'owner-123'): MockSession {
  return createMockSession({
    user: {
      id: discordId,
      name: 'Owner User',
      email: 'owner@example.com',
      discordId,
      isAdmin: true,
    },
  })
}

/**
 * Create a mock admin session
 */
export function createAdminSession(discordId = 'admin-456'): MockSession {
  return createMockSession({
    user: {
      id: discordId,
      name: 'Admin User',
      email: 'admin@example.com',
      discordId,
      isAdmin: true,
    },
  })
}

/**
 * Create a mock regular user session
 */
export function createUserSession(discordId = 'user-789'): MockSession {
  return createMockSession({
    user: {
      id: discordId,
      name: 'Regular User',
      email: 'user@example.com',
      discordId,
      isAdmin: false,
    },
  })
}

// =============================================================================
// Next.js Server Mocks
// =============================================================================

vi.mock('next/server', () => ({
  NextRequest: class NextRequest {
    url: string
    method: string
    headers: Map<string, string>

    constructor(url: string, init?: { method?: string }) {
      this.url = url
      this.method = init?.method || 'GET'
      this.headers = new Map()
    }

    json() {
      return Promise.resolve({})
    }
  },
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) => ({
      status: init?.status || 200,
      json: () => Promise.resolve(data),
    }),
  },
}))

// =============================================================================
// Core Auth Module Mock
// =============================================================================

// Mock getCurrentUser function - can be configured per test
export const mockGetCurrentUser = vi.fn()

// Mock getSession function
export const mockGetSession = vi.fn()

vi.mock('@/lib/core-auth', () => ({
  getCurrentUser: mockGetCurrentUser,
  getSession: mockGetSession,
  getSigninUrl: vi.fn((provider = 'discord', callbackUrl) => {
    const callback = callbackUrl || '/dashboard'
    return `https://core.crit-fumble.com/auth/signin/${provider}?callbackUrl=${encodeURIComponent(callback)}`
  }),
  getSignoutUrl: vi.fn((callbackUrl) => {
    const callback = callbackUrl || '/'
    return `https://core.crit-fumble.com/auth/signout?callbackUrl=${encodeURIComponent(callback)}`
  }),
  isAuthenticated: vi.fn(async () => {
    const user = await mockGetCurrentUser()
    return user !== null
  }),
  isAdmin: vi.fn(async () => {
    const user = await mockGetCurrentUser()
    return user?.isAdmin ?? false
  }),
  requireAuth: vi.fn(),
  requireAdmin: vi.fn(),
  signOut: vi.fn(),
  clientAuth: {
    getSigninUrl: vi.fn((callbackUrl) => `https://core.crit-fumble.com/auth/signin/discord?callbackUrl=${encodeURIComponent(callbackUrl || '/dashboard')}`),
    getSignoutUrl: vi.fn((callbackUrl) => `https://core.crit-fumble.com/auth/signout?callbackUrl=${encodeURIComponent(callbackUrl || '/')}`),
  },
}))

// =============================================================================
// Legacy Auth Module Mock (for backwards compatibility)
// =============================================================================

// Legacy mock auth function - maps to getCurrentUser
export const mockAuth = vi.fn()

vi.mock('@/lib/auth', () => ({
  auth: mockAuth,
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: {
    GET: vi.fn(),
    POST: vi.fn(),
  },
}))

// =============================================================================
// Helper to configure auth mock in tests
// =============================================================================

/**
 * Set up auth mock to return a specific session
 * Use in beforeEach or individual tests
 */
export function setMockSession(session: MockSession | null) {
  // Update legacy mock
  mockAuth.mockResolvedValue(session)

  // Update core-auth mock
  if (session) {
    mockGetCurrentUser.mockResolvedValue({
      id: session.user.id,
      discordId: session.user.discordId || session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
      isAdmin: session.user.isAdmin ?? false,
    })
    mockGetSession.mockResolvedValue({
      user: {
        id: session.user.id,
        discordId: session.user.discordId || session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        isAdmin: session.user.isAdmin ?? false,
      },
      expires: session.expires,
    })
  } else {
    mockGetCurrentUser.mockResolvedValue(null)
    mockGetSession.mockResolvedValue({ user: null, expires: null })
  }
}

/**
 * Set up auth mock to return an owner session (deprecated - use admin)
 */
export function setOwnerSession(discordId = 'owner-123') {
  setMockSession(createOwnerSession(discordId))
}

/**
 * Set up auth mock to return an admin session
 */
export function setAdminSession(discordId = 'admin-456') {
  setMockSession(createAdminSession(discordId))
}

/**
 * Set up auth mock to return a regular user session
 */
export function setUserSession(discordId = 'user-789') {
  setMockSession(createUserSession(discordId))
}

/**
 * Set up auth mock to return no session (unauthenticated)
 */
export function setNoSession() {
  setMockSession(null)
}

// =============================================================================
// Test Lifecycle
// =============================================================================

// Note: beforeEach at module level is deprecated in Vitest 4.x
// Individual test files should handle their own cleanup using beforeEach inside describe blocks
// Example usage in test files:
// beforeEach(() => {
//   vi.clearAllMocks()
//   setNoSession()
// })
