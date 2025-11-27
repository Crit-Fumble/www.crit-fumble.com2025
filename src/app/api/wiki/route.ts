/**
 * Core Concepts Wiki API Route
 * Owner-only write operations, public read for published pages
 *
 * SECURITY: GET is public (rate limited), POST is owner-only
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prismaMain } from '@/lib/db'
import { isOwner } from '@/lib/admin'
import { apiRateLimiter, getClientIdentifier, getIpAddress, checkRateLimit } from '@/lib/rate-limit'

/**
 * GET /api/wiki
 * List all wiki pages (published for non-admins, all for owner)
 *
 * SECURITY: Public read with rate limiting
 */
export async function GET(request: NextRequest) {
  try {
    // RATE LIMITING: 200 requests/minute for public reads
    const ip = getIpAddress(request);
    const rateLimitResult = await checkRateLimit(
      apiRateLimiter,
      getClientIdentifier(undefined, ip)
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: { 'Retry-After': rateLimitResult.retryAfter.toString() }
        }
      );
    }
    const session = await auth()
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const published = searchParams.get('published')

    const where: any = {
      deletedAt: null,
    }

    // Filter by category if specified
    if (category) {
      where.category = category
    }

    // Non-owners can only see published pages
    const user = session?.user ? await prismaMain.critUser.findUnique({
      where: { id: session.user.id },
    }) : null

    const userIsOwner = user && isOwner(user)

    if (!userIsOwner) {
      where.isPublished = true
    } else if (published) {
      where.isPublished = published === 'true'
    }

    const pages = await prismaMain.coreConceptWiki.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
        lastEditedBy: {
          select: {
            id: true,
            username: true,
          },
        },
        _count: {
          select: {
            revisions: true,
          },
        },
      },
      orderBy: [
        { category: 'asc' },
        { sortOrder: 'asc' },
        { title: 'asc' },
      ],
    })

    return NextResponse.json({ pages })
  } catch (error) {
    console.error('Wiki API GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wiki pages', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * POST /api/wiki
 * Create a new wiki page (owner only)
 *
 * SECURITY: Owner-only access with rate limiting
 */
export async function POST(request: NextRequest) {
  try {
    // RATE LIMITING: 100 requests/minute for writes
    const ip = getIpAddress(request);
    const rateLimitResult = await checkRateLimit(
      apiRateLimiter,
      getClientIdentifier(undefined, ip)
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: { 'Retry-After': rateLimitResult.retryAfter.toString() }
        }
      );
    }

    // AUTHENTICATION: Require logged-in user
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // AUTHORIZATION: Owner-only
    const user = await prismaMain.critUser.findUnique({
      where: { id: session.user.id },
    })

    if (!user || !isOwner(user)) {
      return NextResponse.json({ error: 'Forbidden - Owner access required' }, { status: 403 })
    }

    const body = await request.json()
    const {
      slug,
      title,
      category,
      icon,
      sortOrder = 0,
      gmContent,
      playerContent,
      builderContent,
      description,
      keywords,
      isPublished = false,
      aiAssisted = false,
      aiModel,
      aiPromptMetadata = {},
    } = body

    // Validate required fields
    if (!slug || !title || !category || !gmContent || !playerContent || !builderContent) {
      return NextResponse.json(
        { error: 'Missing required fields: slug, title, category, gmContent, playerContent, builderContent' },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const existing = await prismaMain.coreConceptWiki.findUnique({
      where: { slug },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A wiki page with this slug already exists' },
        { status: 409 }
      )
    }

    // Create wiki page and initial revision in a transaction
    const page = await prismaMain.$transaction(async (tx) => {
      const newPage = await tx.coreConceptWiki.create({
        data: {
          slug,
          title,
          category,
          icon,
          sortOrder,
          gmContent,
          playerContent,
          builderContent,
          description,
          keywords,
          isPublished,
          publishedAt: isPublished ? new Date() : null,
          authorId: session.user.id!,
          lastEditedById: session.user.id!,
          aiAssisted,
          aiModel,
          aiPromptMetadata,
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
            },
          },
          lastEditedBy: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      })

      // Create initial revision
      await tx.coreConceptWikiRevision.create({
        data: {
          wikiPageId: newPage.id,
          versionNumber: 1,
          changeNote: 'Initial version',
          gmContent,
          playerContent,
          builderContent,
          editorId: session.user.id!,
          aiAssisted,
          aiModel,
          aiPromptMetadata,
        },
      })

      return newPage
    })

    return NextResponse.json({ page }, { status: 201 })
  } catch (error) {
    console.error('Wiki API POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create wiki page', details: String(error) },
      { status: 500 }
    )
  }
}
