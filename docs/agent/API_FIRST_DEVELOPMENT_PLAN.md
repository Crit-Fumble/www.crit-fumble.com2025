# API-First Development Plan
**Core Concepts + FoundryVTT Integration**

**Date**: November 24, 2025
**Approach**: Build API + Unit Tests → Then Iterate on UI
**Timeline**: 3 months (December 2024 - February 2025)

---

## 🎯 Development Philosophy

**User Quote**: "let's focus on the API and unit test as we go, then iterate on the UI"

**Benefits of API-First Approach**:
1. ✅ **Testable** - APIs are easier to test than UI
2. ✅ **Flexible** - UI can change without breaking backend
3. ✅ **Documented** - API serves as clear contract
4. ✅ **Parallel Work** - Backend and frontend can be developed separately
5. ✅ **Integration Ready** - Third-party tools can integrate via API

---

## 📋 Priority Order

### Phase 1: FoundryVTT Integration (Weeks 1-4)
**Why First?** Foundry is the most complex integration with existing infrastructure needs.

1. **Complete Foundry Sync API** (`/api/foundry/sync`)
2. **Test Asset Mirroring** (`/api/foundry/assets/mirror`)
3. **Add Automated Snapshots** (enhance `/api/foundry/snapshot`)
4. **Write Unit Tests** for all Foundry routes

### Phase 2: Asset Management (Weeks 5-8)
**Why Second?** Assets are the foundation for tiles, boards, and everything else.

1. **Asset Upload API** (`/api/assets/upload`)
2. **Asset Search/Filter API** (`/api/assets`)
3. **Asset License Tracking** (enhance existing `/api/rpg/assets`)
4. **Write Unit Tests** for asset routes

### Phase 3: Tile System (Weeks 9-12)
**Why Third?** Tiles depend on assets, and are needed for boards.

1. **Tile Creation API** (`/api/tiles`)
2. **Tile Library API** (search, filter, categorize)
3. **Multi-Scale Asset Assignment API**
4. **Write Unit Tests** for tile routes

### Phase 4: Board & Card System (If Time Permits)
**Why Last?** Less critical for MVP, can be deferred.

1. **Board Creation API** (`/api/boards`)
2. **Card System API** (`/api/cards`, `/api/decks`)
3. **Write Unit Tests** for board/card routes

---

## 🔧 Week 1-4: FoundryVTT API Completion

### Week 1: Foundry Sync API

**Goal**: Fully implement `/api/foundry/sync` to pull data from Foundry → Crit-Fumble

**Current Status**:
- ⚠️ Route exists but stubbed
- ✅ Owner-only security in place
- ✅ Rate limiting enabled
- ❌ No actual Foundry API calls

**Tasks**:

**1. Foundry API Client** (Day 1-2)
```typescript
// src/lib/foundry-client.ts

export class FoundryClient {
  constructor(private apiUrl: string, private apiKey: string) {}

  // Core API methods
  async getActors() { /* ... */ }
  async getItems() { /* ... */ }
  async getScenes() { /* ... */ }
  async getJournalEntries() { /* ... */ }
  async getWorldInfo() { /* ... */ }
}
```

**Unit Tests**:
```typescript
// tests/unit/foundry-client.test.ts

describe('FoundryClient', () => {
  it('should fetch actors from Foundry API', async () => {
    // Mock HTTP response
    // Call getActors()
    // Assert correct data returned
  });

  it('should handle API errors gracefully', async () => {
    // Mock error response
    // Expect error handling
  });

  it('should use correct authentication headers', async () => {
    // Verify API key sent correctly
  });
});
```

**2. Data Transformation** (Day 3-4)
```typescript
// src/lib/foundry-transform.ts

export function transformFoundryActor(foundryActor: any): Prisma.RpgCharacterCreateInput {
  return {
    name: foundryActor.name,
    // ... map Foundry fields to our schema
  };
}

export function transformFoundryItem(foundryItem: any): Prisma.RpgAssetCreateInput {
  // ... transformation logic
}

export function transformFoundryScene(foundryScene: any): Prisma.RpgBoardCreateInput {
  // ... transformation logic
}
```

