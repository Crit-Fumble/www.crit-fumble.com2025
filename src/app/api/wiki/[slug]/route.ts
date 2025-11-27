/**
 * Core Concepts Wiki Single Page API Route
 * Get, update, or delete individual wiki pages
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prismaMain } from '@/lib/db'
import { isAdmin } from '@/lib/admin'

/**
 * GET /api/wiki/[slug]
 * Get a single wiki page by slug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth()
    const { slug } = await params

    const page = await prismaMain.coreConceptWiki.findUnique({
      where: { slug, deletedAt: null },
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
        revisions: {
          orderBy: { versionNumber: 'desc' },
          take: 10,
          include: {
            editor: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
    })

    if (!page) {
      return NextResponse.json({ error: 'Wiki page not found' }, { status: 404 })
    }

    // Check if user can view unpublished pages
    if (!page.isPublished) {
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const user = await prismaMain.critUser.findUnique({
        where: { id: session.user.id },
      })

      if (!user || !isAdmin(user)) {
        return NextResponse.json({ error: 'Forbidden - Page not published' }, { status: 403 })
      }
    }

    return NextResponse.json({ page })
  } catch (error) {
    console.error('Wiki API GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wiki page', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/wiki/[slug]
 * Update a wiki page (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin status
    const user = await prismaMain.critUser.findUnique({
      where: { id: session.user.id },
    })

    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const { slug } = await params
    const body = await request.json()

    // Find the existing page
    const existing = await prismaMain.coreConceptWiki.findUnique({
      where: { slug, deletedAt: null },
      include: {
        revisions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Wiki page not found' }, { status: 404 })
    }

    const {
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
      changeNote = 'Updated content',
      aiAssisted = false,
      aiModel,
      aiPromptMetadata = {},
    } = body

    // Check if content has changed
    const contentChanged =
      gmContent !== existing.gmContent ||
      playerContent !== existing.playerContent ||
      builderContent !== existing.builderContent

    // Update page and create revision in a transaction
    const page = await prismaMain.$transaction(async (tx) => {
      const updated = await tx.coreConceptWiki.update({
        where: { id: existing.id },
        data: {
          ...(title && { title }),
          ...(category && { category }),
          ...(icon !== undefined && { icon }),
          ...(sortOrder !== undefined && { sortOrder }),
          ...(gmContent && { gmContent }),
          ...(playerContent && { playerContent }),
          ...(builderContent && { builderContent }),
          ...(description !== undefined && { description }),
          ...(keywords !== undefined && { keywords }),
          ...(isPublished !== undefined && {
            isPublished,
            publishedAt: isPublished ? (existing.publishedAt || new Date()) : null,
          }),
          lastEditedById: session.user.id!,
          ...(aiAssisted && { aiAssisted, aiModel, aiPromptMetadata }),
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

      // Create a new revision if content changed
      if (contentChanged) {
        const lastVersion = existing.revisions[0]?.versionNumber || 0
        await tx.coreConceptWikiRevision.create({
          data: {
            wikiPageId: existing.id,
            versionNumber: lastVersion + 1,
            changeNote,
            gmContent: gmContent || existing.gmContent,
            playerContent: playerContent || existing.playerContent,
            builderContent: builderContent || existing.builderContent,
            editorId: session.user.id!,
            aiAssisted,
            aiModel,
            aiPromptMetadata,
          },
        })
      }

      return updated
    })

    return NextResponse.json({ page })
  } catch (error) {
    console.error('Wiki API PATCH error:', error)
    return NextResponse.json(
      { error: 'Failed to update wiki page', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/wiki/[slug]
 * Soft delete a wiki page (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin status
    const user = await prismaMain.critUser.findUnique({
      where: { id: session.user.id },
    })

    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const { slug } = await params

    // Soft delete the page
    const page = await prismaMain.coreConceptWiki.update({
      where: { slug },
      data: {
        deletedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, page })
  } catch (error) {
    console.error('Wiki API DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete wiki page', details: String(error) },
      { status: 500 }
    )
  }
}
