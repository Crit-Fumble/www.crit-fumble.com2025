/**
 * Rate Limiting Utilities
 *
 * Re-exports from @crit-fumble/web-proxy with app-specific aliases.
 */

import {
  rateLimiters,
  getClientIdentifier,
  getIpAddress,
  checkRateLimit,
  RateLimiterMemory,
} from '@crit-fumble/web-proxy'

// Re-export utilities
export { getClientIdentifier, getIpAddress, checkRateLimit, RateLimiterMemory }

// Re-export pre-configured limiters with app-specific names
export const authRateLimiter = rateLimiters.auth
export const oauthRateLimiter = rateLimiters.oauth
export const apiRateLimiter = rateLimiters.api
export const webhookRateLimiter = rateLimiters.webhook
export const publicRateLimiter = rateLimiters.public
export const chatRateLimiter = rateLimiters.chat
