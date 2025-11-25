import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limit';

// Mock dependencies
vi.mock('@/lib/auth');
vi.mock('@/lib/db', () => ({
  prisma: {
    rpgWorld: {
      findUnique: vi.fn()
    },
    rpgWorldWiki: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn()
    },
    rpgWorldWikiRevision: {
      create: vi.fn()
    }
  }
}));
vi.mock('@/lib/rate-limit');

describe('/api/worlds/[worldId]/wiki - GET', () => {
  const mockWorldId = 'world-123';
  const mockUserId = 'user-123';
  const mockOwnerId = 'owner-123';

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: rate limit passes
    vi.mocked(checkRateLimit).mockResolvedValue({ success: true, msBeforeNext: 0 });
  });

  it('should return 429 if rate limit exceeded', async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ success: false, msBeforeNext: 5000 });

    const request = new NextRequest(`http://localhost/api/worlds/${mockWorldId}/wiki`);
    const response = await GET(request, { params: { worldId: mockWorldId } });

    expect(response.status).toBe(429);
    const data = await response.json();
    expect(data.error).toBe('Rate limit exceeded');
    expect(data.retryAfter).toBe(5000);
  });

  it('should return 404 if world not found', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: mockUserId } } as any);
    vi.mocked(prisma.rpgWorld.findUnique).mockResolvedValue(null);

    const request = new NextRequest(`http://localhost/api/worlds/${mockWorldId}/wiki`);
    const response = await GET(request, { params: { worldId: mockWorldId } });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('World not found');
  });

  it('should return all pages for world owner', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: mockOwnerId } } as any);
    vi.mocked(prisma.rpgWorld.findUnique).mockResolvedValue({
      id: mockWorldId,
      ownerId: mockOwnerId
    } as any);

    const mockPages = [
      {
        id: 'page-1',
        slug: 'test-page',
        title: 'Test Page',
        category: 'lore',
        icon: '📖',
        sortOrder: 0,
        description: 'Test description',
        isPublished: false,
        isPublic: false,
        publishedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {
          id: mockOwnerId,
          username: 'owner',
          avatarUrl: null
        },
        lastEditedBy: null
      }
    ];

    vi.mocked(prisma.rpgWorldWiki.findMany).mockResolvedValue(mockPages as any);

    const request = new NextRequest(`http://localhost/api/worlds/${mockWorldId}/wiki`);
    const response = await GET(request, { params: { worldId: mockWorldId } });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.pages).toHaveLength(1);
    expect(data.pages[0].slug).toBe('test-page');
    expect(data.total).toBe(1);
  });

  it('should filter unpublished pages for non-owners', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: mockUserId } } as any);
    vi.mocked(prisma.rpgWorld.findUnique).mockResolvedValue({
      id: mockWorldId,
      ownerId: mockOwnerId
    } as any);

    const mockPages = [
      {
        id: 'page-1',
        slug: 'published-page',
        title: 'Published Page',
        isPublished: true,
        isPublic: false
      }
    ];

    vi.mocked(prisma.rpgWorldWiki.findMany).mockResolvedValue(mockPages as any);

    const request = new NextRequest(`http://localhost/api/worlds/${mockWorldId}/wiki`);
    const response = await GET(request, { params: { worldId: mockWorldId } });

    expect(response.status).toBe(200);

    // Verify the where clause includes isPublished: true
    const findManyCall = vi.mocked(prisma.rpgWorldWiki.findMany).mock.calls[0][0];
    expect(findManyCall.where.isPublished).toBe(true);
  });

  it('should filter non-public pages for unauthenticated users', async () => {
    vi.mocked(auth).mockResolvedValue(null);
    vi.mocked(prisma.rpgWorld.findUnique).mockResolvedValue({
      id: mockWorldId,
      ownerId: mockOwnerId
    } as any);

    const mockPages = [
      {
        id: 'page-1',
        slug: 'public-page',
        title: 'Public Page',
        isPublished: true,
        isPublic: true
      }
    ];

    vi.mocked(prisma.rpgWorldWiki.findMany).mockResolvedValue(mockPages as any);

    const request = new NextRequest(`http://localhost/api/worlds/${mockWorldId}/wiki`);
    const response = await GET(request, { params: { worldId: mockWorldId } });

    expect(response.status).toBe(200);

    // Verify the where clause includes both isPublished and isPublic
    const findManyCall = vi.mocked(prisma.rpgWorldWiki.findMany).mock.calls[0][0];
    expect(findManyCall.where.isPublished).toBe(true);
    expect(findManyCall.where.isPublic).toBe(true);
  });

  it('should filter by category query parameter', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: mockOwnerId } } as any);
    vi.mocked(prisma.rpgWorld.findUnique).mockResolvedValue({
      id: mockWorldId,
      ownerId: mockOwnerId
    } as any);
    vi.mocked(prisma.rpgWorldWiki.findMany).mockResolvedValue([]);

    const request = new NextRequest(`http://localhost/api/worlds/${mockWorldId}/wiki?category=lore`);
    await GET(request, { params: { worldId: mockWorldId } });

    const findManyCall = vi.mocked(prisma.rpgWorldWiki.findMany).mock.calls[0][0];
    expect(findManyCall.where.category).toBe('lore');
  });

  it('should filter by search query parameter', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: mockOwnerId } } as any);
    vi.mocked(prisma.rpgWorld.findUnique).mockResolvedValue({
      id: mockWorldId,
      ownerId: mockOwnerId
    } as any);
    vi.mocked(prisma.rpgWorldWiki.findMany).mockResolvedValue([]);

    const request = new NextRequest(`http://localhost/api/worlds/${mockWorldId}/wiki?search=dragon`);
    await GET(request, { params: { worldId: mockWorldId } });

    const findManyCall = vi.mocked(prisma.rpgWorldWiki.findMany).mock.calls[0][0];
    expect(findManyCall.where.OR).toBeDefined();
    expect(findManyCall.where.OR).toHaveLength(2);
  });
});

