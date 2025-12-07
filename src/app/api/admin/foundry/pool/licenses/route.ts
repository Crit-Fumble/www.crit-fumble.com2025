/**
 * Foundry License Pool Licenses API
 *
 * GET /api/admin/foundry/pool/licenses - List all pool licenses
 * POST /api/admin/foundry/pool/licenses - Add a license to the pool
 *
 * Admin only endpoint.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, getCoreApiClient } from '@/lib/admin-auth'
import type { AddPoolLicenseRequest } from '@crit-fumble/core/types'

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
    const licenses = await api.foundry.listPoolLicenses()
    return NextResponse.json(licenses)
  } catch (error) {
    console.error('[admin/foundry/pool/licenses] Error listing licenses:', error)
    return NextResponse.json(
      { error: 'Failed to list pool licenses' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
    const body = (await request.json()) as AddPoolLicenseRequest

    // Validate required fields
    if (!body.licenseKey) {
      return NextResponse.json(
        { error: 'License key is required' },
        { status: 400 }
      )
    }

    const result = await api.foundry.addPoolLicense(body)
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('[admin/foundry/pool/licenses] Error adding license:', error)
    return NextResponse.json(
      { error: 'Failed to add license to pool' },
      { status: 500 }
    )
  }
}
