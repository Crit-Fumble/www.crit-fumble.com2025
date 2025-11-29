/**
 * Rate Limiting Utilities
 *
 * Provides configurable rate limiters for different use cases:
 * - Authentication (strict)
 * - OAuth callbacks (moderate)
 * - API routes (general)
 * - Webhooks (high volume)
 * - Public endpoints (strict)
 * - Chat/messaging (moderate)
 */

import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible'

/**
 * Rate limiter configuration options
 */
export interface RateLimiterConfig {
  /**
   * Key prefix for the rate limiter
   */
  keyPrefix: string

  /**
   * Number of requests allowed in the duration window
   */
  points: number

  /**
   * Duration window in seconds
   */
  duration: number

  /**
   * How long to block after limit exceeded (in seconds)
   * @default undefined (no additional block time)
   */
  blockDuration?: number
}

/**
 * Create a rate limiter with the given configuration
 */
export function createRateLimiter(config: RateLimiterConfig): RateLimiterMemory {
  return new RateLimiterMemory({
    keyPrefix: config.keyPrefix,
    points: config.points,
    duration: config.duration,
    blockDuration: config.blockDuration,
  })
}

/**
 * Pre-configured rate limiters for common use cases
 */
export const rateLimiters = {
  /**
   * Authentication rate limiting (strict)
   * 5 attempts per 15 minutes, block for 15 minutes if exceeded
   */
  auth: createRateLimiter({
    keyPrefix: 'rl:auth',
    points: 5,
    duration: 15 * 60,
    blockDuration: 15 * 60,
  }),

  /**
   * OAuth callback rate limiting (moderate)
   * 10 requests per minute, block for 1 minute if exceeded
   */
  oauth: createRateLimiter({
    keyPrefix: 'rl:oauth',
    points: 10,
    duration: 60,
    blockDuration: 60,
  }),

  /**
   * API route rate limiting (general)
   * 100 requests per minute
   */
  api: createRateLimiter({
    keyPrefix: 'rl:api',
    points: 100,
    duration: 60,
  }),

  /**
   * Webhook rate limiting (high volume)
   * 100 webhooks per minute
   */
  webhook: createRateLimiter({
    keyPrefix: 'rl:webhook',
    points: 100,
    duration: 60,
  }),

  /**
   * Public endpoint rate limiting (strict)
   * 20 requests per minute, block for 1 minute if exceeded
   */
  public: createRateLimiter({
    keyPrefix: 'rl:public',
    points: 20,
    duration: 60,
    blockDuration: 60,
  }),

  /**
   * Chat rate limiting (moderate - allows conversation flow)
   * 30 messages per minute, block for 30 seconds if exceeded
   */
  chat: createRateLimiter({
    keyPrefix: 'rl:chat',
    points: 30,
    duration: 60,
    blockDuration: 30,
  }),
}

/**
 * Get client identifier from request
 * Prioritizes: User ID > IP address
 *
 * @param userId - Optional user ID from session
 * @param ip - Optional IP address from request
 */
export function getClientIdentifier(userId?: string, ip?: string): string {
  if (userId) return `user:${userId}`
  if (ip) return `ip:${ip}`
  return 'anonymous'
}

/**
 * Get IP address from request headers
 * Checks common headers set by proxies/load balancers
 *
 * @param request - The incoming request
 */
export function getIpAddress(request: Request): string | undefined {
  // Check common headers set by proxies/load balancers
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0]?.trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  return undefined
}

/**
 * Result of a rate limit check
 */
export type RateLimitResult =
  | { success: true }
  | { success: false; retryAfter: number }

/**
 * Check rate limit and return result
 *
 * @param limiter - The rate limiter to check against
 * @param identifier - Client identifier (from getClientIdentifier)
 * @returns Result indicating success or failure with retry info
 */
export async function checkRateLimit(
  limiter: RateLimiterMemory,
  identifier: string
): Promise<RateLimitResult> {
  try {
    await limiter.consume(identifier)
    return { success: true }
  } catch (error) {
    if (error instanceof RateLimiterRes) {
      // Rate limit exceeded
      const retryAfter = Math.ceil(error.msBeforeNext / 1000)
      return { success: false, retryAfter }
    }
    // Other error - log and allow request through
    console.error('Rate limiter error:', error)
    return { success: true }
  }
}

// Re-export types from rate-limiter-flexible
export { RateLimiterMemory, RateLimiterRes }
