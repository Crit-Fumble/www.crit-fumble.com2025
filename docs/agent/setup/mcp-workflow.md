# MCP Interactive Workflow

This document demonstrates how to use the MCP server's interactive tools to automate UI testing and interactions.

## Available Tools

### Core Actions

1. **cfg_login** - Authenticate and create a session
2. **cfg_tap** - Click/tap an element by test ID
3. **cfg_fill** - Fill an input field by test ID
4. **cfg_logout** - End a session

### Session Management

- **get_session_info** - Get details about a session
- **list_sessions** - List all active sessions

## Basic Workflow

### Step 1: Login

```bash
curl -X POST http://localhost:3333/call-tool \
  -H "Content-Type: application/json" \
  -d '{
    "name": "cfg_login",
    "args": {
      "viewport": "desktop",
      "theme": "dark"
    }
  }'
```

**Response includes:**
- `sessionId` - Use this for subsequent actions
- Dashboard screenshot (base64 embedded)
- List of interactive elements with their test IDs
- Session info (playerId, username, email, critCoins)

### Step 2: Click an Element

Using the sessionId from login, click an element:

```bash
curl -X POST http://localhost:3333/call-tool \
  -H "Content-Type: application/json" \
  -d '{
    "name": "cfg_tap",
    "args": {
      "testId": "user-menu-button",
      "sessionId": "YOUR_SESSION_ID_HERE",
      "viewport": "desktop"
    }
  }'
```

**Response includes:**
- Screenshot after the click
- Updated list of visible elements
- Element count

### Step 3: Fill an Input Field

```bash
curl -X POST http://localhost:3333/call-tool \
  -H "Content-Type: application/json" \
  -d '{
    "name": "cfg_fill",
    "args": {
      "testId": "search-input",
      "value": "Sample text",
      "sessionId": "YOUR_SESSION_ID_HERE",
      "viewport": "desktop"
    }
  }'
```

**Response includes:**
- Screenshot after filling the input
- Updated list of visible elements

### Step 4: Check Session Info

```bash
curl -X POST http://localhost:3333/call-tool \
  -H "Content-Type: application/json" \
  -d '{
    "name": "get_session_info",
    "args": {
      "sessionId": "YOUR_SESSION_ID_HERE"
    }
  }'
```

### Step 5: Logout

```bash
curl -X POST http://localhost:3333/call-tool \
  -H "Content-Type: application/json" \
  -d '{
    "name": "cfg_logout",
    "args": {
      "sessionId": "YOUR_SESSION_ID_HERE",
      "viewport": "desktop"
    }
  }'
```

## Example: Complete Flow

This example demonstrates a complete workflow: login, open user menu, and logout.

```javascript
// 1. Login
const loginResponse = await fetch('http://localhost:3333/call-tool', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'cfg_login',
    args: { viewport: 'desktop', theme: 'dark' }
  })
});

const loginData = await loginResponse.json();
const sessionId = JSON.parse(loginData.content[0].text).sessionId;
const elements = JSON.parse(loginData.content[0].text).interactive_elements.top_10;

console.log('Logged in with sessionId:', sessionId);
console.log('Available elements:', elements.map(e => e.testId));

// 2. Click user menu button
const tapResponse = await fetch('http://localhost:3333/call-tool', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'cfg_tap',
    args: {
      testId: 'user-menu-button',
      sessionId: sessionId,
      viewport: 'desktop'
    }
  })
});

const tapData = await tapResponse.json();
console.log('User menu opened:', JSON.parse(tapData.content[0].text));

// 3. Logout
const logoutResponse = await fetch('http://localhost:3333/call-tool', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'cfg_logout',
    args: { sessionId: sessionId, viewport: 'desktop' }
  })
});

console.log('Logged out successfully');
```

## Test IDs Available After Login

From the login response, you'll see test IDs like:
- `logo-link` - Crit Fumble Gaming logo
- `theme-toggle` - Toggle between light/dark theme
- `user-menu-button` - User menu dropdown
- `crit-coin-balance` - Display of Crit Coins
- `welcome-header` - Welcome message section

## Notes

- **Session Persistence**: Sessions are stored in-memory on the MCP server. They persist until the server restarts or the session is explicitly logged out.
- **Viewport Options**: `desktop` (1920x1080) or `mobile` (375x667)
- **Theme Options**: `light` or `dark`
- **Element Selection**: Always use `data-testid` attributes for reliable element selection
- **Screenshots**: Each action returns a full-page screenshot embedded as base64 in the response

## Building Complex Workflows

You can chain multiple actions together:

1. **cfg_login** - Authenticate
2. **cfg_tap** - Navigate to a page
3. **cfg_fill** - Enter form data
4. **cfg_tap** - Submit the form
5. **cfg_tap** - Click on a result
6. **cfg_logout** - Clean up

Each step can use the sessionId from the login response to maintain authentication state.

## Future: Batch Operations

The MCP server also includes a `cfg_batch` tool (in development) that will allow executing multiple actions in a single request:

```json
{
  "name": "cfg_batch",
  "args": {
    "sessionId": "...",
    "actions": [
      { "type": "tap", "testId": "menu-button" },
      { "type": "fill", "testId": "search", "value": "query" },
      { "type": "tap", "testId": "search-button" }
    ]
  }
}
```

This will enable more complex workflows with a single HTTP request.
