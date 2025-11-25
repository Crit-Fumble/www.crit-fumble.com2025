/**
 * Steam OpenID 2.0 Authentication Routes
 *
 * STUBBED FOR FUTURE IMPLEMENTATION
 *
 * Steam uses OpenID 2.0 (deprecated protocol), not OAuth 2.0
 * This requires custom implementation outside of NextAuth.js
 *
 * Flow:
 * 1. User clicks "Sign in with Steam"
 * 2. GET /api/auth/steam - Redirects to Steam OpenID login
 * 3. Steam redirects back to /api/auth/steam/callback
 * 4. Verify OpenID response with Steam
 * 5. Fetch user data from Steam Web API
 * 6. Link Steam account to user or create new user
 *
 * Requirements:
 * - STEAM_API_KEY environment variable (get from https://steamcommunity.com/dev/apikey)
 * - NEXTAUTH_URL environment variable (your site URL)
 *
 * Documentation:
 * - https://steamcommunity.com/dev
 * - https://developer.valvesoftware.com/wiki/Steam_Web_API
 */

import { NextRequest, NextResponse } from 'next/server'
import { buildSteamOpenIdUrl } from '@/lib/steam-openid'

/**
 * GET /api/auth/steam
 * Initiates Steam OpenID authentication
 */
export async function GET(request: NextRequest) {
  // STUBBED - Uncomment to enable Steam authentication
  /*
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL
  const returnUrl = `${baseUrl}/api/auth/steam/callback`

  const steamLoginUrl = buildSteamOpenIdUrl(returnUrl)

  return NextResponse.redirect(steamLoginUrl)
  */

  return NextResponse.json(
    {
      error: 'Steam authentication is not yet enabled',
      message: 'Steam OAuth integration is stubbed for future implementation',
      documentation: '/docs/integrations/STEAM_INTEGRATION.md',
    },
    { status: 501 } // 501 Not Implemented
  )
}
