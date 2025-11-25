# MCP Server Setup for Claude Code

This guide shows you how to configure Claude Code to use the local MCP server for running Playwright tests in the background.

## What is the MCP Server?

The MCP (Model Context Protocol) server allows Claude Code to:
- Run Playwright tests in the background while you continue working
- Test against local dev server OR staging environment
- Monitor test progress and retrieve results
- Access test artifacts (screenshots, videos, reports)

## Prerequisites

1. Node.js installed
2. Playwright installed (`npm install`)
3. MCP server dependencies installed

## Step 1: Install MCP Server Dependencies

```bash
cd mcp-server
npm install
```

## Step 2: Start the MCP Server

```bash
# From the project root
cd mcp-server
npm start
```

The server will start on `http://localhost:3333`

You should see:
```
MCP Server listening on 0.0.0.0:3333
Available tools:
  - run_playwright_tests: Run tests in background
  - get_test_status: Get test run status
  - get_test_output: Get test output logs
  - list_test_runs: List all test runs
  - get_test_artifacts: Get test artifacts
```

## Step 3: Configure Claude Code MCP Settings

### Find Your Claude Code Config File

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**Mac**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`

### Add the MCP Server Configuration

Open the config file and add this configuration:

```json
{
  "mcpServers": {
    "crit-fumble-playwright": {
      "command": "node",
      "args": [
        "C:\\Users\\hobda\\Projects\\Crit-Fumble\\www.crit-fumble.com\\mcp-server\\index.js"
      ],
      "env": {
        "MCP_PORT": "3333",
        "MCP_HOST": "0.0.0.0"
      }
    }
  }
}
```

**IMPORTANT**: Update the path in `args` to match your actual project location.

### Alternative: HTTP-based Configuration (if process-based doesn't work)

```json
{
  "mcpServers": {
    "crit-fumble-playwright": {
      "url": "http://localhost:3333/mcp"
    }
  }
}
```

## Step 4: Restart Claude Code

1. Close Claude Code completely
2. Start the MCP server: `cd mcp-server && npm start`
3. Open Claude Code
4. The MCP server should now be available

## Step 5: Verify Connection

In Claude Code, you can now ask:

> "Run the login dashboard tests using the MCP server"

Or directly use the tool:

```
run_playwright_tests({
  testFile: "tests/integration/10-login-dashboard-flow.spec.ts",
  project: "chromium"
})
```

## Using the MCP Server

### Run Tests Locally

```javascript
run_playwright_tests({
  testFile: "tests/integration/10-login-dashboard-flow.spec.ts",
  project: "chromium"
})
```

### Run Tests Against Staging

```javascript
run_playwright_tests({
  testFile: "tests/integration/10-login-dashboard-flow.spec.ts",
  project: "chromium",
  baseUrl: "https://www-crit-fumble-com-2025-git-staging-hobdaytrains-projects.vercel.app"
})
```

### Filter Tests by Name

```javascript
run_playwright_tests({
  grep: "Dashboard",
  project: "chromium"
})
```

### Exclude Visual Regression Tests

```javascript
run_playwright_tests({
  testFile: "tests/integration/10-login-dashboard-flow.spec.ts",
  grepInvert: "Visual Regression",
  project: "chromium"
})
```

### Get Test Status

```javascript
get_test_status({
  testId: "abc123def456"
})
```

### Get Test Output

```javascript
get_test_output({
  testId: "abc123def456",
  tail: 50  // Last 50 lines
})
```

### List Recent Test Runs

```javascript
list_test_runs({
  limit: 10
})
```

### Get Test Artifacts

```javascript
get_test_artifacts({
  testId: "abc123def456"
})
```

## Workflow Example

1. **Start MCP Server** (in separate terminal):
   ```bash
   cd mcp-server && npm start
   ```

2. **In Claude Code**, ask to run tests:
   > "Run the dashboard tests in the background"

3. **Continue working** while tests run

4. **Check status** when ready:
   > "What's the status of the test run?"

5. **View artifacts**:
   > "Show me the screenshots from the last test run"

## Troubleshooting

### MCP Server Not Connecting

1. Check server is running: `curl http://localhost:3333/health`
2. Verify config path is correct in `claude_desktop_config.json`
3. Check Claude Code logs for errors
4. Restart both server and Claude Code

### Tests Not Running

1. Verify Playwright is installed: `npx playwright --version`
2. Check test file path is correct
3. Ensure project root is correct in MCP server config
4. Check MCP server logs for errors

### Can't Find Screenshots

1. Screenshots are in: `tests/screenshots/`
2. Check test actually ran (not just queued)
3. Verify test completed successfully
4. Use `get_test_artifacts` to see what was generated

## Advanced: Running with Docker

To run tests in Docker containers (isolated environment):

```javascript
run_playwright_tests({
  testFile: "tests/integration/10-login-dashboard-flow.spec.ts",
  project: "chromium",
  useDocker: true
})
```

This requires Docker Desktop to be running.

## Environment Variables

You can set these in your terminal before starting the MCP server:

```bash
# Custom port
export MCP_PORT=4444

# Custom host
export MCP_HOST=127.0.0.1

# Playwright base URL (default test target)
export PLAYWRIGHT_BASE_URL=http://localhost:3000

# Start server
cd mcp-server && npm start
```

## Next Steps

1. Configure staging environment in Vercel
2. Update `baseUrl` to point to staging
3. Run tests against staging from your local machine
4. Review screenshots automatically generated

## Benefits

✅ **Non-blocking**: Tests run in background while you code
✅ **Flexible**: Test locally or against staging
✅ **Fast feedback**: Get status without waiting
✅ **Visual review**: Auto-generated screenshots
✅ **Multi-browser**: Test across Chrome, Firefox, Safari
