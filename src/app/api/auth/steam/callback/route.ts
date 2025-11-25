/**
 * Steam OpenID 2.0 Authentication Callback
 *
 * STUBBED FOR FUTURE IMPLEMENTATION
 *
 * This route handles the return from Steam's OpenID authentication.
 * It verifies the OpenID response, fetches user data from Steam API,
 * and links the Steam account to the user's profile.
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifySteamOpenIdResponse, getSteamPlayerSummary } from '@/lib/steam-openid'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * GET /api/auth/steam/callback
 * Handles Steam OpenID return and links account
 */
export async function GET(request: NextRequest) {
  // STUBBED - Uncomment to enable Steam authentication
  /*
  const searchParams = request.nextUrl.searchParams
  const params: Record<string, string> = {}

  // Extract all OpenID parameters
  for (const [key, value] of searchParams.entries()) {
    params[key] = value
  }

  // Verify the OpenID response with Steam
  const { verified, steamId } = await verifySteamOpenIdResponse(params)

  if (!verified || !steamId) {
    return NextResponse.redirect(
      new URL('/account?error=steam_verification_failed', request.url)
    )
  }

  // Get current user session
  const session = await auth()
  if (!session?.user) {
    return NextResponse.redirect(new URL('/login?error=not_authenticated', request.url))
  }

  // Fetch Steam player data
  const apiKey = process.env.STEAM_API_KEY
  if (!apiKey) {
    console.error('STEAM_API_KEY not configured')
    return NextResponse.redirect(new URL('/account?error=steam_api_key_missing', request.url))
  }

  const playerData = await getSteamPlayerSummary(steamId, apiKey)
  if (!playerData) {
    return NextResponse.redirect(
      new URL('/account?error=steam_data_fetch_failed', request.url)
    )
  }

  // Link Steam account to user
  try {
    await prisma.critUser.update({
      where: { id: session.user.id },
      data: {
        steamId: steamId,
        steamUsername: playerData.personaname,
        steamAvatar: playerData.avatarfull,
      },
    })

    return NextResponse.redirect(new URL('/account?success=steam_linked', request.url))
  } catch (error) {
    console.error('Failed to link Steam account:', error)
    return NextResponse.redirect(new URL('/account?error=steam_link_failed', request.url))
  }
  */

  return NextResponse.json(
    {
      error: 'Steam authentication is not yet enabled',
      message: 'Steam OAuth integration is stubbed for future implementation',
    },
    { status: 501 }
  )
}
