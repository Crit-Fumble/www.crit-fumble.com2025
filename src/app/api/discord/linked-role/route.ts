import { NextResponse } from 'next/server'

/**
 * Discord Linked Roles Verification URL (STUB)
 *
 * FUTURE: Implement full linked roles flow when account system is stable
 *
 * This endpoint will initiate the OAuth2 flow for Discord Linked Roles.
 * Discord redirects users here when they try to connect their account
 * for server role verification.
 *
 * Planned flow:
 * 1. User clicks "Connect" in Discord server role settings
 * 2. Discord redirects to this endpoint
 * 3. We redirect to Discord OAuth2 with role_connections.write scope
 * 4. User authorizes
 * 5. Discord redirects to /api/discord/oauth-callback
 * 6. We update their linked role metadata based on account status
 *
 * Metadata to track (FUTURE):
 * - verified: boolean - Has a crit-fumble.com account
 * - is_member: boolean - Active member status
 * - account_age_days: integer - Account age for trust levels
 */

export async function GET() {
  // FUTURE: Implement OAuth2 flow when account system is ready
  // For now, redirect to dashboard with info message
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.crit-fumble.com'
  return NextResponse.redirect(`${baseUrl}/dashboard?info=linked_roles_coming_soon`)
}
