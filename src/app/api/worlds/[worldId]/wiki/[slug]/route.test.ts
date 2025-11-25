import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, PATCH, DELETE } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limit';

// Mock dependencies
vi.mock('@/lib/auth');
vi.mock('@/lib/db', () => ({
  prisma: {
    rpgWorldWiki: {
      findUnique: vi.fn(),
      update: vi.fn()
    },
    rpgWorldWikiRevision: {
      create: vi.fn()
    }
  }
}));
vi.mock('@/lib/rate-limit');

describe('/api/worlds/[worldId]/wiki/[slug] - GET', () => {
  const mockWorldId = 'world-123';
  const mockSlug = 'test-page';
  const mockUserId = 'user-123';
  const mockOwnerId = 'owner-123';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkRateLimit).mockResolvedValue({ success: true, msBeforeNext: 0 });
  });

  it('should return 429 if rate limit exceeded', async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ success: false, msBeforeNext: 5000 });

    const request = new NextRequest(`http://localhost/api/worlds/${mockWorldId}/wiki/${mockSlug}`);
    const response = await GET(request, { params: { worldId: mockWorldId, slug: mockSlug } });

    expect(response.status).toBe(429);
    const data = await response.json();
    expect(data.error).toBe('Rate limit exceeded');
  });

  it('should return 404 if wiki page not found', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: mockUserId } } as any);
    vi.mocked(prisma.rpgWorldWiki.findUnique).mockResolvedValue(null);

    const request = new NextRequest(`http://localhost/api/worlds/${mockWorldId}/wiki/${mockSlug}`);
    const response = await GET(request, { params: { worldId: mockWorldId, slug: mockSlug } });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('Wiki page not found');
  });

  it('should return 404 if page is unpublished and user is not owner', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: mockUserId } } as any);
    vi.mocked(prisma.rpgWorldWiki.findUnique).mockResolvedValue({
      id: 'page-123',
      slug: mockSlug,
      isPublished: false,
      isPublic: false,
      world: {
        id: mockWorldId,
        name: 'Test World',
        ownerId: mockOwnerId
      }
    } as any);

    const request = new NextRequest(`http://localhost/api/worlds/${mockWorldId}/wiki/${mockSlug}`);
    const response = await GET(request, { params: { worldId: mockWorldId, slug: mockSlug } });

    expect(response.status).toBe(404);
  });

  it('should return 401 if page is not public and user is not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null);
    vi.mocked(prisma.rpgWorldWiki.findUnique).mockResolvedValue({
      id: 'page-123',
      slug: mockSlug,
      isPublished: true,
      isPublic: false,
      world: {
        id: mockWorldId,
        name: 'Test World',
        ownerId: mockOwnerId
      }
    } as any);

    const request = new NextRequest(`http://localhost/api/worlds/${mockWorldId}/wiki/${mockSlug}`);
    const response = await GET(request, { params: { worldId: mockWorldId, slug: mockSlug } });

    expect(response.status).toBe(401);
  });

  it('should return wiki page with full content for owner', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: mockOwnerId } } as any);

    const mockWikiPage = {
      id: 'page-123',
      slug: mockSlug,
      title: 'Test Page',
      category: 'lore',
      icon: '📖',
      sortOrder: 0,
      description: 'Test description',
      content: 'Main content',
      gmContent: 'Secret GM notes',
      playerContent: null,
      isPublished: true,
      isPublic: false,
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {},
      author: {
        id: mockOwnerId,
        username: 'owner',
        avatarUrl: null
      },
      lastEditedBy: null,
      world: {
        id: mockWorldId,
        name: 'Test World',
        ownerId: mockOwnerId
      }
    };

    vi.mocked(prisma.rpgWorldWiki.findUnique).mockResolvedValue(mockWikiPage as any);

    const request = new NextRequest(`http://localhost/api/worlds/${mockWorldId}/wiki/${mockSlug}`);
    const response = await GET(request, { params: { worldId: mockWorldId, slug: mockSlug } });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.slug).toBe(mockSlug);
    expect(data.content).toBe('Main content');
    expect(data.gmContent).toBe('Secret GM notes'); // Owner sees GM content
  });

  it('should not return gmContent for non-owners', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: mockUserId } } as any);

    const mockWikiPage = {
      id: 'page-123',
      slug: mockSlug,
      title: 'Test Page',
      content: 'Main content',
      gmContent: 'Secret GM notes',
      playerContent: 'Player notes',
      isPublished: true,
      isPublic: false,
      world: {
        id: mockWorldId,
        name: 'Test World',
        ownerId: mockOwnerId
      },
      author: { id: mockOwnerId, username: 'owner', avatarUrl: null },
      lastEditedBy: null,
      category: null,
      icon: null,
      sortOrder: 0,
      description: null,
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {}
    };

    vi.mocked(prisma.rpgWorldWiki.findUnique).mockResolvedValue(mockWikiPage as any);

    const request = new NextRequest(`http://localhost/api/worlds/${mockWorldId}/wiki/${mockSlug}`);
    const response = await GET(request, { params: { worldId: mockWorldId, slug: mockSlug } });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.content).toBe('Main content');
    expect(data.gmContent).toBeUndefined(); // Non-owner doesn't see GM content
    expect(data.playerContent).toBe('Player notes');
  });
});

