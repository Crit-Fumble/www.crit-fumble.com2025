/**
 * Tests for Bot Authentication
 *
 * Tests the bot authentication and service account functionality.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock 'server-only' before importing bot-auth
vi.mock('server-only', () => ({}))

// Mock the SDK
const mockGetUser = vi.fn()
const mockCreateUser = vi.fn()

class MockCoreApiClient {
  authAdapter = {
    getUser: mockGetUser,
    createUser: mockCreateUser,
  }
}

vi.mock('@crit-fumble/core/client', () => ({
  CoreApiClient: MockCoreApiClient,
}))

// Store original env
const originalEnv = { ...process.env }

describe('Bot Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockReset()
    mockCreateUser.mockReset()
    // Set up test environment
    process.env.BOT_API_SECRET = 'test-bot-secret'
    process.env.OWNER_DISCORD_IDS = 'owner-123,owner-456'
    process.env.ADMIN_DISCORD_IDS = 'admin-789'
    process.env.CORE_API_URL = 'https://core.example.com'
    process.env.CORE_API_SECRET = 'test-core-secret'
  })

  afterEach(() => {
    vi.restoreAllMocks()
    // Restore original env
    process.env = { ...originalEnv }
  })

  describe('verifyBotAuth', () => {
    it('should return owner role for owner bot ID with valid secret', async () => {
      // Re-import to pick up env changes
      vi.resetModules()
      const { verifyBotAuth } = await import('@/lib/bot-auth')

      const mockRequest = {
        headers: {
          get: (name: string) => {
            if (name === 'X-Discord-Bot-Id') return 'owner-123'
            if (name === 'X-Bot-Secret') return 'test-bot-secret'
            return null
          },
        },
      } as unknown as Request & { headers: Headers }

      // Cast to NextRequest type for the test
      const result = verifyBotAuth(mockRequest as any)

      expect(result).toEqual({
        discordId: 'owner-123',
        role: 'owner',
      })
    })

    it('should return admin role for admin bot ID with valid secret', async () => {
      vi.resetModules()
      const { verifyBotAuth } = await import('@/lib/bot-auth')

      const mockRequest = {
        headers: {
          get: (name: string) => {
            if (name === 'X-Discord-Bot-Id') return 'admin-789'
            if (name === 'X-Bot-Secret') return 'test-bot-secret'
            return null
          },
        },
      }

      const result = verifyBotAuth(mockRequest as any)

      expect(result).toEqual({
        discordId: 'admin-789',
        role: 'admin',
      })
    })

    it('should return null for invalid secret', async () => {
      vi.resetModules()
      const { verifyBotAuth } = await import('@/lib/bot-auth')

      const mockRequest = {
        headers: {
          get: (name: string) => {
            if (name === 'X-Discord-Bot-Id') return 'owner-123'
            if (name === 'X-Bot-Secret') return 'wrong-secret'
            return null
          },
        },
      }

      const result = verifyBotAuth(mockRequest as any)

      expect(result).toBeNull()
    })

    it('should return null for missing bot ID', async () => {
      vi.resetModules()
      const { verifyBotAuth } = await import('@/lib/bot-auth')

      const mockRequest = {
        headers: {
          get: (name: string) => {
            if (name === 'X-Bot-Secret') return 'test-bot-secret'
            return null
          },
        },
      }

      const result = verifyBotAuth(mockRequest as any)

      expect(result).toBeNull()
    })

    it('should return null for missing secret', async () => {
      vi.resetModules()
      const { verifyBotAuth } = await import('@/lib/bot-auth')

      const mockRequest = {
        headers: {
          get: (name: string) => {
            if (name === 'X-Discord-Bot-Id') return 'owner-123'
            return null
          },
        },
      }

      const result = verifyBotAuth(mockRequest as any)

      expect(result).toBeNull()
    })

    it('should return null for unrecognized bot ID', async () => {
      vi.resetModules()
      const { verifyBotAuth } = await import('@/lib/bot-auth')

      const mockRequest = {
        headers: {
          get: (name: string) => {
            if (name === 'X-Discord-Bot-Id') return 'unknown-bot'
            if (name === 'X-Bot-Secret') return 'test-bot-secret'
            return null
          },
        },
      }

      const result = verifyBotAuth(mockRequest as any)

      expect(result).toBeNull()
    })
  })

  describe('getBotServiceAccountId', () => {
    it('should return existing user ID if user exists', async () => {
      vi.resetModules()
      const { getBotServiceAccountId } = await import('@/lib/bot-auth')

      // Mock getUser to return existing user
      mockGetUser.mockResolvedValueOnce({ id: 'bot:bot-discord-id' })

      const result = await getBotServiceAccountId('bot-discord-id')

      expect(result).toBe('bot:bot-discord-id')
      expect(mockGetUser).toHaveBeenCalledWith('bot:bot-discord-id')
    })

    it('should create new user if user does not exist', async () => {
      vi.resetModules()
      const { getBotServiceAccountId } = await import('@/lib/bot-auth')

      // User doesn't exist
      mockGetUser.mockResolvedValueOnce(null)

      // Create user returns new user
      mockCreateUser.mockResolvedValueOnce({ id: 'bot:new-bot-id' })

      const result = await getBotServiceAccountId('new-bot-id')

      expect(result).toBe('bot:new-bot-id')
      expect(mockGetUser).toHaveBeenCalledWith('bot:new-bot-id')
      expect(mockCreateUser).toHaveBeenCalledWith({
        id: 'bot:new-bot-id',
        name: 'FumbleBot',
        email: 'bot-new-bot-id@fumblebot.local',
      })
    })

    it('should throw error if user creation fails', async () => {
      vi.resetModules()
      const { getBotServiceAccountId } = await import('@/lib/bot-auth')

      // User doesn't exist
      mockGetUser.mockResolvedValueOnce(null)

      // Create fails with SDK error
      mockCreateUser.mockRejectedValueOnce(new Error('Failed to create user'))

      await expect(getBotServiceAccountId('failing-bot')).rejects.toThrow(
        'Failed to create user'
      )
    })

    it('should throw error if Core API is not configured', async () => {
      process.env.CORE_API_URL = ''
      process.env.CORE_API_SECRET = ''

      vi.resetModules()
      const { getBotServiceAccountId } = await import('@/lib/bot-auth')

      await expect(getBotServiceAccountId('any-bot')).rejects.toThrow(
        'CORE_API_URL and CORE_API_SECRET must be configured'
      )
    })
  })
})
