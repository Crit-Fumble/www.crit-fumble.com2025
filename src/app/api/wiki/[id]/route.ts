import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getUserRole, canEditWiki, canDeleteWiki } from '@/lib/permissions'
import { verifyBotAuth, getBotServiceAccountId } from '@/lib/bot-auth'
import { apiRateLimiter, checkRateLimit, getClientIdentifier, getIpAddress } from '@/lib/rate-limit'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/wiki/[id]
 * Get a single wiki page (authenticated users or bot)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Check bot auth first
    const botAuth = verifyBotAuth(request)

    if (!botAuth) {
      const session = await auth()
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const { id } = await params

    const page = await prisma.wikiPage.findUnique({
      where: { id, deletedAt: null },
      include: {
        author: { select: { name: true } },
        lastEditor: { select: { name: true } },
      },
    })

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    return NextResponse.json(page)
  } catch (error) {
    console.error('Error fetching wiki page:', error)
    return NextResponse.json({ error: 'Failed to fetch page' }, { status: 500 })
  }
}

/**
 * PATCH /api/wiki/[id]
 * Update a wiki page (admins/owners or bot)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Rate limit write operations
    const ip = getIpAddress(request)
    const identifier = getClientIdentifier(undefined, ip)
    const rateLimitResult = await checkRateLimit(apiRateLimiter, identifier)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rateLimitResult.retryAfter) } }
      )
    }

    let editorId: string
    let role: 'owner' | 'admin' | 'user'

    // Check bot auth first
    const botAuth = verifyBotAuth(request)

    if (botAuth) {
      editorId = await getBotServiceAccountId(botAuth.discordId)
      role = botAuth.role
    } else {
      const session = await auth()
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const userRole = await getUserRole(session.user.id)
      role = userRole.role
      editorId = session.user.id
    }

    if (!canEditWiki(role)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { title, content, category, isPublished, changeNote } = body

    // Get current page for revision history
    const currentPage = await prisma.wikiPage.findUnique({
      where: { id, deletedAt: null },
    })

    if (!currentPage) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    // Create revision before updating
    await prisma.wikiPageRevision.create({
      data: {
        pageId: id,
        title: currentPage.title,
        content: currentPage.content,
        editorId,
        changeNote: changeNote || null,
      },
    })

    // Update page
    const updateData: any = {
      lastEditorId: editorId,
    }

    if (title !== undefined) updateData.title = title
    if (content !== undefined) updateData.content = content
    if (category !== undefined) updateData.category = category
    if (isPublished !== undefined) {
      updateData.isPublished = isPublished
      if (isPublished && !currentPage.publishedAt) {
        updateData.publishedAt = new Date()
      }
    }

    const page = await prisma.wikiPage.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(page)
  } catch (error) {
    console.error('Error updating wiki page:', error)
    return NextResponse.json({ error: 'Failed to update page' }, { status: 500 })
  }
}

/**
 * DELETE /api/wiki/[id]
 * Soft-delete a wiki page
 * - Owners can delete any page
 * - Authors can delete their own pages
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Rate limit delete operations
    const ip = getIpAddress(request)
    const identifier = getClientIdentifier(undefined, ip)
    const rateLimitResult = await checkRateLimit(apiRateLimiter, identifier)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rateLimitResult.retryAfter) } }
      )
    }

    let userId: string
    let role: 'owner' | 'admin' | 'user'

    // Check bot auth first
    const botAuth = verifyBotAuth(request)

    if (botAuth) {
      userId = await getBotServiceAccountId(botAuth.discordId)
      role = botAuth.role
    } else {
      const session = await auth()
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const userRole = await getUserRole(session.user.id)
      role = userRole.role
      userId = session.user.id
    }

    const { id } = await params

    // Get the page to check ownership
    const page = await prisma.wikiPage.findUnique({
      where: { id, deletedAt: null },
      select: { authorId: true },
    })

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    // Allow delete if: owner role OR author of the page
    const isOwner = canDeleteWiki(role)
    const isAuthor = page.authorId === userId

    if (!isOwner && !isAuthor) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Soft delete
    await prisma.wikiPage.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting wiki page:', error)
    return NextResponse.json({ error: 'Failed to delete page' }, { status: 500 })
  }
}