**Unit Tests**:
```typescript
// tests/unit/foundry-transform.test.ts

describe('transformFoundryActor', () => {
  it('should map all Foundry actor fields correctly', () => {
    const mockFoundryActor = { /* ... */ };
    const result = transformFoundryActor(mockFoundryActor);
    expect(result.name).toBe(mockFoundryActor.name);
    // ... assert all fields
  });

  it('should handle missing optional fields', () => {
    // Test with minimal data
  });
});
```

**3. Sync Implementation** (Day 5)
```typescript
// src/app/api/foundry/sync/route.ts

export async function POST(request: NextRequest) {
  // ... existing security checks ...

  const { foundryInstanceId, syncType } = await request.json();

  // Get Foundry instance
  const instance = await prisma.foundryInstance.findUnique({
    where: { id: foundryInstanceId }
  });

  // Create Foundry client
  const client = new FoundryClient(instance.apiUrl, instance.apiKey);

  // Sync based on type
  switch (syncType) {
    case 'actors':
      const actors = await client.getActors();
      await syncActors(actors);
      break;
    case 'items':
      const items = await client.getItems();
      await syncItems(items);
      break;
    case 'scenes':
      const scenes = await client.getScenes();
      await syncScenes(scenes);
      break;
    case 'all':
      // Sync everything
      break;
  }

  return NextResponse.json({ success: true });
}
```

**Integration Tests**:
```typescript
// tests/integration/foundry-sync.test.ts

describe('POST /api/foundry/sync', () => {
  it('should sync actors from Foundry', async () => {
    // Setup mock Foundry server
    // Create test instance in DB
    // Call sync API
    // Assert actors created in DB
  });

  it('should handle sync errors gracefully', async () => {
    // Mock Foundry API error
    // Expect graceful error handling
  });

  it('should require owner permissions', async () => {
    // Test with non-owner user
    // Expect 403
  });
});
```

---

### Week 2: Asset Mirroring Enhancement

**Goal**: Fully test and enhance `/api/foundry/assets/mirror`

**Current Status**:
- ⚠️ Route exists but needs testing
- ✅ Vercel Blob upload works
- ❌ No bulk mirroring
- ❌ No conflict resolution

**Tasks**:

**1. Bulk Asset Mirroring** (Day 1-2)
```typescript
// src/app/api/foundry/assets/mirror-bulk/route.ts

export async function POST(request: NextRequest) {
  // ... security checks ...

  const { foundryInstanceId } = await request.json();

  // Get all Foundry assets
  const foundryAssets = await getFoundryAssets(foundryInstanceId);

  // Mirror each asset
  const results = await Promise.all(
    foundryAssets.map(asset => mirrorAsset(asset))
  );

  return NextResponse.json({
    mirrored: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results
  });
}
```

**Unit Tests**:
```typescript
// tests/unit/asset-mirror.test.ts

describe('mirrorAsset', () => {
  it('should upload asset to Vercel Blob', async () => {
    // Mock asset data
    // Call mirrorAsset()
    // Assert Blob upload called
  });

  it('should handle upload failures', async () => {
    // Mock upload error
    // Expect error handling
  });

  it('should skip already mirrored assets', async () => {
    // Asset already exists
    // Should not re-upload
  });
});
```

