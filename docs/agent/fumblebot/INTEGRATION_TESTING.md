# FumbleBot Integration Testing Guide

**Date**: 2025-11-27
**Status**: ✅ Complete
**Framework**: Vitest
**Environment**: Staging Database

## Overview

Integration tests verify that FumbleBot components work correctly with real external services and databases. Unlike unit tests that mock all dependencies, integration tests use actual connections to validate end-to-end functionality.

## Integration vs Unit Tests

| Aspect | Unit Tests | Integration Tests |
|--------|-----------|-------------------|
| **Speed** | Very fast (~2-3s total) | Slower (depends on network/DB) |
| **Dependencies** | All mocked | Real database, APIs |
| **Isolation** | Fully isolated | Tests interact with real systems |
| **Purpose** | Verify component logic | Verify system integration |
| **Run Frequency** | Every commit | Before deployment, nightly |
| **Flakiness** | None (deterministic) | Possible (network issues) |

## Running Integration Tests

### Prerequisites

1. **Environment Variables** - Required for integration tests:
   ```bash
   # Core Concepts Database (Staging)
   DATABASE_URL=postgresql://user:pass@staging-db.example.com/database

   # AI Providers (Optional - tests will skip if not available)
   ANTHROPIC_API_KEY=sk-ant-...
   OPENAI_API_KEY=sk-...

   # Foundry VTT (Optional)
   FOUNDRY_URL=https://staging-foundry.example.com
   FOUNDRY_USERNAME=admin
   FOUNDRY_PASSWORD=...

   # Discord (Optional)
   DISCORD_TOKEN=...
   DISCORD_TEST_GUILD_ID=...
   ```

2. **Database Access** - Ensure you have read access to the staging database

3. **Network Connectivity** - Integration tests require internet access

### Basic Commands

```bash
# Run all integration tests
npm run test:integration

# Run integration tests in watch mode
npm run test:integration:watch

# Run only unit tests (excludes integration)
npm run test:unit

# Run all tests (unit + integration)
npm test

# Run integration tests with coverage
npm run test:integration -- --coverage
```

### Running Specific Test Files

```bash
# Run Core Concepts integration tests only
npx vitest src/integration/core-concepts.integration.test.ts

# Run all integration tests matching pattern
npx vitest --run src/integration --grep "RPG Systems"
```

## Test Structure

```
src/
├── integration/
│   ├── core-concepts.integration.test.ts  ← Database integration
│   ├── ai-services.integration.test.ts    ← AI API integration (future)
│   ├── foundry.integration.test.ts        ← Foundry VTT integration (future)
│   └── discord.integration.test.ts        ← Discord bot integration (future)
└── test/
    └── setup.ts                            ← Global test setup
```

## Current Integration Tests

### 1. Core Concepts Integration Tests

**File**: [src/integration/core-concepts.integration.test.ts](src/integration/core-concepts.integration.test.ts)

Tests against the real staging database to verify:

#### RPG Systems (4 tests)
- ✅ Fetch all enabled systems from staging
- ✅ Fetch only core systems
- ✅ Fetch system by systemId
- ✅ Return null for non-existent system

#### Creatures (5 tests)
- ✅ Search creatures by name
- ✅ Respect search limit
- ✅ Return empty array for non-existent creature
- ✅ Get creature by ID
- ✅ Return null for non-existent creature ID

#### Locations (4 tests)
- ✅ Search locations by name/title
- ✅ Search by both name and title fields
- ✅ Return empty array for non-existent location
- ✅ Get location by ID

#### System Attributes (2 tests)
- ✅ Fetch attributes for a system
- ✅ Return empty array for non-existent system

#### Data Integrity (3 tests)
- ✅ No soft-deleted systems returned
- ✅ No soft-deleted creatures returned
- ✅ Referential integrity for location parent IDs

#### Performance (3 tests)
- ✅ Fetch systems in <1 second
- ✅ Search creatures in <1 second
- ✅ Handle concurrent queries efficiently

**Key Features**:
- Connects to real staging database
- Non-destructive (read-only operations)
- Handles empty databases gracefully
- Verifies data structure and integrity
- Includes performance benchmarks

**Example Test**:
```typescript
it('should fetch real RPG systems from staging', async () => {
  const systems = await client.getRpgSystems();

  expect(systems).toBeDefined();
  expect(Array.isArray(systems)).toBe(true);

  // If systems exist, verify structure
  if (systems.length > 0) {
    const system = systems[0];
    expect(system).toHaveProperty('id');
    expect(system).toHaveProperty('systemId');
    expect(system).toHaveProperty('name');
    expect(system).toHaveProperty('isEnabled', true);
    expect(system).toHaveProperty('platforms');
    expect(typeof system.platforms).toBe('object');
  }
});
```

