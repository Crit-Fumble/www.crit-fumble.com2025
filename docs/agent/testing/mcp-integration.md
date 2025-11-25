# MCP Server Integration for Background Testing

## Overview

The MCP (Model Context Protocol) server enables Claude Code to run Playwright integration tests in the background while continuing development work. This eliminates the need to wait for tests to complete before iterating on code.

## Architecture

```
┌─────────────────────┐
│   Claude Code       │
│   (You)             │
└──────────┬──────────┘
           │ HTTP API
           ▼
┌─────────────────────┐
│   MCP Server        │
│   Port 3333         │
│   ┌───────────────┐ │
│   │ Test Queue    │ │
│   │ Management    │ │
│   └───────────────┘ │
└──────────┬──────────┘
           │ Docker API
           ▼
┌─────────────────────┐
│  Test Containers    │
│  (Dynamic)          │
│  ┌───────────────┐  │
│  │ Playwright    │  │
│  │ + Chromium    │  │
│  │ + Capture     │  │
│  └───────────────┘  │
└─────────────────────┘
```

## Workflow

### 1. Traditional Testing (Blocking)
```
┌──────┐ ┌──────┐ ┌──────┐
│ Code │→│ Test │→│ Wait │ (❌ Can't work during tests)
└──────┘ └──────┘ └──────┘
```

### 2. MCP Background Testing (Non-Blocking)
```
┌──────┐   ┌──────────────┐
│ Code │──→│ Start Tests  │
└──────┘   └──────────────┘
   ↓              ↓
┌──────┐   ┌──────────────┐
│ Code │   │ Tests Running│ (✅ Continue working)
└──────┘   └──────────────┘
   ↓              ↓
┌──────┐   ┌──────────────┐
│ Code │←──│ Check Results│
└──────┘   └──────────────┘
```

## Setup

### Quick Start

```bash
# 1. Build MCP server
npm run mcp:build

# 2. Start MCP server
npm run mcp:up

# 3. Verify it's running
npm run mcp:status
```

### Expected Output

```json
{
  "status": "healthy",
  "uptime": 15,
  "activeTests": 0,
  "totalTests": 0
}
```

## Usage Examples

### Example 1: Run Auth Debug Test

```bash
# Start test in background
node mcp-server/client.js run tests/integration/09-auth-debug.spec.ts

# Output:
# Test ID: abc123def456
# Status: running
# Message: Test run started in background

# Continue working...
# ... make code changes ...
# ... 30 seconds later ...

# Check status
node mcp-server/client.js status abc123def456

# Output:
# Test Run abc123def456:
#   Status: passed
#   Duration: 28s
#   Exit Code: 0
#   Screenshots: 3
#   Videos: 1
```

### Example 2: Run All Tests While Developing

```bash
# Start comprehensive test run
node mcp-server/client.js run

# Output:
# Test ID: xyz789abc123
# Status: running

# Continue development for 5 minutes...

# Check final status
node mcp-server/client.js status xyz789abc123

# Get artifacts
node mcp-server/client.js artifacts xyz789abc123
```

### Example 3: Monitor Active Tests

```bash
# List all running tests
node mcp-server/client.js list --status=running

# View live output from test
node mcp-server/client.js output abc123def456 --tail=50

# Stream full output
node mcp-server/client.js output abc123def456
```

## Claude Code Integration

As Claude Code, I can now use the MCP server directly:

### Pattern 1: Start Test and Continue Working

```javascript
// Start test
await fetch('http://localhost:3333/mcp/tools/call', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'run_playwright_tests',
    arguments: {
      testFile: 'tests/integration/09-auth-debug.spec.ts',
      project: 'chromium'
    }
  })
});

// Immediately continue with next task
// User asks: "Can you add a new button to the dashboard?"
// I can work on that while test runs...
```

### Pattern 2: Check Test Results Later

```javascript
// User asks: "How did those tests go?"

// Fetch test status
const response = await fetch('http://localhost:3333/mcp/tools/call', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'get_test_status',
    arguments: { testId: 'abc123def456' }
  })
});

const data = await response.json();
const status = JSON.parse(data.content[0].text);

// Report to user
console.log(`Tests ${status.status}! Duration: ${status.duration}ms`);
console.log(`Captured ${status.artifacts.screenshots.length} screenshots`);
```

### Pattern 3: Proactive Testing

```javascript
// After making code changes to auth.ts

// Automatically start relevant tests
await fetch('http://localhost:3333/mcp/tools/call', {
  method: 'POST',
  body: JSON.stringify({
    name: 'run_playwright_tests',
    arguments: {
      grep: 'auth',  // Only run auth-related tests
      project: 'chromium'
    }
  })
});

// Tell user
console.log('Started auth tests in background. Continuing with next task...');
```

## Available Tools

### 1. run_playwright_tests

Start a test run in the background.

