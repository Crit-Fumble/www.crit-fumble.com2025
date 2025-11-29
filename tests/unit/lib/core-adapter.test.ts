/**
 * Tests for Core API Adapter
 *
 * Tests the CoreAdapter function that proxies auth operations to the Core API.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { CoreAdapter } from '@/lib/core-adapter'

// Mock fetch globally
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('CoreAdapter', () => {
  const config = {
    coreApiUrl: 'https://core.example.com',
    coreApiSecret: 'test-secret',
    timeout: 5000,
  }

  let adapter: ReturnType<typeof CoreAdapter>

  beforeEach(() => {
    vi.clearAllMocks()
    adapter = CoreAdapter(config)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('User Operations', () => {
    describe('createUser', () => {
      it('should create a user via Core API', async () => {
        const userData = {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          emailVerified: null,
        }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          text: async () => JSON.stringify(userData),
        })

        const result = await adapter.createUser(userData)

        expect(mockFetch).toHaveBeenCalledWith(
          'https://core.example.com/api/auth/user',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              'X-Core-Secret': 'test-secret',
            }),
            body: JSON.stringify(userData),
          })
        )
        expect(result).toEqual(userData)
      })

      it('should throw error when user creation fails', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
        })

        await expect(
          adapter.createUser({
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
            emailVerified: null,
          })
        ).rejects.toThrow('Failed to create user')
      })
    })

    describe('getUser', () => {
      it('should get a user by ID', async () => {
        const userData = {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
        }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          text: async () => JSON.stringify(userData),
        })

        const result = await adapter.getUser('user-123')

        expect(mockFetch).toHaveBeenCalledWith(
          'https://core.example.com/api/auth/user/user-123',
          expect.objectContaining({
            headers: expect.objectContaining({
              'X-Core-Secret': 'test-secret',
            }),
          })
        )
        expect(result).toEqual(userData)
      })

      it('should return null for non-existent user', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
        })

        const result = await adapter.getUser('non-existent')
        expect(result).toBeNull()
      })

      it('should encode special characters in user ID', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          text: async () => JSON.stringify({ id: 'user@special' }),
        })

        await adapter.getUser('user@special')

        expect(mockFetch).toHaveBeenCalledWith(
          'https://core.example.com/api/auth/user/user%40special',
          expect.anything()
        )
      })
    })

    describe('getUserByEmail', () => {
      it('should get a user by email', async () => {
        const userData = { id: 'user-123', email: 'test@example.com' }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          text: async () => JSON.stringify(userData),
        })

        const result = await adapter.getUserByEmail('test@example.com')

        expect(mockFetch).toHaveBeenCalledWith(
          'https://core.example.com/api/auth/user/email/test%40example.com',
          expect.anything()
        )
        expect(result).toEqual(userData)
      })
    })

    describe('getUserByAccount', () => {
      it('should get a user by provider account', async () => {
        const userData = { id: 'user-123', email: 'test@example.com' }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          text: async () => JSON.stringify(userData),
        })

        const result = await adapter.getUserByAccount({
          provider: 'discord',
          providerAccountId: '12345',
        })

        expect(mockFetch).toHaveBeenCalledWith(
          'https://core.example.com/api/auth/user/account?provider=discord&providerAccountId=12345',
          expect.anything()
        )
        expect(result).toEqual(userData)
      })
    })

    describe('updateUser', () => {
      it('should update a user', async () => {
        const userData = { id: 'user-123', name: 'Updated Name' }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          text: async () => JSON.stringify(userData),
        })

        const result = await adapter.updateUser(userData)

        expect(mockFetch).toHaveBeenCalledWith(
          'https://core.example.com/api/auth/user/user-123',
          expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify(userData),
          })
        )
        expect(result).toEqual(userData)
      })

      it('should throw error when update fails', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
        })

        await expect(
          adapter.updateUser({ id: 'user-123', name: 'Updated' })
        ).rejects.toThrow('Failed to update user')
      })
    })

    describe('deleteUser', () => {
      it('should delete a user', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          text: async () => '',
        })

        await adapter.deleteUser('user-123')

        expect(mockFetch).toHaveBeenCalledWith(
          'https://core.example.com/api/auth/user/user-123',
          expect.objectContaining({
            method: 'DELETE',
          })
        )
      })
    })
  })

  describe('Account Operations', () => {
    describe('linkAccount', () => {
      it('should link an OAuth account', async () => {
        const accountData = {
          userId: 'user-123',
          type: 'oauth' as const,
          provider: 'discord',
          providerAccountId: '12345',
        }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          text: async () => JSON.stringify(accountData),
        })

        const result = await adapter.linkAccount(accountData)

        expect(mockFetch).toHaveBeenCalledWith(
          'https://core.example.com/api/auth/account',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify(accountData),
          })
        )
        expect(result).toEqual(accountData)
      })

      it('should throw error when linking fails', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
        })

        await expect(
          adapter.linkAccount({
            userId: 'user-123',
            type: 'oauth',
            provider: 'discord',
            providerAccountId: '12345',
          })
        ).rejects.toThrow('Failed to link account')
      })
    })

    describe('unlinkAccount', () => {
      it('should unlink an OAuth account', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          text: async () => '',
        })

        await adapter.unlinkAccount({
          provider: 'discord',
          providerAccountId: '12345',
        })

        expect(mockFetch).toHaveBeenCalledWith(
          'https://core.example.com/api/auth/account?provider=discord&providerAccountId=12345',
          expect.objectContaining({
            method: 'DELETE',
          })
        )
      })
    })
  })

  describe('Session Operations', () => {
    describe('createSession', () => {
      it('should create a session', async () => {
        const sessionData = {
          sessionToken: 'token-123',
          userId: 'user-123',
          expires: '2025-12-31T00:00:00.000Z', // JSON serialized date
        }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          text: async () => JSON.stringify(sessionData),
        })

        const result = await adapter.createSession({
          sessionToken: 'token-123',
          userId: 'user-123',
          expires: new Date('2025-12-31'),
        })

        expect(mockFetch).toHaveBeenCalledWith(
          'https://core.example.com/api/auth/session',
          expect.objectContaining({
            method: 'POST',
          })
        )
        expect(result).toMatchObject({
          sessionToken: 'token-123',
          userId: 'user-123',
        })
      })

      it('should throw error when session creation fails', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
        })

        await expect(
          adapter.createSession({
            sessionToken: 'token-123',
            userId: 'user-123',
            expires: new Date(),
          })
        ).rejects.toThrow('Failed to create session')
      })
    })

    describe('getSessionAndUser', () => {
      it('should get session and user by token', async () => {
        const data = {
          session: { sessionToken: 'token-123', userId: 'user-123', expires: '2025-12-31T00:00:00.000Z' },
          user: { id: 'user-123', email: 'test@example.com' },
        }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          text: async () => JSON.stringify(data),
        })

        const result = await adapter.getSessionAndUser('token-123')

        expect(mockFetch).toHaveBeenCalledWith(
          'https://core.example.com/api/auth/session/token-123',
          expect.anything()
        )
        expect(result).toMatchObject({
          session: { sessionToken: 'token-123', userId: 'user-123' },
          user: { id: 'user-123', email: 'test@example.com' },
        })
      })

      it('should return null for invalid session', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
        })

        const result = await adapter.getSessionAndUser('invalid-token')
        expect(result).toBeNull()
      })
    })

    describe('updateSession', () => {
      it('should update a session', async () => {
        const sessionData = {
          sessionToken: 'token-123',
          expires: '2026-01-01T00:00:00.000Z', // JSON serialized
        }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          text: async () => JSON.stringify(sessionData),
        })

        const result = await adapter.updateSession(sessionData)

        expect(mockFetch).toHaveBeenCalledWith(
          'https://core.example.com/api/auth/session/token-123',
          expect.objectContaining({
            method: 'PATCH',
          })
        )
        expect(result).toEqual(sessionData)
      })
    })

    describe('deleteSession', () => {
      it('should delete a session', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          text: async () => '',
        })

        await adapter.deleteSession('token-123')

        expect(mockFetch).toHaveBeenCalledWith(
          'https://core.example.com/api/auth/session/token-123',
          expect.objectContaining({
            method: 'DELETE',
          })
        )
      })
    })
  })

  describe('Verification Token Operations', () => {
    describe('createVerificationToken', () => {
      it('should create a verification token', async () => {
        const responseData = {
          identifier: 'test@example.com',
          token: 'verify-token',
          expires: '2025-12-31T00:00:00.000Z', // JSON serialized
        }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          text: async () => JSON.stringify(responseData),
        })

        const result = await adapter.createVerificationToken({
          identifier: 'test@example.com',
          token: 'verify-token',
          expires: new Date('2025-12-31'),
        })

        expect(mockFetch).toHaveBeenCalledWith(
          'https://core.example.com/api/auth/verification-token',
          expect.objectContaining({
            method: 'POST',
          })
        )
        expect(result).toMatchObject({
          identifier: 'test@example.com',
          token: 'verify-token',
        })
      })
    })

    describe('useVerificationToken', () => {
      it('should use and delete a verification token', async () => {
        const responseData = {
          identifier: 'test@example.com',
          token: 'verify-token',
          expires: '2025-12-31T00:00:00.000Z', // JSON serialized
        }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          text: async () => JSON.stringify(responseData),
        })

        const result = await adapter.useVerificationToken({
          identifier: 'test@example.com',
          token: 'verify-token',
        })

        expect(mockFetch).toHaveBeenCalledWith(
          'https://core.example.com/api/auth/verification-token?identifier=test%40example.com&token=verify-token',
          expect.objectContaining({
            method: 'DELETE',
          })
        )
        expect(result).toMatchObject({
          identifier: 'test@example.com',
          token: 'verify-token',
        })
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await adapter.getUser('user-123')
      expect(result).toBeNull()
    })

    it('should handle timeout errors', async () => {
      const abortError = new Error('Aborted')
      abortError.name = 'AbortError'
      mockFetch.mockRejectedValueOnce(abortError)

      const result = await adapter.getUser('user-123')
      expect(result).toBeNull()
    })

    it('should handle empty response body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      })

      const result = await adapter.getUser('user-123')
      expect(result).toBeNull()
    })

    it('should handle non-404 errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      const result = await adapter.getUser('user-123')
      expect(result).toBeNull()
    })
  })

  describe('Configuration', () => {
    it('should use default timeout when not specified', async () => {
      const adapterNoTimeout = CoreAdapter({
        coreApiUrl: 'https://core.example.com',
        coreApiSecret: 'test-secret',
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ id: 'user-123' }),
      })

      await adapterNoTimeout.getUser('user-123')

      // The request should still work with default timeout
      expect(mockFetch).toHaveBeenCalled()
    })
  })
})
