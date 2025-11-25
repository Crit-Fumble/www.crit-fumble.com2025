# Foundry VTT Bridge Authentication

## Overview

The Crit-Fumble platform uses a three-tier authentication system to securely bridge authentication between the Next.js web application, the Express bridge server, and Foundry VTT browser modules.

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   Next.js App   │      │  Express Bridge  │      │  Foundry VTT    │
│   (Port 3000)   │◄────►│   (Port 3002)    │◄────►│  (Port 30000)   │
│                 │      │                  │      │                 │
│  NextAuth/      │      │  JWT Token       │      │  Browser-based  │
│  Auth.js        │      │  Validation      │      │  ES Modules     │
│  OAuth          │      │                  │      │                 │
└─────────────────┘      └──────────────────┘      └─────────────────┘
         │                        │                         │
         └────────────────────────┴─────────────────────────┘
                    Shared PostgreSQL Database
                           (via Prisma)
```

## Architecture Components

### 1. Next.js Application (Port 3000)
- **Framework**: Next.js 15 with App Router
- **Authentication**: NextAuth/Auth.js v5
- **OAuth Providers**: Discord, GitHub
- **Session Storage**: PostgreSQL database (via Prisma)
- **Session Strategy**: Database sessions (30-day expiry)

### 2. Express Bridge Server (Port 3002)
- **Framework**: Express.js
- **Location**: `src/server/foundry-bridge.ts`
- **Purpose**: Bridge authentication between Node.js and browser environments
- **Token Type**: JWT (JSON Web Tokens)
- **Database**: Shared Prisma database with Next.js
- **CORS**: Configured for Next.js and Foundry origins

### 3. Foundry VTT Module (Port 30000)
- **Type**: Browser-based ES Module
- **Location**: `src/modules/foundry-core-concepts-api/`
- **Authentication**: JWT tokens from bridge server
- **Storage**: Browser localStorage or IndexedDB

## Authentication Flow

### Initial Authentication (OAuth)

1. **User visits Crit-Fumble website** (`http://localhost:3000`)
2. **User clicks login** → Redirected to `/login` page
3. **User selects provider** (Discord or GitHub)
4. **OAuth flow completes**:
   - NextAuth handles OAuth callback
   - User/Player record created or updated in database
   - Database session created with `sessionToken`
   - Session cookie set in browser

### Token Exchange (Next.js → Foundry VTT)

When the user opens Foundry VTT with the Core Concepts API module:

```javascript
// 1. Foundry module reads session cookie from browser
const cookies = document.cookie.split(';');
const sessionCookie = cookies.find(c => c.includes('next-auth.session-token'));
const sessionToken = sessionCookie?.split('=')[1];

// 2. Module calls Express bridge to exchange session for JWT
const response = await fetch('http://localhost:3002/auth/exchange', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ sessionToken })
});

const { token, expiresIn, user } = await response.json();

// 3. Module stores JWT token for API requests
localStorage.setItem('crit-fumble-jwt', token);
localStorage.setItem('crit-fumble-user', JSON.stringify(user));
```

### API Requests with JWT

All subsequent requests from Foundry to the bridge server include the JWT:

```javascript
// Example: Fetch sessions for current world
const token = localStorage.getItem('crit-fumble-jwt');
const response = await fetch('http://localhost:3002/api/sessions?worldId=world_123', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const sessions = await response.json();
```

## Express Bridge Endpoints

### Authentication Endpoints

#### `POST /auth/exchange`
Exchange NextAuth session token for JWT token.

**Request:**
```json
{
  "sessionToken": "abc123def456..."
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 604800,
  "user": {
    "id": "user_123",
    "username": "playerOne",
    "email": "player@example.com"
  }
}
```

**Errors:**
- `400` - Session token required
- `401` - Invalid or expired session token
- `500` - Server error

#### `POST /auth/verify`
Verify JWT token validity.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "valid": true,
  "user": {
    "userId": "user_123",
    "playerId": "user_123",
    "username": "playerOne",
    "email": "player@example.com"
  }
}
```

#### `GET /auth/me`
Get current authenticated user information.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "id": "user_123",
  "username": "playerOne",
  "email": "player@example.com",
  "discordId": "123456789",
  "discordUsername": "PlayerOne#1234",
  "githubId": "987654",
  "githubUsername": "player-one",
  "defaultRole": "player",
  "lastLoginAt": "2025-11-20T10:30:00.000Z"
}
```

### Core Concepts API Endpoints

All Core Concepts endpoints require JWT authentication via `Authorization: Bearer <token>` header.

#### Sessions
- `GET /api/sessions?worldId=<worldId>` - List all sessions for a world
- `POST /api/sessions` - Create new session

#### History
- `GET /api/history?sessionId=<sessionId>&worldId=<worldId>&limit=100` - Get session history
- `POST /api/history` - Create history entry

#### Boards (Maps)
- `GET /api/boards?worldId=<worldId>` - List all boards
- `POST /api/boards` - Create new board
- `GET /api/boards/:boardId/tiles` - Get tiles for board

#### Tiles
- `POST /api/tiles` - Create new tile

## Security Considerations

### JWT Token Security

1. **Token Expiry**: JWT tokens expire after 7 days
2. **Secret Key**: Uses `NEXTAUTH_SECRET` or `JWT_SECRET` environment variable
3. **Storage**: Tokens stored in browser localStorage (consider IndexedDB for better security)
4. **HTTPS**: Production must use HTTPS for all communications

### CORS Configuration

The bridge server only allows requests from:
- `http://localhost:3000` (Next.js dev)
- `http://localhost:30000` (Foundry VTT default port)
- `NEXT_PUBLIC_URL` environment variable
- `FOUNDRY_URL` environment variable

