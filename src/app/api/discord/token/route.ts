import { NextRequest, NextResponse } from 'next/server'

/**
 * Discord OAuth Token Exchange
 *
 * POST /api/discord/token
 *
 * Exchanges an authorization code for an access token.
 * This is called by the Discord Activity client after the user
 * authorizes the application.
 *
 * Required environment variables:
 * - NEXT_PUBLIC_DISCORD_CLIENT_ID: Discord application client ID
 * - DISCORD_CLIENT_SECRET: Discord application client secret
 */
export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({ error: 'Authorization code is required' }, { status: 400 })
    }

    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID
    const clientSecret = process.env.DISCORD_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      console.error('Discord credentials not configured')
      return NextResponse.json(
        { error: 'Discord integration not configured' },
        { status: 500 }
      )
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Discord token exchange failed:', errorText)
      return NextResponse.json(
        { error: 'Failed to exchange authorization code' },
        { status: tokenResponse.status }
      )
    }

    const tokenData = await tokenResponse.json()

    // Fetch user information using the access token
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })

    if (!userResponse.ok) {
      const errorText = await userResponse.text()
      console.error('Discord user fetch failed:', errorText)
      return NextResponse.json(
        { error: 'Failed to fetch user information' },
        { status: userResponse.status }
      )
    }

    const userData = await userResponse.json()

    // Return access token and user information
    // We don't expose refresh tokens to the client for security
    return NextResponse.json({
      access_token: tokenData.access_token,
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in,
      scope: tokenData.scope,
      user: {
        id: userData.id,
        username: userData.username,
        discriminator: userData.discriminator,
        avatar: userData.avatar,
        global_name: userData.global_name,
      },
      expires: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      scopes: tokenData.scope.split(' '),
    })
  } catch (error) {
    console.error('Discord token exchange error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
