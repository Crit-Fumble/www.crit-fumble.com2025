import { NextRequest, NextResponse } from 'next/server'
import { verifyBotAuth } from '@/lib/bot-auth'

/**
 * GET /api/bot/status
 * Health check endpoint for FumbleBot
 * Verifies bot authentication is working
 */
export async function GET(request: NextRequest) {
  try {
    const botAuth = verifyBotAuth(request)

    if (!botAuth) {
      return NextResponse.json(
        { error: 'Unauthorized', authenticated: false },
        { status: 401 }
      )
    }

    return NextResponse.json({
      authenticated: true,
      isAdmin: botAuth.isAdmin,
      discordId: botAuth.discordId,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error in bot status check:', error)
    return NextResponse.json(
      { error: 'Internal server error', authenticated: false },
      { status: 500 }
    )
  }
}
