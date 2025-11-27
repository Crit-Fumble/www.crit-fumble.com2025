import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prismaMain } from '@/lib/db'
import { apiRateLimiter, getClientIdentifier, getIpAddress, checkRateLimit } from '@/lib/rate-limit'

/**
 * GET /api/user/accounts
 * Get all linked accounts for the current user
 *
 * SECURITY: Requires authentication, rate limited
 */
export async function GET(req: NextRequest) {
  try {
    // RATE LIMITING: 200 requests/minute for reads
    const ip = getIpAddress(req);
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
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch all linked accounts for the user
    const accounts = await prismaMain.account.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        provider: true,
        providerAccountId: true,
        metadata: true,
        displayName: true,
        createdAt: true,
        updatedAt: true,
        // Don't return sensitive tokens
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    // Get user's primary account preference
    const user = await prismaMain.critUser.findUnique({
      where: { id: session.user.id },
      select: { primaryAccountId: true },
    })

    return NextResponse.json({
      accounts,
      primaryAccountId: user?.primaryAccountId,
    })
  } catch (error) {
    console.error('Error fetching linked accounts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch linked accounts' },
      { status: 500 }
    )
  }
}
