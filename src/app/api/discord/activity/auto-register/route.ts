import { NextRequest, NextResponse } from 'next/server'
import { prismaMain } from '@/lib/db'

/**
 * Discord Activity Auto-Registration Endpoint
 *
 * POST /api/discord/activity/auto-register
 *
 * Automatically creates a CritUser account for Discord users who join the activity.
 * This provides seamless onboarding - users get instant access without manual signup.
 *
 * Request body:
 * - discordId: Discord user ID
 * - discordUsername: Discord username
 * - discordAvatar: Discord avatar hash
 * - displayName: User's Discord display name (global_name)
 * - email: User's email (optional, from Discord OAuth scopes)
 *
 * Returns:
 * - success: Whether account was created
 * - user: Created CritUser account details
 */
export async function POST(request: NextRequest) {
  try {
    const { discordId, discordUsername, discordAvatar, displayName, email } = await request.json()

    if (!discordId || !discordUsername) {
      return NextResponse.json(
        { error: 'Discord ID and username are required' },
        { status: 400 }
      )
    }

    // Check if account already exists
    const existingUser = await prismaMain.critUser.findUnique({
      where: { discordId },
    })

    if (existingUser) {
      return NextResponse.json({
        success: true,
        alreadyExists: true,
        user: {
          id: existingUser.id,
          username: existingUser.username,
          displayName: existingUser.displayName || existingUser.username,
          isOwner: false, // Will be computed from roles if needed
        },
      })
    }

    // Check if username already exists (Discord username might conflict)
    // If it does, append a random suffix
    let username = discordUsername.toLowerCase().replace(/[^a-z0-9_]/g, '_')
    const existingUsername = await prismaMain.critUser.findUnique({
      where: { username },
    })

    if (existingUsername) {
      const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
      username = `${username}_${randomSuffix}`
    }

    // Create new CritUser account
    const newUser = await prismaMain.critUser.create({
      data: {
        username,
        email: email || null,
        displayName: displayName || discordUsername,
        discordId,
        discordUsername,
        discordAvatar,
        profileCompleted: true, // Auto-completed from Discord
        tier: 'FREE', // Default tier
        roles: [], // No special roles by default
        isActive: true,
        settings: {},
      },
    })

    return NextResponse.json({
      success: true,
      alreadyExists: false,
      user: {
        id: newUser.id,
        username: newUser.username,
        displayName: newUser.displayName || newUser.username,
        avatarUrl: newUser.discordAvatar
          ? `https://cdn.discordapp.com/avatars/${newUser.discordId}/${newUser.discordAvatar}.png`
          : null,
        isOwner: false,
        tier: newUser.tier,
      },
    })
  } catch (error) {
    console.error('Error auto-registering Discord user:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}
