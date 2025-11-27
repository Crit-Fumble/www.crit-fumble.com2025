# FumbleBot Testing Guide

**Framework**: Vitest
**Coverage Tool**: v8
**Mocking**: Vitest built-in mocking

## Overview

Comprehensive unit tests for FumbleBot components with proper dependency mocking. All external dependencies (database, AI services, Discord API) are mocked to ensure fast, reliable tests.

## Test Structure

```
src/
├── core-concepts/
│   ├── client.ts
│   └── client.test.ts          ← Core Concepts Client tests
├── mcp/
│   ├── fumblebot-server.ts
│   └── fumblebot-server.test.ts ← MCP Server tests
├── discord/
│   └── commands/
│       └── slash/
│           ├── rpg.ts
│           └── rpg.test.ts      ← Discord commands tests
└── test/
    └── setup.ts                 ← Global test setup
```

## Running Tests

### Basic Commands

```bash
# Run all tests once
npm test

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with UI dashboard
npm run test:ui
```

### Filtering Tests

```bash
# Run specific test file
npx vitest src/core-concepts/client.test.ts

# Run tests matching pattern
npx vitest --grep "search creatures"

# Run only Core Concepts tests
npx vitest core-concepts
```

## Test Coverage

### Current Coverage

**Core Concepts Client** (`client.test.ts`):
- ✅ `getRpgSystems()` - all enabled systems
- ✅ `getRpgSystemBySystemId()` - by ID, not found
- ✅ `getCoreSystems()` - only core systems
- ✅ `searchCreatures()` - search, limit
- ✅ `getCreature()` - by ID, deleted check
- ✅ `searchLocations()` - search by name/title
- ✅ `getLocation()` - by ID
- ✅ `getSystemAttributes()` - by system name

**MCP Server** (`fumblebot-server.test.ts`):
- ✅ Anthropic tools: `anthropic_chat`, `anthropic_dm_response`, `anthropic_lookup_rule`
- ✅ OpenAI tools: `openai_chat`, `openai_generate_dungeon`, `openai_generate_encounter`
- ✅ Core Concepts tools: All 7 RPG data tools
- ✅ Utility tools: `fumble_roll_dice`, `fumble_generate_npc`, `fumble_generate_lore`
- ✅ Error handling: Missing providers, not initialized

**Discord Commands** (`rpg.test.ts`):
- ✅ `/rpg systems` - all systems, core-only, empty, errors
- ✅ `/rpg creature` - search, default limit, no results
- ✅ `/rpg location` - search, truncation
- ✅ `/rpg lookup` - AI lookup, default system, truncation, errors
- ✅ Unknown subcommands

### Coverage Goals

- **Statements**: >90%
- **Branches**: >85%
- **Functions**: >90%
- **Lines**: >90%

## Mocking Patterns

### 1. Mocking Prisma Client

```typescript
const createMockPrisma = () => ({
  rpgSystem: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
  },
  rpgCreature: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  // ... other models
});

const mockPrisma = createMockPrisma();
const client = new CoreConceptsClient({
  prisma: mockPrisma as unknown as PrismaClient
});

// Setup mock return value
mockPrisma.rpgSystem.findMany.mockResolvedValue([/* data */]);
```

### 2. Mocking AI Service

```typescript
vi.mock('../ai/service.js');

const mockAIService = {
  isProviderAvailable: vi.fn(),
  chat: vi.fn(),
  dmResponse: vi.fn(),
  // ... other methods
};

vi.mocked(AIService.getInstance).mockReturnValue(mockAIService);

// Setup provider availability
mockAIService.isProviderAvailable.mockReturnValue(true);
mockAIService.chat.mockResolvedValue({
  content: 'Response',
  provider: 'anthropic',
  model: 'claude-sonnet-4',
  usage: { /* ... */ },
});
```

### 3. Mocking Discord Interactions

```typescript
const createMockInteraction = (
  subcommand: string,
  options: Record<string, any> = {}
): Partial<ChatInputCommandInteraction> => {
  return {
    options: {
      getSubcommand: vi.fn().mockReturnValue(subcommand),
      getString: vi.fn((key) => options[key] ?? null),
      getBoolean: vi.fn((key) => options[key] ?? null),
      getInteger: vi.fn((key) => options[key] ?? null),
    } as any,
    deferReply: vi.fn().mockResolvedValue(undefined),
    editReply: vi.fn().mockResolvedValue(undefined),
    reply: vi.fn().mockResolvedValue(undefined),
  };
};

const interaction = createMockInteraction('systems', { 'core-only': true });
```

### 4. Mocking MCP Server

```typescript
vi.mock('../../../mcp/fumblebot-server.js');

const mockMCPServer = {
  listRpgSystems: vi.fn(),
  searchCreatures: vi.fn(),
  anthropicLookupRule: vi.fn(),
};

vi.mocked(FumbleBotMCPServer).mockImplementation(() => mockMCPServer);

// Setup mock responses
mockMCPServer.listRpgSystems.mockResolvedValue({
  content: [{ type: 'text', text: JSON.stringify([/* systems */]) }],
});
```

## Writing New Tests

### Template for Component Tests

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock external dependencies
vi.mock('../dependency.js');

import { ComponentToTest } from './component.js';

