/**
 * Wiki Admin Page by ID API
 *
 * PUT /api/admin/wiki/[id] - Update a wiki page
 * DELETE /api/admin/wiki/[id] - Delete a wiki page
 *
 * Admin only endpoint.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, getCoreApiClient } from '@/lib/admin-auth'
import type { UpdateWikiPageRequest } from '@crit-fumble/core/types'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
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
    const body = (await request.json()) as UpdateWikiPageRequest

    const result = await api.wiki.update(id, body)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[admin/wiki/[id]] Error updating page:', error)
    return NextResponse.json(
      { error: 'Failed to update wiki page' },
      { status: 500 }
    )
  }
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
    const result = await api.wiki.delete(id)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[admin/wiki/[id]] Error deleting page:', error)
    return NextResponse.json(
      { error: 'Failed to delete wiki page' },
      { status: 500 }
    )
  }
}
