/**
 * Core Concepts API - Web Platform - System Details
 *
 * GET /api/core-concepts/web/systems/[systemId]
 * Returns details for a specific RPG system including mappings
 */

import { NextRequest } from 'next/server'
import {
  validatePlatformAuth,
  getSystemMappings,
  errorResponse,
  successResponse,
} from '@/lib/core-concepts-api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ systemId: string }> }
) {
  // Validate web platform authentication
  const authResult = await validatePlatformAuth(request, 'web')
  if ('error' in authResult) {
    return errorResponse(authResult.error, authResult.status)
  }

  const { systemId } = await params

  try {
    const system = await getSystemMappings(systemId)

    if (!system) {
      return errorResponse('System not found', 404)
    }

    return successResponse({
      system,
      platform: 'web',
    })
  } catch (error) {
    console.error('Error fetching system:', error)
    return errorResponse('Failed to fetch system', 500)
  }
}
