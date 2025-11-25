/**
 * Unit tests for WorldAnvilPlaywrightClient
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WorldAnvilPlaywrightClient } from '@/packages/worldanvil/client/WorldAnvilPlaywrightClient';
import axios from 'axios';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Mock Playwright
vi.mock('playwright', () => ({
  chromium: {
    launch: vi.fn(() => Promise.resolve({
      newContext: vi.fn(() => Promise.resolve({
        newPage: vi.fn(() => Promise.resolve({
          evaluate: vi.fn(),
        })),
      })),
      close: vi.fn(),
    })),
  },
}));

describe('WorldAnvilPlaywrightClient', () => {
  let client: WorldAnvilPlaywrightClient;
  const mockApiKey = 'test-api-key';
  const mockAuthToken = 'test-auth-token';

  beforeEach(() => {
    vi.clearAllMocks();
    client = new WorldAnvilPlaywrightClient({
      apiKey: mockApiKey,
      authToken: mockAuthToken,
    });
  });

  afterEach(async () => {
    await client.destroy();
  });

  describe('constructor', () => {
    it('should initialize with provided config', () => {
      expect(client).toBeDefined();
    });

    it('should use default API URL if not provided', () => {
      const defaultClient = new WorldAnvilPlaywrightClient({
        apiKey: mockApiKey,
        authToken: mockAuthToken,
      });
      expect(defaultClient).toBeDefined();
    });

    it('should accept custom API URL', () => {
      const customClient = new WorldAnvilPlaywrightClient({
        apiUrl: 'https://custom.example.com/api',
        apiKey: mockApiKey,
        authToken: mockAuthToken,
      });
      expect(customClient).toBeDefined();
    });
  });

  describe('get method - standard HTTP request', () => {
    it('should successfully make standard HTTP request when not blocked', async () => {
      const mockResponse = {
        data: { id: '123', username: 'testuser', success: true },
      };

      mockedAxios.get = vi.fn().mockResolvedValue(mockResponse);

      const result = await client.get('/identity');

      expect(result).toEqual(mockResponse.data);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://www.worldanvil.com/api/external/boromir/identity',
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-application-key': mockApiKey,
            'x-auth-token': mockAuthToken,
          }),
        })
      );
    });

    it('should include User-Agent header in request', async () => {
      const mockResponse = { data: { success: true } };
      mockedAxios.get = vi.fn().mockResolvedValue(mockResponse);

      await client.get('/identity');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': expect.stringContaining('Crit-Fumble'),
          }),
        })
      );
    });
  });

  describe('Cloudflare detection', () => {
    it('should detect Cloudflare challenge and fall back to Playwright', async () => {
      const cloudflareError: any = new Error('Request failed');
      cloudflareError.response = {
        status: 403,
        data: '<html>Just a moment...</html>',
      };

      mockedAxios.get = vi.fn().mockRejectedValue(cloudflareError);

      // Mock Playwright response
      const { chromium } = await import('playwright');
      const mockBrowser = await chromium.launch();
      const mockContext = await mockBrowser.newContext();
      const mockPage = await mockContext.newPage();

      (mockPage.evaluate as any).mockResolvedValue({
        success: true,
        status: 200,
        body: JSON.stringify({ id: '123', username: 'testuser', success: true }),
      });

      const result = await client.get('/identity');

      expect(result).toEqual({ id: '123', username: 'testuser', success: true });
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should throw error if not a Cloudflare challenge', async () => {
      const normalError: any = new Error('Network error');
      normalError.response = {
        status: 500,
        data: 'Internal server error',
      };

      mockedAxios.get = vi.fn().mockRejectedValue(normalError);

      await expect(client.get('/identity')).rejects.toThrow('Network error');
    });
  });

  describe('convenience methods', () => {
    beforeEach(() => {
      mockedAxios.get = vi.fn().mockResolvedValue({
        data: { id: '123', username: 'testuser', success: true },
      });
    });

    it('should call /identity endpoint for getIdentity', async () => {
      await client.getIdentity();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://www.worldanvil.com/api/external/boromir/identity',
        expect.any(Object)
      );
    });

    it('should call /user endpoint for getCurrentUser', async () => {
      await client.getCurrentUser();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://www.worldanvil.com/api/external/boromir/user',
        expect.any(Object)
      );
    });

    it('should call /user/worlds endpoint for getMyWorlds', async () => {
      await client.getMyWorlds();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://www.worldanvil.com/api/external/boromir/user/worlds',
        expect.any(Object)
      );
    });

    it('should call /world/:id endpoint for getWorldById', async () => {
      await client.getWorldById('world-123');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://www.worldanvil.com/api/external/boromir/world/world-123',
        expect.any(Object)
      );
    });
  });

  describe('session management', () => {
    it('should reuse Playwright session for multiple requests', async () => {
      const cloudflareError: any = new Error('Request failed');
      cloudflareError.response = {
        status: 403,
        data: '<html>Just a moment...</html>',
      };

      mockedAxios.get = vi.fn().mockRejectedValue(cloudflareError);

      const { chromium } = await import('playwright');
      const mockBrowser = await chromium.launch();

      (mockBrowser.newContext as any).mockClear();

      // Make multiple requests
      await client.get('/identity').catch(() => {});
      await client.get('/identity').catch(() => {});

      // Should only create one browser context
      expect(mockBrowser.newContext).toHaveBeenCalledTimes(1);
    });

    it('should close Playwright session on destroy', async () => {
      const { chromium } = await import('playwright');
      const mockBrowser = await chromium.launch();

      await client.destroy();

      expect(mockBrowser.close).toHaveBeenCalled();
    });
  });
});
