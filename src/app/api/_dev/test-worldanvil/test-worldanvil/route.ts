/**
 * Test World Anvil API from Next.js API route
 * This simulates how production account linking would work
 *
 * SECURITY: Only available in development and test environments
 */

import { NextRequest, NextResponse } from 'next/server';

// SECURITY: Completely disable in production
if (process.env.NODE_ENV === 'production') {
  throw new Error('Test World Anvil endpoint cannot be loaded in production');
}

export async function GET(request: NextRequest) {
  // SECURITY: Only allow in development/test
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Test endpoint not available in production' },
      { status: 403 }
    );
  }

  const applicationKey = process.env.WORLD_ANVIL_CLIENT_SECRET;
  const authToken = process.env.WORLD_ANVIL_TOKEN;

  if (!applicationKey || !authToken) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 500 });
  }

  try {
    // Test with fetch API (similar to browser)
    const response = await fetch('https://www.worldanvil.com/api/external/boromir/identity', {
      method: 'GET',
      headers: {
        'x-application-key': applicationKey,
        'x-auth-token': authToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const contentType = response.headers.get('content-type');
    const text = await response.text();

    // Check if it's HTML (Cloudflare)
    const isCloudflare = text.includes('<!DOCTYPE html>') || text.includes('Just a moment');

    return NextResponse.json({
      status: response.status,
      ok: response.ok,
      cloudflare: isCloudflare,
      contentType,
      data: isCloudflare ? 'Cloudflare blocked' : JSON.parse(text)
    });

  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
