import { NextRequest, NextResponse } from 'next/server'

/**
 * Discord OAuth2 Callback for Linked Roles (STUB)
 *
 * FUTURE: Implement full callback handler when linked roles flow is active
 *
 * This endpoint will handle the OAuth2 callback after user authorizes
 * the linked role connection. It will:
 * 1. Exchange the authorization code for tokens
 * 2. Fetch Discord user info
 * 3. Update the user's role connection metadata on Discord
 *
 * Prerequisites before implementing:
 * - Stable account system on crit-fumble.com
 * - /api/discord/linked-role endpoint fully implemented
 * - Metadata schema registered with Discord API
 */

export async function GET(request: NextRequest) {
  // FUTURE: Implement full OAuth callback when linked roles flow is active
  // For now, redirect to dashboard with info message
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.crit-fumble.com'
  return NextResponse.redirect(`${baseUrl}/dashboard?info=linked_roles_coming_soon`)
}
