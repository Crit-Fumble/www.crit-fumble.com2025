import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/packages/cfg-lib/db'

/**
 * POST /api/user/accounts/primary
 * Set the primary account for display purposes
 * Body: { accountId: string }
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
    const { accountId } = body

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId is required' },
        { status: 400 }
      )
    }

    // Verify the account belongs to the user
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId: session.user.id,
      },
    })

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found or does not belong to you' },
        { status: 404 }
      )
    }

    // Update the user's primary account
    await prisma.critUser.update({
      where: { id: session.user.id },
      data: { primaryAccountId: accountId },
    })

    return NextResponse.json({ success: true, accountId })
  } catch (error) {
    console.error('Error setting primary account:', error)
    return NextResponse.json(
      { error: 'Failed to set primary account' },
      { status: 500 }
    )
  }
}
