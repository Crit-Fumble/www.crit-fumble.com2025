/**
 * Print-Ready Asset API Route
 * Generates print-ready versions of assets with QR code overlays
 *
 * SECURITY: Requires authentication, rate limited
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { apiRateLimiter, getClientIdentifier, getIpAddress, checkRateLimit } from '@/lib/rate-limit';
import { generatePrintReadyAsset } from '@/lib/asset-utils';
import { QRCodeOptions } from '@/lib/qr-utils';

/**
 * GET /api/rpg/assets/print?id={assetId}&size=64&opacity=0.15&position=corner
 * Generate a print-ready version of an asset with QR code overlay
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
    const assetId = searchParams.get('id');

    if (!assetId) {
      return NextResponse.json(
        { error: 'Asset ID is required' },
        { status: 400 }
      );
    }

    // Parse QR code options from query params
    const qrOptions: Partial<QRCodeOptions> = {};

    const size = searchParams.get('size');
    if (size) qrOptions.size = parseInt(size, 10);

    const opacity = searchParams.get('opacity');
    if (opacity) qrOptions.opacity = parseFloat(opacity);

    const position = searchParams.get('position');
    if (position && (position === 'corner' || position === 'center' || position === 'edge')) {
      qrOptions.position = position;
    }

    const cornerOffset = searchParams.get('cornerOffset');
    if (cornerOffset) qrOptions.cornerOffset = parseInt(cornerOffset, 10);

    const errorLevel = searchParams.get('errorLevel');
    if (errorLevel && ['L', 'M', 'Q', 'H'].includes(errorLevel)) {
      qrOptions.errorCorrectionLevel = errorLevel as 'L' | 'M' | 'Q' | 'H';
    }

    // Generate print-ready asset
    const result = await generatePrintReadyAsset(assetId, qrOptions);

    if (!result) {
      return NextResponse.json(
        { error: 'Asset not found or failed to generate print-ready version' },
        { status: 404 }
      );
    }

    // Return the image
    return new NextResponse(result.buffer, {
      status: 200,
      headers: {
        'Content-Type': result.mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Print-ready asset generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate print-ready asset', details: String(error) },
      { status: 500 }
    );
  }
}
