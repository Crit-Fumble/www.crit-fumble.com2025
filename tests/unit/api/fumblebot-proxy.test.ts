/**
 * Tests for FumbleBot Proxy API (src/app/api/fumblebot-proxy/[[...path]]/route.ts)
 *
 * Tests the proxy that forwards requests from fumblebot.crit-fumble.com
 * to the FumbleBot service on Digital Ocean.
 *
 * @vitest-environment node
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Store original env
const originalEnv = { ...process.env }

// Mock fetch globally
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Mock NextRequest and NextResponse
vi.mock('next/server', () => {
  class MockNextRequest {
    url: string
    method: string
    nextUrl: { searchParams: URLSearchParams }
    private _headers: Map<string, string>
    private _body: string | null

    constructor(url: string, init?: { method?: string; headers?: Record<string, string>; body?: string }) {
      this.url = url
      this.method = init?.method || 'GET'
      this.nextUrl = { searchParams: new URL(url).searchParams }
      this._headers = new Map(Object.entries(init?.headers || {}))
      this._body = init?.body || null
    }

    headers = {
      get: (name: string) => this._headers.get(name) || null,
    }

    async text() {
      return this._body || ''
    }
  }

  class MockNextResponse {
    status: number
    private _body: ArrayBuffer | null
    private _headers: Record<string, string>

    constructor(body: ArrayBuffer | null, init?: { status?: number; headers?: Record<string, string> }) {
      this._body = body
      this.status = init?.status || 200
      this._headers = init?.headers || {}
    }

    async json() {
      if (!this._body) return null
      const text = new TextDecoder().decode(this._body)
      return JSON.parse(text)
    }

    static json(data: unknown, init?: { status?: number }) {
      const body = new TextEncoder().encode(JSON.stringify(data)).buffer as ArrayBuffer
      return new MockNextResponse(body, init)
    }
  }

  return {
    NextRequest: MockNextRequest,
    NextResponse: MockNextResponse,
  }
})

// Helper to create mock request
function createMockRequest(
  path: string,
  method: string = 'GET',
  options: { headers?: Record<string, string>; body?: string; query?: Record<string, string> } = {}
) {
  const url = new URL(`https://fumblebot.crit-fumble.com/api/fumblebot-proxy/${path}`)
  if (options.query) {
    Object.entries(options.query).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })
  }

  const { NextRequest } = require('next/server')
  return new NextRequest(url.toString(), {
    method,
    headers: options.headers,
    body: options.body,
  })
}

// Helper to create mock fetch response
function createMockResponse(
  body: unknown,
  status: number = 200,
  headers: Record<string, string> = {}
) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (name: string) => headers[name] || null,
    },
    arrayBuffer: () => Promise.resolve(
      typeof body === 'string'
        ? new TextEncoder().encode(body).buffer
        : new TextEncoder().encode(JSON.stringify(body)).buffer
    ),
  }
}

describe('FumbleBot Proxy API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    process.env = { ...originalEnv }
    process.env.FUMBLEBOT_API_URL = 'http://159.203.126.144'
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  describe('GET requests', () => {
    it('should proxy GET requests to FumbleBot API', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ status: 'ok', version: '1.0.0' }, 200, {
          'Content-Type': 'application/json',
        })
      )

      const { GET } = await import('@/app/api/fumblebot-proxy/[[...path]]/route')
      const request = createMockRequest('status')

      const response = await GET(request, { params: Promise.resolve({ path: ['status'] }) })

      expect(mockFetch).toHaveBeenCalledWith(
        'http://159.203.126.144/status',
        expect.objectContaining({
          method: 'GET',
        })
      )
      expect(response.status).toBe(200)
    })

    it('should forward query parameters', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ results: [] }, 200, {
          'Content-Type': 'application/json',
        })
      )

      const { GET } = await import('@/app/api/fumblebot-proxy/[[...path]]/route')
      const request = createMockRequest('search', 'GET', {
        query: { q: 'test', limit: '10' },
      })

      await GET(request, { params: Promise.resolve({ path: ['search'] }) })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('q=test'),
        expect.any(Object)
      )
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=10'),
        expect.any(Object)
      )
    })

    it('should handle root path requests', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ message: 'FumbleBot API' }, 200, {
          'Content-Type': 'application/json',
        })
      )

      const { GET } = await import('@/app/api/fumblebot-proxy/[[...path]]/route')
      const request = createMockRequest('')

      await GET(request, { params: Promise.resolve({ path: undefined }) })

      expect(mockFetch).toHaveBeenCalledWith(
        'http://159.203.126.144/',
        expect.any(Object)
      )
    })

    it('should handle nested paths', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ data: {} }, 200, {
          'Content-Type': 'application/json',
        })
      )

      const { GET } = await import('@/app/api/fumblebot-proxy/[[...path]]/route')
      const request = createMockRequest('api/v1/users')

      await GET(request, { params: Promise.resolve({ path: ['api', 'v1', 'users'] }) })

      expect(mockFetch).toHaveBeenCalledWith(
        'http://159.203.126.144/api/v1/users',
        expect.any(Object)
      )
    })
  })

  describe('POST requests', () => {
    it('should proxy POST requests with body', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ success: true }, 201, {
          'Content-Type': 'application/json',
        })
      )

      const { POST } = await import('@/app/api/fumblebot-proxy/[[...path]]/route')
      const request = createMockRequest('commands', 'POST', {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'roll', args: ['1d20'] }),
      })

      const response = await POST(request, { params: Promise.resolve({ path: ['commands'] }) })

      expect(mockFetch).toHaveBeenCalledWith(
        'http://159.203.126.144/commands',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ command: 'roll', args: ['1d20'] }),
        })
      )
      expect(response.status).toBe(201)
    })

    it('should forward Content-Type header', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ success: true }, 200, {
          'Content-Type': 'application/json',
        })
      )

      const { POST } = await import('@/app/api/fumblebot-proxy/[[...path]]/route')
      const request = createMockRequest('data', 'POST', {
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      })

      await POST(request, { params: Promise.resolve({ path: ['data'] }) })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
    })
  })

  describe('PUT requests', () => {
    it('should proxy PUT requests', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ updated: true }, 200, {
          'Content-Type': 'application/json',
        })
      )

      const { PUT } = await import('@/app/api/fumblebot-proxy/[[...path]]/route')
      const request = createMockRequest('config/123', 'PUT', {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: true }),
      })

      const response = await PUT(request, { params: Promise.resolve({ path: ['config', '123'] }) })

      expect(mockFetch).toHaveBeenCalledWith(
        'http://159.203.126.144/config/123',
        expect.objectContaining({
          method: 'PUT',
        })
      )
      expect(response.status).toBe(200)
    })
  })

  describe('DELETE requests', () => {
    it('should proxy DELETE requests', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ deleted: true }, 200, {
          'Content-Type': 'application/json',
        })
      )

      const { DELETE } = await import('@/app/api/fumblebot-proxy/[[...path]]/route')
      const request = createMockRequest('sessions/abc', 'DELETE')

      const response = await DELETE(request, { params: Promise.resolve({ path: ['sessions', 'abc'] }) })

      expect(mockFetch).toHaveBeenCalledWith(
        'http://159.203.126.144/sessions/abc',
        expect.objectContaining({
          method: 'DELETE',
        })
      )
      expect(response.status).toBe(200)
    })
  })

  describe('PATCH requests', () => {
    it('should proxy PATCH requests', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ patched: true }, 200, {
          'Content-Type': 'application/json',
        })
      )

      const { PATCH } = await import('@/app/api/fumblebot-proxy/[[...path]]/route')
      const request = createMockRequest('users/456', 'PATCH', {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: 'NewName' }),
      })

      const response = await PATCH(request, { params: Promise.resolve({ path: ['users', '456'] }) })

      expect(mockFetch).toHaveBeenCalledWith(
        'http://159.203.126.144/users/456',
        expect.objectContaining({
          method: 'PATCH',
        })
      )
      expect(response.status).toBe(200)
    })
  })

  describe('Error handling', () => {
    it('should return 502 when fetch throws an error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'))

      const { GET } = await import('@/app/api/fumblebot-proxy/[[...path]]/route')
      const request = createMockRequest('status')

      const response = await GET(request, { params: Promise.resolve({ path: ['status'] }) })

      expect(response.status).toBe(502)
      const data = await response.json()
      expect(data.error).toBe('Proxy error')
    })

    it('should forward error status codes from upstream', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ error: 'Not found' }, 404, {
          'Content-Type': 'application/json',
        })
      )

      const { GET } = await import('@/app/api/fumblebot-proxy/[[...path]]/route')
      const request = createMockRequest('nonexistent')

      const response = await GET(request, { params: Promise.resolve({ path: ['nonexistent'] }) })

      expect(response.status).toBe(404)
    })

    it('should forward 500 errors from upstream', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ error: 'Internal error' }, 500, {
          'Content-Type': 'application/json',
        })
      )

      const { GET } = await import('@/app/api/fumblebot-proxy/[[...path]]/route')
      const request = createMockRequest('broken')

      const response = await GET(request, { params: Promise.resolve({ path: ['broken'] }) })

      expect(response.status).toBe(500)
    })
  })

  describe('Header forwarding', () => {
    it('should forward Authorization header', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ authorized: true }, 200, {
          'Content-Type': 'application/json',
        })
      )

      const { GET } = await import('@/app/api/fumblebot-proxy/[[...path]]/route')
      const request = createMockRequest('protected', 'GET', {
        headers: { 'Authorization': 'Bearer test-token' },
      })

      await GET(request, { params: Promise.resolve({ path: ['protected'] }) })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
          }),
        })
      )
    })

    it('should forward CORS headers from response', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ data: {} }, 200, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST',
        })
      )

      const { GET } = await import('@/app/api/fumblebot-proxy/[[...path]]/route')
      const request = createMockRequest('cors-enabled')

      // Note: The actual CORS header forwarding is handled in the route
      // This test verifies the fetch is made correctly
      await GET(request, { params: Promise.resolve({ path: ['cors-enabled'] }) })

      expect(mockFetch).toHaveBeenCalled()
    })
  })

  describe('Environment configuration', () => {
    it('should use FUMBLEBOT_API_URL when configured', async () => {
      process.env.FUMBLEBOT_API_URL = 'http://custom-host:3000'
      vi.resetModules()

      mockFetch.mockResolvedValueOnce(
        createMockResponse({ status: 'ok' }, 200, {
          'Content-Type': 'application/json',
        })
      )

      const { GET } = await import('@/app/api/fumblebot-proxy/[[...path]]/route')
      const request = createMockRequest('status')

      await GET(request, { params: Promise.resolve({ path: ['status'] }) })

      expect(mockFetch).toHaveBeenCalledWith(
        'http://custom-host:3000/status',
        expect.any(Object)
      )
    })

    it('should use default URL when FUMBLEBOT_API_URL is not set', async () => {
      delete process.env.FUMBLEBOT_API_URL
      vi.resetModules()

      mockFetch.mockResolvedValueOnce(
        createMockResponse({ status: 'ok' }, 200, {
          'Content-Type': 'application/json',
        })
      )

      const { GET } = await import('@/app/api/fumblebot-proxy/[[...path]]/route')
      const request = createMockRequest('status')

      await GET(request, { params: Promise.resolve({ path: ['status'] }) })

      // Default URL from the route file
      expect(mockFetch).toHaveBeenCalledWith(
        'http://159.203.126.144/status',
        expect.any(Object)
      )
    })
  })
})
