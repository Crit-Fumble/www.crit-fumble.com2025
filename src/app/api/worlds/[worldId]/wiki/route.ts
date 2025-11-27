import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prismaMain } from '@/lib/db';
import { apiRateLimiter, getClientIdentifier, getIpAddress, checkRateLimit } from '@/lib/rate-limit';

/**
 * GET /api/worlds/[worldId]/wiki
 *
 * List wiki pages for a world
 *
 * @security Requires authentication
 * @ratelimit 200 requests/minute
 *
 * @queryparam category - Filter by category (optional)
 * @queryparam published - Filter by published status (optional)
 * @queryparam search - Search in title and content (optional)
 *
 * @returns {RpgWorldWiki[]} List of wiki pages
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ worldId: string }> }
) {
  try {
    // RATE LIMITING: 200 requests/minute for reads
    const ip = getIpAddress(request);
    const session = await auth();
    const rateLimitResult = await checkRateLimit(
      apiRateLimiter,
      getClientIdentifier(session?.user?.id, ip)
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: rateLimitResult.msBeforeNext
        },
        { status: 429 }
      );
    }

    const { worldId } = await params;
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const category = searchParams.get('category');
    const publishedParam = searchParams.get('published');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {
      worldId,
      deletedAt: null
    };

    if (category) {
      where.category = category;
    }

    if (publishedParam !== null) {
      where.isPublished = publishedParam === 'true';
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Check permissions
    // Public: can only see published, public pages
    // Authenticated: can see published pages if in campaign
    // Owner: can see all pages

    const world = await prismaMain.rpgWorld.findUnique({
      where: { id: worldId },
      select: { ownerId: true }
    });

    if (!world) {
      return NextResponse.json(
        { error: 'World not found' },
        { status: 404 }
      );
    }

    const isOwner = session?.user?.id === world.ownerId;

    // Non-owners can only see published pages
    if (!isOwner) {
      where.isPublished = true;

      // If not authenticated, only show public pages
      if (!session?.user?.id) {
        where.isPublic = true;
      }
    }

    // Fetch wiki pages
    const pages = await prismaMain.rpgWorldWiki.findMany({
      where,
      select: {
        id: true,
        slug: true,
        title: true,
        category: true,
        icon: true,
        sortOrder: true,
        description: true,
        isPublished: true,
        isPublic: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true
          }
        },
        lastEditedBy: {
          select: {
            id: true,
            username: true,
            avatarUrl: true
          }
        },
        // Don't include full content in list view
        // Content will be fetched individually
      },
      orderBy: [
        { sortOrder: 'asc' },
        { title: 'asc' }
      ]
    });

    return NextResponse.json({
      pages,
      total: pages.length
    });
  } catch (error) {
    console.error('[WIKI_LIST_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch wiki pages' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/worlds/[worldId]/wiki
 *
 * Create a new wiki page
 *
 * @security Requires authentication and world ownership
 * @ratelimit 100 requests/minute
 *
 * @body {string} slug - URL-friendly identifier
 * @body {string} title - Page title
 * @body {string} content - Main content (markdown)
 * @body {string} category - Category (optional)
 * @body {string} gmContent - GM-only content (optional)
 * @body {string} playerContent - Player-visible content (optional)
 * @body {boolean} isPublished - Published status (default: false)
 * @body {boolean} isPublic - Public visibility (default: false)
 *
 * @returns {RpgWorldWiki} The created wiki page
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ worldId: string }> }
) {
  try {
    // RATE LIMITING: 100 requests/minute for writes
    const session = await auth();
    const ip = getIpAddress(request);
    const rateLimitResult = await checkRateLimit(
      apiRateLimiter,
      getClientIdentifier(session?.user?.id, ip)
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: rateLimitResult.msBeforeNext
        },
        { status: 429 }
      );
    }

    // AUTHENTICATION: Require logged-in user
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { worldId } = await params;
    const body = await request.json();

    // Validate required fields
    if (!body.slug || !body.title || !body.content) {
      return NextResponse.json(
        { error: 'Missing required fields: slug, title, content' },
        { status: 400 }
      );
    }

    // AUTHORIZATION: Check world ownership
    const world = await prismaMain.rpgWorld.findUnique({
      where: { id: worldId },
      select: { ownerId: true }
    });

    if (!world) {
      return NextResponse.json(
        { error: 'World not found' },
        { status: 404 }
      );
    }

    if (world.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - Only world owner can create wiki pages' },
        { status: 403 }
      );
    }

    // Check if slug already exists in this world
    const existing = await prismaMain.rpgWorldWiki.findUnique({
      where: {
        worldId_slug: {
          worldId,
          slug: body.slug
        }
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A page with this slug already exists in this world' },
        { status: 409 }
      );
    }

    // Create wiki page
    const wikiPage = await prismaMain.rpgWorldWiki.create({
      data: {
        worldId,
        slug: body.slug,
        title: body.title,
        content: body.content,
        category: body.category || null,
        icon: body.icon || null,
        sortOrder: body.sortOrder || 0,
        description: body.description || null,
        gmContent: body.gmContent || null,
        playerContent: body.playerContent || null,
        isPublished: body.isPublished || false,
        isPublic: body.isPublic || false,
        publishedAt: body.isPublished ? new Date() : null,
        authorId: session.user.id,
        metadata: body.metadata || {}
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true
          }
        }
      }
    });

    // Create initial revision
    await prismaMain.rpgWorldWikiRevision.create({
      data: {
        wikiPageId: wikiPage.id,
        versionNumber: 1,
        changeNote: 'Initial version',
        content: body.content,
        gmContent: body.gmContent || null,
        playerContent: body.playerContent || null,
        editorId: session.user.id,
        aiAssisted: body.aiAssisted || false,
        aiModel: body.aiModel || null,
        aiPromptMetadata: body.aiPromptMetadata || {}
      }
    });

    return NextResponse.json({
      success: true,
      wikiPage
    }, { status: 201 });
  } catch (error) {
    console.error('[WIKI_CREATE_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to create wiki page' },
      { status: 500 }
    );
  }
}
