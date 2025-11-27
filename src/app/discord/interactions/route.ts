import { NextRequest, NextResponse } from 'next/server'
import { verifyKey } from 'discord-interactions'

/**
 * Discord Interactions Endpoint
 *
 * This endpoint handles Discord slash commands and button interactions.
 * Discord will POST interaction events here.
 *
 * Required environment variables:
 * - DISCORD_PUBLIC_KEY or DISCORD_PUBLIC_KEY_PROD (for production)
 */

const DISCORD_PUBLIC_KEY =
  process.env.NODE_ENV === 'production'
    ? process.env.DISCORD_PUBLIC_KEY_PROD
    : process.env.DISCORD_PUBLIC_KEY

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from Discord
    const signature = request.headers.get('x-signature-ed25519')
    const timestamp = request.headers.get('x-signature-timestamp')
    const body = await request.text()

    if (!signature || !timestamp || !DISCORD_PUBLIC_KEY) {
      return NextResponse.json(
        { error: 'Invalid request signature' },
        { status: 401 }
      )
    }

    const isValidRequest = verifyKey(body, signature, timestamp, DISCORD_PUBLIC_KEY)

    if (!isValidRequest) {
      return NextResponse.json(
        { error: 'Invalid request signature' },
        { status: 401 }
      )
    }

    // Parse the interaction
    const interaction = JSON.parse(body)

    // Handle PING (Discord verification)
    if (interaction.type === 1) {
      return NextResponse.json({ type: 1 })
    }

    // Handle APPLICATION_COMMAND (slash commands)
    if (interaction.type === 2) {
      const { name, options } = interaction.data

      // Example: Handle a /dice command
      if (name === 'dice') {
        const sides = options?.find((opt: any) => opt.name === 'sides')?.value || 20
        const roll = Math.floor(Math.random() * sides) + 1

        return NextResponse.json({
          type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
          data: {
            content: `🎲 You rolled a **${roll}** (d${sides})`,
          },
        })
      }

      // Default response for unknown commands
      return NextResponse.json({
        type: 4,
        data: {
          content: 'Command not implemented yet.',
        },
      })
    }

    // Handle MESSAGE_COMPONENT (button/select menu interactions)
    if (interaction.type === 3) {
      return NextResponse.json({
        type: 4,
        data: {
          content: 'Button interaction received!',
        },
      })
    }

    // Unknown interaction type
    return NextResponse.json(
      { error: 'Unknown interaction type' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error handling Discord interaction:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Discord requires this endpoint to accept GET requests for verification
export async function GET() {
  return NextResponse.json({
    message: 'Discord Interactions Endpoint',
    status: 'ready',
  })
}
