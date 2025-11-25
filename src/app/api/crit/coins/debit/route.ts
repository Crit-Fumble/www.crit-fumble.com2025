import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isOwner } from '@/lib/admin';

/**
 * POST /api/crit/coins/debit
 * Debit coins from the authenticated user's account
 *
 * SECURITY: Owner-only access.
 * The userId is taken from the authenticated session, not the request body.
 */
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Require authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // SECURITY: Only owners can debit crit-coins
    const user = await prisma.critUser.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !isOwner(user)) {
      return NextResponse.json(
        { error: 'Forbidden - Owner access required' },
        { status: 403 }
      );
    }

    // SECURITY: Use authenticated user's ID, not client-provided
    const userId = session.user.id;

    const body = await request.json();
    const { amount, description, metadata } = body;

    // Validate amount
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount - must be a positive number' },
        { status: 400 }
      );
    }

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    // Get current balance
    const latestTransaction = await prisma.critCoinTransaction.findFirst({
      where: { playerId: userId },
      orderBy: { createdAt: 'desc' }
    });

    const currentBalance = latestTransaction?.balanceAfter ?? 0;

    // Check sufficient balance
    if (currentBalance < amount) {
      return NextResponse.json(
        {
          error: 'Insufficient balance',
          currentBalance,
          requestedAmount: amount,
          shortfall: amount - currentBalance
        },
        { status: 400 }
      );
    }

    const newBalance = currentBalance - amount;

    // Create debit transaction
    const transaction = await prisma.critCoinTransaction.create({
      data: {
        playerId: userId,
        transactionType: 'debit',
        amount: -amount, // Negative for debit
        balanceAfter: newBalance,
        description,
        metadata: metadata || {}
      }
    });

    // AUDIT LOG
    console.log(
      `[DEBIT] User ${userId} debited ${amount} coins. New balance: ${newBalance}. Reason: ${description}`
    );

    return NextResponse.json({
      success: true,
      transaction,
      previousBalance: currentBalance,
      newBalance,
      amountDebited: amount
    });
  } catch (error) {
    console.error('Error debiting coins:', error);
    return NextResponse.json(
      { error: 'Failed to debit coins' },
      { status: 500 }
    );
  }
}
