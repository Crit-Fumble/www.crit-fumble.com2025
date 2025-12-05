/**
 * Tests for Mock Auth Adapter
 *
 * Tests the mock adapter used when USE_MOCK_AUTH=true.
 * This allows tests to run without depending on Core API.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Set USE_MOCK_AUTH before importing the module
vi.stubEnv('USE_MOCK_AUTH', 'true')

// Import after setting env var
const { CoreAdapter } = await import('@/lib/core-adapter')

describe('MockAdapter (USE_MOCK_AUTH=true)', () => {
  const config = {
    coreApiUrl: 'https://core.example.com',
    coreApiSecret: 'test-secret',
  }

  let adapter: ReturnType<typeof CoreAdapter>

  beforeEach(() => {
    // Create fresh adapter for each test
    adapter = CoreAdapter(config)
  })

  describe('User Operations', () => {
    it('should create a user in memory', async () => {
      const userData = {
        id: 'mock-user-1',
        email: 'mock@example.com',
        name: 'Mock User',
        emailVerified: null,
      }

      const result = await adapter.createUser(userData)

      expect(result).toEqual(userData)
    })

    it('should get a user by ID', async () => {
      const userData = {
        id: 'mock-user-2',
        email: 'get@example.com',
        name: 'Get User',
        emailVerified: null,
      }

      await adapter.createUser(userData)
      const result = await adapter.getUser('mock-user-2')

      expect(result).toEqual(userData)
    })

    it('should return null for non-existent user', async () => {
      const result = await adapter.getUser('non-existent-user')
      expect(result).toBeNull()
    })

    it('should get a user by email', async () => {
      const userData = {
        id: 'mock-user-3',
        email: 'byemail@example.com',
        name: 'Email User',
        emailVerified: null,
      }

      await adapter.createUser(userData)
      const result = await adapter.getUserByEmail('byemail@example.com')

      expect(result).toEqual(userData)
    })

    it('should return null for non-existent email', async () => {
      const result = await adapter.getUserByEmail('nonexistent@example.com')
      expect(result).toBeNull()
    })

    it('should get a user by provider account', async () => {
      const userData = {
        id: 'mock-user-4',
        email: 'provider@example.com',
        name: 'Provider User',
        emailVerified: null,
      }

      await adapter.createUser(userData)
      await adapter.linkAccount({
        userId: 'mock-user-4',
        type: 'oauth',
        provider: 'discord',
        providerAccountId: 'discord-123',
      })

      const result = await adapter.getUserByAccount({
        provider: 'discord',
        providerAccountId: 'discord-123',
      })

      expect(result).toEqual(userData)
    })

    it('should return null for non-existent provider account', async () => {
      const result = await adapter.getUserByAccount({
        provider: 'discord',
        providerAccountId: 'non-existent',
      })
      expect(result).toBeNull()
    })

    it('should update a user', async () => {
      const userData = {
        id: 'mock-user-5',
        email: 'update@example.com',
        name: 'Original Name',
        emailVerified: null,
      }

      await adapter.createUser(userData)
      const result = await adapter.updateUser({
        id: 'mock-user-5',
        name: 'Updated Name',
      })

      expect(result).toMatchObject({
        id: 'mock-user-5',
        name: 'Updated Name',
        email: 'update@example.com',
      })
    })

    it('should throw error when updating non-existent user', async () => {
      await expect(
        adapter.updateUser({ id: 'non-existent', name: 'Test' })
      ).rejects.toThrow('User not found')
    })

    it('should delete a user', async () => {
      const userData = {
        id: 'mock-user-6',
        email: 'delete@example.com',
        name: 'Delete User',
        emailVerified: null,
      }

      await adapter.createUser(userData)
      await adapter.deleteUser('mock-user-6')

      const result = await adapter.getUser('mock-user-6')
      expect(result).toBeNull()
    })
  })

  describe('Account Operations', () => {
    it('should link an OAuth account', async () => {
      const accountData = {
        userId: 'mock-user-acc-1',
        type: 'oauth' as const,
        provider: 'discord',
        providerAccountId: 'acc-123',
      }

      const result = await adapter.linkAccount(accountData)

      expect(result).toEqual(accountData)
    })

    it('should unlink an OAuth account', async () => {
      // First create user and link account
      await adapter.createUser({
        id: 'mock-user-acc-2',
        email: 'unlink@example.com',
        name: 'Unlink User',
        emailVerified: null,
      })

      await adapter.linkAccount({
        userId: 'mock-user-acc-2',
        type: 'oauth',
        provider: 'discord',
        providerAccountId: 'acc-456',
      })

      // Unlink the account
      await adapter.unlinkAccount({
        provider: 'discord',
        providerAccountId: 'acc-456',
      })

      // Verify account is unlinked
      const result = await adapter.getUserByAccount({
        provider: 'discord',
        providerAccountId: 'acc-456',
      })
      expect(result).toBeNull()
    })
  })

  describe('Session Operations', () => {
    it('should create a session', async () => {
      const sessionData = {
        sessionToken: 'mock-token-1',
        userId: 'mock-user-sess-1',
        expires: new Date('2025-12-31'),
      }

      const result = await adapter.createSession(sessionData)

      expect(result).toEqual(sessionData)
    })

    it('should get session and user', async () => {
      // Create user first
      await adapter.createUser({
        id: 'mock-user-sess-2',
        email: 'session@example.com',
        name: 'Session User',
        emailVerified: null,
      })

      // Create session
      await adapter.createSession({
        sessionToken: 'mock-token-2',
        userId: 'mock-user-sess-2',
        expires: new Date('2025-12-31'),
      })

      const result = await adapter.getSessionAndUser('mock-token-2')

      expect(result).not.toBeNull()
      expect(result?.session.sessionToken).toBe('mock-token-2')
      expect(result?.user.id).toBe('mock-user-sess-2')
    })

    it('should return null for non-existent session', async () => {
      const result = await adapter.getSessionAndUser('non-existent-token')
      expect(result).toBeNull()
    })

    it('should return null for expired session', async () => {
      // Create user
      await adapter.createUser({
        id: 'mock-user-sess-3',
        email: 'expired@example.com',
        name: 'Expired User',
        emailVerified: null,
      })

      // Create expired session
      await adapter.createSession({
        sessionToken: 'expired-token',
        userId: 'mock-user-sess-3',
        expires: new Date('2020-01-01'), // Past date
      })

      const result = await adapter.getSessionAndUser('expired-token')
      expect(result).toBeNull()
    })

    it('should return null when session exists but user does not', async () => {
      // Create session without creating user
      await adapter.createSession({
        sessionToken: 'orphan-token',
        userId: 'non-existent-user',
        expires: new Date('2025-12-31'),
      })

      const result = await adapter.getSessionAndUser('orphan-token')
      expect(result).toBeNull()
    })

    it('should update a session', async () => {
      await adapter.createSession({
        sessionToken: 'mock-token-3',
        userId: 'mock-user-sess-4',
        expires: new Date('2025-12-31'),
      })

      const newExpires = new Date('2026-06-30')
      const result = await adapter.updateSession({
        sessionToken: 'mock-token-3',
        expires: newExpires,
      })

      expect(result).not.toBeNull()
      expect(result?.expires).toEqual(newExpires)
    })

    it('should return null when updating non-existent session', async () => {
      const result = await adapter.updateSession({
        sessionToken: 'non-existent-token',
        expires: new Date(),
      })
      expect(result).toBeNull()
    })

    it('should delete a session', async () => {
      await adapter.createUser({
        id: 'mock-user-sess-5',
        email: 'delete-sess@example.com',
        name: 'Delete Session User',
        emailVerified: null,
      })

      await adapter.createSession({
        sessionToken: 'delete-token',
        userId: 'mock-user-sess-5',
        expires: new Date('2025-12-31'),
      })

      await adapter.deleteSession('delete-token')

      const result = await adapter.getSessionAndUser('delete-token')
      expect(result).toBeNull()
    })
  })

  describe('Verification Token Operations', () => {
    it('should return null for createVerificationToken (not implemented)', async () => {
      const result = await adapter.createVerificationToken?.({
        identifier: 'test@example.com',
        token: 'verify-token',
        expires: new Date(),
      })
      expect(result).toBeNull()
    })

    it('should return null for useVerificationToken (not implemented)', async () => {
      const result = await adapter.useVerificationToken?.({
        identifier: 'test@example.com',
        token: 'verify-token',
      })
      expect(result).toBeNull()
    })
  })
})