### Session Validation

1. Session tokens are validated against the database
2. Expired sessions are rejected
3. Session expiry checked on every token exchange

### Database Session Strategy

- NextAuth uses database sessions (not JWT sessions)
- Sessions stored in `Session` table with foreign key to `Player`
- 30-day session expiry
- Sessions can be revoked by deleting from database

## Environment Variables

Required environment variables for the bridge server:

```bash
# Required - JWT signing secret (shares with NextAuth)
NEXTAUTH_SECRET="<your-secret-key>"

# Optional - Bridge server configuration
FOUNDRY_BRIDGE_PORT="3002"           # Default: 3002
FOUNDRY_URL="http://localhost:30000" # Foundry VTT URL
NEXT_PUBLIC_URL="http://localhost:3000" # Next.js public URL

# Database (shared with Next.js)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/critfumble"
```

## Running the Bridge Server

### Development Mode

Start the bridge server with auto-reload on file changes:

```bash
npm run bridge:dev
```

### Production Mode

Start the bridge server:

```bash
npm run bridge
```

### Alongside Next.js

Recommended setup for local development:

```bash
# Terminal 1: Next.js dev server
npm run dev

# Terminal 2: Bridge server
npm run bridge:dev

# Terminal 3: Tests or other commands
npm test
```

## Troubleshooting

### "Authorization header required" Error

**Problem**: Foundry module not sending JWT token.

**Solution**: Verify token is stored and included in request:
```javascript
const token = localStorage.getItem('crit-fumble-jwt');
console.log('Token:', token); // Should not be null

fetch(url, {
  headers: {
    'Authorization': `Bearer ${token}` // Don't forget 'Bearer ' prefix
  }
});
```

### "Invalid or expired token" Error

**Problem**: JWT token expired or invalid.

**Solution**: Exchange session token for new JWT:
```javascript
// Re-authenticate with bridge server
const sessionToken = getSessionTokenFromCookie();
const response = await fetch('http://localhost:3002/auth/exchange', {
  method: 'POST',
  body: JSON.stringify({ sessionToken })
});
const { token } = await response.json();
localStorage.setItem('crit-fumble-jwt', token);
```

### "Not allowed by CORS" Error

**Problem**: Request origin not in CORS whitelist.

**Solution**: Add origin to bridge server CORS configuration:
```typescript
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:30000',
  'http://your-custom-origin:port', // Add your origin
  process.env.NEXT_PUBLIC_URL,
  process.env.FOUNDRY_URL,
].filter(Boolean);
```

### Session Cookie Not Found

**Problem**: Foundry module can't read Next.js session cookie.

**Possible causes**:
1. User not logged in to Crit-Fumble website
2. Cookie domain/path restrictions
3. Cookie expired

**Solution**:
```javascript
// Check if user is authenticated
const cookies = document.cookie;
console.log('All cookies:', cookies);

if (!cookies.includes('next-auth.session-token')) {
  console.error('Not authenticated. Please log in at http://localhost:3000');
  // Show login prompt or redirect
}
```

## Testing Authentication Flow

### Manual Testing

1. **Start all servers**:
   ```bash
   npm run dev        # Terminal 1
   npm run bridge:dev # Terminal 2
   ```

2. **Log in to website**:
   - Visit `http://localhost:3000`
   - Click "Login"
   - Authenticate with Discord or GitHub

3. **Open browser console** (F12):
   ```javascript
   // Get session token from cookie
   const sessionToken = document.cookie
     .split(';')
     .find(c => c.includes('next-auth.session-token'))
     ?.split('=')[1];

   console.log('Session Token:', sessionToken);

   // Exchange for JWT
   const response = await fetch('http://localhost:3002/auth/exchange', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ sessionToken })
   });

   const data = await response.json();
   console.log('JWT Response:', data);

   // Test authenticated request
   const sessionsResponse = await fetch(
     'http://localhost:3002/api/sessions?worldId=test_world',
     {
       headers: { 'Authorization': `Bearer ${data.token}` }
     }
   );

   const sessions = await sessionsResponse.json();
   console.log('Sessions:', sessions);
   ```

### Automated Testing

Create integration tests in `tests/integration/foundry-bridge.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Foundry Bridge Authentication', () => {
  test('should exchange session for JWT', async ({ page }) => {
    // Log in
    await page.goto('http://localhost:3000/login');
    // ... authentication flow ...

    // Get session token
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(c => c.name === 'next-auth.session-token');

    // Exchange for JWT
    const response = await page.request.post('http://localhost:3002/auth/exchange', {
      data: { sessionToken: sessionCookie.value }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.token).toBeTruthy();
    expect(data.user).toBeTruthy();
  });
});
```

## Future Enhancements

### Planned Features

1. **Token Refresh**: Automatic JWT refresh before expiry
2. **Revocation List**: Support for token revocation
3. **Rate Limiting**: Request rate limiting per user
4. **Audit Logging**: Log all authentication events
5. **Multi-factor Auth**: Optional 2FA for high-privilege operations
6. **WebSocket Support**: Real-time authentication for socket connections

### Security Improvements

1. **Token Rotation**: Rotate JWT secret periodically
2. **IP Whitelisting**: Optional IP-based access control
3. **Anomaly Detection**: Detect suspicious authentication patterns
4. **Encrypted Storage**: Use IndexedDB with encryption for token storage

## Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [JWT.io](https://jwt.io/) - JWT token debugger
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Foundry VTT API Documentation](https://foundryvtt.com/api/)

## Related Documentation

- [Core Concepts Schema](../CoreConcepts.md)
- [Database Schema](../database/SCHEMA.md)
- [API Reference](../api/README.md)
- [Foundry Module Development](../modules/FOUNDRY_DEVELOPMENT.md)
