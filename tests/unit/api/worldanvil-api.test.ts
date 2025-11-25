/**
 * Unit tests for World Anvil API routes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    critUser: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/packages/worldanvil/client/WorldAnvilPlaywrightClient', () => ({
  WorldAnvilPlaywrightClient: vi.fn().mockImplementation(() => ({
    getIdentity: vi.fn(),
    destroy: vi.fn(),
  })),
}));

describe('World Anvil API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.WORLD_ANVIL_CLIENT_SECRET = 'test-app-key';
  });

  describe('POST /api/linked-accounts/worldanvil/link', () => {
    it('should reject unauthenticated requests', async () => {
      const { auth } = await import('@/lib/auth');
      vi.mocked(auth).mockResolvedValue(null);

      const { POST } = await import('@/app/api/linked-accounts/worldanvil/link/route');
      const request = new NextRequest('http://localhost:3000/api/linked-accounts/worldanvil/link', {
        method: 'POST',
        body: JSON.stringify({ userToken: 'test-token' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should reject requests without userToken', async () => {
      const { auth } = await import('@/lib/auth');
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-123' },
      } as any);

      const { POST } = await import('@/app/api/linked-accounts/worldanvil/link/route');
      const request = new NextRequest('http://localhost:3000/api/linked-accounts/worldanvil/link', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('User API token is required');
    });

    it('should reject if WORLD_ANVIL_CLIENT_SECRET is not configured', async () => {
      delete process.env.WORLD_ANVIL_CLIENT_SECRET;

      const { auth } = await import('@/lib/auth');
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-123' },
      } as any);

      const { POST } = await import('@/app/api/linked-accounts/worldanvil/link/route');
      const request = new NextRequest('http://localhost:3000/api/linked-accounts/worldanvil/link', {
        method: 'POST',
        body: JSON.stringify({ userToken: 'test-token' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('not configured');
    });

    it('should reject invalid World Anvil tokens', async () => {
      const { auth } = await import('@/lib/auth');
      const { WorldAnvilPlaywrightClient } = await import('@/packages/worldanvil/client/WorldAnvilPlaywrightClient');

      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-123' },
      } as any);

      const mockClient = {
        getIdentity: vi.fn().mockRejectedValue(new Error('Invalid token')),
        destroy: vi.fn(),
      };
      vi.mocked(WorldAnvilPlaywrightClient).mockImplementation(() => mockClient as any);

      const { POST } = await import('@/app/api/linked-accounts/worldanvil/link/route');
      const request = new NextRequest('http://localhost:3000/api/linked-accounts/worldanvil/link', {
        method: 'POST',
        body: JSON.stringify({ userToken: 'invalid-token' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid World Anvil token');
      expect(mockClient.destroy).toHaveBeenCalled();
    });

    it('should reject if World Anvil account is already linked to another user', async () => {
      const { auth } = await import('@/lib/auth');
      const { prisma } = await import('@/lib/prisma');
      const { WorldAnvilPlaywrightClient } = await import('@/packages/worldanvil/client/WorldAnvilPlaywrightClient');

      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-123' },
      } as any);

      const mockClient = {
        getIdentity: vi.fn().mockResolvedValue({
          id: 'wa-user-456',
          username: 'testuser',
        }),
        destroy: vi.fn(),
      };
      vi.mocked(WorldAnvilPlaywrightClient).mockImplementation(() => mockClient as any);

      // Mock existing link to different user
      vi.mocked(prisma.critUser.findFirst).mockResolvedValue({
        id: 'different-user',
      } as any);

      const { POST } = await import('@/app/api/linked-accounts/worldanvil/link/route');
      const request = new NextRequest('http://localhost:3000/api/linked-accounts/worldanvil/link', {
        method: 'POST',
        body: JSON.stringify({ userToken: 'valid-token' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toContain('already linked to another user');
    });

    it('should successfully link World Anvil account', async () => {
      const { auth } = await import('@/lib/auth');
      const { prisma } = await import('@/lib/prisma');
      const { WorldAnvilPlaywrightClient } = await import('@/packages/worldanvil/client/WorldAnvilPlaywrightClient');

      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-123' },
      } as any);

      const mockClient = {
        getIdentity: vi.fn().mockResolvedValue({
          id: 'wa-user-456',
          username: 'testuser',
        }),
        destroy: vi.fn(),
      };
      vi.mocked(WorldAnvilPlaywrightClient).mockImplementation(() => mockClient as any);

      // No existing link
      vi.mocked(prisma.critUser.findFirst).mockResolvedValue(null);

      // Mock successful update
      vi.mocked(prisma.critUser.update).mockResolvedValue({
        id: 'user-123',
        worldAnvilId: 'wa-user-456',
        worldAnvilUsername: 'testuser',
      } as any);

      const { POST } = await import('@/app/api/linked-accounts/worldanvil/link/route');
      const request = new NextRequest('http://localhost:3000/api/linked-accounts/worldanvil/link', {
        method: 'POST',
        body: JSON.stringify({ userToken: 'valid-token' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.worldAnvil.id).toBe('wa-user-456');
      expect(data.worldAnvil.username).toBe('testuser');
      expect(mockClient.destroy).toHaveBeenCalled();
    });
  });

  describe('POST /api/linked-accounts/worldanvil/unlink', () => {
    it('should reject unauthenticated requests', async () => {
      const { auth } = await import('@/lib/auth');
      vi.mocked(auth).mockResolvedValue(null);

      const { POST } = await import('@/app/api/linked-accounts/worldanvil/unlink/route');
      const request = new NextRequest('http://localhost:3000/api/linked-accounts/worldanvil/unlink', {
        method: 'POST',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should successfully unlink World Anvil account', async () => {
      const { auth } = await import('@/lib/auth');
      const { prisma } = await import('@/lib/prisma');

      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-123' },
      } as any);

      vi.mocked(prisma.critUser.update).mockResolvedValue({} as any);

      const { POST } = await import('@/app/api/linked-accounts/worldanvil/unlink/route');
      const request = new NextRequest('http://localhost:3000/api/linked-accounts/worldanvil/unlink', {
        method: 'POST',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      expect(prisma.critUser.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          worldAnvilId: null,
          worldAnvilUsername: null,
          worldAnvilToken: null,
          worldAnvilRefreshToken: null,
          worldAnvilTokenExpires: null,
        },
      });
    });
  });
});