describe('/api/worlds/[worldId]/wiki - POST', () => {
  const mockWorldId = 'world-123';
  const mockUserId = 'user-123';
  const mockOwnerId = 'owner-123';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkRateLimit).mockResolvedValue({ success: true, msBeforeNext: 0 });
  });

  it('should return 401 if not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const request = new NextRequest(`http://localhost/api/worlds/${mockWorldId}/wiki`, {
      method: 'POST',
      body: JSON.stringify({
        slug: 'test-page',
        title: 'Test Page',
        content: 'Test content'
      })
    });
    const response = await POST(request, { params: { worldId: mockWorldId } });

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 if missing required fields', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: mockUserId } } as any);

    const request = new NextRequest(`http://localhost/api/worlds/${mockWorldId}/wiki`, {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Page'
        // Missing slug and content
      })
    });
    const response = await POST(request, { params: { worldId: mockWorldId } });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('Missing required fields');
  });

  it('should return 404 if world not found', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: mockUserId } } as any);
    vi.mocked(prisma.rpgWorld.findUnique).mockResolvedValue(null);

    const request = new NextRequest(`http://localhost/api/worlds/${mockWorldId}/wiki`, {
      method: 'POST',
      body: JSON.stringify({
        slug: 'test-page',
        title: 'Test Page',
        content: 'Test content'
      })
    });
    const response = await POST(request, { params: { worldId: mockWorldId } });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('World not found');
  });

  it('should return 403 if user is not world owner', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: mockUserId } } as any);
    vi.mocked(prisma.rpgWorld.findUnique).mockResolvedValue({
      id: mockWorldId,
      ownerId: mockOwnerId
    } as any);

    const request = new NextRequest(`http://localhost/api/worlds/${mockWorldId}/wiki`, {
      method: 'POST',
      body: JSON.stringify({
        slug: 'test-page',
        title: 'Test Page',
        content: 'Test content'
      })
    });
    const response = await POST(request, { params: { worldId: mockWorldId } });

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toContain('Only world owner');
  });

  it('should return 409 if slug already exists', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: mockOwnerId } } as any);
    vi.mocked(prisma.rpgWorld.findUnique).mockResolvedValue({
      id: mockWorldId,
      ownerId: mockOwnerId
    } as any);
    vi.mocked(prisma.rpgWorldWiki.findUnique).mockResolvedValue({
      id: 'existing-page',
      slug: 'test-page'
    } as any);

    const request = new NextRequest(`http://localhost/api/worlds/${mockWorldId}/wiki`, {
      method: 'POST',
      body: JSON.stringify({
        slug: 'test-page',
        title: 'Test Page',
        content: 'Test content'
      })
    });
    const response = await POST(request, { params: { worldId: mockWorldId } });

    expect(response.status).toBe(409);
    const data = await response.json();
    expect(data.error).toContain('already exists');
  });

  it('should create wiki page and revision successfully', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: mockOwnerId } } as any);
    vi.mocked(prisma.rpgWorld.findUnique).mockResolvedValue({
      id: mockWorldId,
      ownerId: mockOwnerId
    } as any);
    vi.mocked(prisma.rpgWorldWiki.findUnique).mockResolvedValue(null); // Slug doesn't exist

    const mockWikiPage = {
      id: 'page-123',
      slug: 'test-page',
      title: 'Test Page',
      content: 'Test content',
      author: {
        id: mockOwnerId,
        username: 'owner',
        avatarUrl: null
      }
    };

    vi.mocked(prisma.rpgWorldWiki.create).mockResolvedValue(mockWikiPage as any);
    vi.mocked(prisma.rpgWorldWikiRevision.create).mockResolvedValue({} as any);

    const request = new NextRequest(`http://localhost/api/worlds/${mockWorldId}/wiki`, {
      method: 'POST',
      body: JSON.stringify({
        slug: 'test-page',
        title: 'Test Page',
        content: 'Test content',
        category: 'lore',
        isPublished: true
      })
    });
    const response = await POST(request, { params: { worldId: mockWorldId } });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.wikiPage.slug).toBe('test-page');

    // Verify revision was created
    expect(prisma.rpgWorldWikiRevision.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          wikiPageId: 'page-123',
          versionNumber: 1,
          changeNote: 'Initial version'
        })
      })
    );
  });

  it('should handle AI-assisted content metadata', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: mockOwnerId } } as any);
    vi.mocked(prisma.rpgWorld.findUnique).mockResolvedValue({
      id: mockWorldId,
      ownerId: mockOwnerId
    } as any);
    vi.mocked(prisma.rpgWorldWiki.findUnique).mockResolvedValue(null);

    const mockWikiPage = {
      id: 'page-123',
      slug: 'ai-generated',
      title: 'AI Generated Page',
      content: 'AI content',
      author: { id: mockOwnerId, username: 'owner', avatarUrl: null }
    };

    vi.mocked(prisma.rpgWorldWiki.create).mockResolvedValue(mockWikiPage as any);
    vi.mocked(prisma.rpgWorldWikiRevision.create).mockResolvedValue({} as any);

    const request = new NextRequest(`http://localhost/api/worlds/${mockWorldId}/wiki`, {
      method: 'POST',
      body: JSON.stringify({
        slug: 'ai-generated',
        title: 'AI Generated Page',
        content: 'AI content',
        aiAssisted: true,
        aiModel: 'claude-3-5-sonnet',
        aiPromptMetadata: { prompt: 'Generate lore for dragon kingdom' }
      })
    });
    await POST(request, { params: { worldId: mockWorldId } });

    // Verify AI metadata was passed to revision
    expect(prisma.rpgWorldWikiRevision.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          aiAssisted: true,
          aiModel: 'claude-3-5-sonnet',
          aiPromptMetadata: { prompt: 'Generate lore for dragon kingdom' }
        })
      })
    );
  });
});
