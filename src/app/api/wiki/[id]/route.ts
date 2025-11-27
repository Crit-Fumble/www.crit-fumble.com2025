import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getUserRole, canEditWiki, canDeleteWiki } from '@/lib/permissions'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/wiki/[id]
 * Get a single wiki page
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
 * Update a wiki page (admins/owners only)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { role } = await getUserRole(session.user.id)
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
        editorId: session.user.id,
        changeNote: changeNote || null,
      },
    })

    // Update page
    const updateData: any = {
      lastEditorId: session.user.id,
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
 * Soft-delete a wiki page (owners only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { role } = await getUserRole(session.user.id)
    if (!canDeleteWiki(role)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const { id } = await params

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
