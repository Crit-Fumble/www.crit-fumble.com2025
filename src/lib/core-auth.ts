/**
 * Core-Based Authentication
 *
 * Delegates all authentication to Core API.
 * Core handles OAuth, sessions, and user management.
 * www just validates sessions and redirects for signin.
 *
 * Cookie: 'authjs.session-token' is set by Core with domain=.crit-fumble.com
 *
 * Security:
 * - X-Core-Secret header proves www's identity to Core (defense-in-depth)
 * - X-Response-Signature header from Core proves response authenticity
 * - HMAC-SHA256 signature prevents MITM attacks even if TLS is compromised
 * - Uses @crit-fumble/core SDK for signature verification
 *
 * Mock Mode (USE_MOCK_AUTH=true):
 * For local development and testing, sessions are validated against
 * in-memory mock stores instead of Core API.
 */

import { cookies } from 'next/headers'
import { verifyResponseSignature as coreVerifySignature } from '@crit-fumble/core'
import { mockAuthStores } from './mock-auth-stores'

const CORE_API_URL = process.env.CORE_API_URL || 'https://core.crit-fumble.com'
const CORE_API_SECRET = process.env.CORE_API_SECRET || ''
const USE_MOCK_AUTH = process.env.USE_MOCK_AUTH === 'true'

/**
 * Session user from Core API
 */
export interface SessionUser {
  id: string
  discordId: string
  name: string | null
  email: string | null
  image: string | null
  isAdmin: boolean
}

/**
 * Session response from Core API
 */
export interface SessionResponse {
  user: SessionUser | null
  expires: string | null
}

/**
 * Get the signin URL for a provider
 * Redirect users here to initiate OAuth
 */
export function getSigninUrl(
  provider: 'discord' | 'github' | 'twitch' = 'discord',
  callbackUrl?: string
): string {
  const callback = callbackUrl || `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.crit-fumble.com'}/dashboard`
  return `${CORE_API_URL}/auth/signin/${provider}?callbackUrl=${encodeURIComponent(callback)}`
}

/**
 * Get the signout URL
 * Redirect users here to sign out
 */
export function getSignoutUrl(callbackUrl?: string): string {
  const callback = callbackUrl || `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.crit-fumble.com'}/`
  return `${CORE_API_URL}/auth/signout?callbackUrl=${encodeURIComponent(callback)}`
}

/**
 * Get current session from Core API (server-side)
 * Reads the session cookie and validates with Core
 *
 * In mock mode, validates against in-memory mock stores instead.
 */
export async function getSession(): Promise<SessionResponse> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('authjs.session-token')

    if (!sessionCookie?.value) {
      return { user: null, expires: null }
    }

    // Mock mode: validate against in-memory stores
    if (USE_MOCK_AUTH) {
      const result = mockAuthStores.sessions.getWithUser(sessionCookie.value)
      if (!result) {
        return { user: null, expires: null }
      }

      const { session, user } = result
      return {
        user: {
          id: user.id,
          discordId: user.id, // In mock mode, user ID is the Discord ID
          name: user.name,
          email: user.email,
          image: user.image,
          isAdmin: user.isAdmin ?? false,
        },
        expires: session.expires.toISOString(),
      }
    }

    // Production mode: validate with Core API
    // Include X-Core-Secret to prove www's identity (defense-in-depth)
    const headers: Record<string, string> = {
      Cookie: `authjs.session-token=${sessionCookie.value}`,
    }

    if (CORE_API_SECRET) {
      headers['X-Core-Secret'] = CORE_API_SECRET
    }

    // Use /api/auth/session for server-side validation with X-Core-Secret
    const response = await fetch(`${CORE_API_URL}/api/auth/session`, {
      headers,
      // Don't cache session checks
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error('[core-auth] Session validation failed:', response.status)
      return { user: null, expires: null }
    }

    const bodyText = await response.text()
    const signature = response.headers.get('X-Response-Signature')

    // Verify response signature if Core provides one (defense-in-depth)
    // If CORE_API_SECRET is set, we require a valid signature
    if (CORE_API_SECRET && signature) {
      if (!coreVerifySignature(bodyText, signature, CORE_API_SECRET)) {
        console.error('[core-auth] Invalid response signature from Core')
        return { user: null, expires: null }
      }
    } else if (CORE_API_SECRET && !signature) {
      // Secret is configured but Core didn't sign - log warning but allow
      // This enables gradual rollout: www can be updated before Core
      console.warn('[core-auth] CORE_API_SECRET set but Core did not sign response')
    }

    const data = JSON.parse(bodyText)
    return data as SessionResponse
  } catch (error) {
    console.error('[core-auth] Failed to get session:', error)
    return { user: null, expires: null }
  }
}

/**
 * Get current user from session (convenience method)
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession()
  return session.user
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return user !== null
}

/**
 * Check if user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.isAdmin ?? false
}

/**
 * Require authentication - throws redirect if not authenticated
 * Use in server components or route handlers
 */
export async function requireAuth(redirectTo?: string): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) {
    const signinUrl = getSigninUrl('discord', redirectTo)
    throw new Response(null, {
      status: 302,
      headers: { Location: signinUrl },
    })
  }
  return user
}

/**
 * Require admin - throws redirect if not admin
 */
export async function requireAdmin(redirectTo?: string): Promise<SessionUser> {
  const user = await requireAuth(redirectTo)
  if (!user.isAdmin) {
    throw new Response('Forbidden', { status: 403 })
  }
  return user
}

/**
 * Sign out (server action)
 * Clears the session cookie by calling Core API
 */
export async function signOut(): Promise<void> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('authjs.session-token')

    if (sessionCookie?.value) {
      const headers: Record<string, string> = {
        Cookie: `authjs.session-token=${sessionCookie.value}`,
      }

      if (CORE_API_SECRET) {
        headers['X-Core-Secret'] = CORE_API_SECRET
      }

      await fetch(`${CORE_API_URL}/auth/signout`, {
        method: 'POST',
        headers,
      })
    }
  } catch (error) {
    console.error('[core-auth] Sign out failed:', error)
  }
}

/**
 * Client-side auth helpers
 * These return URLs for client-side redirects
 */
export const clientAuth = {
  /**
   * Get signin URL for client-side redirect
   */
  getSigninUrl: (callbackUrl?: string) => getSigninUrl('discord', callbackUrl),

  /**
   * Get signout URL for client-side redirect
   */
  getSignoutUrl: (callbackUrl?: string) => getSignoutUrl(callbackUrl),
}