**2. Conflict Resolution** (Day 3)
```typescript
// src/lib/asset-conflict-resolver.ts

export enum ConflictStrategy {
  SKIP = 'skip',           // Keep existing
  OVERWRITE = 'overwrite', // Replace with new
  VERSION = 'version',     // Create new version
  RENAME = 'rename'        // Rename to avoid conflict
}

export async function resolveAssetConflict(
  existingAsset: RpgAsset,
  newAsset: AssetUpload,
  strategy: ConflictStrategy
): Promise<RpgAsset> {
  switch (strategy) {
    case ConflictStrategy.SKIP:
      return existingAsset;
    case ConflictStrategy.OVERWRITE:
      return await updateAsset(existingAsset.id, newAsset);
    case ConflictStrategy.VERSION:
      return await createAssetVersion(existingAsset, newAsset);
    case ConflictStrategy.RENAME:
      return await createAsset({ ...newAsset, name: generateUniqueName(newAsset.name) });
  }
}
```

**Unit Tests**:
```typescript
// tests/unit/asset-conflict-resolver.test.ts

describe('resolveAssetConflict', () => {
  it('should skip when strategy is SKIP', async () => {
    // Existing asset
    // New asset
    // Strategy: SKIP
    // Should return existing
  });

  it('should overwrite when strategy is OVERWRITE', async () => {
    // Should update existing asset
  });

  it('should version when strategy is VERSION', async () => {
    // Should create new version
  });
});
```

**3. Progress Tracking** (Day 4-5)
```typescript
// src/lib/mirror-progress.ts

export class MirrorProgress {
  private progress: Map<string, number> = new Map();

  start(jobId: string, total: number) {
    this.progress.set(jobId, 0);
  }

  increment(jobId: string) {
    const current = this.progress.get(jobId) || 0;
    this.progress.set(jobId, current + 1);
  }

  getProgress(jobId: string): { current: number, total: number } {
    // Return progress
  }
}
```

---

### Week 3: Automated Snapshots

**Goal**: Enhance `/api/foundry/snapshot` with automation

**Current Status**:
- ✅ Create/list/restore work
- ❌ No automated scheduling
- ❌ No retention policy

**Tasks**:

**1. Snapshot Scheduler** (Day 1-2)
```typescript
// src/lib/snapshot-scheduler.ts

export interface SnapshotSchedule {
  frequency: 'hourly' | 'daily' | 'weekly' | 'manual';
  retentionDays: number;
  autoDelete: boolean;
}

export async function scheduleSnapshot(
  foundryInstanceId: string,
  schedule: SnapshotSchedule
) {
  // Create cron job or scheduled task
  // Store schedule in database
}
```

**Unit Tests**:
```typescript
// tests/unit/snapshot-scheduler.test.ts

describe('scheduleSnapshot', () => {
  it('should create hourly snapshot schedule', async () => {
    // Schedule hourly snapshots
    // Assert cron job created
  });

  it('should delete old snapshots based on retention', async () => {
    // Create old snapshots
    // Run retention cleanup
    // Assert old snapshots deleted
  });
});
```

**2. Snapshot Comparison** (Day 3-4)
```typescript
// src/lib/snapshot-diff.ts

export interface SnapshotDiff {
  added: string[];    // New actors/items/scenes
  removed: string[];  // Deleted actors/items/scenes
  modified: string[]; // Changed actors/items/scenes
}

export async function compareSnapshots(
  snapshot1Id: string,
  snapshot2Id: string
): Promise<SnapshotDiff> {
  // Load both snapshots
  // Compare data
  // Return diff
}
```

**Unit Tests**:
```typescript
// tests/unit/snapshot-diff.test.ts

describe('compareSnapshots', () => {
  it('should detect added actors', async () => {
    // Snapshot 1: 5 actors
    // Snapshot 2: 7 actors
    // Should return 2 added
  });

  it('should detect removed items', async () => {
    // Test deletion detection
  });

  it('should detect modified scenes', async () => {
    // Test modification detection
  });
});
```

---

### Week 4: Foundry Integration Tests + Polish

**Goal**: Comprehensive integration tests and bug fixes

**Tasks**:

