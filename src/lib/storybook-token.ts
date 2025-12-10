/**
 * Storybook Access Token
 *
 * Generates and verifies short-lived access tokens for storybook.
 * This allows authentication on the main domain to grant access to the subdomain
 * without requiring cross-domain cookies.
 *
 * Token format: base64(userId:role:expiry:signature)
 * - Expires after 24 hours
 * - Signed with HMAC-SHA256 using AUTH_SECRET
 */

import { createHmac } from 'crypto'
import type { UserRole } from './permissions'

const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 hours
const AUTH_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || ''

/**
 * Generate a storybook access token for an authenticated admin user
 */
export function generateStorybookToken(userId: string, role: string): string {
  if (!AUTH_SECRET) {
    throw new Error('AUTH_SECRET is required for token generation')
  }

  const expiry = Date.now() + TOKEN_EXPIRY_MS
  const payload = `${userId}:${role}:${expiry}`
  const signature = createHmac('sha256', AUTH_SECRET)
    .update(payload)
    .digest('hex')
    .slice(0, 32) // Use first 32 chars for shorter token

  return Buffer.from(`${payload}:${signature}`).toString('base64url')
}

/**
 * Verify a storybook access token
 * Returns the userId and role if valid, null if invalid or expired
 */
export function verifyStorybookToken(token: string): { userId: string; role: UserRole } | null {
  if (!AUTH_SECRET || !token) {
    return null
  }

  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8')
    const parts = decoded.split(':')

    if (parts.length !== 4) {
      return null
    }

    const [userId, role, expiryStr, providedSignature] = parts
    const expiry = parseInt(expiryStr, 10)

    // Check expiry
    if (isNaN(expiry) || Date.now() > expiry) {
      return null
    }

    // Verify signature
    const payload = `${userId}:${role}:${expiryStr}`
    const expectedSignature = createHmac('sha256', AUTH_SECRET)
      .update(payload)
      .digest('hex')
      .slice(0, 32)

    // Constant-time comparison to prevent timing attacks
    if (providedSignature.length !== expectedSignature.length) {
      return null
    }

    let valid = true
    for (let i = 0; i < providedSignature.length; i++) {
      if (providedSignature[i] !== expectedSignature[i]) {
        valid = false
      }
    }

    if (!valid) {
      return null
    }

    // Validate role is a valid UserRole (owner is treated as admin for backwards compat)
    if (role !== 'owner' && role !== 'admin' && role !== 'user') {
      return null
    }

    // Normalize 'owner' to 'admin' for backwards compatibility
    const normalizedRole = role === 'owner' ? 'admin' : role

    return { userId, role: normalizedRole as 'admin' | 'user' }
  } catch {
    return null
  }
}
