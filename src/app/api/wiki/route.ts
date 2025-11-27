import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getUserRole, canEditWiki } from '@/lib/permissions'

/**
 * GET /api/wiki
 * List all wiki pages (authenticated users only)
 */
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const pages = await prisma.wikiPage.findMany({
      where: { deletedAt: null },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { title: 'asc' }],
      select: {
        id: true,
        slug: true,
        title: true,
        category: true,
        content: true,
        isPublished: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ pages })
  } catch (error) {
    console.error('Error fetching wiki pages:', error)
    return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 })
  }
}

/**
 * POST /api/wiki
 * Create a new wiki page (admins/owners only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { role } = await getUserRole(session.user.id)
    if (!canEditWiki(role)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const body = await request.json()
    const { slug, title, category, content } = body

    if (!slug || !title || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check for duplicate slug
    const existing = await prisma.wikiPage.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: 'A page with this slug already exists' }, { status: 409 })
    }

    const page = await prisma.wikiPage.create({
      data: {
        slug,
        title,
        category,
        content: content || '',
        authorId: session.user.id,
        lastEditorId: session.user.id,
      },
    })

    return NextResponse.json(page, { status: 201 })
  } catch (error) {
    console.error('Error creating wiki page:', error)
    return NextResponse.json({ error: 'Failed to create page' }, { status: 500 })
  }
}
