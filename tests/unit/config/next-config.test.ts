/**
 * Tests for Next.js Configuration (next.config.js)
 *
 * Tests the configuration values used for Discord Activity support,
 * including assetPrefix for proper static asset loading through Discord's proxy.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Store original env
const originalEnv = { ...process.env }

describe('Next.js Configuration', () => {
  beforeEach(() => {
    vi.resetModules()
    // Reset env to known state
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  describe('assetPrefix Configuration', () => {
    it('should set production assetPrefix to www.crit-fumble.com', async () => {
      process.env.VERCEL_ENV = 'production'

      // Dynamic import to pick up env changes
      const config = await loadNextConfig()

      expect(config.assetPrefix).toBe('https://www.crit-fumble.com')
    })

    it('should set preview assetPrefix to staging-treefarm22.crit-fumble.com', async () => {
      process.env.VERCEL_ENV = 'preview'

      const config = await loadNextConfig()

      expect(config.assetPrefix).toBe('https://staging-treefarm22.crit-fumble.com')
    })

    it('should have undefined assetPrefix in development', async () => {
      process.env.VERCEL_ENV = 'development'

      const config = await loadNextConfig()

      expect(config.assetPrefix).toBeUndefined()
    })

    it('should have undefined assetPrefix when VERCEL_ENV is not set', async () => {
      delete process.env.VERCEL_ENV

      const config = await loadNextConfig()

      expect(config.assetPrefix).toBeUndefined()
    })
  })

  describe('Discord CSP Configuration', () => {
    it('should include Discord frame-ancestors when DISCORD_CLIENT_ID is set', async () => {
      process.env.DISCORD_CLIENT_ID = '1223681019178123274'
      process.env.FUMBLEBOT_DISCORD_CLIENT_ID = ''

      const config = await loadNextConfig()
      const headers = await config.headers()
      const mainHeaders = headers.find((h: any) => h.source === '/:path*')
      const cspHeader = mainHeaders?.headers?.find((h: any) => h.key === 'Content-Security-Policy')

      expect(cspHeader?.value).toContain('frame-ancestors')
      expect(cspHeader?.value).toContain('1223681019178123274.discordsays.com')
    })

    it('should include FumbleBot frame-ancestors when FUMBLEBOT_DISCORD_CLIENT_ID is set', async () => {
      process.env.DISCORD_CLIENT_ID = ''
      process.env.FUMBLEBOT_DISCORD_CLIENT_ID = '1234567890'

      const config = await loadNextConfig()
      const headers = await config.headers()
      const mainHeaders = headers.find((h: any) => h.source === '/:path*')
      const cspHeader = mainHeaders?.headers?.find((h: any) => h.key === 'Content-Security-Policy')

      expect(cspHeader?.value).toContain('frame-ancestors')
      expect(cspHeader?.value).toContain('1234567890.discordsays.com')
    })

    it('should include both Discord frame-ancestors when both IDs are set', async () => {
      process.env.DISCORD_CLIENT_ID = '1223681019178123274'
      process.env.FUMBLEBOT_DISCORD_CLIENT_ID = '1234567890'

      const config = await loadNextConfig()
      const headers = await config.headers()
      const mainHeaders = headers.find((h: any) => h.source === '/:path*')
      const cspHeader = mainHeaders?.headers?.find((h: any) => h.key === 'Content-Security-Policy')

      expect(cspHeader?.value).toContain('1223681019178123274.discordsays.com')
      expect(cspHeader?.value).toContain('1234567890.discordsays.com')
    })
  })

  describe('Static Asset Headers', () => {
    it('should set cache headers for /_next/static paths', async () => {
      const config = await loadNextConfig()
      const headers = await config.headers()
      const staticHeaders = headers.find((h: any) => h.source === '/_next/static/:path*')

      expect(staticHeaders).toBeDefined()
      const cacheControl = staticHeaders?.headers?.find((h: any) => h.key === 'Cache-Control')
      expect(cacheControl?.value).toContain('public')
      expect(cacheControl?.value).toContain('immutable')
    })
  })

  describe('Redirects Configuration', () => {
    it('should have redirects configured', async () => {
      const config = await loadNextConfig()
      const redirects = await config.redirects()

      expect(redirects).toBeDefined()
      expect(Array.isArray(redirects)).toBe(true)
    })

    it('should redirect from crit-fumble.com to www.crit-fumble.com', async () => {
      const config = await loadNextConfig()
      const redirects = await config.redirects()

      const apexRedirect = redirects.find((r: any) =>
        r.has?.some((h: any) => h.value === 'crit-fumble.com')
      )

      expect(apexRedirect).toBeDefined()
      expect(apexRedirect.destination).toContain('www.crit-fumble.com')
      expect(apexRedirect.permanent).toBe(true)
    })

    it('should exclude discordsays.com from redirects', async () => {
      const config = await loadNextConfig()
      const redirects = await config.redirects()

      const apexRedirect = redirects.find((r: any) =>
        r.has?.some((h: any) => h.value === 'crit-fumble.com')
      )

      expect(apexRedirect.missing).toBeDefined()
      // The config uses escaped regex: '(.*)\\.discordsays\\.com'
      const discordsaysMissing = apexRedirect.missing?.find((m: any) =>
        m.value?.includes('discordsays')
      )
      expect(discordsaysMissing).toBeDefined()
    })
  })

  describe('Transpile Packages', () => {
    it('should transpile @crit-fumble/react', async () => {
      const config = await loadNextConfig()

      expect(config.transpilePackages).toContain('@crit-fumble/react')
    })

    it('should transpile @crit-fumble/core', async () => {
      const config = await loadNextConfig()

      expect(config.transpilePackages).toContain('@crit-fumble/core')
    })

    it('should transpile framer-motion', async () => {
      const config = await loadNextConfig()

      expect(config.transpilePackages).toContain('framer-motion')
    })
  })

  describe('Image Configuration', () => {
    it('should allow Discord CDN images', async () => {
      const config = await loadNextConfig()

      const discordPattern = config.images.remotePatterns.find(
        (p: any) => p.hostname === 'cdn.discordapp.com'
      )

      expect(discordPattern).toBeDefined()
      expect(discordPattern.protocol).toBe('https')
    })

    it('should allow GitHub avatar images', async () => {
      const config = await loadNextConfig()

      const githubPattern = config.images.remotePatterns.find(
        (p: any) => p.hostname === 'avatars.githubusercontent.com'
      )

      expect(githubPattern).toBeDefined()
      expect(githubPattern.protocol).toBe('https')
    })
  })
})

/**
 * Helper to dynamically load next.config.js with fresh env
 */
async function loadNextConfig() {
  // Clear the module cache for next.config.js
  const configPath = require.resolve('../../../next.config.js')
  delete require.cache[configPath]

  // Re-require the config
  return require('../../../next.config.js')
}
