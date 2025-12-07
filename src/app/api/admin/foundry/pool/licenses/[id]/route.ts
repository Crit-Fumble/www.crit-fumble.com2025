/**
 * Foundry License Pool License by ID API
 *
 * DELETE /api/admin/foundry/pool/licenses/[id] - Remove a license from the pool
 *
 * Admin only endpoint.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, getCoreApiClient } from '@/lib/admin-auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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
    const { id } = await params
    const result = await api.foundry.removePoolLicense(id)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[admin/foundry/pool/licenses/[id]] Error removing license:', error)
    return NextResponse.json(
      { error: 'Failed to remove license from pool' },
      { status: 500 }
    )
  }
}
