import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { isOwner } from '@/lib/admin';

/**
 * POST /api/marketplace/commissions
 * Create a new commission request
 * Supports both Crit-Coins (5:4 ratio) and Story Credits (1:1)
 *
 * SECURITY: Requires authentication. Only owners can create commissions.
 */
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Require authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // SECURITY: Only owners can create commissions (Owner-only restriction)
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
    const { type, title, description, paymentType, budget, deadline } = body;

    // Validate required fields
    if (!type || !title || !description || !paymentType || !budget) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: ['type', 'title', 'description', 'paymentType', 'budget']
        },
        { status: 400 }
      );
    }

    // Validate payment type
    if (paymentType !== 'crit_coins' && paymentType !== 'story_credits') {
      return NextResponse.json(
        { error: 'Invalid paymentType. Must be "crit_coins" or "story_credits"' },
        { status: 400 }
      );
    }

    // Validate budget
    if (budget <= 0) {
      return NextResponse.json(
        { error: 'Budget must be greater than 0' },
        { status: 400 }
      );
    }

    // Check user has sufficient balance
    if (paymentType === 'crit_coins') {
      const latestCritCoin = await prisma.critCoinTransaction.findFirst({
        where: { playerId: userId },
        orderBy: { createdAt: 'desc' }
      });

      const balance = latestCritCoin?.balanceAfter ?? 0;
      if (balance < budget) {
        return NextResponse.json(
          {
            error: 'Insufficient Crit-Coins',
            currentBalance: balance,
            required: budget
          },
          { status: 400 }
        );
      }
    } else {
      const latestStoryCredit = await prisma.storyCreditTransaction.findFirst({
        where: { playerId: userId },
        orderBy: { createdAt: 'desc' }
      });

      const balance = latestStoryCredit?.balanceAfter.toNumber() ?? 0;
      if (balance < budget) {
        return NextResponse.json(
          {
            error: 'Insufficient Story Credits',
            currentBalance: balance,
            required: budget
          },
          { status: 400 }
        );
      }
    }

    // Create commission
    const commission = await prisma.marketplaceCommission.create({
      data: {
        requestorId: userId,
        type,
        title,
        description,
        paymentType,
        budget,
        deadline: deadline ? new Date(deadline) : null,
        status: 'open'
      }
    });

    // Calculate what creator will receive
    const creatorReceives = paymentType === 'crit_coins'
      ? budget * 0.8  // 5:4 ratio - creator gets 80%
      : budget;       // 1:1 - creator gets 100%

    // AUDIT LOG
    console.log(
      `[OWNER_COMMISSION] Owner ${userId} created ${type} commission. Budget: ${budget} ${paymentType}. Title: ${title}`
    );

    return NextResponse.json({
      success: true,
      commission,
      paymentInfo: {
        paymentType,
        budget,
        creatorReceives,
        platformMargin: paymentType === 'crit_coins' ? budget * 0.2 : 0,
        ratio: paymentType === 'crit_coins' ? '5:4 (20% margin)' : '1:1 (no fee)'
      },
      message: `Commission created successfully. Creator will receive ${creatorReceives} Story Credits.`
    });
  } catch (error) {
    console.error('Error creating commission:', error);
    return NextResponse.json(
      { error: 'Failed to create commission' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/marketplace/commissions
 * Browse available commissions
 * Query params: type, status, paymentType, requestorId, creatorId
 *
 * SECURITY: Requires authentication. Only owners can view commissions.
 */
export async function GET(request: NextRequest) {
  try {
    // SECURITY: Require authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // SECURITY: Only owners can view commissions (Owner-only restriction)
    const user = await prisma.critUser.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !isOwner(user)) {
      return NextResponse.json(
        { error: 'Forbidden - Owner access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);

    const type = searchParams.get('type');
    const status = searchParams.get('status') || 'open';
    const paymentType = searchParams.get('paymentType');
    const requestorId = searchParams.get('requestorId');
    const creatorId = searchParams.get('creatorId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build where clause
    const where: any = {
      deletedAt: null
    };

    if (type) where.type = type;
    if (status) where.status = status;
    if (paymentType) where.paymentType = paymentType;
    if (requestorId) where.requestorId = requestorId;
    if (creatorId) where.creatorId = creatorId;

    // Get total count
    const total = await prisma.marketplaceCommission.count({ where });

    // Get commissions
    const commissions = await prisma.marketplaceCommission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        type: true,
        title: true,
        description: true,
        paymentType: true,
        budget: true,
        deadline: true,
        requestorId: true,
        creatorId: true,
        status: true,
        deliveredAt: true,
        approvedAt: true,
        requestorRating: true,
        creatorRating: true
      }
    });

    // Add calculated fields
    const commissionsWithInfo = commissions.map(commission => ({
      ...commission,
      creatorReceives: commission.paymentType === 'crit_coins'
        ? commission.budget.toNumber() * 0.8
        : commission.budget.toNumber(),
      platformMargin: commission.paymentType === 'crit_coins'
        ? commission.budget.toNumber() * 0.2
        : 0
    }));

    return NextResponse.json({
      success: true,
      commissions: commissionsWithInfo,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching commissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch commissions' },
      { status: 500 }
    );
  }
}
