import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/packages/cfg-lib/db'

/**
 * POST /api/user/profile/complete
 * Complete user profile during sign-up
 * Body: { username: string, email?: string, avatarUrl?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { username, email, avatarUrl } = body

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        {
          error: 'Username must be 3-30 characters and contain only letters, numbers, hyphens, and underscores',
        },
        { status: 400 }
      )
    }

    // Check if username is already taken (excluding current user)
    const existingUser = await prismaMain.critUser.findFirst({
      where: {
        username,
        NOT: {
          id: session.user.id,
        },
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username is already taken' },
        { status: 400 }
      )
    }

    // Check if email is already taken (excluding current user)
    if (email) {
      const existingEmail = await prismaMain.critUser.findFirst({
        where: {
          email,
          NOT: {
            id: session.user.id,
          },
        },
      })

      if (existingEmail) {
        return NextResponse.json(
          { error: 'Email is already in use' },
          { status: 400 }
        )
      }
    }

    // Update user profile
    const user = await prismaMain.critUser.update({
      where: { id: session.user.id },
      data: {
        username,
        email: email || null,
        avatarUrl: avatarUrl || null,
        profileCompleted: true,
      },
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
    })
  } catch (error) {
    console.error('Error completing profile:', error)
    return NextResponse.json(
      { error: 'Failed to complete profile' },
      { status: 500 }
    )
  }
}
