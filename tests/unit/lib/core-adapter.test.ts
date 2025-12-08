/**
 * Tests for CoreAdapter (src/lib/core-adapter.ts)
 *
 * Tests the real Core API adapter that uses CoreApiClient SDK.
 * The mock adapter is tested separately in core-adapter-mock.test.ts
 *
 * @vitest-environment node
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Store original env
const originalEnv = { ...process.env }

// Mock the CoreApiClient from @crit-fumble/core/client
const mockAuthAdapter = {
  createUser: vi.fn(),
  getUser: vi.fn(),
  getUserByEmail: vi.fn(),
  getUserByAccount: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  linkAccount: vi.fn(),
  unlinkAccount: vi.fn(),
  createSession: vi.fn(),
  getSessionAndUser: vi.fn(),
  updateSession: vi.fn(),
  deleteSession: vi.fn(),
  createVerificationToken: vi.fn(),
  useVerificationToken: vi.fn(),
}

vi.mock('@crit-fumble/core/client', () => {
  return {
    CoreApiClient: class MockCoreApiClient {
      authAdapter = mockAuthAdapter
      constructor() {}
    },
  }
})

describe('CoreAdapter (Real SDK)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    process.env = { ...originalEnv }
    // Ensure we're NOT using mock auth
    delete process.env.USE_MOCK_AUTH
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  describe('User Operations', () => {
    it('should create a user via Core API', async () => {
      const { CoreAdapter } = await import('@/lib/core-adapter')

      mockAuthAdapter.createUser.mockResolvedValueOnce({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        image: 'https://example.com/avatar.png',
        emailVerified: '2024-01-01T00:00:00.000Z',
        isAdmin: true,
      })

      const adapter = CoreAdapter({
        coreApiUrl: 'https://core.example.com',
        coreApiSecret: 'secret-key',
      })

      const result = await adapter.createUser!({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        image: 'https://example.com/avatar.png',
        emailVerified: new Date('2024-01-01'),
      })

      expect(mockAuthAdapter.createUser).toHaveBeenCalledWith({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        image: 'https://example.com/avatar.png',
        emailVerified: '2024-01-01T00:00:00.000Z',
      })
      expect(result.id).toBe('user-123')
      expect(result.isAdmin).toBe(true)
      expect(result.emailVerified).toBeInstanceOf(Date)
    })

    it('should handle createUser with null values', async () => {
      const { CoreAdapter } = await import('@/lib/core-adapter')

      mockAuthAdapter.createUser.mockResolvedValueOnce({
        id: 'user-456',
        email: null,
        name: null,
        image: null,
        emailVerified: null,
      })

      const adapter = CoreAdapter({
        coreApiUrl: 'https://core.example.com',
        coreApiSecret: 'secret-key',
      })

      const result = await adapter.createUser!({
        id: 'user-456',
        email: null,
        name: null,
        image: null,
        emailVerified: null,
      })

      expect(result.email).toBeNull()
      expect(result.emailVerified).toBeNull()
      expect(result.isAdmin).toBe(false) // Default when not returned
    })

    it('should throw error when createUser fails', async () => {
      const { CoreAdapter } = await import('@/lib/core-adapter')

      mockAuthAdapter.createUser.mockRejectedValueOnce(new Error('API error'))

      const adapter = CoreAdapter({
        coreApiUrl: 'https://core.example.com',
        coreApiSecret: 'secret-key',
      })

      await expect(
        adapter.createUser!({
          id: 'user-789',
          email: 'test@example.com',
          name: null,
          image: null,
          emailVerified: null,
        })
      ).rejects.toThrow('Failed to create user')
    })

    it('should get a user by ID', async () => {
      const { CoreAdapter } = await import('@/lib/core-adapter')

      mockAuthAdapter.getUser.mockResolvedValueOnce({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        image: null,
        emailVerified: null,
        isAdmin: false,
      })

      const adapter = CoreAdapter({
        coreApiUrl: 'https://core.example.com',
        coreApiSecret: 'secret-key',
      })

      const result = await adapter.getUser!('user-123')

      expect(mockAuthAdapter.getUser).toHaveBeenCalledWith('user-123')
      expect(result?.id).toBe('user-123')
    })

    it('should return null when user not found', async () => {
      const { CoreAdapter } = await import('@/lib/core-adapter')

      mockAuthAdapter.getUser.mockResolvedValueOnce(null)

      const adapter = CoreAdapter({
        coreApiUrl: 'https://core.example.com',
        coreApiSecret: 'secret-key',
      })

      const result = await adapter.getUser!('nonexistent')

      expect(result).toBeNull()
    })

    it('should return null when getUser throws', async () => {
      const { CoreAdapter } = await import('@/lib/core-adapter')

      mockAuthAdapter.getUser.mockRejectedValueOnce(new Error('Network error'))

      const adapter = CoreAdapter({
        coreApiUrl: 'https://core.example.com',
        coreApiSecret: 'secret-key',
      })

      const result = await adapter.getUser!('user-123')

      expect(result).toBeNull()
    })

    it('should get a user by email', async () => {
      const { CoreAdapter } = await import('@/lib/core-adapter')

      mockAuthAdapter.getUserByEmail.mockResolvedValueOnce({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        image: null,
        emailVerified: '2024-01-01T00:00:00.000Z',
        isAdmin: true,
      })

      const adapter = CoreAdapter({
        coreApiUrl: 'https://core.example.com',
        coreApiSecret: 'secret-key',
      })

      const result = await adapter.getUserByEmail!('test@example.com')

      expect(mockAuthAdapter.getUserByEmail).toHaveBeenCalledWith('test@example.com')
      expect(result?.email).toBe('test@example.com')
      expect(result?.isAdmin).toBe(true)
    })

    it('should return null when email not found', async () => {
      const { CoreAdapter } = await import('@/lib/core-adapter')

      mockAuthAdapter.getUserByEmail.mockResolvedValueOnce(null)

      const adapter = CoreAdapter({
        coreApiUrl: 'https://core.example.com',
        coreApiSecret: 'secret-key',
      })

      const result = await adapter.getUserByEmail!('unknown@example.com')

      expect(result).toBeNull()
    })

    it('should return null when getUserByEmail throws', async () => {
      const { CoreAdapter } = await import('@/lib/core-adapter')

      mockAuthAdapter.getUserByEmail.mockRejectedValueOnce(new Error('API error'))

      const adapter = CoreAdapter({
        coreApiUrl: 'https://core.example.com',
        coreApiSecret: 'secret-key',
      })

      const result = await adapter.getUserByEmail!('test@example.com')

      expect(result).toBeNull()
    })

    it('should get a user by provider account', async () => {
      const { CoreAdapter } = await import('@/lib/core-adapter')

      mockAuthAdapter.getUserByAccount.mockResolvedValueOnce({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        image: null,
        emailVerified: null,
        isAdmin: false,
      })

      const adapter = CoreAdapter({
        coreApiUrl: 'https://core.example.com',
        coreApiSecret: 'secret-key',
      })

      const result = await adapter.getUserByAccount!({
        provider: 'discord',
        providerAccountId: '123456789',
      })

      expect(mockAuthAdapter.getUserByAccount).toHaveBeenCalledWith('discord', '123456789')
      expect(result?.id).toBe('user-123')
    })

    it('should return null when provider account not found', async () => {
      const { CoreAdapter } = await import('@/lib/core-adapter')

      mockAuthAdapter.getUserByAccount.mockResolvedValueOnce(null)

      const adapter = CoreAdapter({
        coreApiUrl: 'https://core.example.com',
        coreApiSecret: 'secret-key',
      })

      const result = await adapter.getUserByAccount!({
        provider: 'discord',
        providerAccountId: 'unknown',
      })

      expect(result).toBeNull()
    })

    it('should return null when getUserByAccount throws', async () => {
      const { CoreAdapter } = await import('@/lib/core-adapter')

      mockAuthAdapter.getUserByAccount.mockRejectedValueOnce(new Error('API error'))

      const adapter = CoreAdapter({
        coreApiUrl: 'https://core.example.com',
        coreApiSecret: 'secret-key',
      })

      const result = await adapter.getUserByAccount!({
        provider: 'discord',
        providerAccountId: '123',
      })

      expect(result).toBeNull()
    })

    it('should update a user', async () => {
      const { CoreAdapter } = await import('@/lib/core-adapter')

      mockAuthAdapter.updateUser.mockResolvedValueOnce({
        id: 'user-123',
        email: 'new@example.com',
        name: 'Updated Name',
        image: 'https://example.com/new-avatar.png',
        emailVerified: '2024-06-01T00:00:00.000Z',
        isAdmin: true,
      })

      const adapter = CoreAdapter({
        coreApiUrl: 'https://core.example.com',
        coreApiSecret: 'secret-key',
      })

      const result = await adapter.updateUser!({
        id: 'user-123',
        email: 'new@example.com',
        name: 'Updated Name',
        image: 'https://example.com/new-avatar.png',
        emailVerified: new Date('2024-06-01'),
      })

      expect(mockAuthAdapter.updateUser).toHaveBeenCalledWith('user-123', {
        email: 'new@example.com',
        name: 'Updated Name',
        image: 'https://example.com/new-avatar.png',
        emailVerified: '2024-06-01T00:00:00.000Z',
      })
      expect(result.name).toBe('Updated Name')
      expect(result.isAdmin).toBe(true)
    })

    it('should throw error when updateUser fails', async () => {
      const { CoreAdapter } = await import('@/lib/core-adapter')

      mockAuthAdapter.updateUser.mockRejectedValueOnce(new Error('API error'))

      const adapter = CoreAdapter({
        coreApiUrl: 'https://core.example.com',
        coreApiSecret: 'secret-key',
      })

      await expect(
        adapter.updateUser!({
          id: 'user-123',
          email: 'test@example.com',
        })
      ).rejects.toThrow('Failed to update user')
    })

    it('should delete a user', async () => {
      const { CoreAdapter } = await import('@/lib/core-adapter')

      mockAuthAdapter.deleteUser.mockResolvedValueOnce(undefined)

      const adapter = CoreAdapter({
        coreApiUrl: 'https://core.example.com',
        coreApiSecret: 'secret-key',
      })

      await adapter.deleteUser!('user-123')

      expect(mockAuthAdapter.deleteUser).toHaveBeenCalledWith('user-123')
    })

    it('should handle deleteUser error gracefully', async () => {
      const { CoreAdapter } = await import('@/lib/core-adapter')

      mockAuthAdapter.deleteUser.mockRejectedValueOnce(new Error('API error'))

      const adapter = CoreAdapter({
        coreApiUrl: 'https://core.example.com',
        coreApiSecret: 'secret-key',
      })

      // Should not throw
      await expect(adapter.deleteUser!('user-123')).resolves.toBeUndefined()
    })
  })

  describe('Account Operations', () => {
    it('should link an OAuth account', async () => {
      const { CoreAdapter } = await import('@/lib/core-adapter')

      mockAuthAdapter.linkAccount.mockResolvedValueOnce({
        userId: 'user-123',
        type: 'oauth',
        provider: 'discord',
        providerAccountId: '987654321',
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_at: 1735689600,
        token_type: 'Bearer',
        scope: 'identify email',
        id_token: null,
        session_state: null,
      })

      const adapter = CoreAdapter({
        coreApiUrl: 'https://core.example.com',
        coreApiSecret: 'secret-key',
      })

      const result = await adapter.linkAccount!({
        userId: 'user-123',
        type: 'oauth',
        provider: 'discord',
        providerAccountId: '987654321',
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_at: 1735689600,
        token_type: 'Bearer',
        scope: 'identify email',
      })

      expect(mockAuthAdapter.linkAccount).toHaveBeenCalled()
      expect(result?.provider).toBe('discord')
      expect(result?.access_token).toBe('access-token')
    })

    it('should handle linkAccount with string session_state', async () => {
      const { CoreAdapter } = await import('@/lib/core-adapter')

      mockAuthAdapter.linkAccount.mockResolvedValueOnce({
        userId: 'user-123',
        type: 'oauth',
        provider: 'google',
        providerAccountId: '123',
        session_state: 'active',
      })

      const adapter = CoreAdapter({
        coreApiUrl: 'https://core.example.com',
        coreApiSecret: 'secret-key',
      })

      await adapter.linkAccount!({
        userId: 'user-123',
        type: 'oauth',
        provider: 'google',
        providerAccountId: '123',
        session_state: 'active',
      })

      expect(mockAuthAdapter.linkAccount).toHaveBeenCalledWith(
        expect.objectContaining({
          session_state: 'active',
        })
      )
    })

    it('should throw error when linkAccount fails', async () => {
      const { CoreAdapter } = await import('@/lib/core-adapter')

      mockAuthAdapter.linkAccount.mockRejectedValueOnce(new Error('API error'))

      const adapter = CoreAdapter({
        coreApiUrl: 'https://core.example.com',
        coreApiSecret: 'secret-key',
      })

      await expect(
        adapter.linkAccount!({
          userId: 'user-123',
          type: 'oauth',
          provider: 'discord',
          providerAccountId: '123',
        })
      ).rejects.toThrow('Failed to link account')
    })

    it('should unlink an account', async () => {
      const { CoreAdapter } = await import('@/lib/core-adapter')

      mockAuthAdapter.unlinkAccount.mockResolvedValueOnce(undefined)

      const adapter = CoreAdapter({
        coreApiUrl: 'https://core.example.com',
        coreApiSecret: 'secret-key',
      })

      await adapter.unlinkAccount!({
        provider: 'discord',
        providerAccountId: '123456789',
      })

      expect(mockAuthAdapter.unlinkAccount).toHaveBeenCalledWith('discord', '123456789')
    })

    it('should handle unlinkAccount error gracefully', async () => {
      const { CoreAdapter } = await import('@/lib/core-adapter')

      mockAuthAdapter.unlinkAccount.mockRejectedValueOnce(new Error('API error'))

      const adapter = CoreAdapter({
        coreApiUrl: 'https://core.example.com',
        coreApiSecret: 'secret-key',
      })

      // Should not throw
      await expect(
        adapter.unlinkAccount!({
          provider: 'discord',
          providerAccountId: '123',
        })
      ).resolves.toBeUndefined()
    })
  })

  describe('Session Operations', () => {
    it('should create a session', async () => {
      const { CoreAdapter } = await import('@/lib/core-adapter')

      mockAuthAdapter.createSession.mockResolvedValueOnce({
        sessionToken: 'session-token-123',
        userId: 'user-123',
        expires: '2024-12-31T23:59:59.000Z',
      })

      const adapter = CoreAdapter({
        coreApiUrl: 'https://core.example.com',
        coreApiSecret: 'secret-key',
      })

      const result = await adapter.createSession!({
        sessionToken: 'session-token-123',
        userId: 'user-123',
        expires: new Date('2024-12-31T23:59:59.000Z'),
      })

      expect(mockAuthAdapter.createSession).toHaveBeenCalledWith({
        sessionToken: 'session-token-123',
        userId: 'user-123',
        expires: '2024-12-31T23:59:59.000Z',
      })
      expect(result.sessionToken).toBe('session-token-123')
      expect(result.expires).toBeInstanceOf(Date)
    })

    it('should throw error when createSession fails', async () => {
      const { CoreAdapter } = await import('@/lib/core-adapter')

      mockAuthAdapter.createSession.mockRejectedValueOnce(new Error('API error'))

      const adapter = CoreAdapter({
        coreApiUrl: 'https://core.example.com',
        coreApiSecret: 'secret-key',
      })

      await expect(
        adapter.createSession!({
          sessionToken: 'token',
          userId: 'user-123',
          expires: new Date(),
        })
      ).rejects.toThrow('Failed to create session')
    })

    it('should get session and user', async () => {
      const { CoreAdapter } = await import('@/lib/core-adapter')

      mockAuthAdapter.getSessionAndUser.mockResolvedValueOnce({
        session: {
          sessionToken: 'session-123',
          userId: 'user-123',
          expires: '2024-12-31T23:59:59.000Z',
        },
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          image: null,
          emailVerified: null,
          isAdmin: true,
        },
      })

      const adapter = CoreAdapter({
        coreApiUrl: 'https://core.example.com',
        coreApiSecret: 'secret-key',
      })

      const result = await adapter.getSessionAndUser!('session-123')

      expect(mockAuthAdapter.getSessionAndUser).toHaveBeenCalledWith('session-123')
      expect(result?.session.sessionToken).toBe('session-123')
      expect(result?.user.id).toBe('user-123')
      expect(result?.user.isAdmin).toBe(true)
    })

    it('should return null when session not found', async () => {
      const { CoreAdapter } = await import('@/lib/core-adapter')

      mockAuthAdapter.getSessionAndUser.mockResolvedValueOnce(null)

      const adapter = CoreAdapter({
        coreApiUrl: 'https://core.example.com',
        coreApiSecret: 'secret-key',
      })

      const result = await adapter.getSessionAndUser!('nonexistent')

      expect(result).toBeNull()
    })

    it('should return null when getSessionAndUser throws', async () => {
      const { CoreAdapter } = await import('@/lib/core-adapter')

      mockAuthAdapter.getSessionAndUser.mockRejectedValueOnce(new Error('API error'))

      const adapter = CoreAdapter({
        coreApiUrl: 'https://core.example.com',
        coreApiSecret: 'secret-key',
      })

      const result = await adapter.getSessionAndUser!('session-123')

      expect(result).toBeNull()
    })

    it('should update a session', async () => {
      const { CoreAdapter } = await import('@/lib/core-adapter')

      mockAuthAdapter.updateSession.mockResolvedValueOnce({
        sessionToken: 'session-123',
        userId: 'user-123',
        expires: '2025-01-15T00:00:00.000Z',
      })

      const adapter = CoreAdapter({
        coreApiUrl: 'https://core.example.com',
        coreApiSecret: 'secret-key',
      })

      const result = await adapter.updateSession!({
        sessionToken: 'session-123',
        expires: new Date('2025-01-15T00:00:00.000Z'),
      })

      expect(mockAuthAdapter.updateSession).toHaveBeenCalledWith('session-123', {
        expires: '2025-01-15T00:00:00.000Z',
      })
      expect(result?.expires).toBeInstanceOf(Date)
    })

    it('should return null when updateSession returns null', async () => {
      const { CoreAdapter } = await import('@/lib/core-adapter')

      mockAuthAdapter.updateSession.mockResolvedValueOnce(null)

      const adapter = CoreAdapter({
        coreApiUrl: 'https://core.example.com',
        coreApiSecret: 'secret-key',
      })

      const result = await adapter.updateSession!({
        sessionToken: 'nonexistent',
      })

      expect(result).toBeNull()
    })

    it('should return null when updateSession throws', async () => {
      const { CoreAdapter } = await import('@/lib/core-adapter')

      mockAuthAdapter.updateSession.mockRejectedValueOnce(new Error('API error'))

      const adapter = CoreAdapter({
        coreApiUrl: 'https://core.example.com',
        coreApiSecret: 'secret-key',
      })

      const result = await adapter.updateSession!({
        sessionToken: 'session-123',
      })

      expect(result).toBeNull()
    })

    it('should delete a session', async () => {
      const { CoreAdapter } = await import('@/lib/core-adapter')

      mockAuthAdapter.deleteSession.mockResolvedValueOnce(undefined)

      const adapter = CoreAdapter({
        coreApiUrl: 'https://core.example.com',
        coreApiSecret: 'secret-key',
      })

      await adapter.deleteSession!('session-123')

      expect(mockAuthAdapter.deleteSession).toHaveBeenCalledWith('session-123')
    })

    it('should handle deleteSession error gracefully', async () => {
      const { CoreAdapter } = await import('@/lib/core-adapter')

      mockAuthAdapter.deleteSession.mockRejectedValueOnce(new Error('API error'))

      const adapter = CoreAdapter({
        coreApiUrl: 'https://core.example.com',
        coreApiSecret: 'secret-key',
      })

      // Should not throw
      await expect(adapter.deleteSession!('session-123')).resolves.toBeUndefined()
    })
  })

  describe('Verification Token Operations', () => {
    it('should create a verification token', async () => {
      const { CoreAdapter } = await import('@/lib/core-adapter')

      mockAuthAdapter.createVerificationToken.mockResolvedValueOnce({
        identifier: 'test@example.com',
        token: 'verification-token-123',
        expires: '2024-12-31T23:59:59.000Z',
      })

      const adapter = CoreAdapter({
        coreApiUrl: 'https://core.example.com',
        coreApiSecret: 'secret-key',
      })

      const result = await adapter.createVerificationToken!({
        identifier: 'test@example.com',
        token: 'verification-token-123',
        expires: new Date('2024-12-31T23:59:59.000Z'),
      })

      expect(mockAuthAdapter.createVerificationToken).toHaveBeenCalledWith({
        identifier: 'test@example.com',
        token: 'verification-token-123',
        expires: '2024-12-31T23:59:59.000Z',
      })
      expect(result?.identifier).toBe('test@example.com')
      expect(result?.expires).toBeInstanceOf(Date)
    })

    it('should return null when createVerificationToken returns null', async () => {
      const { CoreAdapter } = await import('@/lib/core-adapter')

      mockAuthAdapter.createVerificationToken.mockResolvedValueOnce(null)

      const adapter = CoreAdapter({
        coreApiUrl: 'https://core.example.com',
        coreApiSecret: 'secret-key',
      })

      const result = await adapter.createVerificationToken!({
        identifier: 'test@example.com',
        token: 'token',
        expires: new Date(),
      })

      expect(result).toBeNull()
    })

    it('should return null when createVerificationToken throws', async () => {
      const { CoreAdapter } = await import('@/lib/core-adapter')

      mockAuthAdapter.createVerificationToken.mockRejectedValueOnce(new Error('API error'))

      const adapter = CoreAdapter({
        coreApiUrl: 'https://core.example.com',
        coreApiSecret: 'secret-key',
      })

      const result = await adapter.createVerificationToken!({
        identifier: 'test@example.com',
        token: 'token',
        expires: new Date(),
      })

      expect(result).toBeNull()
    })

    it('should use a verification token', async () => {
      const { CoreAdapter } = await import('@/lib/core-adapter')

      mockAuthAdapter.useVerificationToken.mockResolvedValueOnce({
        identifier: 'test@example.com',
        token: 'verification-token-123',
        expires: '2024-12-31T23:59:59.000Z',
      })

      const adapter = CoreAdapter({
        coreApiUrl: 'https://core.example.com',
        coreApiSecret: 'secret-key',
      })

      const result = await adapter.useVerificationToken!({
        identifier: 'test@example.com',
        token: 'verification-token-123',
      })

      expect(mockAuthAdapter.useVerificationToken).toHaveBeenCalledWith(
        'test@example.com',
        'verification-token-123'
      )
      expect(result?.identifier).toBe('test@example.com')
    })

    it('should return null when useVerificationToken returns null', async () => {
      const { CoreAdapter } = await import('@/lib/core-adapter')

      mockAuthAdapter.useVerificationToken.mockResolvedValueOnce(null)

      const adapter = CoreAdapter({
        coreApiUrl: 'https://core.example.com',
        coreApiSecret: 'secret-key',
      })

      const result = await adapter.useVerificationToken!({
        identifier: 'test@example.com',
        token: 'invalid-token',
      })

      expect(result).toBeNull()
    })

    it('should return null when useVerificationToken throws', async () => {
      const { CoreAdapter } = await import('@/lib/core-adapter')

      mockAuthAdapter.useVerificationToken.mockRejectedValueOnce(new Error('API error'))

      const adapter = CoreAdapter({
        coreApiUrl: 'https://core.example.com',
        coreApiSecret: 'secret-key',
      })

      const result = await adapter.useVerificationToken!({
        identifier: 'test@example.com',
        token: 'token',
      })

      expect(result).toBeNull()
    })
  })
})
