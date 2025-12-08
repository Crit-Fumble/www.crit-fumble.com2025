/**
 * Tests for Discord Activity Auth API Route
 *
 * Tests the authentication endpoint that exchanges Discord Activity context
 * for a session via Core API.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock NextRequest and NextResponse
vi.mock('next/server', () => ({
  NextRequest: class MockNextRequest {
    private body: unknown

    constructor(_url: string, init?: { body?: string }) {
      if (init?.body) {
        this.body = JSON.parse(init.body)
      }
    }

    async json() {
      return this.body
    }
  },
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) => ({
      status: init?.status || 200,
      data,
      async json() {
        return data
      },
    }),
  },
}))

// Store original env
const originalEnv = { ...process.env }

describe('Discord Activity Auth API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
    // Set up test environment
    process.env.CORE_API_URL = 'https://core.test.com'
    process.env.CORE_API_SECRET = 'test-secret-key'
  })

  afterEach(() => {
    vi.restoreAllMocks()
    process.env = { ...originalEnv }
  })

  describe('POST /api/discord-activity/auth', () => {
    it('should return 503 when CORE_API_SECRET is not configured', async () => {
      process.env.CORE_API_SECRET = ''

      // Re-import to get fresh module with updated env
      vi.resetModules()
      const { POST } = await import('@/app/api/discord-activity/auth/route')

      const request = new (await import('next/server')).NextRequest(
        'http://localhost/api/discord-activity/auth',
        {
          body: JSON.stringify({
            guildId: 'guild-123',
            channelId: 'channel-456',
            accessToken: 'discord-token',
          }),
        }
      )

      const response = await POST(request)
      expect(response.status).toBe(503)
      const data = await response.json()
      expect(data.error).toBe('Service unavailable')
    })

    it('should return 400 when guildId is missing', async () => {
      vi.resetModules()
      const { POST } = await import('@/app/api/discord-activity/auth/route')

      const request = new (await import('next/server')).NextRequest(
        'http://localhost/api/discord-activity/auth',
        {
          body: JSON.stringify({
            channelId: 'channel-456',
            accessToken: 'discord-token',
          }),
        }
      )

      const response = await POST(request)
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Missing guild or channel ID')
    })

    it('should return 400 when channelId is missing', async () => {
      vi.resetModules()
      const { POST } = await import('@/app/api/discord-activity/auth/route')

      const request = new (await import('next/server')).NextRequest(
        'http://localhost/api/discord-activity/auth',
        {
          body: JSON.stringify({
            guildId: 'guild-123',
            accessToken: 'discord-token',
          }),
        }
      )

      const response = await POST(request)
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Missing guild or channel ID')
    })

    it('should return 400 when accessToken is missing', async () => {
      vi.resetModules()
      const { POST } = await import('@/app/api/discord-activity/auth/route')

      const request = new (await import('next/server')).NextRequest(
        'http://localhost/api/discord-activity/auth',
        {
          body: JSON.stringify({
            guildId: 'guild-123',
            channelId: 'channel-456',
          }),
        }
      )

      const response = await POST(request)
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Missing access token')
    })

    it('should forward auth request to Core API and return success', async () => {
      vi.resetModules()

      const mockCoreResponse = {
        userId: 'user-123',
        name: 'Test User',
        discordId: 'discord-789',
        isAdmin: false,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCoreResponse),
      })

      const { POST } = await import('@/app/api/discord-activity/auth/route')

      const request = new (await import('next/server')).NextRequest(
        'http://localhost/api/discord-activity/auth',
        {
          body: JSON.stringify({
            guildId: 'guild-123',
            channelId: 'channel-456',
            accessToken: 'discord-token',
            instanceId: 'instance-001',
            platform: 'desktop',
          }),
        }
      )

      const response = await POST(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.userId).toBe('user-123')
      expect(data.name).toBe('Test User')

      // Verify fetch was called with correct params
      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://core.test.com/api/activity/auth',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Core-Secret': 'test-secret-key',
          }),
        })
      )

      // Verify request body sent to Core API
      const fetchCall = mockFetch.mock.calls[0]
      const fetchBody = JSON.parse(fetchCall[1].body)
      expect(fetchBody).toEqual({
        authType: 'discord',
        discordToken: 'discord-token',
        guildId: 'guild-123',
        channelId: 'channel-456',
      })
    })

    it('should return Core API error status when auth fails', async () => {
      vi.resetModules()

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      })

      const { POST } = await import('@/app/api/discord-activity/auth/route')

      const request = new (await import('next/server')).NextRequest(
        'http://localhost/api/discord-activity/auth',
        {
          body: JSON.stringify({
            guildId: 'guild-123',
            channelId: 'channel-456',
            accessToken: 'invalid-token',
          }),
        }
      )

      const response = await POST(request)
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Authentication failed')
    })

    it('should return 500 when fetch throws an error', async () => {
      vi.resetModules()

      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { POST } = await import('@/app/api/discord-activity/auth/route')

      const request = new (await import('next/server')).NextRequest(
        'http://localhost/api/discord-activity/auth',
        {
          body: JSON.stringify({
            guildId: 'guild-123',
            channelId: 'channel-456',
            accessToken: 'discord-token',
          }),
        }
      )

      const response = await POST(request)
      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Authentication failed')
    })

    it('should use default Core API URL when not configured', async () => {
      process.env.CORE_API_URL = ''

      vi.resetModules()

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ userId: 'user-123' }),
      })

      const { POST } = await import('@/app/api/discord-activity/auth/route')

      const request = new (await import('next/server')).NextRequest(
        'http://localhost/api/discord-activity/auth',
        {
          body: JSON.stringify({
            guildId: 'guild-123',
            channelId: 'channel-456',
            accessToken: 'discord-token',
          }),
        }
      )

      await POST(request)

      // Should use default URL
      expect(mockFetch).toHaveBeenCalledWith(
        'https://core.crit-fumble.com/api/activity/auth',
        expect.anything()
      )
    })
  })
})