```javascript
{
  name: 'run_playwright_tests',
  arguments: {
    testFile: 'tests/integration/09-auth-debug.spec.ts',  // Optional
    project: 'chromium',                                   // Optional: chromium|firefox|webkit
    grep: 'should login',                                  // Optional: filter by name
    processCaptures: true,                                 // Optional: enable processing
    timeout: 60000                                         // Optional: test timeout
  }
}
```

### 2. get_test_status

Get current status of a test run.

```javascript
{
  name: 'get_test_status',
  arguments: {
    testId: 'abc123def456'  // Required
  }
}
```

### 3. get_test_output

Get output logs from a test run.

```javascript
{
  name: 'get_test_output',
  arguments: {
    testId: 'abc123def456',  // Required
    tail: 50                 // Optional: last N lines
  }
}
```

### 4. list_test_runs

List all test runs with optional filter.

```javascript
{
  name: 'list_test_runs',
  arguments: {
    status: 'running',  // Optional: queued|running|passed|failed
    limit: 20           // Optional: max results
  }
}
```

### 5. get_test_artifacts

Get list of artifacts from a test run.

```javascript
{
  name: 'get_test_artifacts',
  arguments: {
    testId: 'abc123def456'  // Required
  }
}
```

## Benefits

### 1. Non-Blocking Development

**Before MCP:**
```
09:00 - Make code change
09:01 - Run tests (wait 3 minutes...)
09:04 - Tests pass
09:04 - Make next change
```

**With MCP:**
```
09:00 - Make code change
09:01 - Start tests in background
09:01 - Make next change
09:02 - Make another change
09:03 - Make another change
09:04 - Check test results (passed!)
```

### 2. Parallel Workflows

- Run multiple test suites simultaneously
- Continue coding while tests execute
- No context switching delays

### 3. Better Feedback Loop

- Start tests early
- Get results when ready
- Iterate faster

## Management Commands

### Start/Stop

```bash
# Start MCP server
npm run mcp:up

# Stop MCP server
npm run mcp:down

# Restart MCP server
npm run mcp:restart
```

### Monitoring

```bash
# Check health
npm run mcp:status

# View logs
npm run mcp:logs

# List active tests
node mcp-server/client.js list --status=running
```

### Cleanup

```bash
# Stop MCP server
npm run mcp:down

# Clean up test containers
npm run test:docker:down
```

## Troubleshooting

### MCP Server Won't Start

**Check port availability:**
```bash
netstat -an | findstr 3333
```

**Check Docker is running:**
```bash
docker ps
```

**View logs:**
```bash
npm run mcp:logs
```

### Tests Won't Start

**Check MCP server health:**
```bash
npm run mcp:status
```

**Check Docker socket access:**
```bash
docker ps  # Should work from within MCP container
```

### Can't Access Artifacts

**Check volume mounts in docker-compose.test.yml:**
```yaml
volumes:
  - ./tests/screenshots:/app/tests/screenshots
  - ./tests/videos:/app/tests/videos
```

## Best Practices

### 1. Start Tests Early

As soon as you make a significant change, start tests:

```bash
# After modifying auth code
node mcp-server/client.js run tests/integration/09-auth-debug.spec.ts
```

### 2. Use Grep for Focused Testing

Instead of running all tests, use grep to run relevant ones:

```bash
# Only test authentication
node mcp-server/client.js run --grep="auth"

# Only test login flow
node mcp-server/client.js run --grep="login"
```

### 3. Monitor Long-Running Tests

For comprehensive test runs, check status periodically:

```bash
# Start all tests
TEST_ID=$(node mcp-server/client.js run | grep "Test ID" | cut -d: -f2 | xargs)

# Check every minute
while true; do
  node mcp-server/client.js status $TEST_ID
  sleep 60
done
```

### 4. Review Artifacts After Completion

Always check artifacts for visual verification:

```bash
node mcp-server/client.js artifacts abc123def456

# Open screenshots
explorer tests/screenshots/

# Open videos
explorer tests/videos/
```

## Integration with Development Workflow

### Typical Session

```bash
# Morning: Start MCP server
npm run mcp:up

# Work on feature
# ... edit code ...

# Run tests in background
node mcp-server/client.js run tests/integration/08-user-login-flow.spec.ts

# Continue working
# ... edit more code ...

# Check test results
node mcp-server/client.js list

# End of day: Stop MCP server
npm run mcp:down
```

## Related Documentation

- [MCP Server README](../../mcp-server/README.md) - Complete server documentation
- [Docker Test Capture](DOCKER_TEST_CAPTURE.md) - Test container setup
- [Authentication Testing](AUTH_TESTING_GUIDE.md) - Auth.js testing patterns

## Summary

The MCP server transforms testing from a blocking operation into a background process. This enables:

✅ **Continuous development** - Never wait for tests
✅ **Parallel execution** - Run multiple test suites
✅ **Faster iterations** - Get feedback without context switching
✅ **Better coverage** - Run more tests more often

Start the MCP server and keep it running throughout your development session for the best experience.