## Writing Integration Tests

### Template for Database Integration Tests

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@crit-fumble/core-concepts-api';
import { YourClient } from '../your-module/client.js';

describe('Your Integration Tests', () => {
  let prisma: PrismaClient;
  let client: YourClient;

  beforeAll(async () => {
    // Setup real database connection
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    client = new YourClient({ prisma });

    // Verify connection
    await prisma.$connect();
  });

  afterAll(async () => {
    // Always disconnect
    await prisma.$disconnect();
  });

  describe('Feature Name', () => {
    it('should work with real data', async () => {
      // Arrange
      const input = 'test';

      // Act
      const result = await client.method(input);

      // Assert
      expect(result).toBeDefined();

      // Handle empty databases gracefully
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('id');
      }
    });

    it('should handle edge cases', async () => {
      const result = await client.method('nonexistent-12345');
      expect(result).toEqual([]);
    });
  });

  describe('Performance', () => {
    it('should complete within reasonable time', async () => {
      const start = Date.now();
      await client.method('test');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000);
    });
  });
});
```

### Template for API Integration Tests

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { AIService } from '../ai/service.js';

describe('AI Service Integration Tests', () => {
  let aiService: AIService;

  beforeAll(() => {
    aiService = AIService.getInstance();
  });

  describe('Anthropic Integration', () => {
    it('should generate response from Claude', async () => {
      // Skip if API key not available
      if (!process.env.ANTHROPIC_API_KEY) {
        console.warn('Skipping: ANTHROPIC_API_KEY not set');
        return;
      }

      const response = await aiService.chat(
        [{ role: 'user', content: 'Say hello' }],
        'You are helpful',
        { provider: 'anthropic', maxTokens: 50 }
      );

      expect(response).toBeDefined();
      expect(response.content).toBeTruthy();
      expect(response.provider).toBe('anthropic');
    });
  });
});
```

## Best Practices

### 1. Non-Destructive Tests

**DO**:
- Use read-only operations
- Search for generic terms ('dragon', 'city')
- Test with safe, predictable queries

**DON'T**:
- Create, update, or delete production data
- Rely on specific data existing
- Modify database state

### 2. Environment Variable Checks

Always check if required credentials are available:

```typescript
it('should use API', async () => {
  if (!process.env.API_KEY) {
    console.warn('Skipping: API_KEY not set');
    return;
  }

  // Test with API
});
```

### 3. Handle Empty Data Gracefully

Staging databases might be empty:

```typescript
it('should fetch data', async () => {
  const results = await client.getData();

  expect(Array.isArray(results)).toBe(true);

  // Only verify structure if data exists
  if (results.length > 0) {
    expect(results[0]).toHaveProperty('id');
  }
});
```

### 4. Set Reasonable Timeouts

Integration tests can be slower:

```typescript
it('should fetch data', async () => {
  const start = Date.now();
  await client.getData();
  const duration = Date.now() - start;

  // Allow more time than unit tests
  expect(duration).toBeLessThan(5000); // 5 seconds
}, 10000); // 10 second timeout
```

### 5. Test Data Integrity

Verify database constraints and relationships:

```typescript
it('should maintain referential integrity', async () => {
  const locations = await client.getLocations();

  locations.forEach((location) => {
    if (location.parentLocationId) {
      // Parent ID should be valid UUID
      expect(location.parentLocationId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    }
  });
});
```

## Performance Testing

Integration tests should include performance benchmarks:

```typescript
describe('Performance', () => {
  it('should fetch systems quickly', async () => {
    const start = Date.now();
    await client.getRpgSystems();
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(1000);
  });

  it('should handle concurrent queries', async () => {
    const promises = [
      client.getRpgSystems(),
      client.searchCreatures('dragon', 5),
      client.searchLocations('city', 5),
    ];

    const start = Date.now();
    const results = await Promise.all(promises);
    const duration = Date.now() - start;

    expect(results).toHaveLength(3);
    expect(duration).toBeLessThan(2000);
  });
});
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Integration Tests

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main, staging]
  schedule:
    - cron: '0 2 * * *' # Nightly at 2 AM

jobs:
  integration-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Run integration tests
        env:
          DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: npm run test:integration

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: integration-test-results
          path: test-results/
```

### Separate Unit and Integration in CI

