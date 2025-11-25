/**
 * Foundry VTT Synchronization API (Proxy)
 * Proxies sync requests to Foundry bridge server with server-side API token authentication
 * This keeps the FOUNDRY_API_TOKEN secure on the server side
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isOwner } from '@/lib/admin';

const FOUNDRY_BRIDGE_URL = process.env.FOUNDRY_BRIDGE_URL || 'http://localhost:30000';
const FOUNDRY_API_TOKEN = process.env.FOUNDRY_API_TOKEN;

/**
 * POST /api/foundry/sync
 * Proxy sync requests to Foundry bridge with authentication
 *
 * Query params:
 * - mode: 'import' | 'export'
 *
 * Body:
 * - rpgWorldId: string
 * - entities: object (selected entities to sync)
 * - options: object (optional sync options)
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // AUTHORIZATION: Owner-only (Foundry sync is costly operation)
    const user = await prisma.critUser.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !isOwner(user)) {
      return NextResponse.json(
        { error: 'Forbidden - Owner access required for Foundry sync' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'import';
    const body = await request.json();
    const { rpgWorldId, entities, options } = body;

    if (!rpgWorldId) {
      return NextResponse.json(
        { error: 'Missing required field: rpgWorldId' },
        { status: 400 }
      );
    }

    // Determine endpoint based on mode
    const endpoint = mode === 'import'
      ? `${FOUNDRY_BRIDGE_URL}/sync/import/world`
      : `${FOUNDRY_BRIDGE_URL}/sync/export/world`;

    // Build request body based on mode
    const requestBody = mode === 'import'
      ? { rpgWorldId, entities, options: options || {} }
      : {
          rpgWorldId,
          entities: {
            creatures: entities?.actors || false,
            things: entities?.items || false,
            sheets: entities?.scenes || entities?.journal || entities?.combats || false,
            tables: entities?.tables || false,
            rules: entities?.macros || false,
            events: entities?.chat || false,
          },
        };

    // Proxy request to Foundry bridge with server-side API token
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FOUNDRY_API_TOKEN}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Foundry sync failed: ${response.statusText}`, details: errorText },
        { status: response.status }
      );
    }

    const result = await response.json();

    return NextResponse.json(result);
  } catch (error) {
    console.error('Foundry sync proxy error:', error);
    return NextResponse.json(
      { error: 'Sync failed', details: String(error) },
      { status: 500 }
    );
  }
}