describe('ComponentToTest', () => {
  let component: ComponentToTest;
  let mockDependency: any;

  beforeEach(() => {
    // Setup mocks
    mockDependency = {
      method: vi.fn(),
    };

    // Create instance
    component = new ComponentToTest(mockDependency);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('methodName', () => {
    it('should do expected behavior', async () => {
      // Arrange
      mockDependency.method.mockResolvedValue('result');

      // Act
      const result = await component.methodName('input');

      // Assert
      expect(mockDependency.method).toHaveBeenCalledWith('input');
      expect(result).toBe('result');
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      mockDependency.method.mockRejectedValue(new Error('Failed'));

      // Act & Assert
      await expect(component.methodName('input')).rejects.toThrow('Failed');
    });
  });
});
```

### Best Practices

1. **Arrange-Act-Assert Pattern**: Structure tests clearly
2. **Mock External Dependencies**: Database, APIs, file system
3. **Test Edge Cases**: Empty results, null values, errors
4. **Descriptive Test Names**: Use "should" statements
5. **One Assertion Per Test**: Keep tests focused
6. **Clean Up**: Use `afterEach` to clear mocks

## Test Examples

### Example 1: Testing Database Query

```typescript
it('should search creatures by name', async () => {
  // Arrange
  const mockCreatures = [
    { id: '1', name: 'Dragon', creatureType: 'Dragon' },
  ];
  mockPrisma.rpgCreature.findMany.mockResolvedValue(mockCreatures);

  // Act
  const result = await client.searchCreatures('dragon', 10);

  // Assert
  expect(mockPrisma.rpgCreature.findMany).toHaveBeenCalledWith({
    where: {
      name: { contains: 'dragon', mode: 'insensitive' },
      deletedAt: null,
    },
    take: 10,
    orderBy: { name: 'asc' },
  });
  expect(result).toHaveLength(1);
  expect(result[0].name).toBe('Dragon');
});
```

### Example 2: Testing AI Integration

```typescript
it('should generate DM response using Anthropic', async () => {
  // Arrange
  mockAIService.isProviderAvailable.mockReturnValue(true);
  mockAIService.dmResponse.mockResolvedValue(
    'The dragon roars menacingly!'
  );

  // Act
  const result = await server.anthropicDMResponse({
    scenario: 'Players encounter dragon',
    system: 'D&D 5e',
    tone: 'dramatic',
  });

  // Assert
  expect(mockAIService.isProviderAvailable).toHaveBeenCalledWith('anthropic');
  expect(mockAIService.dmResponse).toHaveBeenCalledWith(
    'Players encounter dragon',
    'D&D 5e',
    'dramatic'
  );
  expect(result.content[0].text).toContain('dragon');
});
```

### Example 3: Testing Discord Commands

```typescript
it('should display creature search results', async () => {
  // Arrange
  const mockCreatures = [
    { id: '1', name: 'Goblin', cr: '1/4', size: 'Small' },
  ];
  mockMCPServer.searchCreatures.mockResolvedValue({
    content: [{ type: 'text', text: JSON.stringify(mockCreatures) }],
  });

  const interaction = createMockInteraction('creature', {
    name: 'goblin',
    limit: 5,
  });

  // Act
  await rpgHandler.execute(interaction as ChatInputCommandInteraction);

  // Assert
  expect(interaction.deferReply).toHaveBeenCalled();
  expect(mockMCPServer.searchCreatures).toHaveBeenCalledWith({
    query: 'goblin',
    limit: 5,
  });
  expect(interaction.editReply).toHaveBeenCalledWith(
    expect.objectContaining({
      embeds: expect.arrayContaining([
        expect.objectContaining({
          data: expect.objectContaining({
            title: expect.stringContaining('goblin'),
          }),
        }),
      ]),
    })
  );
});
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Run tests
        run: npm test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

## Debugging Tests

### Run Single Test in Debug Mode

```bash
# Add debugger statement in test
it('should work', () => {
  debugger;
  // test code
});

# Run with Node inspector
node --inspect-brk node_modules/.bin/vitest run
```

### View Coverage HTML Report

```bash
npm run test:coverage
# Open coverage/index.html in browser
```

### Vitest UI Dashboard

```bash
npm run test:ui
# Opens browser with interactive test dashboard
```

## Common Issues

### Issue 1: Module Import Errors

**Problem**: `Cannot find module` errors

**Solution**: Ensure `.js` extensions in imports and check `tsconfig.json`

```typescript
// Correct
import { Thing } from './thing.js';

// Incorrect
import { Thing } from './thing';
```

### Issue 2: Mock Not Working

**Problem**: Real module used instead of mock

**Solution**: Call `vi.mock()` before imports

```typescript
// Correct order
vi.mock('../dependency.js');
import { Dependency } from '../dependency.js';

// Incorrect order (won't work)
import { Dependency } from '../dependency.js';
vi.mock('../dependency.js');
```

### Issue 3: Async Tests Timing Out

**Problem**: Tests hang or timeout

**Solution**: Ensure promises are awaited and mocks return resolved values

```typescript
// Correct
mockFunction.mockResolvedValue(result);
await component.method();

// Incorrect (hangs)
mockFunction.mockReturnValue(result); // Should be mockResolvedValue
await component.method();
```

## Test Maintenance

### Adding Tests for New Features

1. Create `*.test.ts` file alongside component
2. Mock all external dependencies
3. Test happy path + edge cases + errors
4. Aim for >90% coverage

### Updating Tests for Changes

1. Run tests to see what breaks
2. Update mocks to match new signatures
3. Add tests for new functionality
4. Ensure coverage doesn't decrease

### Refactoring Tests

1. Extract common setup to `beforeEach`
2. Create helper functions for repetitive mocks
3. Group related tests with `describe`
4. Keep tests DRY but readable

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Vitest API Reference](https://vitest.dev/api/)
- [Mocking Guide](https://vitest.dev/guide/mocking.html)
- [Coverage Reports](https://vitest.dev/guide/coverage.html)

---

**Next Steps**:
1. Run `npm install` to install Vitest
2. Run `npm test` to execute all tests
3. Run `npm run test:coverage` to see coverage report
4. Add tests for any new components
