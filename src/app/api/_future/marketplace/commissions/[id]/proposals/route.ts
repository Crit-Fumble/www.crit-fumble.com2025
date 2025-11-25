import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/marketplace/commissions/:id/proposals
 * Submit a proposal for a commission
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { userId, price, message, portfolioUrls, estimatedDays } = body;
    const commissionId = params.id;

    // Validate required fields
    if (!userId || !price || !message) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: ['userId', 'price', 'message']
        },
        { status: 400 }
      );
    }

    // Validate price
    if (price <= 0) {
      return NextResponse.json(
        { error: 'Price must be greater than 0' },
        { status: 400 }
      );
    }

    // Get commission
    const commission = await prisma.marketplaceCommission.findUnique({
      where: { id: commissionId }
    });

    if (!commission) {
      return NextResponse.json(
        { error: 'Commission not found' },
        { status: 404 }
      );
    }

    // Check commission is open
    if (commission.status !== 'open') {
      return NextResponse.json(
        { error: 'Commission is not open for proposals' },
        { status: 400 }
      );
    }

    // Can't propose on your own commission
    if (commission.requestorId === userId) {
      return NextResponse.json(
        { error: 'Cannot propose on your own commission' },
        { status: 400 }
      );
    }

    // Check if user already has a pending proposal
    const existingProposal = await prisma.commissionProposal.findFirst({
      where: {
        commissionId,
        creatorId: userId,
        status: 'pending'
      }
    });

    if (existingProposal) {
      return NextResponse.json(
        { error: 'You already have a pending proposal for this commission' },
        { status: 400 }
      );
    }

    // Create proposal
    const proposal = await prisma.commissionProposal.create({
      data: {
        commissionId,
        creatorId: userId,
        price,
        message,
        portfolioUrls: portfolioUrls || null,
        estimatedDays: estimatedDays || null,
        status: 'pending'
      }
    });

    // Calculate what creator will receive if accepted
    const creatorReceives = commission.paymentType === 'crit_coins'
      ? price * 0.8  // 5:4 ratio - creator gets 80%
      : price;       // 1:1 - creator gets 100%

    return NextResponse.json({
      success: true,
      proposal,
      paymentInfo: {
        requestedPrice: price,
        paymentType: commission.paymentType,
        youWillReceive: creatorReceives,
        platformMargin: commission.paymentType === 'crit_coins' ? price * 0.2 : 0
      },
      message: `Proposal submitted. If accepted, you will receive ${creatorReceives} Story Credits.`
    });
  } catch (error) {
    console.error('Error creating proposal:', error);
    return NextResponse.json(
      { error: 'Failed to create proposal' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/marketplace/commissions/:id/proposals
 * Get all proposals for a commission
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const commissionId = params.id;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Build where clause
    const where: any = {
      commissionId,
      deletedAt: null
    };

    if (status) where.status = status;

    // Get proposals
    const proposals = await prisma.commissionProposal.findMany({
      where,
      orderBy: { createdAt: 'asc' }
    });

    // Get commission to calculate creator receives
    const commission = await prisma.marketplaceCommission.findUnique({
      where: { id: commissionId },
      select: { paymentType: true }
    });

    if (!commission) {
      return NextResponse.json(
        { error: 'Commission not found' },
        { status: 404 }
      );
    }

    // Add calculated fields
    const proposalsWithInfo = proposals.map(proposal => ({
      ...proposal,
      creatorReceives: commission.paymentType === 'crit_coins'
        ? proposal.price.toNumber() * 0.8
        : proposal.price.toNumber(),
      platformMargin: commission.paymentType === 'crit_coins'
        ? proposal.price.toNumber() * 0.2
        : 0
    }));

    return NextResponse.json({
      success: true,
      proposals: proposalsWithInfo,
      count: proposals.length
    });
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch proposals' },
      { status: 500 }
    );
  }
}
