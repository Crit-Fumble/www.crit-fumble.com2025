import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getClientIdentifier,
  getIpAddress,
  checkRateLimit,
  authRateLimiter,
  oauthRateLimiter,
  apiRateLimiter,
  webhookRateLimiter,
  publicRateLimiter,
  chatRateLimiter,
  RateLimiterMemory,
} from '@/lib/rate-limit';

describe('rate-limit utilities', () => {
  describe('getClientIdentifier', () => {
    it('should prioritize userId over IP', () => {
      const result = getClientIdentifier('user-123', '192.168.1.1');
      expect(result).toBe('user:user-123');
    });

    it('should use IP address when userId is not provided', () => {
      const result = getClientIdentifier(undefined, '192.168.1.1');
      expect(result).toBe('ip:192.168.1.1');
    });

    it('should return "anonymous" when neither userId nor IP is provided', () => {
      const result = getClientIdentifier(undefined, undefined);
      expect(result).toBe('anonymous');
    });

    it('should use IP when userId is empty string', () => {
      const result = getClientIdentifier('', '192.168.1.1');
      expect(result).toBe('ip:192.168.1.1');
    });

    it('should return "anonymous" when both are empty strings', () => {
      const result = getClientIdentifier('', '');
      expect(result).toBe('anonymous');
    });

    it('should handle different userId formats', () => {
      expect(getClientIdentifier('abc-123-def', '1.2.3.4')).toBe('user:abc-123-def');
      expect(getClientIdentifier('email@example.com', '1.2.3.4')).toBe('user:email@example.com');
      expect(getClientIdentifier('1234567890', '1.2.3.4')).toBe('user:1234567890');
    });

    it('should handle different IP formats', () => {
      expect(getClientIdentifier(undefined, '192.168.1.1')).toBe('ip:192.168.1.1');
      expect(getClientIdentifier(undefined, '::1')).toBe('ip:::1');
      expect(getClientIdentifier(undefined, '2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe('ip:2001:0db8:85a3:0000:0000:8a2e:0370:7334');
    });
  });

  describe('getIpAddress', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '203.0.113.195',
        },
      });

      const ip = getIpAddress(request);
      expect(ip).toBe('203.0.113.195');
    });

    it('should extract first IP from x-forwarded-for with multiple IPs', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178',
        },
      });

      const ip = getIpAddress(request);
      expect(ip).toBe('203.0.113.195');
    });

    it('should trim whitespace from x-forwarded-for IP', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '  203.0.113.195  , 70.41.3.18',
        },
      });

      const ip = getIpAddress(request);
      expect(ip).toBe('203.0.113.195');
    });

    it('should extract IP from x-real-ip header when x-forwarded-for is not present', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-real-ip': '198.51.100.42',
        },
      });

      const ip = getIpAddress(request);
      expect(ip).toBe('198.51.100.42');
    });

    it('should prioritize x-forwarded-for over x-real-ip', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '203.0.113.195',
          'x-real-ip': '198.51.100.42',
        },
      });

      const ip = getIpAddress(request);
      expect(ip).toBe('203.0.113.195');
    });

    it('should return undefined when no IP headers are present', () => {
      const request = new Request('http://localhost');

      const ip = getIpAddress(request);
      expect(ip).toBeUndefined();
    });

    it('should handle IPv6 addresses in x-forwarded-for', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '2001:db8:85a3::8a2e:370:7334',
        },
      });

      const ip = getIpAddress(request);
      expect(ip).toBe('2001:db8:85a3::8a2e:370:7334');
    });

    it('should handle IPv6 addresses in x-real-ip', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-real-ip': '::1',
        },
      });

      const ip = getIpAddress(request);
      expect(ip).toBe('::1');
    });

    it('should handle empty x-forwarded-for header', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '',
          'x-real-ip': '198.51.100.42',
        },
      });

      const ip = getIpAddress(request);
      expect(ip).toBe('198.51.100.42');
    });

    it('should handle x-forwarded-for with only commas', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': ', , ',
          'x-real-ip': '198.51.100.42',
        },
      });

      const ip = getIpAddress(request);
      // When x-forwarded-for has only whitespace/commas, first split returns empty string
      // The current implementation returns empty string, not falling back to x-real-ip
      expect(ip).toBe('');
    });
  });

  describe('checkRateLimit', () => {
    let testLimiter: RateLimiterMemory;

    beforeEach(() => {
      // Create a test limiter with low limits for testing
      testLimiter = new RateLimiterMemory({
        keyPrefix: 'test',
        points: 2,
        duration: 1, // 1 second
      });
    });

    it('should return success when under limit', async () => {
      const result = await checkRateLimit(testLimiter, 'test-user-1');
      expect(result).toEqual({ success: true });
    });

    it('should return success for multiple requests under limit', async () => {
      const result1 = await checkRateLimit(testLimiter, 'test-user-2');
      const result2 = await checkRateLimit(testLimiter, 'test-user-2');

      expect(result1).toEqual({ success: true });
      expect(result2).toEqual({ success: true });
    });

    it('should return failure with retryAfter when limit exceeded', async () => {
      // Use all points
      await checkRateLimit(testLimiter, 'test-user-3');
      await checkRateLimit(testLimiter, 'test-user-3');

      // This should exceed the limit
      const result = await checkRateLimit(testLimiter, 'test-user-3');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.retryAfter).toBeGreaterThan(0);
        expect(result.retryAfter).toBeLessThanOrEqual(1); // Should be 1 second or less
      }
    });

    it('should track different identifiers separately', async () => {
      // Exhaust limit for user A
      await checkRateLimit(testLimiter, 'user-a');
      await checkRateLimit(testLimiter, 'user-a');
      const resultA = await checkRateLimit(testLimiter, 'user-a');

      // User B should still have quota
      const resultB = await checkRateLimit(testLimiter, 'user-b');

      expect(resultA.success).toBe(false);
      expect(resultB.success).toBe(true);
    });
  });

  describe('Pre-configured Rate Limiters', () => {
    it('should export authRateLimiter', () => {
      expect(authRateLimiter).toBeInstanceOf(RateLimiterMemory);
    });

    it('should export oauthRateLimiter', () => {
      expect(oauthRateLimiter).toBeInstanceOf(RateLimiterMemory);
    });

    it('should export apiRateLimiter', () => {
      expect(apiRateLimiter).toBeInstanceOf(RateLimiterMemory);
    });

    it('should export webhookRateLimiter', () => {
      expect(webhookRateLimiter).toBeInstanceOf(RateLimiterMemory);
    });

    it('should export publicRateLimiter', () => {
      expect(publicRateLimiter).toBeInstanceOf(RateLimiterMemory);
    });

    it('should export chatRateLimiter', () => {
      expect(chatRateLimiter).toBeInstanceOf(RateLimiterMemory);
    });

    it('should allow requests within auth limits', async () => {
      // Auth limiter allows 5 attempts per 15 minutes
      const result = await checkRateLimit(authRateLimiter, 'auth-test-unique-' + Date.now());
      expect(result.success).toBe(true);
    });

    it('should allow requests within api limits', async () => {
      // API limiter allows 100 requests per minute
      const result = await checkRateLimit(apiRateLimiter, 'api-test-unique-' + Date.now());
      expect(result.success).toBe(true);
    });

    it('should allow requests within chat limits', async () => {
      // Chat limiter allows 30 messages per minute
      const result = await checkRateLimit(chatRateLimiter, 'chat-test-unique-' + Date.now());
      expect(result.success).toBe(true);
    });
  });
});