describe('/api/worlds/[worldId]/wiki/[slug] - PATCH', () => {
  const mockWorldId = 'world-123';
  const mockSlug = 'test-page';
  const mockUserId = 'user-123';
  const mockOwnerId = 'owner-123';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkRateLimit).mockResolvedValue({ success: true, msBeforeNext: 0 });
  });

  it('should return 401 if not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const request = new NextRequest(`http://localhost/api/worlds/${mockWorldId}/wiki/${mockSlug}`, {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated Title' })
    });
    const response = await PATCH(request, { params: { worldId: mockWorldId, slug: mockSlug } });

    expect(response.status).toBe(401);
  });

  it('should return 404 if wiki page not found', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: mockOwnerId } } as any);
    vi.mocked(prisma.rpgWorldWiki.findUnique).mockResolvedValue(null);

    const request = new NextRequest(`http://localhost/api/worlds/${mockWorldId}/wiki/${mockSlug}`, {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated Title' })
    });
    const response = await PATCH(request, { params: { worldId: mockWorldId, slug: mockSlug } });

    expect(response.status).toBe(404);
  });

  it('should return 403 if user is not world owner', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: mockUserId } } as any);
    vi.mocked(prisma.rpgWorldWiki.findUnique).mockResolvedValue({
      id: 'page-123',
      slug: mockSlug,
      world: {
        ownerId: mockOwnerId
      },
      revisions: []
    } as any);

    const request = new NextRequest(`http://localhost/api/worlds/${mockWorldId}/wiki/${mockSlug}`, {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated Title' })
    });
    const response = await PATCH(request, { params: { worldId: mockWorldId, slug: mockSlug } });

    expect(response.status).toBe(403);
  });

  it('should update wiki page successfully', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: mockOwnerId } } as any);

    const existingPage = {
      id: 'page-123',
      slug: mockSlug,
      title: 'Old Title',
      content: 'Old content',
      publishedAt: null,
      world: {
        ownerId: mockOwnerId
      },
      revisions: [{ versionNumber: 1 }]
    };

    vi.mocked(prisma.rpgWorldWiki.findUnique).mockResolvedValue(existingPage as any);

    const updatedPage = {
      id: 'page-123',
      slug: mockSlug,
      title: 'Updated Title',
      content: 'Old content',
      author: { id: mockOwnerId, username: 'owner', avatarUrl: null },
      lastEditedBy: { id: mockOwnerId, username: 'owner', avatarUrl: null }
    };

    vi.mocked(prisma.rpgWorldWiki.update).mockResolvedValue(updatedPage as any);

    const request = new NextRequest(`http://localhost/api/worlds/${mockWorldId}/wiki/${mockSlug}`, {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated Title' })
    });
    const response = await PATCH(request, { params: { worldId: mockWorldId, slug: mockSlug } });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.wikiPage.title).toBe('Updated Title');
  });

  it('should set publishedAt when publishing for the first time', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: mockOwnerId } } as any);

    const existingPage = {
      id: 'page-123',
      slug: mockSlug,
      publishedAt: null,
      world: {
        ownerId: mockOwnerId
      },
      revisions: [{ versionNumber: 1 }]
    };

    vi.mocked(prisma.rpgWorldWiki.findUnique).mockResolvedValue(existingPage as any);
    vi.mocked(prisma.rpgWorldWiki.update).mockResolvedValue({} as any);

    const request = new NextRequest(`http://localhost/api/worlds/${mockWorldId}/wiki/${mockSlug}`, {
      method: 'PATCH',
      body: JSON.stringify({ isPublished: true })
    });
    await PATCH(request, { params: { worldId: mockWorldId, slug: mockSlug } });

    const updateCall = vi.mocked(prisma.rpgWorldWiki.update).mock.calls[0][0];
    expect(updateCall.data.isPublished).toBe(true);
    expect(updateCall.data.publishedAt).toBeInstanceOf(Date);
  });

  it('should create revision when content changes', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: mockOwnerId } } as any);

    const existingPage = {
      id: 'page-123',
      slug: mockSlug,
      content: 'Old content',
      gmContent: null,
      playerContent: null,
      world: {
        ownerId: mockOwnerId
      },
      revisions: [{ versionNumber: 2 }]
    };

    vi.mocked(prisma.rpgWorldWiki.findUnique).mockResolvedValue(existingPage as any);
    vi.mocked(prisma.rpgWorldWiki.update).mockResolvedValue({} as any);
    vi.mocked(prisma.rpgWorldWikiRevision.create).mockResolvedValue({} as any);

    const request = new NextRequest(`http://localhost/api/worlds/${mockWorldId}/wiki/${mockSlug}`, {
      method: 'PATCH',
      body: JSON.stringify({
        content: 'Updated content',
        changeNote: 'Fixed typos'
      })
    });
    await PATCH(request, { params: { worldId: mockWorldId, slug: mockSlug } });

    expect(prisma.rpgWorldWikiRevision.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          wikiPageId: 'page-123',
          versionNumber: 3, // Incremented from latest version (2)
          changeNote: 'Fixed typos',
          content: 'Updated content'
        })
      })
    );
  });

  it('should not create revision when only metadata changes', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: mockOwnerId } } as any);

    const existingPage = {
      id: 'page-123',
      slug: mockSlug,
      world: {
        ownerId: mockOwnerId
      },
      revisions: [{ versionNumber: 1 }]
    };

    vi.mocked(prisma.rpgWorldWiki.findUnique).mockResolvedValue(existingPage as any);
    vi.mocked(prisma.rpgWorldWiki.update).mockResolvedValue({} as any);

    const request = new NextRequest(`http://localhost/api/worlds/${mockWorldId}/wiki/${mockSlug}`, {
      method: 'PATCH',
      body: JSON.stringify({
        title: 'Updated Title',
        category: 'npcs'
      })
    });
    await PATCH(request, { params: { worldId: mockWorldId, slug: mockSlug } });

    // Revision should NOT be created (no content changes)
    expect(prisma.rpgWorldWikiRevision.create).not.toHaveBeenCalled();
  });
});

