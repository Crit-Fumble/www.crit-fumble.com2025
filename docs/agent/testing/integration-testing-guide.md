# Integration Testing Guide

## Overview

This guide covers the integration testing strategy for Crit-Fumble Gaming, focusing on visual regression testing and automated screenshot capture for rapid UI iteration.

## Testing Philosophy

**Key Principle**: Every test run should produce visual artifacts (screenshots) for both passing and failing tests, enabling quick identification of style issues and regressions.

## Setup

### Prerequisites

1. **Development server running**:
   ```bash
   npm run dev
   ```

2. **Environment configured**:
   - `.env` with test database URL
   - Auth providers configured (Discord, GitHub)
   - NextAuth secrets set

### Running Tests

#### Basic Test Run
```bash
npm run test:e2e
```

#### Specific Test File
```bash
npm run test:e2e -- tests/integration/09-auth-debug.spec.ts
```

#### Specific Browser
```bash
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project=firefox
npm run test:e2e -- --project=webkit
```

#### Filter by Test Name
```bash
npm run test:e2e -- --grep "auth flow"
```

## Screenshot Capture

### Configuration

Screenshots are captured for **all tests** (not just failures) via [playwright.config.ts:58](playwright.config.ts#L58):

```typescript
screenshot: {
  mode: 'on',        // Always take screenshots for visual review
  fullPage: true,    // Capture full page
}
```

### Viewing Screenshots

After running tests, screenshots are saved to:
```
test-results/artifacts/{test-name}-{browser}/test-finished-1.png
```

Example locations:
- `test-results/artifacts/integration-09-auth-debug--f4898--flow-with-detailed-logging-chromium/test-finished-1.png`
- `test-results/artifacts/integration-09-auth-debug--ae008-ween-test-auth-and-NextAuth-chromium/test-finished-1.png`

### Using Screenshots for Visual Review

1. **Run tests**: `npm run test:e2e -- tests/integration/09-auth-debug.spec.ts --project=chromium`
2. **Check output**: Look for screenshot paths in test results
3. **Review visuals**: Open screenshots to verify styling
4. **Iterate**: Make CSS changes and re-run tests

## Test Structure

### Authentication Tests

Located in [tests/integration/09-auth-debug.spec.ts](tests/integration/09-auth-debug.spec.ts):

1. **Complete Auth Flow Test**
   - Creates test session via `/api/test-auth`
   - Verifies cookie setting
   - Tests dashboard access
   - Captures dashboard UI

2. **Cookie Name Comparison Test**
   - Tests login page rendering
   - Verifies OAuth button display
   - Captures login page UI

3. **Manual Cookie Injection Test**
   - Tests session persistence
   - Verifies authentication state
   - Captures authenticated dashboard

### Test-Auth API

The [/api/test-auth](src/app/api/test-auth/route.ts) endpoint provides:
- Test session creation without OAuth
- Security-locked to development/test only
- Automatic cookie configuration
- Database transaction safety

**Security**:
- Module-level production check
- Runtime environment validation
- Triple-protected against production use

## Visual Regression Strategy

### Current Approach

1. **Always capture** screenshots on every test run
2. **Manual review** of visual changes
3. **Fast iteration** on UI/UX improvements
4. **Quick identification** of styling issues

### Future Enhancements

1. **Baseline comparison**: Store "golden" screenshots
2. **Automated diff**: Compare current vs. baseline
3. **Visual regression reports**: Highlight pixel differences
4. **Approval workflow**: Accept/reject visual changes

## MCP Server Integration

### Overview

The MCP (Model Context Protocol) server enables background test execution during development:

- Run tests asynchronously
- Monitor test progress
- Retrieve screenshots/videos
- Queue concurrent test runs

### Starting MCP Server

```bash
npm run mcp:up
```

### Using MCP Server

```bash
# Check health
curl http://localhost:3333/health

# Run tests
curl -X POST http://localhost:3333/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{
    "name": "run_playwright_tests",
    "arguments": {
      "testFile": "tests/integration/09-auth-debug.spec.ts",
      "project": "chromium"
    }
  }'

# Get test status
curl -X POST http://localhost:3333/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{
    "name": "get_test_status",
    "arguments": {"testId": "<test-id>"}
  }'

# Get artifacts
curl -X POST http://localhost:3333/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{
    "name": "get_test_artifacts",
    "arguments": {"testId": "<test-id>"}
  }'
```

## Best Practices

### Writing Integration Tests

1. **Use descriptive test names**: `should display dashboard after successful login`
2. **Add visual checkpoints**: Take screenshots at key UI states
3. **Test user journeys**: Complete flows, not isolated actions
4. **Include error states**: Test failure scenarios too

### Screenshot Organization

1. **Clear naming**: Test names should describe what's captured
2. **Consistent timing**: Wait for animations/loading states
3. **Full page captures**: Use `fullPage: true` for context
4. **Mobile testing**: Include mobile viewport tests

### Performance

1. **Parallel execution**: Use `--workers=N` for faster runs
2. **Targeted testing**: Run specific files during development
3. **Browser selection**: Start with Chromium, expand for compatibility
4. **Smart retries**: Use retries only on CI

## Troubleshooting

### Common Issues

**Tests timing out**:
- Ensure dev server is running
- Check network connectivity
- Increase timeout in test file

**Screenshots not generated**:
- Verify playwright.config.ts has `screenshot: { mode: 'on' }`
- Check test-results/artifacts directory permissions
- Look for errors in test output

**Authentication failures**:
- Verify `.env` configuration
- Check database connectivity
- Review test-auth endpoint security checks

**MCP server not starting**:
- Check Docker is running
- Verify port 3333 is available
- Review `npm run mcp:build` logs

## Related Documentation

- [MCP Integration Guide](MCP_INTEGRATION.md)
- [Docker Test Capture](DOCKER_TEST_CAPTURE.md)
- [Core Concepts](../../CoreConcepts.md)
- [Playwright Configuration](../../../playwright.config.ts)