**1. End-to-End Integration Tests**
```typescript
// tests/integration/foundry-e2e.test.ts

describe('Foundry Integration E2E', () => {
  it('should complete full sync workflow', async () => {
    // 1. Create Foundry instance
    // 2. Start instance
    // 3. Sync actors
    // 4. Create snapshot
    // 5. Mirror assets
    // 6. Stop instance
    // 7. Verify all data synced
  });

  it('should handle instance lifecycle', async () => {
    // Create → Start → Stop → Delete
    // Assert state changes correct
  });

  it('should track costs correctly', async () => {
    // Create instance
    // Run for X hours
    // Assert cost calculated correctly
  });
});
```

**2. Performance Testing**
```typescript
// tests/performance/foundry-perf.test.ts

describe('Foundry Performance', () => {
  it('should sync 1000 actors in under 60 seconds', async () => {
    // Generate 1000 mock actors
    // Sync all
    // Assert time < 60s
  });

  it('should mirror 100 assets in parallel', async () => {
    // Test bulk mirroring performance
  });
});
```

**3. Error Handling**
```typescript
// tests/error-handling/foundry-errors.test.ts

describe('Foundry Error Handling', () => {
  it('should retry failed API calls', async () => {
    // Mock transient error
    // Expect retry logic
  });

  it('should rollback partial sync on error', async () => {
    // Sync fails halfway
    // Should rollback changes
  });

  it('should log errors for debugging', async () => {
    // Error occurs
    // Assert error logged
  });
});
```

---

## 🔧 Week 5-8: Asset Management API

### Week 5: Asset Upload API

**Goal**: Build robust asset upload endpoint with license tracking

**Tasks**:

**1. Upload Endpoint** (Day 1-2)
```typescript
// src/app/api/assets/upload/route.ts

export async function POST(request: NextRequest) {
  // Security checks
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limiting (100/min)
  const rateLimitResult = await checkRateLimit(/* ... */);

  // Parse multipart form data
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const metadata = JSON.parse(formData.get('metadata') as string);

  // Validate file
  const validation = validateAssetUpload(file, metadata);
  if (!validation.valid) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  // Upload to Vercel Blob
  const blob = await put(file.name, file, {
    access: 'public',
    addRandomSuffix: true
  });

  // Create asset record with license tracking
  const asset = await prisma.rpgAsset.create({
    data: {
      name: metadata.name,
      assetType: metadata.assetType,
      url: blob.url,
      mimeType: file.type,
      fileSize: BigInt(file.size),
      filename: file.name,

      // License tracking (from asset tracking spec)
      source: metadata.source,
      sourceAuthor: metadata.sourceAuthor,
      license: metadata.license,
      legalNotes: metadata.legalNotes,
      contentOrigin: metadata.contentOrigin,

      // AI tracking (if applicable)
      aiModel: metadata.aiModel,
      aiPrompt: metadata.aiPrompt,

      // Ownership
      uploadedBy: session.user.id,
      worldId: metadata.worldId
    }
  });

  return NextResponse.json({ asset });
}
```

**Unit Tests**:
```typescript
// tests/unit/asset-upload.test.ts

describe('Asset Upload', () => {
  it('should upload image file successfully', async () => {
    // Mock file upload
    // Assert Blob storage called
    // Assert database record created
  });

  it('should validate file size limits', async () => {
    // Upload file > 50MB
    // Expect error
  });

  it('should validate file types', async () => {
    // Upload .exe file
    // Expect error
  });

  it('should require license info for marketplace assets', async () => {
    // Upload without license
    // isMarketplace: true
    // Expect error
  });

  it('should track AI generation metadata', async () => {
    // Upload AI-generated image
    // Assert aiModel and aiPrompt saved
  });
});
```

