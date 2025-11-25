/**
 * Asset Lookup API Route
 * Look up asset information by shortcode
 *
 * SECURITY: Requires authentication, rate limited
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { apiRateLimiter, getClientIdentifier, getIpAddress, checkRateLimit } from '@/lib/rate-limit';
import { lookupAssetByShortcode } from '@/lib/qr-utils';

/**
 * GET /api/rpg/assets/lookup?shortcode={code}
 * Look up an asset by its shortcode
 *
 * SECURITY: Requires authentication, rate limited
 */
export async function GET(request: NextRequest) {
  try {
    // RATE LIMITING: 200 requests/minute for reads
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const shortcode = searchParams.get('shortcode');

    if (!shortcode) {
      return NextResponse.json(
        { error: 'Shortcode is required' },
        { status: 400 }
      );
    }

    const asset = await lookupAssetByShortcode(shortcode.toUpperCase());

    if (!asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ asset });
  } catch (error) {
    console.error('Asset lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to lookup asset', details: String(error) },
      { status: 500 }
    );
  }
}
