import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * Discord User Verification Endpoint
 *
 * This endpoint handles linking Discord accounts to Crit-Fumble user accounts.
 * Used during Discord OAuth2 flow to verify and link accounts.
 */

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in first' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { discordId, discordUsername, discordAvatar } = body

    if (!discordId) {
      return NextResponse.json(
        { error: 'Discord ID is required' },
        { status: 400 }
      )
    }

    // Check if this Discord account is already linked to another user
    const existingLink = await prisma.critUser.findFirst({
      where: {
        discordId: discordId,
        NOT: {
          id: session.user.id,
        },
      },
    })

    if (existingLink) {
      return NextResponse.json(
        { error: 'This Discord account is already linked to another Crit-Fumble account' },
        { status: 409 }
      )
    }

    // Update the user's Discord information
    const updatedUser = await prisma.critUser.update({
      where: { id: session.user.id },
      data: {
        discordId,
        discordUsername,
        discordAvatar,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Discord account linked successfully',
      user: {
        id: updatedUser.id,
        discordId: updatedUser.discordId,
        discordUsername: updatedUser.discordUsername,
      },
    })
  } catch (error) {
    console.error('Error verifying Discord user:', error)
    return NextResponse.json(
      { error: 'Failed to link Discord account' },
      { status: 500 }
    )
  }
}

// GET endpoint to check if current user has Discord linked
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.critUser.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        discordId: true,
        discordUsername: true,
        discordAvatar: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const isLinked = !!user.discordId

    return NextResponse.json({
      isLinked,
      discord: isLinked
        ? {
            id: user.discordId,
            username: user.discordUsername,
            avatar: user.discordAvatar,
          }
        : null,
    })
  } catch (error) {
    console.error('Error fetching Discord link status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Discord link status' },
      { status: 500 }
    )
  }
}

// DELETE endpoint to unlink Discord account
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await prisma.critUser.update({
      where: { id: session.user.id },
      data: {
        discordId: null,
        discordUsername: null,
        discordAvatar: null,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Discord account unlinked successfully',
    })
  } catch (error) {
    console.error('Error unlinking Discord account:', error)
    return NextResponse.json(
      { error: 'Failed to unlink Discord account' },
      { status: 500 }
    )
  }
}
