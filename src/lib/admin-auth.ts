import 'server-only'

/**
 * Admin Authentication Utility
 *
 * Provides admin-only route protection using isAdmin flag from Core database.
 */

import { NextResponse } from 'next/server'
import { auth } from './auth'
import { isAdmin as checkIsAdmin, type SessionUser } from './permissions'
import { CoreApiClient } from '@crit-fumble/core/client'

/**
 * Admin session with verified role
 */
export interface AdminSession {
  userId: string
  discordId: string | null
  isAdmin: boolean
}

/**
 * Verify the current user is an admin
 *
 * @returns AdminSession if user is admin, null otherwise
 */
export async function verifyAdmin(): Promise<AdminSession | null> {
  const session = await auth()

  if (!session?.user) {
    return null
  }

  const user = session.user as SessionUser

  if (!checkIsAdmin(user)) {
    console.log('[admin-auth] User is not admin:', {
      userId: user.id ? `${user.id.slice(0, 4)}...` : 'none',
      isAdmin: user.isAdmin,
    })
    return null
  }

  return {
    userId: user.id,
    discordId: user.discordId ?? null,
    isAdmin: true,
  }
}

/**
 * Create a 401 Unauthorized response
 */
export function unauthorizedResponse(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 })
}

/**
 * Create a 403 Forbidden response
 */
export function forbiddenResponse(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 })
}

/**
 * Get a configured Core API client with admin API key
 *
 * @returns Configured CoreApiClient or null if not configured
 */
export function getCoreApiClient(): CoreApiClient | null {
  const coreApiUrl = process.env.CORE_API_URL
  const coreApiSecret = process.env.CORE_API_SECRET

  if (!coreApiUrl || !coreApiSecret) {
    console.error('[admin-auth] Core API not configured')
    return null
  }

  return new CoreApiClient({
    baseUrl: coreApiUrl,
    apiKey: coreApiSecret,
  })
}

/**
 * Require admin authentication for an API route
 *
 * Usage:
 * ```ts
 * export async function GET() {
 *   const admin = await requireAdmin()
 *   if (admin instanceof NextResponse) return admin
 *
 *   // admin is now typed as AdminSession
 *   console.log(admin.userId)
 * }
 * ```
 */
export async function requireAdmin(): Promise<AdminSession | NextResponse> {
  const admin = await verifyAdmin()
  if (!admin) {
    return unauthorizedResponse('Admin access required')
  }
  return admin
}
