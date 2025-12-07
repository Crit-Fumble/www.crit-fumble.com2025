/**
 * Foundry License Pool Stats API
 *
 * GET /api/admin/foundry/pool - Get pool statistics
 *
 * Admin only endpoint.
 */

import { NextResponse } from 'next/server'
import { requireAdmin, getCoreApiClient } from '@/lib/admin-auth'

export async function GET() {
  // Verify admin access
  const admin = await requireAdmin()
  if (admin instanceof NextResponse) return admin

  // Get Core API client
  const api = getCoreApiClient()
  if (!api) {
    return NextResponse.json(
      { error: 'Core API not configured' },
      { status: 500 }
    )
  }

  try {
    const stats = await api.foundry.getPoolStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error('[admin/foundry/pool] Error fetching pool stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pool stats' },
      { status: 500 }
    )
  }
}
