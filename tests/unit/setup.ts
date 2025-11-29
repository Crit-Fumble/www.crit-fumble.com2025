import { vi, beforeEach } from 'vitest'

// Mock Next.js server module
vi.mock('next/server', () => ({
  NextRequest: class NextRequest {
    url: string
    method: string
    headers: Map<string, string>

    constructor(url: string, init?: { method?: string }) {
      this.url = url
      this.method = init?.method || 'GET'
      this.headers = new Map()
    }

    json() {
      return Promise.resolve({})
    }
  },
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) => ({
      status: init?.status || 200,
      json: () => Promise.resolve(data),
    }),
  },
}))

// Mock auth module - can be configured per test
export const mockAuth = vi.fn()

vi.mock('@/lib/auth', () => ({
  auth: mockAuth,
}))

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
  mockAuth.mockResolvedValue(null)
})
