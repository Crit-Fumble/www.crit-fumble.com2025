/**
 * Tests for Proxy (src/proxy.ts)
 *
 * Tests the Next.js 16 Proxy function that handles:
 * - Subdomain routing
 * - Discord Activity proxy domain handling
 * - Path restrictions
 *
 * @vitest-environment node
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Create mock NextResponse methods
const mockNextFn = vi.fn(() => ({ type: 'next' }))
const mockRedirectFn = vi.fn((url: URL) => ({ type: 'redirect', url: url.toString() }))
const mockRewriteFn = vi.fn((url: URL) => ({ type: 'rewrite', url: url.toString() }))

// Must mock before importing the proxy module
vi.mock('next/server', () => ({
  NextResponse: {
    next: () => mockNextFn(),
    redirect: (url: URL) => mockRedirectFn(url),
    rewrite: (url: URL) => mockRewriteFn(url),
  },
}))

// Create mock NextRequest factory
function createMockRequest(
  pathname: string,
  host: string = 'www.crit-fumble.com'
) {
  const url = new URL(`https://${host}${pathname}`)
  return {
    nextUrl: {
      pathname,
      clone: () => ({ ...url, pathname }),
    },
    headers: {
      get: (name: string) => (name === 'host' ? host : null),
    },
    url: url.toString(),
  }
}

describe('Proxy (src/proxy.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNextFn.mockReturnValue({ type: 'next' })
    mockRedirectFn.mockImplementation((url: URL) => ({ type: 'redirect', url: url.toString() }))
    mockRewriteFn.mockImplementation((url: URL) => ({ type: 'rewrite', url: url.toString() }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Discord Activity Domain Handling', () => {
    it('should pass through requests from *.discordsays.com domains', async () => {
      vi.resetModules()
      const { proxy } = await import('@/proxy')

      const request = createMockRequest(
        '/discord/activity',
        '1225663590166691840.discordsays.com'
      )

      const response = await proxy(request as any)

      expect(mockNextFn).toHaveBeenCalled()
      expect(response.type).toBe('next')
    })

    it('should pass through static asset requests from discordsays.com', async () => {
      vi.resetModules()
      const { proxy } = await import('@/proxy')

      const request = createMockRequest(
        '/_next/static/chunks/main.css',
        '1223681019178123274.discordsays.com'
      )

      const response = await proxy(request as any)

      expect(mockNextFn).toHaveBeenCalled()
      expect(response.type).toBe('next')
    })

    it('should pass through API requests from discordsays.com', async () => {
      vi.resetModules()
      const { proxy } = await import('@/proxy')

      const request = createMockRequest(
        '/api/discord-activity/auth',
        '1225663590166691840.discordsays.com'
      )

      const response = await proxy(request as any)

      expect(mockNextFn).toHaveBeenCalled()
      expect(response.type).toBe('next')
    })

    it('should handle staging Discord Activity domain', async () => {
      vi.resetModules()
      const { proxy } = await import('@/proxy')

      const request = createMockRequest(
        '/discord/activity',
        '1225663590166691840.discordsays.com'
      )

      const response = await proxy(request as any)

      expect(mockNextFn).toHaveBeenCalled()
    })

    it('should handle production Discord Activity domain', async () => {
      vi.resetModules()
      const { proxy } = await import('@/proxy')

      const request = createMockRequest(
        '/discord/activity',
        '1223681019178123274.discordsays.com'
      )

      const response = await proxy(request as any)

      expect(mockNextFn).toHaveBeenCalled()
    })
  })

  describe('Subdomain Routing', () => {
    it('should rewrite wiki subdomain to /wiki routes', async () => {
      vi.resetModules()
      const { proxy } = await import('@/proxy')

      const request = createMockRequest('/some-article', 'wiki.crit-fumble.com')

      const response = await proxy(request as any)

      expect(mockRewriteFn).toHaveBeenCalled()
      expect(response.type).toBe('rewrite')
    })

    it('should rewrite wiki subdomain root to /wiki', async () => {
      vi.resetModules()
      const { proxy } = await import('@/proxy')

      const request = createMockRequest('/', 'wiki.crit-fumble.com')

      await proxy(request as any)

      expect(mockRewriteFn).toHaveBeenCalled()
    })

    it('should pass through /api routes on wiki subdomain', async () => {
      vi.resetModules()
      const { proxy } = await import('@/proxy')

      const request = createMockRequest('/api/auth/session', 'wiki.crit-fumble.com')

      const response = await proxy(request as any)

      expect(mockNextFn).toHaveBeenCalled()
      expect(response.type).toBe('next')
    })

    it('should rewrite activity subdomain to /activity routes', async () => {
      vi.resetModules()
      const { proxy } = await import('@/proxy')

      const request = createMockRequest('/feed', 'activity.crit-fumble.com')

      await proxy(request as any)

      expect(mockRewriteFn).toHaveBeenCalled()
    })

    it('should pass through /api routes on activity subdomain', async () => {
      vi.resetModules()
      const { proxy } = await import('@/proxy')

      const request = createMockRequest('/api/auth/session', 'activity.crit-fumble.com')

      const response = await proxy(request as any)

      expect(mockNextFn).toHaveBeenCalled()
      expect(response.type).toBe('next')
    })

    it('should rewrite storybook subdomain to proxy API', async () => {
      vi.resetModules()
      const { proxy } = await import('@/proxy')

      const request = createMockRequest('/index.html', 'storybook.crit-fumble.com')

      await proxy(request as any)

      expect(mockRewriteFn).toHaveBeenCalled()
    })

    it('should rewrite fumblebot subdomain to proxy API', async () => {
      vi.resetModules()
      const { proxy } = await import('@/proxy')

      const request = createMockRequest('/status', 'fumblebot.crit-fumble.com')

      await proxy(request as any)

      expect(mockRewriteFn).toHaveBeenCalled()
    })
  })

  describe('Path Restrictions', () => {
    it('should allow homepage', async () => {
      vi.resetModules()
      const { proxy } = await import('@/proxy')

      const request = createMockRequest('/', 'www.crit-fumble.com')

      const response = await proxy(request as any)

      expect(mockNextFn).toHaveBeenCalled()
      expect(response.type).toBe('next')
    })

    it('should allow /api routes', async () => {
      vi.resetModules()
      const { proxy } = await import('@/proxy')

      const request = createMockRequest('/api/auth/session', 'www.crit-fumble.com')

      const response = await proxy(request as any)

      expect(mockNextFn).toHaveBeenCalled()
      expect(response.type).toBe('next')
    })

    it('should allow /dashboard', async () => {
      vi.resetModules()
      const { proxy } = await import('@/proxy')

      const request = createMockRequest('/dashboard', 'www.crit-fumble.com')

      const response = await proxy(request as any)

      expect(mockNextFn).toHaveBeenCalled()
    })

    it('should allow /wiki', async () => {
      vi.resetModules()
      const { proxy } = await import('@/proxy')

      const request = createMockRequest('/wiki', 'www.crit-fumble.com')

      const response = await proxy(request as any)

      expect(mockNextFn).toHaveBeenCalled()
    })

    it('should allow /discord paths', async () => {
      vi.resetModules()
      const { proxy } = await import('@/proxy')

      const request = createMockRequest('/discord/activity', 'www.crit-fumble.com')

      const response = await proxy(request as any)

      expect(mockNextFn).toHaveBeenCalled()
    })

    it('should allow /terms-of-service', async () => {
      vi.resetModules()
      const { proxy } = await import('@/proxy')

      const request = createMockRequest('/terms-of-service', 'www.crit-fumble.com')

      const response = await proxy(request as any)

      expect(mockNextFn).toHaveBeenCalled()
    })

    it('should allow /privacy-policy', async () => {
      vi.resetModules()
      const { proxy } = await import('@/proxy')

      const request = createMockRequest('/privacy-policy', 'www.crit-fumble.com')

      const response = await proxy(request as any)

      expect(mockNextFn).toHaveBeenCalled()
    })

    it('should allow /storybook', async () => {
      vi.resetModules()
      const { proxy } = await import('@/proxy')

      const request = createMockRequest('/storybook', 'www.crit-fumble.com')

      const response = await proxy(request as any)

      expect(mockNextFn).toHaveBeenCalled()
    })

    it('should allow /storybook-auth', async () => {
      vi.resetModules()
      const { proxy } = await import('@/proxy')

      const request = createMockRequest('/storybook-auth', 'www.crit-fumble.com')

      const response = await proxy(request as any)

      expect(mockNextFn).toHaveBeenCalled()
    })

    it('should redirect unknown paths to homepage', async () => {
      vi.resetModules()
      const { proxy } = await import('@/proxy')

      const request = createMockRequest('/unknown-path', 'www.crit-fumble.com')

      const response = await proxy(request as any)

      expect(mockRedirectFn).toHaveBeenCalled()
      expect(response.type).toBe('redirect')
    })

    it('should redirect /random-page to homepage', async () => {
      vi.resetModules()
      const { proxy } = await import('@/proxy')

      const request = createMockRequest('/random-page', 'www.crit-fumble.com')

      await proxy(request as any)

      expect(mockRedirectFn).toHaveBeenCalled()
    })
  })

  describe('Config', () => {
    it('should export config with matcher', async () => {
      vi.resetModules()
      const { config } = await import('@/proxy')

      expect(config).toBeDefined()
      expect(config.matcher).toBeDefined()
      expect(Array.isArray(config.matcher)).toBe(true)
    })

    it('should exclude _next/static from matcher', async () => {
      vi.resetModules()
      const { config } = await import('@/proxy')

      const matcherPattern = config.matcher[0]
      expect(matcherPattern).toContain('_next/static')
    })

    it('should exclude _next/image from matcher', async () => {
      vi.resetModules()
      const { config } = await import('@/proxy')

      const matcherPattern = config.matcher[0]
      expect(matcherPattern).toContain('_next/image')
    })

    it('should exclude favicon.ico from matcher', async () => {
      vi.resetModules()
      const { config } = await import('@/proxy')

      const matcherPattern = config.matcher[0]
      expect(matcherPattern).toContain('favicon.ico')
    })
  })
})
