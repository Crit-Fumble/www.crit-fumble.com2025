import { NextRequest, NextResponse } from 'next/server'
import { prismaMain } from '@/lib/db'

/**
 * Discord Activity User Status Endpoint
 *
 * POST /api/discord/activity/user-status
 *
 * Checks if a Discord user has a linked CritUser account and returns their status.
 * This is called from the Discord Activity to determine user permissions and features.
 *
 * Request body:
 * - discordId: Discord user ID from OAuth authentication
 *
 * Returns:
 * - isLinked: Whether the Discord account is linked to a CritUser
 * - user: CritUser account details (if linked)
 *   - id: CritUser ID
 *   - username: Platform username
 *   - displayName: Display name
 *   - avatarUrl: Avatar URL
 *   - roles: User roles array
 *   - isOwner: Whether user is an owner (has role in roles array)
 *   - tier: User subscription tier
 */
export async function POST(request: NextRequest) {
  try {
    const { discordId } = await request.json()

    if (!discordId) {
      return NextResponse.json(
        { error: 'Discord ID is required' },
        { status: 400 }
      )
    }

    // Find CritUser by Discord ID
    const critUser = await prismaMain.critUser.findUnique({
      where: { discordId },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        roles: true,
        tier: true,
        isActive: true,
        discordId: true,
        discordUsername: true,
        discordAvatar: true,
      },
    })

    // User not linked
    if (!critUser) {
      return NextResponse.json({
        isLinked: false,
        user: null,
      })
    }

    // Check if user is inactive/deleted
    if (!critUser.isActive) {
      return NextResponse.json({
        isLinked: true,
        user: null,
        error: 'Account is inactive',
      })
    }

    // Parse roles (stored as JSON)
    const roles = Array.isArray(critUser.roles) ? critUser.roles : []

    // Check if user is an owner (has any owner-related role)
    // Owners can have roles like: 'Admin', 'Moderator', 'Creator', etc.
    const isOwner = roles.some((role: string) =>
      ['Admin', 'Moderator', 'Owner'].includes(role)
    )

    return NextResponse.json({
      isLinked: true,
      user: {
        id: critUser.id,
        username: critUser.username,
        displayName: critUser.displayName || critUser.username,
        avatarUrl: critUser.avatarUrl || (
          critUser.discordAvatar
            ? `https://cdn.discordapp.com/avatars/${critUser.discordId}/${critUser.discordAvatar}.png`
            : null
        ),
        roles,
        isOwner,
        tier: critUser.tier,
      },
    })
  } catch (error) {
    console.error('Error checking Discord user status:', error)
    return NextResponse.json(
      { error: 'Failed to check user status' },
      { status: 500 }
    )
  }
}
