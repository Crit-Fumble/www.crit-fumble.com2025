/**
 * Tests for Admin Authentication Utility
 *
 * Tests the admin-only route protection and helper functions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextResponse } from 'next/server'
import { mockAuth, setMockSession, createMockSession } from '../setup'

// Mock 'server-only' before importing admin-auth
vi.mock('server-only', () => ({}))

// Mock the Core API Client
const mockCoreApiClient = vi.fn()

vi.mock('@crit-fumble/core/client', () => {
  return {
    CoreApiClient: mockCoreApiClient,
  }
})

// Now import the admin-auth module
import {
  verifyAdmin,
  unauthorizedResponse,
  forbiddenResponse,
  getCoreApiClient,
  requireAdmin,
  type AdminSession,
} from '@/lib/admin-auth'

// Store original env values
const originalEnv = { ...process.env }

describe('Admin Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCoreApiClient.mockClear()
    // Set up test environment
    process.env.CORE_API_URL = 'https://core.test.com'
    process.env.CORE_API_SECRET = 'test-secret'
  })

  afterEach(() => {
    vi.restoreAllMocks()
    // Restore original env
    process.env = { ...originalEnv }
  })

  describe('verifyAdmin', () => {
    it('should return AdminSession when user is admin', async () => {
      const session = createMockSession({
        user: {
          id: 'user-123',
          discordId: 'discord-456',
          isAdmin: true,
        },
      })
      setMockSession(session)

      const result = await verifyAdmin()

      expect(result).not.toBeNull()
      expect(result?.userId).toBe('user-123')
      expect(result?.discordId).toBe('discord-456')
      expect(result?.isAdmin).toBe(true)
    })

    it('should return null when user is not admin', async () => {
      const session = createMockSession({
        user: {
          id: 'user-123',
          discordId: 'discord-456',
          isAdmin: false,
        },
      })
      setMockSession(session)

      const result = await verifyAdmin()

      expect(result).toBeNull()
    })

    it('should return null when user is not authenticated', async () => {
      setMockSession(null)

      const result = await verifyAdmin()

      expect(result).toBeNull()
    })

    it('should handle user without discordId', async () => {
      const session = createMockSession({
        user: {
          id: 'user-123',
          isAdmin: true,
        },
      })
      // Remove discordId
      delete (session.user as any).discordId

      setMockSession(session)

      const result = await verifyAdmin()

      expect(result).not.toBeNull()
      expect(result?.userId).toBe('user-123')
      expect(result?.discordId).toBeNull()
      expect(result?.isAdmin).toBe(true)
    })

    it('should return null when isAdmin is undefined', async () => {
      const session = createMockSession({
        user: {
          id: 'user-123',
          discordId: 'discord-456',
        },
      })
      // Remove isAdmin flag
      delete (session.user as any).isAdmin

      setMockSession(session)

      const result = await verifyAdmin()

      expect(result).toBeNull()
    })

    it('should log when user is not admin', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const session = createMockSession({
        user: {
          id: 'user-123',
          discordId: 'discord-456',
          isAdmin: false,
        },
      })
      setMockSession(session)

      await verifyAdmin()

      expect(consoleSpy).toHaveBeenCalledWith(
        '[admin-auth] User is not admin:',
        expect.objectContaining({
          userId: expect.any(String),
          isAdmin: false,
        })
      )

      consoleSpy.mockRestore()
    })
  })

  describe('unauthorizedResponse', () => {
    it('should create a 401 response with default message', async () => {
      const response = unauthorizedResponse()

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data).toEqual({ error: 'Unauthorized' })
    })

    it('should create a 401 response with custom message', async () => {
      const response = unauthorizedResponse('Custom error message')

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data).toEqual({ error: 'Custom error message' })
    })
  })

  describe('forbiddenResponse', () => {
    it('should create a 403 response with default message', async () => {
      const response = forbiddenResponse()

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data).toEqual({ error: 'Forbidden' })
    })

    it('should create a 403 response with custom message', async () => {
      const response = forbiddenResponse('Custom forbidden message')

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data).toEqual({ error: 'Custom forbidden message' })
    })
  })

  describe('getCoreApiClient', () => {
    it('should return CoreApiClient when environment variables are set', () => {
      process.env.CORE_API_URL = 'https://core.test.com'
      process.env.CORE_API_SECRET = 'test-secret'

      const client = getCoreApiClient()

      expect(client).not.toBeNull()
      expect(mockCoreApiClient).toHaveBeenCalledWith({
        baseUrl: 'https://core.test.com',
        apiKey: 'test-secret',
      })
    })

    it('should return null when CORE_API_URL is not set', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      delete process.env.CORE_API_URL
      process.env.CORE_API_SECRET = 'test-secret'

      const client = getCoreApiClient()

      expect(client).toBeNull()
      expect(consoleSpy).toHaveBeenCalledWith('[admin-auth] Core API not configured')

      consoleSpy.mockRestore()
    })

    it('should return null when CORE_API_SECRET is not set', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      process.env.CORE_API_URL = 'https://core.test.com'
      delete process.env.CORE_API_SECRET

      const client = getCoreApiClient()

      expect(client).toBeNull()
      expect(consoleSpy).toHaveBeenCalledWith('[admin-auth] Core API not configured')

      consoleSpy.mockRestore()
    })

    it('should return null when both environment variables are not set', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      delete process.env.CORE_API_URL
      delete process.env.CORE_API_SECRET

      const client = getCoreApiClient()

      expect(client).toBeNull()
      expect(consoleSpy).toHaveBeenCalledWith('[admin-auth] Core API not configured')

      consoleSpy.mockRestore()
    })
  })

  describe('requireAdmin', () => {
    it('should return AdminSession when user is admin', async () => {
      const session = createMockSession({
        user: {
          id: 'user-123',
          discordId: 'discord-456',
          isAdmin: true,
        },
      })
      setMockSession(session)

      const result = await requireAdmin()

      expect(result).not.toBeInstanceOf(NextResponse)
      expect((result as AdminSession).userId).toBe('user-123')
      expect((result as AdminSession).discordId).toBe('discord-456')
      expect((result as AdminSession).isAdmin).toBe(true)
    })

    it('should return unauthorized response when user is not admin', async () => {
      const session = createMockSession({
        user: {
          id: 'user-123',
          discordId: 'discord-456',
          isAdmin: false,
        },
      })
      setMockSession(session)

      const result = await requireAdmin()

      expect(result).toBeInstanceOf(Object)
      expect((result as any).status).toBe(401)
      const data = await (result as any).json()
      expect(data).toEqual({ error: 'Admin access required' })
    })

    it('should return unauthorized response when user is not authenticated', async () => {
      setMockSession(null)

      const result = await requireAdmin()

      expect(result).toBeInstanceOf(Object)
      expect((result as any).status).toBe(401)
      const data = await (result as any).json()
      expect(data).toEqual({ error: 'Admin access required' })
    })
  })

  describe('Module Exports', () => {
    it('should export all expected functions', () => {
      expect(typeof verifyAdmin).toBe('function')
      expect(typeof unauthorizedResponse).toBe('function')
      expect(typeof forbiddenResponse).toBe('function')
      expect(typeof getCoreApiClient).toBe('function')
      expect(typeof requireAdmin).toBe('function')
    })
  })
})
