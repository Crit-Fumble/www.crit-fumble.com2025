/**
 * Tests for Core-Based Authentication
 *
 * Tests the authentication utilities that delegate to Core API.
 *
 * Note: Functions that use `cookies()` from next/headers require special
 * handling since they need a request context. We test the pure URL generation
 * functions directly and mock the session-related functions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createHmac } from 'crypto'

// Unmock core-auth so we test the actual implementation
vi.unmock('@/lib/core-auth')

// Store original env
const originalEnv = { ...process.env }

// Mock next/headers cookies
const mockCookiesGet = vi.fn()
const mockCookies = vi.fn(() =>
  Promise.resolve({
    get: mockCookiesGet,
  })
)

vi.mock('next/headers', () => ({
  cookies: mockCookies,
}))

// Mock fetch for Core API calls
const mockFetch = vi.fn()
global.fetch = mockFetch

// Helper to create signed response
function createSignedResponse(body: object, secret: string) {
  const bodyText = JSON.stringify(body)
  const signature = createHmac('sha256', secret).update(bodyText).digest('hex')
  return {
    ok: true,
    text: () => Promise.resolve(bodyText),
    headers: {
      get: (name: string) => (name === 'X-Response-Signature' ? signature : null),
    },
  }
}

// Helper to create unsigned response
function createUnsignedResponse(body: object) {
  const bodyText = JSON.stringify(body)
  return {
    ok: true,
    text: () => Promise.resolve(bodyText),
    headers: {
      get: () => null,
    },
  }
}

describe('Core Auth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    process.env = { ...originalEnv }
    process.env.CORE_API_URL = 'https://core.test.com'
    process.env.NEXT_PUBLIC_BASE_URL = 'https://www.test.com'
    process.env.USE_MOCK_AUTH = ''
    process.env.CORE_API_SECRET = ''
    mockCookies.mockReturnValue(Promise.resolve({ get: mockCookiesGet }))
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  describe('getSigninUrl', () => {
    it('should generate signin URL with default provider', async () => {
      const { getSigninUrl } = await import('@/lib/core-auth')

      const url = getSigninUrl()

      expect(url).toContain('https://core.test.com/auth/signin/discord')
      expect(url).toContain('callbackUrl=')
    })

    it('should generate signin URL with specified provider', async () => {
      const { getSigninUrl } = await import('@/lib/core-auth')

      const url = getSigninUrl('github')

      expect(url).toContain('/auth/signin/github')
    })

    it('should include custom callback URL', async () => {
      const { getSigninUrl } = await import('@/lib/core-auth')

      const url = getSigninUrl('discord', '/custom-page')

      expect(url).toContain(encodeURIComponent('/custom-page'))
    })

    it('should use default callback URL when not provided', async () => {
      const { getSigninUrl } = await import('@/lib/core-auth')

      const url = getSigninUrl('discord')

      expect(url).toContain(encodeURIComponent('/dashboard'))
    })
  })

  describe('getSignoutUrl', () => {
    it('should generate signout URL', async () => {
      const { getSignoutUrl } = await import('@/lib/core-auth')

      const url = getSignoutUrl()

      expect(url).toContain('https://core.test.com/auth/signout')
      expect(url).toContain('callbackUrl=')
    })

    it('should include custom callback URL', async () => {
      const { getSignoutUrl } = await import('@/lib/core-auth')

      const url = getSignoutUrl('/goodbye')

      expect(url).toContain(encodeURIComponent('/goodbye'))
    })

    it('should use root as default callback', async () => {
      const { getSignoutUrl } = await import('@/lib/core-auth')

      const url = getSignoutUrl()

      expect(url).toContain(encodeURIComponent('/'))
    })
  })

  describe('getSession', () => {
    it('should return null user when no session cookie exists', async () => {
      mockCookiesGet.mockReturnValue(undefined)
      const { getSession } = await import('@/lib/core-auth')

      const result = await getSession()

      expect(result).toEqual({ user: null, expires: null })
    })

    it('should return null user when session cookie is empty', async () => {
      mockCookiesGet.mockReturnValue({ value: '' })
      const { getSession } = await import('@/lib/core-auth')

      const result = await getSession()

      expect(result).toEqual({ user: null, expires: null })
    })

    it('should validate session with Core API in production mode', async () => {
      mockCookiesGet.mockReturnValue({ value: 'valid-session-token' })
      const responseBody = {
        user: {
          id: 'user-123',
          discordId: 'discord-456',
          name: 'Test User',
          email: 'test@example.com',
          image: null,
          isAdmin: true,
        },
        expires: '2025-01-01T00:00:00.000Z',
      }
      mockFetch.mockResolvedValueOnce(createUnsignedResponse(responseBody))

      const { getSession } = await import('@/lib/core-auth')
      const result = await getSession()

      expect(mockFetch).toHaveBeenCalledWith(
        'https://core.test.com/api/auth/session',
        expect.objectContaining({
          headers: {
            Cookie: 'authjs.session-token=valid-session-token',
          },
          cache: 'no-store',
        })
      )
      expect(result.user?.id).toBe('user-123')
      expect(result.user?.isAdmin).toBe(true)
    })

    it('should include X-Core-Secret header when configured', async () => {
      process.env.CORE_API_SECRET = 'test-secret-123'
      vi.resetModules()

      mockCookiesGet.mockReturnValue({ value: 'valid-session-token' })
      const responseBody = {
        user: { id: 'user-123', discordId: 'discord-456', isAdmin: false },
        expires: '2025-01-01T00:00:00.000Z',
      }
      mockFetch.mockResolvedValueOnce(createSignedResponse(responseBody, 'test-secret-123'))

      const { getSession } = await import('@/lib/core-auth')
      await getSession()

      expect(mockFetch).toHaveBeenCalledWith(
        'https://core.test.com/api/auth/session',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Core-Secret': 'test-secret-123',
          }),
        })
      )
    })

    it('should verify valid response signature', async () => {
      process.env.CORE_API_SECRET = 'test-secret-123'
      vi.resetModules()

      mockCookiesGet.mockReturnValue({ value: 'valid-session-token' })
      const responseBody = {
        user: { id: 'user-123', discordId: 'discord-456', isAdmin: true },
        expires: '2025-01-01T00:00:00.000Z',
      }
      mockFetch.mockResolvedValueOnce(createSignedResponse(responseBody, 'test-secret-123'))

      const { getSession } = await import('@/lib/core-auth')
      const result = await getSession()

      expect(result.user?.id).toBe('user-123')
    })

    it('should reject invalid response signature', async () => {
      process.env.CORE_API_SECRET = 'test-secret-123'
      vi.resetModules()

      mockCookiesGet.mockReturnValue({ value: 'valid-session-token' })
      const responseBody = {
        user: { id: 'user-123', discordId: 'discord-456', isAdmin: true },
        expires: '2025-01-01T00:00:00.000Z',
      }
      // Sign with wrong secret
      mockFetch.mockResolvedValueOnce(createSignedResponse(responseBody, 'wrong-secret'))

      const { getSession } = await import('@/lib/core-auth')
      const result = await getSession()

      expect(result).toEqual({ user: null, expires: null })
    })

    it('should allow unsigned response when secret not configured', async () => {
      // CORE_API_SECRET is empty by default in tests
      mockCookiesGet.mockReturnValue({ value: 'valid-session-token' })
      const responseBody = {
        user: { id: 'user-123', discordId: 'discord-456', isAdmin: false },
        expires: '2025-01-01T00:00:00.000Z',
      }
      mockFetch.mockResolvedValueOnce(createUnsignedResponse(responseBody))

      const { getSession } = await import('@/lib/core-auth')
      const result = await getSession()

      expect(result.user?.id).toBe('user-123')
    })

    it('should return null user when Core API returns error', async () => {
      mockCookiesGet.mockReturnValue({ value: 'invalid-token' })
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      })

      const { getSession } = await import('@/lib/core-auth')
      const result = await getSession()

      expect(result).toEqual({ user: null, expires: null })
    })

    it('should return null user when fetch throws', async () => {
      mockCookiesGet.mockReturnValue({ value: 'token' })
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { getSession } = await import('@/lib/core-auth')
      const result = await getSession()

      expect(result).toEqual({ user: null, expires: null })
    })

    it('should use mock stores in mock auth mode', async () => {
      process.env.USE_MOCK_AUTH = 'true'
      vi.resetModules()

      // Import and set up mock data
      const { mockAuthStores } = await import('@/lib/mock-auth-stores')
      mockAuthStores.clearAll()

      mockAuthStores.users.create({
        id: 'mock-user-id',
        email: 'mock@example.com',
        emailVerified: null,
        name: 'Mock User',
        image: null,
        isAdmin: true,
      })
      mockAuthStores.sessions.create({
        sessionToken: 'mock-session-token',
        userId: 'mock-user-id',
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      })

      mockCookiesGet.mockReturnValue({ value: 'mock-session-token' })

      const { getSession } = await import('@/lib/core-auth')
      const result = await getSession()

      expect(result.user).not.toBeNull()
      expect(result.user?.id).toBe('mock-user-id')
      expect(result.user?.isAdmin).toBe(true)
      // Should NOT call fetch in mock mode
      expect(mockFetch).not.toHaveBeenCalled()

      mockAuthStores.clearAll()
    })

    it('should return null when mock session not found', async () => {
      process.env.USE_MOCK_AUTH = 'true'
      vi.resetModules()

      const { mockAuthStores } = await import('@/lib/mock-auth-stores')
      mockAuthStores.clearAll()

      mockCookiesGet.mockReturnValue({ value: 'non-existent-token' })

      const { getSession } = await import('@/lib/core-auth')
      const result = await getSession()

      expect(result).toEqual({ user: null, expires: null })
    })
  })

  describe('getCurrentUser', () => {
    it('should return user from session', async () => {
      mockCookiesGet.mockReturnValue({ value: 'valid-token' })
      const responseBody = {
        user: {
          id: 'user-123',
          discordId: 'discord-456',
          name: 'Test User',
          email: 'test@example.com',
          image: null,
          isAdmin: false,
        },
        expires: '2025-01-01T00:00:00.000Z',
      }
      mockFetch.mockResolvedValueOnce(createUnsignedResponse(responseBody))

      const { getCurrentUser } = await import('@/lib/core-auth')
      const user = await getCurrentUser()

      expect(user?.id).toBe('user-123')
      expect(user?.isAdmin).toBe(false)
    })

    it('should return null when no session', async () => {
      mockCookiesGet.mockReturnValue(undefined)

      const { getCurrentUser } = await import('@/lib/core-auth')
      const user = await getCurrentUser()

      expect(user).toBeNull()
    })
  })

  describe('isAuthenticated', () => {
    it('should return true when user exists', async () => {
      mockCookiesGet.mockReturnValue({ value: 'valid-token' })
      const responseBody = {
        user: { id: 'user-123', discordId: 'discord-456', isAdmin: false },
        expires: '2025-01-01T00:00:00.000Z',
      }
      mockFetch.mockResolvedValueOnce(createUnsignedResponse(responseBody))

      const { isAuthenticated } = await import('@/lib/core-auth')
      const result = await isAuthenticated()

      expect(result).toBe(true)
    })

    it('should return false when no user', async () => {
      mockCookiesGet.mockReturnValue(undefined)

      const { isAuthenticated } = await import('@/lib/core-auth')
      const result = await isAuthenticated()

      expect(result).toBe(false)
    })
  })

  describe('isAdmin (function)', () => {
    it('should return true when user is admin', async () => {
      mockCookiesGet.mockReturnValue({ value: 'valid-token' })
      const responseBody = {
        user: { id: 'user-123', discordId: 'discord-456', isAdmin: true },
        expires: '2025-01-01T00:00:00.000Z',
      }
      mockFetch.mockResolvedValueOnce(createUnsignedResponse(responseBody))

      const { isAdmin } = await import('@/lib/core-auth')
      const result = await isAdmin()

      expect(result).toBe(true)
    })

    it('should return false when user is not admin', async () => {
      mockCookiesGet.mockReturnValue({ value: 'valid-token' })
      const responseBody = {
        user: { id: 'user-123', discordId: 'discord-456', isAdmin: false },
        expires: '2025-01-01T00:00:00.000Z',
      }
      mockFetch.mockResolvedValueOnce(createUnsignedResponse(responseBody))

      const { isAdmin } = await import('@/lib/core-auth')
      const result = await isAdmin()

      expect(result).toBe(false)
    })

    it('should return false when no user', async () => {
      mockCookiesGet.mockReturnValue(undefined)

      const { isAdmin } = await import('@/lib/core-auth')
      const result = await isAdmin()

      expect(result).toBe(false)
    })
  })

  describe('signOut', () => {
    it('should call Core API signout endpoint', async () => {
      mockCookiesGet.mockReturnValue({ value: 'session-token' })
      mockFetch.mockResolvedValueOnce({ ok: true })

      const { signOut } = await import('@/lib/core-auth')
      await signOut()

      expect(mockFetch).toHaveBeenCalledWith(
        'https://core.test.com/auth/signout',
        expect.objectContaining({
          method: 'POST',
          headers: {
            Cookie: 'authjs.session-token=session-token',
          },
        })
      )
    })

    it('should not call API when no session cookie', async () => {
      mockCookiesGet.mockReturnValue(undefined)

      const { signOut } = await import('@/lib/core-auth')
      await signOut()

      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should handle signout error gracefully', async () => {
      mockCookiesGet.mockReturnValue({ value: 'token' })
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { signOut } = await import('@/lib/core-auth')
      // Should not throw
      await expect(signOut()).resolves.toBeUndefined()
    })
  })

  describe('clientAuth', () => {
    it('should export getSigninUrl helper', async () => {
      const { clientAuth } = await import('@/lib/core-auth')

      const url = clientAuth.getSigninUrl('/callback')

      expect(url).toContain('/auth/signin/discord')
      expect(url).toContain(encodeURIComponent('/callback'))
    })

    it('should export getSignoutUrl helper', async () => {
      const { clientAuth } = await import('@/lib/core-auth')

      const url = clientAuth.getSignoutUrl('/goodbye')

      expect(url).toContain('/auth/signout')
      expect(url).toContain(encodeURIComponent('/goodbye'))
    })
  })

  describe('Module Exports', () => {
    it('should export all expected functions', async () => {
      const coreAuth = await import('@/lib/core-auth')

      expect(typeof coreAuth.getSigninUrl).toBe('function')
      expect(typeof coreAuth.getSignoutUrl).toBe('function')
      expect(typeof coreAuth.getSession).toBe('function')
      expect(typeof coreAuth.getCurrentUser).toBe('function')
      expect(typeof coreAuth.isAuthenticated).toBe('function')
      expect(typeof coreAuth.isAdmin).toBe('function')
      expect(typeof coreAuth.requireAuth).toBe('function')
      expect(typeof coreAuth.requireAdmin).toBe('function')
      expect(typeof coreAuth.signOut).toBe('function')
      expect(typeof coreAuth.clientAuth).toBe('object')
    })
  })
})