describe('/api/worlds/[worldId]/wiki/[slug] - DELETE', () => {
  const mockWorldId = 'world-123';
  const mockSlug = 'test-page';
  const mockUserId = 'user-123';
  const mockOwnerId = 'owner-123';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkRateLimit).mockResolvedValue({ success: true, msBeforeNext: 0 });
  });

  it('should return 401 if not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const request = new NextRequest(`http://localhost/api/worlds/${mockWorldId}/wiki/${mockSlug}`, {
      method: 'DELETE'
    });
    const response = await DELETE(request, { params: { worldId: mockWorldId, slug: mockSlug } });

    expect(response.status).toBe(401);
  });

  it('should return 404 if wiki page not found', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: mockOwnerId } } as any);
    vi.mocked(prisma.rpgWorldWiki.findUnique).mockResolvedValue(null);

    const request = new NextRequest(`http://localhost/api/worlds/${mockWorldId}/wiki/${mockSlug}`, {
      method: 'DELETE'
    });
    const response = await DELETE(request, { params: { worldId: mockWorldId, slug: mockSlug } });

    expect(response.status).toBe(404);
  });

  it('should return 403 if user is not world owner', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: mockUserId } } as any);
    vi.mocked(prisma.rpgWorldWiki.findUnique).mockResolvedValue({
      id: 'page-123',
      slug: mockSlug,
      world: {
        ownerId: mockOwnerId
      }
    } as any);

    const request = new NextRequest(`http://localhost/api/worlds/${mockWorldId}/wiki/${mockSlug}`, {
      method: 'DELETE'
    });
    const response = await DELETE(request, { params: { worldId: mockWorldId, slug: mockSlug } });

    expect(response.status).toBe(403);
  });

  it('should soft delete wiki page successfully', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: mockOwnerId } } as any);
    vi.mocked(prisma.rpgWorldWiki.findUnique).mockResolvedValue({
      id: 'page-123',
      slug: mockSlug,
      world: {
        ownerId: mockOwnerId
      }
    } as any);
    vi.mocked(prisma.rpgWorldWiki.update).mockResolvedValue({} as any);

    const request = new NextRequest(`http://localhost/api/worlds/${mockWorldId}/wiki/${mockSlug}`, {
      method: 'DELETE'
    });
    const response = await DELETE(request, { params: { worldId: mockWorldId, slug: mockSlug } });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);

    // Verify soft delete (deletedAt set, not hard delete)
    expect(prisma.rpgWorldWiki.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          worldId_slug: {
            worldId: mockWorldId,
            slug: mockSlug
          }
        },
        data: {
          deletedAt: expect.any(Date)
        }
      })
    );
  });
});