```yaml
jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test:unit  # Fast, no secrets needed

  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests  # Only run if unit tests pass
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test:integration  # With secrets
        env:
          DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}
```

## Debugging Integration Tests

### Enable Verbose Logging

```bash
# Prisma query logging
DATABASE_URL=... npx vitest src/integration --run

# With DEBUG output
DEBUG=* npx vitest src/integration --run
```

### Run Single Test

```bash
# Run specific test file
npx vitest src/integration/core-concepts.integration.test.ts

# Run specific test case
npx vitest src/integration --run --grep "should fetch systems"
```

### Check Database Connection

```typescript
beforeAll(async () => {
  prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'], // Enable logging
  });

  await prisma.$connect();

  // Verify connection
  const result = await prisma.$queryRaw`SELECT 1 as value`;
  console.log('Database connected:', result);
});
```

## Common Issues

### Issue 1: Connection Timeout

**Problem**: Tests timeout when connecting to database

**Solution**:
- Verify DATABASE_URL is correct
- Check network access to staging database
- Ensure database firewall allows your IP
- Increase test timeout

```typescript
it('should connect', async () => {
  await client.getData();
}, 30000); // 30 second timeout
```

### Issue 2: Flaky Tests

**Problem**: Tests pass sometimes, fail other times

**Solution**:
- Don't rely on specific data existing
- Use conditional assertions
- Add retries for network operations
- Check for race conditions

### Issue 3: API Rate Limits

**Problem**: AI API tests fail with rate limit errors

**Solution**:
- Skip tests when API key not available
- Add delays between tests
- Use lower token limits
- Consider test API quotas

```typescript
it('should call API', async () => {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('Skipping: API key not available');
    return;
  }

  // Use minimal tokens to conserve quota
  const response = await ai.chat(messages, { maxTokens: 50 });
  expect(response).toBeDefined();
});
```

## Cost Considerations

### Database Integration Tests
- ✅ **Free** - Read-only queries to staging database
- ⚠️ Monitor query volume to avoid impacting staging performance

### AI API Integration Tests
- ❌ **Costs money** - Each API call uses tokens
- 💡 **Recommendation**: Skip AI integration tests in local dev, run in CI only
- 💡 Use minimal token limits for tests (e.g., maxTokens: 50)

### Foundry VTT Integration Tests
- ✅ **Free** - If using staging Foundry instance
- ⚠️ Requires Foundry server to be running

## Future Integration Tests

### Planned Test Files

1. **AI Services Integration** (`ai-services.integration.test.ts`)
   - Test Anthropic Claude API
   - Test OpenAI GPT-4 API
   - Verify function calling works
   - Test error handling for API failures

2. **Foundry VTT Integration** (`foundry.integration.test.ts`)
   - Test screenshot capture
   - Test module communication
   - Verify Foundry API compatibility

3. **Discord Bot Integration** (`discord.integration.test.ts`)
   - Test slash commands in test guild
   - Verify embed formatting
   - Test permission checks

## Summary

Integration tests provide confidence that FumbleBot works correctly with real external systems. They complement unit tests by catching integration issues that mocks can't reveal.

**Key Differences from Unit Tests**:

| Feature | Unit Tests | Integration Tests |
|---------|-----------|-------------------|
| Speed | ⚡ Very fast | 🐢 Slower |
| Dependencies | 🎭 All mocked | 🌐 Real connections |
| Cost | 💰 Free | 💸 May cost (APIs) |
| Reliability | ✅ Always pass/fail | ⚠️ Can be flaky |
| Run frequency | 🔄 Every commit | 📅 Pre-deploy, nightly |
| Environment | 💻 Local dev | ☁️ CI/CD preferred |

---

## Quick Reference

```bash
# Run only unit tests (fast, no secrets needed)
npm run test:unit

# Run only integration tests (slower, needs DATABASE_URL)
npm run test:integration

# Run all tests
npm test

# Watch mode for integration tests
npm run test:integration:watch

# Run specific integration test
npx vitest src/integration/core-concepts.integration.test.ts
```

**Environment Variables Required**:
```bash
DATABASE_URL=postgresql://...  # Required
ANTHROPIC_API_KEY=sk-ant-...   # Optional (for AI tests)
OPENAI_API_KEY=sk-...          # Optional (for AI tests)
```

---

**Next Steps**:
1. Set up `DATABASE_URL` environment variable pointing to staging
2. Run `npm run test:integration` to verify integration tests work
3. Review test output and verify all tests pass
4. Add integration tests to CI/CD pipeline
