import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/packages/cfg-lib/db'

/**
 * GET /api/user/profile
 * Get current user's profile
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.critUser.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        profileCompleted: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/user/profile
 * Update current user's profile
 * Body: { displayName?: string, bio?: string, avatarUrl?: string }
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { displayName, bio, avatarUrl } = body

    // Build update data
    const updateData: any = {}

    // Validate and update display name
    if (displayName !== undefined) {
      if (displayName !== null && displayName !== '') {
        if (typeof displayName !== 'string') {
          return NextResponse.json(
            { error: 'Display name must be a string' },
            { status: 400 }
          )
        }

        if (displayName.length > 50) {
          return NextResponse.json(
            { error: 'Display name must be 50 characters or less' },
            { status: 400 }
          )
        }
      }

      updateData.displayName = displayName || null
    }

    // Validate and update bio
    if (bio !== undefined) {
      if (bio !== null && bio !== '') {
        if (typeof bio !== 'string') {
          return NextResponse.json(
            { error: 'Bio must be a string' },
            { status: 400 }
          )
        }

        if (bio.length > 200) {
          return NextResponse.json(
            { error: 'Bio must be 200 characters or less' },
            { status: 400 }
          )
        }
      }

      updateData.bio = bio || null
    }

    // Update avatar URL
    if (avatarUrl !== undefined) {
      updateData.avatarUrl = avatarUrl || null
    }

    // Perform update
    const user = await prisma.critUser.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        displayName: true,
        bio: true,
        profileCompleted: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
