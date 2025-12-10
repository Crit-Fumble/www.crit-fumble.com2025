/**
 * Tests for Storybook Token Generation and Verification
 *
 * Tests the HMAC-signed token system for cross-domain storybook authentication.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Store original env
const originalEnv = { ...process.env }

describe('Storybook Token', () => {
  beforeEach(() => {
    vi.resetModules()
    // Set up test environment with AUTH_SECRET
    process.env.AUTH_SECRET = 'test-secret-key-for-testing'
  })

  afterEach(() => {
    // Restore original env
    process.env = { ...originalEnv }
  })

  describe('generateStorybookToken', () => {
    it('should generate a valid base64url encoded token', async () => {
      const { generateStorybookToken } = await import('@/lib/storybook-token')

      const token = generateStorybookToken('user-123', 'admin')

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      // Should be base64url encoded (no + or / chars)
      expect(token).not.toMatch(/[+/]/)
    })

    it('should throw error when AUTH_SECRET is not set', async () => {
      process.env.AUTH_SECRET = ''
      process.env.NEXTAUTH_SECRET = ''
      vi.resetModules()
      const { generateStorybookToken } = await import('@/lib/storybook-token')

      expect(() => generateStorybookToken('user-123', 'admin')).toThrow(
        'AUTH_SECRET is required for token generation'
      )
    })

    it('should include user ID and role in token payload', async () => {
      const { generateStorybookToken } = await import('@/lib/storybook-token')

      const token = generateStorybookToken('my-user-id', 'owner')
      const decoded = Buffer.from(token, 'base64url').toString('utf-8')

      expect(decoded).toContain('my-user-id')
      expect(decoded).toContain('owner')
    })

    it('should use NEXTAUTH_SECRET as fallback', async () => {
      process.env.AUTH_SECRET = ''
      process.env.NEXTAUTH_SECRET = 'fallback-secret'
      vi.resetModules()
      const { generateStorybookToken } = await import('@/lib/storybook-token')

      // Should not throw since NEXTAUTH_SECRET is set
      const token = generateStorybookToken('user-123', 'admin')
      expect(token).toBeDefined()
    })
  })

  describe('verifyStorybookToken', () => {
    it('should verify a valid token', async () => {
      const { generateStorybookToken, verifyStorybookToken } = await import('@/lib/storybook-token')

      const token = generateStorybookToken('user-456', 'admin')
      const result = verifyStorybookToken(token)

      expect(result).not.toBeNull()
      expect(result?.userId).toBe('user-456')
      expect(result?.role).toBe('admin')
    })

    it('should return null for empty token', async () => {
      const { verifyStorybookToken } = await import('@/lib/storybook-token')

      expect(verifyStorybookToken('')).toBeNull()
    })

    it('should return null when AUTH_SECRET is not set', async () => {
      // First generate with secret
      const { generateStorybookToken } = await import('@/lib/storybook-token')
      const token = generateStorybookToken('user-123', 'admin')

      // Then verify without secret
      process.env.AUTH_SECRET = ''
      process.env.NEXTAUTH_SECRET = ''
      vi.resetModules()
      const { verifyStorybookToken } = await import('@/lib/storybook-token')

      expect(verifyStorybookToken(token)).toBeNull()
    })

    it('should return null for malformed token (wrong parts count)', async () => {
      const { verifyStorybookToken } = await import('@/lib/storybook-token')

      // Create a malformed token with wrong number of parts
      const malformed = Buffer.from('only:two:parts').toString('base64url')
      expect(verifyStorybookToken(malformed)).toBeNull()
    })

    it('should return null for expired token', async () => {
      const { verifyStorybookToken } = await import('@/lib/storybook-token')

      // Create a token with expired timestamp
      const expiredTimestamp = Date.now() - 1000 // 1 second ago
      const payload = `user-123:admin:${expiredTimestamp}`

      // We can't easily create a valid signature without the secret function,
      // but we can test that expired tokens are rejected
      const { createHmac } = await import('crypto')
      const signature = createHmac('sha256', 'test-secret-key-for-testing')
        .update(payload)
        .digest('hex')
        .slice(0, 32)

      const token = Buffer.from(`${payload}:${signature}`).toString('base64url')
      expect(verifyStorybookToken(token)).toBeNull()
    })

    it('should return null for invalid signature', async () => {
      const { verifyStorybookToken } = await import('@/lib/storybook-token')

      // Create a token with valid format but wrong signature
      const futureTimestamp = Date.now() + 1000000
      const payload = `user-123:admin:${futureTimestamp}`
      const wrongSignature = 'invalid_signature_here_12345678'

      const token = Buffer.from(`${payload}:${wrongSignature}`).toString('base64url')
      expect(verifyStorybookToken(token)).toBeNull()
    })

    it('should return null for signature with wrong length', async () => {
      const { verifyStorybookToken } = await import('@/lib/storybook-token')

      // Create a token with signature of wrong length
      const futureTimestamp = Date.now() + 1000000
      const payload = `user-123:admin:${futureTimestamp}`
      const shortSignature = 'short'

      const token = Buffer.from(`${payload}:${shortSignature}`).toString('base64url')
      expect(verifyStorybookToken(token)).toBeNull()
    })

    it('should return null for non-numeric expiry', async () => {
      const { verifyStorybookToken } = await import('@/lib/storybook-token')

      // Create a token with non-numeric expiry
      const payload = 'user-123:admin:not-a-number:somesignature0123456789012345'
      const token = Buffer.from(payload).toString('base64url')

      expect(verifyStorybookToken(token)).toBeNull()
    })

    it('should return null for invalid base64', async () => {
      const { verifyStorybookToken } = await import('@/lib/storybook-token')

      // Invalid base64 that will cause decode to fail
      expect(verifyStorybookToken('!!!invalid-base64!!!')).toBeNull()
    })

    it('should return null when crypto operation throws', async () => {
      vi.resetModules()

      // Mock crypto to throw an error
      vi.doMock('crypto', async () => {
        const actual = await vi.importActual<typeof import('crypto')>('crypto')
        return {
          ...actual,
          createHmac: () => {
            throw new Error('Crypto error')
          },
        }
      })

      const { verifyStorybookToken } = await import('@/lib/storybook-token')

      // Create a valid-looking token that will trigger the crypto path
      const payload = 'user-123:admin:9999999999999:12345678901234567890123456789012'
      const token = Buffer.from(payload).toString('base64url')

      // Should hit the catch block and return null
      expect(verifyStorybookToken(token)).toBeNull()

      // Restore
      vi.doUnmock('crypto')
    })

    it('should return null for invalid role', async () => {
      const { verifyStorybookToken } = await import('@/lib/storybook-token')
      const { createHmac } = await import('crypto')

      // Create a token with an invalid role
      const futureTimestamp = Date.now() + 1000000
      const payload = `user-123:invalid_role:${futureTimestamp}`
      const signature = createHmac('sha256', 'test-secret-key-for-testing')
        .update(payload)
        .digest('hex')
        .slice(0, 32)

      const token = Buffer.from(`${payload}:${signature}`).toString('base64url')
      expect(verifyStorybookToken(token)).toBeNull()
    })

    it('should handle different roles correctly', async () => {
      const { generateStorybookToken, verifyStorybookToken } = await import('@/lib/storybook-token')

      const ownerToken = generateStorybookToken('user-1', 'owner')
      const adminToken = generateStorybookToken('user-2', 'admin')
      const userToken = generateStorybookToken('user-3', 'user')

      // 'owner' is normalized to 'admin' for backwards compatibility
      expect(verifyStorybookToken(ownerToken)?.role).toBe('admin')
      expect(verifyStorybookToken(adminToken)?.role).toBe('admin')
      expect(verifyStorybookToken(userToken)?.role).toBe('user')
    })

    it('should reject token signed with different secret', async () => {
      // Generate token with one secret
      const { generateStorybookToken } = await import('@/lib/storybook-token')
      const token = generateStorybookToken('user-123', 'admin')

      // Try to verify with different secret
      process.env.AUTH_SECRET = 'different-secret-key'
      vi.resetModules()
      const { verifyStorybookToken } = await import('@/lib/storybook-token')

      expect(verifyStorybookToken(token)).toBeNull()
    })
  })

  describe('Token round-trip', () => {
    it('should successfully round-trip generate and verify', async () => {
      const { generateStorybookToken, verifyStorybookToken } = await import('@/lib/storybook-token')

      const testCases = [
        { userId: 'simple-user', inputRole: 'admin', expectedRole: 'admin' },
        { userId: 'user-with-numbers-123', inputRole: 'owner', expectedRole: 'admin' }, // owner -> admin
        { userId: 'email@example.com', inputRole: 'user', expectedRole: 'user' },
        { userId: 'uuid-a1b2c3d4-e5f6', inputRole: 'admin', expectedRole: 'admin' },
      ]

      for (const { userId, inputRole, expectedRole } of testCases) {
        const token = generateStorybookToken(userId, inputRole)
        const result = verifyStorybookToken(token)

        expect(result).not.toBeNull()
        expect(result?.userId).toBe(userId)
        expect(result?.role).toBe(expectedRole)
      }
    })
  })
})
