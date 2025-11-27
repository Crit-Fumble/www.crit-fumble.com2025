/**
 * Foundry VTT Management API Route
 * Vercel endpoint that proxies authenticated requests to the DigitalOcean management API
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import type {
  StartContainerRequest,
  StartContainerResponse,
  StopContainerRequest,
  StopContainerResponse,
  StatusResponse,
  FoundryEnvironment
} from '@crit-fumble/foundryvtt-server';

/**
 * POST /api/foundry/manage
 * Manage Foundry VTT instances (start, stop, status, restart)
 */
export async function POST(request: NextRequest) {
  // Authenticate user
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    // Validate action
    const validActions = ['start', 'stop', 'status', 'restart'];
    if (!action || !validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    // Determine environment from Vercel deployment
    const isProduction = process.env.VERCEL_ENV === 'production';
    const environment: FoundryEnvironment = isProduction ? 'production' : 'staging';

    // Get environment-specific management secret
    const managementSecret = isProduction
      ? process.env.FOUNDRY_MANAGEMENT_SECRET_PROD
      : process.env.FOUNDRY_MANAGEMENT_SECRET_STAGING;

    if (!managementSecret) {
      console.error(`[FOUNDRY] Missing management secret for ${environment} environment`);
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Get droplet API URL
    const dropletIP = process.env.FOUNDRY_DROPLET_IP;
    if (!dropletIP) {
      console.error('[FOUNDRY] Missing FOUNDRY_DROPLET_IP environment variable');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const apiUrl = `https://${dropletIP}/api/instances/${action}`;

    // Prepare request body for management API
    const requestBody: Partial<StartContainerRequest | StopContainerRequest> = {
      ...body,
      environment,
      ownerId: session.user.id
    };

    // Remove 'action' from body as it's in the URL
    delete (requestBody as any).action;

    // Validate license key is present for start action
    if (action === 'start' && !(requestBody as any).licenseKey) {
      return NextResponse.json(
        { error: 'License key is required to start a Foundry instance' },
        { status: 400 }
      );
    }

    console.log(`[FOUNDRY] ${environment.toUpperCase()} - ${action} request for user ${session.user.id}`);

    // Call DigitalOcean management API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${managementSecret}`,
        'X-Environment': environment,
        'Content-Type': 'application/json',
        'User-Agent': 'Vercel-Foundry-Proxy/1.0'
      },
      body: JSON.stringify(requestBody)
    });

    // Parse response
    const data = await response.json();

    // Forward response status and data
    if (!response.ok) {
      console.error(`[FOUNDRY] Management API error:`, data);
      return NextResponse.json(data, { status: response.status });
    }

    console.log(`[FOUNDRY] ${environment.toUpperCase()} - ${action} completed successfully`);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[FOUNDRY] Error calling management API:', error);

    return NextResponse.json(
      {
        error: 'Failed to communicate with Foundry management API',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/foundry/manage/health
 * Check health of the management API (no authentication required)
 */
export async function GET() {
  try {
    const dropletIP = process.env.FOUNDRY_DROPLET_IP;
    if (!dropletIP) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const response = await fetch(`http://${dropletIP}:3001/health`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Vercel-Foundry-Proxy/1.0'
      }
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[FOUNDRY] Health check failed:', error);
    return NextResponse.json(
      {
        error: 'Management API health check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    );
  }
}
