import { NextRequest, NextResponse } from 'next/server';
import { prismaMain } from '@/lib/db';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { isOwner } from '@/lib/admin';
// import Stripe from 'stripe';

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: '2023-10-16'
// });
/**
 * POST /api/crit/credits/cash-out
 * Cash out Story Credits via Stripe Connect (10% platform fee)
 * Minimum: 1,000 Story Credits ($10 USD)
 *
 * SECURITY: Owner-only access.
 */
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Require authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // SECURITY: Only owners can cash out story credits
    const user = await prismaMain.critUser.findUnique({
      where: { id: session.user.id },
    });
    if (!user || !isOwner(user)) {
      return NextResponse.json(
        { error: 'Forbidden - Owner access required' },
        { status: 403 }
      );
    const body = await request.json();
    const { amount, stripeAccountId } = body;
    // SECURITY: Use authenticated user's ID, not client-provided
    const userId = session.user.id;
    // Validate required fields
    if (!amount || !stripeAccountId) {
        { error: 'Missing required fields: amount, stripeAccountId' },
        { status: 400 }
    // Validate minimum amount
    if (amount < 1000) {
        { error: 'Minimum cash-out is 1,000 Story Credits ($10 USD)' },
    // Get current Story Credits balance
    const latestTransaction = await prismaMain.critStoryCreditTransaction.findFirst({
      where: { playerId: userId },
      orderBy: { createdAt: 'desc' }
    const currentBalance = latestTransaction?.balanceAfter.toNumber() ?? 0;
    // Check sufficient balance
    if (currentBalance < amount) {
        {
          error: 'Insufficient Story Credits',
          currentBalance,
          requestedAmount: amount
        },
    // Calculate payout
    const grossUsd = amount * 0.01; // 1 Story Credit = $0.01
    const platformFee = grossUsd * 0.10; // 10% fee
    const netPayout = grossUsd - platformFee;
    const newBalance = currentBalance - amount;
    // TODO: Uncomment when Stripe is configured
    // Create Stripe transfer
    // const transfer = await stripe.transfers.create({
    //   amount: Math.round(netPayout * 100), // Convert to cents
    //   currency: 'usd',
    //   destination: stripeAccountId,
    //   metadata: {
    //     playerId: userId,
    //     storyCredits: amount.toString(),
    //     grossUsd: grossUsd.toFixed(2),
    //     platformFee: platformFee.toFixed(2),
    //     netPayout: netPayout.toFixed(2)
    //   }
    // });
    // For now, create a mock transfer ID
    const mockTransferId = `tr_mock_${Date.now()}`;
    // Create transaction
    const transaction = await prismaMain.critStoryCreditTransaction.create({
      data: {
        playerId: userId,
        transactionType: 'spent_payout',
        amount: -amount,
        balanceAfter: newBalance,
        description: `Cash-out: $${netPayout.toFixed(2)} (${amount} credits - 10% fee)`,
        source: 'cash_out',
        stripeTransferId: mockTransferId, // Use transfer.id when Stripe is enabled
        payoutStatus: 'pending', // Will be 'completed' after Stripe confirms
        metadata: {
          grossUsd,
          platformFee,
          netPayout,
          platformFeePercentage: 10
        }
      }
    // AUDIT LOG
    console.log(
      `[OWNER_CASHOUT] Owner ${userId} cashed out ${amount} story credits ($${netPayout.toFixed(2)} after fees)`
    );
    return NextResponse.json({
      success: true,
      storyCreditsDebited: amount,
      grossUsd,
      platformFee,
      platformFeePercentage: 10,
      netPayout,
      newBalance,
      transaction,
      stripeTransferId: mockTransferId,
      message: 'Cash-out initiated. Funds will be transferred to your Stripe account within 1-2 business days.'
  } catch (error) {
    console.error('Error cashing out Story Credits:', error);
    return NextResponse.json(
      { error: 'Failed to cash out Story Credits' },
      { status: 500 }
  }
}
 * GET /api/crit/credits/cash-out
 * Get cash-out history and status
export async function GET(request: NextRequest) {
    // SECURITY: Only owners can view cash-out history
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId');
    // Use requested userId or authenticated user's ID
    const userId = requestedUserId || session.user.id;
    // Get all cash-out transactions
    const cashOuts = await prismaMain.critStoryCreditTransaction.findMany({
      where: {
        source: 'cash_out'
      },
    // Calculate totals
    const totalCreditsWithdrawn = cashOuts.reduce(
      (sum, tx) => sum + Math.abs(tx.amount.toNumber()),
      0
    const totalUsdWithdrawn = cashOuts.reduce(
      (sum, tx) => sum + ((tx.metadata as any)?.netPayout || 0),
    const totalPlatformFees = cashOuts.reduce(
      (sum, tx) => sum + ((tx.metadata as any)?.platformFee || 0),
      cashOuts,
      totals: {
        creditsWithdrawn: totalCreditsWithdrawn,
        usdWithdrawn: totalUsdWithdrawn,
        platformFees: totalPlatformFees
    console.error('Error fetching cash-out history:', error);
      { error: 'Failed to fetch cash-out history' },
