import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/packages/cfg-lib/db'

/**
 * DELETE /api/user/accounts/[accountId]
 * Unlink an account from the current user
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { accountId } = await params

    // Check how many accounts the user has
    const accountCount = await prisma.account.count({
      where: { userId: session.user.id },
    })

    // Prevent unlinking the last account
    if (accountCount <= 1) {
      return NextResponse.json(
        { error: 'Cannot unlink your last account. You must have at least one linked account.' },
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

    // Delete the account
    await prisma.account.delete({
      where: { id: accountId },
    })

    // If this was the primary account, clear it
    await prisma.critUser.updateMany({
      where: {
        id: session.user.id,
        primaryAccountId: accountId,
      },
      data: {
        primaryAccountId: null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error unlinking account:', error)
    return NextResponse.json(
      { error: 'Failed to unlink account' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/user/accounts/[accountId]
 * Update account settings (display name, etc.)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { accountId } = await params
    const body = await req.json()

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

    // Update allowed fields
    const updateData: any = {}
    if ('displayName' in body) {
      updateData.displayName = body.displayName
    }

    const updatedAccount = await prisma.account.update({
      where: { id: accountId },
      data: updateData,
    })

    return NextResponse.json(updatedAccount)
  } catch (error) {
    console.error('Error updating account:', error)
    return NextResponse.json(
      { error: 'Failed to update account' },
      { status: 500 }
    )
  }
}
