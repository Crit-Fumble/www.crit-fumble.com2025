/**
 * API route to unlink World Anvil account
 *
 * SECURITY: Requires authentication, rate limited
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prismaMain } from '@/lib/db';
import { apiRateLimiter, getClientIdentifier, getIpAddress, checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // RATE LIMITING: 100 requests/minute
    const ip = getIpAddress(request);
    const rateLimitResult = await checkRateLimit(
      apiRateLimiter,
      getClientIdentifier(undefined, ip)
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: { 'Retry-After': rateLimitResult.retryAfter.toString() }
        }
      );
    }

    // AUTHENTICATION: Require logged-in user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Remove World Anvil information from user
    await prismaMain.critUser.update({
      where: { id: session.user.id },
      data: {
        worldAnvilId: null,
        worldAnvilUsername: null,
        worldAnvilToken: null,
        worldAnvilRefreshToken: null,
        worldAnvilTokenExpires: null,
      },
    });

    console.log(`[World Anvil] Successfully unlinked account for user ${session.user.id}`);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('[World Anvil] Unlink account error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
