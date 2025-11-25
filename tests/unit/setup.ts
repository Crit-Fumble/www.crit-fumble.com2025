import { vi } from 'vitest';

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

// Create a mock Prisma client
export const createMockPrisma = () => ({
  critUser: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  rpgPlayer: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  critCoinTransaction: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    aggregate: vi.fn(),
  },
  storyCreditTransaction: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    aggregate: vi.fn(),
  },
  foundryWorldSnapshot: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  rpgCampaign: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  rpgWorld: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  $transaction: vi.fn((callback) => callback(createMockPrisma())),
});

export const prismaMock = createMockPrisma();

// Mock the db-main module
vi.mock('@/packages/cfg-lib/db-main', () => ({
  prismaMain: prismaMock,
  default: prismaMock,
}));

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});
