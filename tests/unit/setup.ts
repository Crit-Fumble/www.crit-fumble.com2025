import { vi, beforeEach } from 'vitest';

// Mock Next.js server module
vi.mock('next/server', () => ({
  NextRequest: class NextRequest {
    url: string;
    method: string;
    headers: Map<string, string>;

    constructor(url: string, init?: any) {
      this.url = url;
      this.method = init?.method || 'GET';
      this.headers = new Map();
    }

    json() {
      return Promise.resolve({});
    }
  },
  NextResponse: {
    json: (data: any, init?: any) => ({
      status: init?.status || 200,
      json: () => Promise.resolve(data),
    }),
  },
}));

// Create a mock Prisma client for the simplified wiki schema
export const createMockPrisma = () => ({
  user: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
  account: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
  session: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
  verificationToken: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
  wikiPage: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  wikiPageRevision: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
  },
  $transaction: vi.fn((callback) => callback(createMockPrisma())),
});

export const prismaMock = createMockPrisma();

// Mock the db module
vi.mock('@/lib/db', () => ({
  prisma: prismaMock,
  default: prismaMock,
}));

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});
