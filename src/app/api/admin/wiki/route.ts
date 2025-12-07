/**
 * Wiki Admin API
 *
 * POST /api/admin/wiki - Create a new wiki page
 *
 * Admin only endpoint.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, getCoreApiClient } from '@/lib/admin-auth'
import type { CreateWikiPageRequest } from '@crit-fumble/core/types'

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
    const body = (await request.json()) as CreateWikiPageRequest

    // Validate required fields
    if (!body.slug || !body.title || !body.category || !body.content) {
      return NextResponse.json(
        { error: 'Missing required fields: slug, title, category, content' },
        { status: 400 }
      )
    }

    const result = await api.wiki.create(body)
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('[admin/wiki] Error creating page:', error)
    return NextResponse.json(
      { error: 'Failed to create wiki page' },
      { status: 500 }
    )
  }
}
