/**
 * Rate Limiting Utilities
 */

import { RateLimiterMemory, RateLimiterRes } from "rate-limiter-flexible"

// Authentication rate limiting (strict)
export const authRateLimiter = new RateLimiterMemory({
  keyPrefix: "rl:auth",
  points: 5, // Number of attempts
  duration: 15 * 60, // Per 15 minutes
  blockDuration: 15 * 60, // Block for 15 minutes if exceeded
})

// OAuth callback rate limiting (moderate)
export const oauthRateLimiter = new RateLimiterMemory({
  keyPrefix: "rl:oauth",
  points: 10, // Number of requests
  duration: 60, // Per minute
  blockDuration: 60, // Block for 1 minute if exceeded
})

// API route rate limiting (general)
export const apiRateLimiter = new RateLimiterMemory({
  keyPrefix: "rl:api",
  points: 100, // Number of requests
  duration: 60, // Per minute
})

// Stripe webhook rate limiting (high volume)
export const webhookRateLimiter = new RateLimiterMemory({
  keyPrefix: "rl:webhook",
  points: 100, // Number of webhooks
  duration: 60, // Per minute
})

// Public endpoint rate limiting (strict)
export const publicRateLimiter = new RateLimiterMemory({
  keyPrefix: "rl:public",
  points: 20, // Number of requests
  duration: 60, // Per minute
  blockDuration: 60, // Block for 1 minute if exceeded
})

/**
 * Get client identifier from request
 * Prioritizes: User ID > IP address
 */
export function getClientIdentifier(userId?: string, ip?: string): string {
  if (userId) return `user:${userId}`
  if (ip) return `ip:${ip}`
  return "anonymous"
}

/**
 * Get IP address from request headers
 */
export function getIpAddress(request: Request): string | undefined {
  // Check common headers set by proxies/load balancers
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0]?.trim()
  }

  const realIp = request.headers.get("x-real-ip")
  if (realIp) {
    return realIp
  }

  return undefined
}

/**
 * Check rate limit and return result
 * Returns null if rate limit not exceeded, otherwise returns retry info
 */
export async function checkRateLimit(
  limiter: RateLimiterMemory,
  identifier: string
): Promise<{ success: true } | { success: false; retryAfter: number }> {
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
    console.error("Rate limiter error:", error)
    return { success: true }
  }
}
