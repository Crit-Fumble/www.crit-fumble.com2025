import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prismaMain } from '@/lib/db';
import { apiRateLimiter, getClientIdentifier, getIpAddress, checkRateLimit } from '@/lib/rate-limit';

/**
 * GET /api/worlds/[worldId]/wiki/[slug]
 *
 * Retrieve a single wiki page by slug
 *
 * @security Requires authentication for unpublished pages
 * @ratelimit 200 requests/minute
 *
 * @returns {RpgWorldWiki} The wiki page with full content
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ worldId: string; slug: string }> }
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

    const { worldId, slug } = await params;

    // Find the wiki page
    const wikiPage = await prismaMain.rpgWorldWiki.findUnique({
      where: {
        worldId_slug: {
          worldId,
          slug
        },
        deletedAt: null
      },
      include: {
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
        world: {
          select: {
            id: true,
            name: true,
            ownerId: true
          }
        }
      }
    });

    if (!wikiPage) {
      return NextResponse.json(
        { error: 'Wiki page not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const isOwner = session?.user?.id === wikiPage.world.ownerId;
    const isAuthenticated = !!session?.user?.id;

    // Non-owners can only see published pages
    if (!isOwner && !wikiPage.isPublished) {
      return NextResponse.json(
        { error: 'Wiki page not found' },
        { status: 404 }
      );
    }

    // Unauthenticated users can only see public pages
    if (!isAuthenticated && !wikiPage.isPublic) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Filter content based on permissions
    const response: any = {
      id: wikiPage.id,
      slug: wikiPage.slug,
      title: wikiPage.title,
      category: wikiPage.category,
      icon: wikiPage.icon,
      sortOrder: wikiPage.sortOrder,
      description: wikiPage.description,
      content: wikiPage.content,
      isPublished: wikiPage.isPublished,
      isPublic: wikiPage.isPublic,
      publishedAt: wikiPage.publishedAt,
      createdAt: wikiPage.createdAt,
      updatedAt: wikiPage.updatedAt,
      author: wikiPage.author,
      lastEditedBy: wikiPage.lastEditedBy,
      metadata: wikiPage.metadata
    };

    // Only include GM content for owners
    if (isOwner) {
      response.gmContent = wikiPage.gmContent;
    }

    // Include player content if exists
    if (wikiPage.playerContent) {
      response.playerContent = wikiPage.playerContent;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('[WIKI_GET_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch wiki page' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/worlds/[worldId]/wiki/[slug]
 *
 * Update a wiki page
 *
 * @security Requires authentication and world ownership
 * @ratelimit 100 requests/minute
 *
 * @body {string} title - Page title (optional)
 * @body {string} content - Main content (optional)
 * @body {string} category - Category (optional)
 * @body {string} gmContent - GM-only content (optional)
 * @body {string} playerContent - Player-visible content (optional)
 * @body {boolean} isPublished - Published status (optional)
 * @body {boolean} isPublic - Public visibility (optional)
 * @body {string} changeNote - Description of changes for revision history
 *
 * @returns {RpgWorldWiki} The updated wiki page
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ worldId: string; slug: string }> }
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

    const { worldId, slug } = await params;
    const body = await request.json();

    // Find the wiki page with world owner info
    const existingPage = await prismaMain.rpgWorldWiki.findUnique({
      where: {
        worldId_slug: {
          worldId,
          slug
        },
        deletedAt: null
      },
      include: {
        world: {
          select: {
            ownerId: true
          }
        },
        revisions: {
          orderBy: {
            versionNumber: 'desc'
          },
          take: 1,
          select: {
            versionNumber: true
          }
        }
      }
    });

    if (!existingPage) {
      return NextResponse.json(
        { error: 'Wiki page not found' },
        { status: 404 }
      );
    }

    // AUTHORIZATION: Check world ownership
    if (existingPage.world.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - Only world owner can update wiki pages' },
        { status: 403 }
      );
    }

    // Build update data
    const updateData: any = {
      lastEditedById: session.user.id
    };

    if (body.title !== undefined) {
      updateData.title = body.title;
    }

    if (body.content !== undefined) {
      updateData.content = body.content;
    }

    if (body.category !== undefined) {
      updateData.category = body.category;
    }

    if (body.icon !== undefined) {
      updateData.icon = body.icon;
    }

    if (body.sortOrder !== undefined) {
      updateData.sortOrder = body.sortOrder;
    }

    if (body.description !== undefined) {
      updateData.description = body.description;
    }

    if (body.gmContent !== undefined) {
      updateData.gmContent = body.gmContent;
    }

    if (body.playerContent !== undefined) {
      updateData.playerContent = body.playerContent;
    }

    if (body.isPublished !== undefined) {
      updateData.isPublished = body.isPublished;
      // Set publishedAt timestamp if being published for the first time
      if (body.isPublished && !existingPage.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    if (body.isPublic !== undefined) {
      updateData.isPublic = body.isPublic;
    }

    if (body.metadata !== undefined) {
      updateData.metadata = body.metadata;
    }

    // Update the wiki page
    const wikiPage = await prismaMain.rpgWorldWiki.update({
      where: {
        worldId_slug: {
          worldId,
          slug
        }
      },
      data: updateData,
      include: {
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
        }
      }
    });

    // Create revision if content changed
    if (body.content !== undefined || body.gmContent !== undefined || body.playerContent !== undefined) {
      const latestVersion = existingPage.revisions[0]?.versionNumber || 0;

      await prismaMain.rpgWorldWikiRevision.create({
        data: {
          wikiPageId: wikiPage.id,
          versionNumber: latestVersion + 1,
          changeNote: body.changeNote || 'Updated content',
          content: body.content !== undefined ? body.content : existingPage.content,
          gmContent: body.gmContent !== undefined ? body.gmContent : existingPage.gmContent,
          playerContent: body.playerContent !== undefined ? body.playerContent : existingPage.playerContent,
          editorId: session.user.id,
          aiAssisted: body.aiAssisted || false,
          aiModel: body.aiModel || null,
          aiPromptMetadata: body.aiPromptMetadata || {}
        }
      });
    }

    return NextResponse.json({
      success: true,
      wikiPage
    });
  } catch (error) {
    console.error('[WIKI_UPDATE_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to update wiki page' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/worlds/[worldId]/wiki/[slug]
 *
 * Soft delete a wiki page
 *
 * @security Requires authentication and world ownership
 * @ratelimit 100 requests/minute
 *
 * @returns {success: boolean} Deletion confirmation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ worldId: string; slug: string }> }
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

    const { worldId, slug } = await params;

    // Find the wiki page with world owner info
    const existingPage = await prismaMain.rpgWorldWiki.findUnique({
      where: {
        worldId_slug: {
          worldId,
          slug
        },
        deletedAt: null
      },
      include: {
        world: {
          select: {
            ownerId: true
          }
        }
      }
    });

    if (!existingPage) {
      return NextResponse.json(
        { error: 'Wiki page not found' },
        { status: 404 }
      );
    }

    // AUTHORIZATION: Check world ownership
    if (existingPage.world.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - Only world owner can delete wiki pages' },
        { status: 403 }
      );
    }

    // Soft delete the wiki page
    await prismaMain.rpgWorldWiki.update({
      where: {
        worldId_slug: {
          worldId,
          slug
        }
      },
      data: {
        deletedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Wiki page deleted successfully'
    });
  } catch (error) {
    console.error('[WIKI_DELETE_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to delete wiki page' },
      { status: 500 }
    );
  }
}