**2. Asset Validation** (Day 3)
```typescript
// src/lib/asset-validation.ts

export interface AssetUploadValidation {
  valid: boolean;
  errors: string[];
}

export function validateAssetUpload(
  file: File,
  metadata: AssetMetadata
): AssetUploadValidation {
  const errors: string[] = [];

  // File size validation (50MB max for free tier)
  if (file.size > 50 * 1024 * 1024) {
    errors.push('File size exceeds 50MB limit');
  }

  // File type validation
  const allowedTypes = [
    'image/png', 'image/jpeg', 'image/webp', 'image/gif',
    'audio/mpeg', 'audio/ogg', 'audio/wav',
    'video/mp4', 'video/webm',
    'application/pdf'
  ];

  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} not allowed`);
  }

  // License validation
  if (metadata.isMarketplace && !metadata.license) {
    errors.push('License is required for marketplace assets');
  }

  // AI tracking validation
  if (metadata.contentOrigin === 'ai_generated') {
    if (!metadata.aiModel) {
      errors.push('AI model is required for AI-generated content');
    }
    if (!metadata.aiPrompt) {
      errors.push('AI prompt is required for AI-generated content');
    }
  }

  // SPDX license format
  if (metadata.license && !isValidSPDX(metadata.license)) {
    errors.push('Invalid license format. Use SPDX identifiers (e.g., "CC-BY-4.0")');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

**Unit Tests**:
```typescript
// tests/unit/asset-validation.test.ts

describe('validateAssetUpload', () => {
  it('should accept valid image upload', () => {
    const file = createMockFile('test.png', 'image/png', 1024);
    const metadata = { name: 'Test', assetType: 'image' };
    const result = validateAssetUpload(file, metadata);
    expect(result.valid).toBe(true);
  });

  it('should reject oversized files', () => {
    const file = createMockFile('huge.png', 'image/png', 100 * 1024 * 1024);
    const result = validateAssetUpload(file, {});
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('File size exceeds 50MB limit');
  });

  it('should require license for marketplace assets', () => {
    const file = createMockFile('test.png', 'image/png', 1024);
    const metadata = { isMarketplace: true };
    const result = validateAssetUpload(file, metadata);
    expect(result.valid).toBe(false);
  });
});
```

---

### Week 6: Asset Search & Filter API

**Goal**: Build comprehensive asset query API

**Tasks**:

**1. Asset Query Endpoint** (Day 1-3)
```typescript
// src/app/api/assets/route.ts

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Parse query parameters
  const query = {
    search: searchParams.get('search'),
    assetType: searchParams.get('type'),
    category: searchParams.get('category'),
    tags: searchParams.getAll('tag'),
    license: searchParams.get('license'),
    contentOrigin: searchParams.get('origin'),
    verified: searchParams.get('verified') === 'true',

    // Pagination
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '20'),

    // Sorting
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc'
  };

  // Build Prisma where clause
  const where: Prisma.RpgAssetWhereInput = {};

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
      { tags: { has: query.search } }
    ];
  }

  if (query.assetType) {
    where.assetType = query.assetType;
  }

  if (query.category) {
    where.category = query.category;
  }

  if (query.tags.length > 0) {
    where.tags = { hasSome: query.tags };
  }

  if (query.license) {
    where.license = query.license;
  }

  if (query.contentOrigin) {
    where.contentOrigin = query.contentOrigin;
  }

  if (query.verified !== undefined) {
    where.verified = query.verified;
  }

  // Execute query
  const [assets, total] = await Promise.all([
    prisma.rpgAsset.findMany({
      where,
      orderBy: { [query.sortBy]: query.sortOrder },
      skip: (query.page - 1) * query.limit,
      take: query.limit
    }),
    prisma.rpgAsset.count({ where })
  ]);

  return NextResponse.json({
    assets,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      pages: Math.ceil(total / query.limit)
    }
  });
}
```

**Unit Tests**:
```typescript
// tests/unit/asset-query.test.ts

describe('Asset Query API', () => {
  beforeEach(async () => {
    // Seed test assets
    await seedTestAssets();
  });

  it('should search assets by name', async () => {
    const response = await GET('?search=grass');
    expect(response.assets).toHaveLength(5);
  });

  it('should filter by asset type', async () => {
    const response = await GET('?type=image');
    expect(response.assets.every(a => a.assetType === 'image')).toBe(true);
  });

  it('should filter by tags', async () => {
    const response = await GET('?tag=terrain&tag=outdoor');
    // Should return assets with both tags
  });

  it('should filter by license', async () => {
    const response = await GET('?license=CC-BY-4.0');
    expect(response.assets.every(a => a.license === 'CC-BY-4.0')).toBe(true);
  });

  it('should paginate results', async () => {
    const page1 = await GET('?page=1&limit=10');
    const page2 = await GET('?page=2&limit=10');
    expect(page1.assets).not.toEqual(page2.assets);
  });

  it('should sort by creation date', async () => {
    const response = await GET('?sortBy=createdAt&sortOrder=asc');
    // Assert sorted correctly
  });
});
```

---

## 📊 Testing Strategy

### Unit Tests (Vitest)

**Coverage Goal**: 80%+

**Location**: `tests/unit/`

**What to Test**:
- Individual functions (transformers, validators)
- Business logic (conflict resolution, licensing)
- Utilities (formatters, parsers)

**Example**:
```bash
npm run test:unit
npm run test:unit -- --coverage
```

### Integration Tests (Vitest + Test DB)

**Coverage Goal**: Key API flows

**Location**: `tests/integration/`

**What to Test**:
- API routes with database
- Multi-step workflows (upload → process → store)
- External API mocking (Foundry API)

**Example**:
```bash
npm run test:integration
```

### E2E Tests (Playwright)

**Coverage Goal**: Critical user journeys

**Location**: `tests/e2e/`

**What to Test** (later, when UI exists):
- Asset upload flow
- Foundry sync flow
- Snapshot creation/restore

---

## 📝 Documentation as We Go

### API Documentation

For each route, document:

```typescript
/**
 * POST /api/assets/upload
 *
 * Upload an asset (image, audio, video) to Vercel Blob storage.
 *
 * @security Requires authentication
 * @ratelimit 100 requests/minute
 *
 * @body {File} file - The file to upload
 * @body {AssetMetadata} metadata - Asset metadata (name, type, license, etc.)
 *
 * @returns {RpgAsset} The created asset record
 *
 * @example
 * const formData = new FormData();
 * formData.append('file', imageFile);
 * formData.append('metadata', JSON.stringify({
 *   name: 'Grass Terrain',
 *   assetType: 'image',
 *   license: 'CC-BY-4.0',
 *   sourceAuthor: 'John Doe'
 * }));
 *
 * const response = await fetch('/api/assets/upload', {
 *   method: 'POST',
 *   body: formData
 * });
 */
```

### OpenAPI/Swagger Spec

Consider generating OpenAPI spec:
```bash
npm install @asteasolutions/zod-to-openapi
```

---

## 🎯 Success Criteria

### Week 1-4 (Foundry Integration)
- ✅ All Foundry routes fully functional
- ✅ Unit test coverage > 80%
- ✅ Integration tests pass
- ✅ Can sync full Foundry world

### Week 5-8 (Asset Management)
- ✅ Asset upload works with all file types
- ✅ License tracking implemented
- ✅ Search/filter API complete
- ✅ Unit test coverage > 80%

### Week 9-12 (Tile System)
- ✅ Tile creation API complete
- ✅ Multi-scale asset assignment works
- ✅ Tile search/filter functional
- ✅ Unit test coverage > 80%

---

## 🔄 Iteration Process

After each feature:

1. **Write Tests First** (TDD when possible)
2. **Implement Feature**
3. **Run Tests**
4. **Fix Bugs**
5. **Document API**
6. **Code Review** (if working with others)
7. **Merge to Main**
8. **Deploy to Staging**

---

**Status**: 📋 **Plan Complete**
**Next Action**: Start with Week 1 - Foundry Sync API
**First Task**: Build FoundryClient class with unit tests

Ready to start building?
