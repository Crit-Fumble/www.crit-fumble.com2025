/**
 * @crit-fumble/web-proxy
 *
 * Proxy utilities, rate limiting, and middleware for Crit-Fumble websites.
 */

// Rate limiting utilities
export {
  createRateLimiter,
  rateLimiters,
  getClientIdentifier,
  getIpAddress,
  checkRateLimit,
  RateLimiterMemory,
  RateLimiterRes,
  type RateLimiterConfig,
  type RateLimitResult,
} from './rate-limit.js'

// Middleware utilities
export {
  createPathRouter,
  defaultMatcher,
  composeMiddleware,
  createRateLimitedMiddleware,
  type PathRouterConfig,
  type RateLimitMiddlewareConfig,
} from './middleware.js'

// Auth proxy utilities
export {
  createAuthProxy,
  createLoginPage,
  createAccessDeniedPage,
  type AuthProxyConfig,
  type LoginPageConfig,
  type AccessDeniedConfig,
} from './auth-proxy.js'
