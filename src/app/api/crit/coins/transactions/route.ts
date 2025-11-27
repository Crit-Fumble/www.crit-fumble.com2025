import { NextRequest, NextResponse } from 'next/server';
import { prismaMain } from '@/lib/db';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isOwner } from '@/lib/admin';

/**
 * GET /api/crit/coins/transactions
 * Get user's Crit-Coin transaction history
 *
 * SECURITY: Owner-only access.
 */
export async function GET(request: NextRequest) {
  try {
    // SECURITY: Require authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // SECURITY: Only owners can access crit-coin transactions
    const user = await prismaMain.critUser.findUnique({
      where: { id: session.user.id },
    });
    if (!user || !isOwner(user)) {
      return NextResponse.json(
        { error: 'Forbidden - Owner access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Cap at 100
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);
    // Determine which user's transactions to fetch
    const userId = requestedUserId || session.user.id;
    const transactions = await prismaMain.critCoinTransaction.findMany({
      where: { playerId: userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        product: {
          select: {
            name: true,
            title: true,
            sku: true
          }
        }
      }
    });

    const total = await prismaMain.critCoinTransaction.count({
      where: { playerId: userId }
    });

    return NextResponse.json({
      transactions,
      total,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/crit/coins/transactions
 * Create a new Crit-Coin transaction (owner/system use ONLY)
 * This is an administrative endpoint for manual adjustments.
 */
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Require authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // SECURITY: Only owners can create transactions
    const body = await request.json();
    const {
      playerId,
      transactionType,
      amount,
      description,
      productId,
      stripePaymentIntentId,
      stripeChargeId,
      expiresAt,
      metadata
    } = body;
    // Validate required fields
    if (!playerId || !transactionType || !amount || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: playerId, transactionType, amount, description' },
        { status: 400 }
      );
    }
    // Validate amount
    if (typeof amount !== 'number' || isNaN(amount)) {
      return NextResponse.json(
        { error: 'Invalid amount - must be a number' },
        { status: 400 }
      );
    }
    // Validate transaction type
    const validTypes = ['credit', 'debit'];
    if (!validTypes.includes(transactionType)) {
      return NextResponse.json(
        { error: 'Invalid transactionType - must be "credit" or "debit"' },
        { status: 400 }
      );
    }
    // Get current balance
    const latestTransaction = await prismaMain.critCoinTransaction.findFirst({
      where: { playerId },
      orderBy: { createdAt: 'desc' }
    });

    const currentBalance = latestTransaction?.balanceAfter ?? 0;
    const newBalance = currentBalance + amount;
    // Prevent negative balance for debits
    if (newBalance < 0) {
      return NextResponse.json(
        { error: 'Insufficient balance', currentBalance, requestedAmount: amount },
        { status: 400 }
      );
    }
    // Create transaction
    const transaction = await prismaMain.critCoinTransaction.create({
      data: {
        playerId,
        transactionType,
        amount,
        balanceAfter: newBalance,
        description,
        productId: productId || null,
        stripePaymentIntentId: stripePaymentIntentId || null,
        stripeChargeId: stripeChargeId || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        metadata: metadata || {}
      }
    });

    // AUDIT LOG: Log owner transaction creation
    console.log(
      `[OWNER_TRANSACTION] Owner ${session.user.id} created ${transactionType} transaction of ${amount} coins for user ${playerId}. Reason: ${description}`
    );

    return NextResponse.json({
      transaction,
      previousBalance: currentBalance,
      newBalance
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}
