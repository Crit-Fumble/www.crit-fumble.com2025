/**
 * Foundry Game Systems Management
 *
 * SECURITY: Owner-only access
 * Returns information about installed game systems and their status
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/packages/cfg-lib/auth';
import { isOwner } from '@/lib/admin';
import { prismaMain } from '@/lib/db';

/**
 * Supported game systems for Crit-Fumble platform
 * These are the systems we have adapters/bridges for
 */
const SUPPORTED_SYSTEMS = {
  dnd5e: {
    id: 'dnd5e',
    name: 'Dungeons & Dragons 5th Edition',
    shortName: 'D&D 5e',
    description: 'Official D&D 5th Edition system (451MB)',
    bridgeModule: 'foundry-cfg-5e',
    adapterClass: 'DnD5eAdapter',
    minimumVersion: '5.0.0',
    verifiedVersion: '5.2.0',
    url: 'https://foundryvtt.com/packages/dnd5e',
    license: 'Limited License Agreement for Official Content',
    srd: 'SRD 5.2.1',
  },
  cyphersystem: {
    id: 'cyphersystem',
    name: 'Cypher System',
    shortName: 'Cypher',
    description: 'Cypher System by Monte Cook Games (~3.5MB)',
    bridgeModule: 'foundry-cfg-cypher',
    adapterClass: 'CypherSystemAdapter',
    minimumVersion: '3.4.0',
    verifiedVersion: '3.4.3',
    url: 'https://foundryvtt.com/packages/cyphersystem',
    license: 'Cypher System Open License (CSOL)',
    srd: 'OG-CSRD (Old Gus\' Cypher System Reference Document)',
    supportedGames: [
      'Generic Cypher System',
      'Numenera',
      'The Strange',
      'Predation',
      'Gods of the Fall',
      'Unmasked',
      'Fairy Tale',
      'Weird West',
    ],
  },
};

/**
 * GET /api/foundry/systems - Get game systems information
 *
 * Returns:
 * - Supported systems (those with adapters/bridges)
 * - Installed systems (queried from Foundry if running)
 * - System status and metadata
 *
 * SECURITY: Owner-only access
 */
export async function GET(request: NextRequest) {
  try {
    // AUTHENTICATION: Require logged-in user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // AUTHORIZATION: Owner-only
    const user = await prismaMain.critUser.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !isOwner(user)) {
      return NextResponse.json(
        { error: 'Forbidden - Owner access required' },
        { status: 403 }
      );
    }

    // Get installed systems from database (if tracked)
    const foundryInstances = await prismaMain.foundryInstance.findMany({
      where: {
        ownerId: user.id,
      },
      select: {
        id: true,
        gameSystem: true,
        installedSystems: true,
        status: true,
        url: true,
      },
    });

    // Build response
    const response = {
      supportedSystems: Object.values(SUPPORTED_SYSTEMS),
      instances: foundryInstances.map((instance) => ({
        id: instance.id,
        gameSystem: instance.gameSystem,
        installedSystems: instance.installedSystems || [],
        status: instance.status,
        url: instance.url,
        supportedSystemsInstalled: (instance.installedSystems || []).filter(
          (sys: string) => Object.keys(SUPPORTED_SYSTEMS).includes(sys)
        ),
      })),
      summary: {
        totalSupported: Object.keys(SUPPORTED_SYSTEMS).length,
        dualSystemSupport: true, // We support both 5e and Cypher
        targetDate: '2026-03-24',
        progress: {
          dnd5e: {
            adapter: 'DnD5eAdapter',
            bridge: 'foundry-cfg-5e',
            status: 'complete',
          },
          cyphersystem: {
            adapter: 'CypherSystemAdapter',
            bridge: 'foundry-cfg-cypher',
            status: 'complete',
          },
        },
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error getting systems:', error);
    return NextResponse.json(
      { error: 'Failed to get systems', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/foundry/systems - Install or configure a game system
 *
 * Body:
 * - systemId: string (dnd5e, cyphersystem)
 * - action: 'install' | 'uninstall' | 'update'
 * - instanceId?: string (optional, specific Foundry instance)
 *
 * SECURITY: Owner-only access
 * NOTE: Actual installation happens in Foundry container via Core Concepts API
 */
export async function POST(request: NextRequest) {
  try {
    // AUTHENTICATION: Require logged-in user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // AUTHORIZATION: Owner-only
    const user = await prismaMain.critUser.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !isOwner(user)) {
      return NextResponse.json(
        { error: 'Forbidden - Owner access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { systemId, action, instanceId } = body;

    // Validate system ID
    if (!systemId || !SUPPORTED_SYSTEMS[systemId as keyof typeof SUPPORTED_SYSTEMS]) {
      return NextResponse.json(
        { error: 'Invalid system ID. Supported: dnd5e, cyphersystem' },
        { status: 400 }
      );
    }

    // Validate action
    if (!action || !['install', 'uninstall', 'update'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Supported: install, uninstall, update' },
        { status: 400 }
      );
    }

    // Get system metadata
    const systemMeta = SUPPORTED_SYSTEMS[systemId as keyof typeof SUPPORTED_SYSTEMS];

    // TODO: Actual installation logic
    // This would communicate with Foundry instance via Core Concepts API
    // For now, return success with metadata

    return NextResponse.json({
      success: true,
      action,
      system: systemMeta,
      message: `${action} requested for ${systemMeta.name}`,
      note: 'Actual installation requires Foundry instance to be running and accessible via Core Concepts API',
    });
  } catch (error: any) {
    console.error('Error managing system:', error);
    return NextResponse.json(
      { error: 'Failed to manage system', details: error.message },
      { status: 500 }
    );
  }
}
