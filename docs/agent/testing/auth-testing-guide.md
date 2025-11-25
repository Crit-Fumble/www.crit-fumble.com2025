# Authentication Testing Guide

## Overview

This guide documents the authentication testing patterns used in the Crit Fumble platform, including how to write integration tests for Auth.js v5 (NextAuth) with a custom Prisma adapter and Player model.

## Architecture

### Custom Authentication Setup

- **Auth Library**: Auth.js v5 (NextAuth) with App Router
- **Session Strategy**: Database sessions (30-day expiry)
- **Database**: PostgreSQL via Prisma ORM
- **Custom Model**: `Player` instead of `User`
- **Custom Adapter**: `CustomPrismaAdapter` that maps `playerId` ↔ `userId`

### Key Files

| File | Purpose |
|------|---------|
| [`src/packages/cfg-lib/auth.ts`](../../src/packages/cfg-lib/auth.ts) | NextAuth configuration with cookie settings |
| [`src/packages/cfg-lib/prisma-adapter.ts`](../../src/packages/cfg-lib/prisma-adapter.ts) | Custom adapter with Player/User mapping |
| [`src/app/api/test-auth/route.ts`](../../src/app/api/test-auth/route.ts) | Test helper for creating sessions |
| [`tests/integration/09-auth-debug.spec.ts`](../../tests/integration/09-auth-debug.spec.ts) | Debug test with detailed logging |
| [`tests/integration/08-user-login-flow.spec.ts`](../../tests/integration/08-user-login-flow.spec.ts) | Complete login flow with captures |

---

## Critical Configuration

### 1. Cookie Configuration (auth.ts)

The explicit cookie configuration in `auth.ts` is **critical** for session recognition:

```typescript
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: CustomPrismaAdapter(),
  providers: [/* ... */],
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      },
    },
  },
})
```

**Why this is needed**: Without explicit cookie configuration, Auth.js may not correctly read the session cookie, causing authentication to fail even when sessions exist in the database.

### 2. Custom Adapter with getSessionAndUser()

The `CustomPrismaAdapter` must override `getSessionAndUser()` to map between the custom `Player` model and Auth.js expectations:

```typescript
async getSessionAndUser(sessionToken) {
  const sessionAndPlayer = await prisma.session.findUnique({
    where: { sessionToken },
    include: { player: true },
  })

  if (!sessionAndPlayer) return null

  const { player, ...session } = sessionAndPlayer

  // Check expiration
  if (session.expires < new Date()) {
    return null
  }

  // Return with userId mapping
  return {
    session: {
      sessionToken: session.sessionToken,
      userId: session.playerId, // Map playerId to userId
      expires: session.expires,
    },
    user: {
      id: player.id,
      name: player.username,
      email: player.email || '',
      emailVerified: null,
    },
  }
}
```

**Why this is needed**: The base PrismaAdapter expects `Session.userId`, but our schema uses `Session.playerId`. This method bridges the gap.

---

## Test Helper: test-auth API

### Purpose

The `/api/test-auth` endpoint creates test sessions without requiring OAuth provider interaction, essential for automated testing.

### Usage

**Create a test session:**

```typescript
const authData = await page.evaluate(async ({ email, username }) => {
  const res = await fetch('/api/test-auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // CRITICAL: Include cookies
    body: JSON.stringify({ email, username }),
  });
  return res.json();
}, { email: testEmail, username: testUsername });
```

**Response:**

```json
{
  "success": true,
  "sessionToken": "abc123...",
  "userId": "player-uuid",
  "playerId": "player-uuid",
  "username": "testuser",
  "email": "test@example.com",
  "expiresAt": "2025-12-20T23:42:29.214Z"
}
```

### Implementation Details

The test-auth route:
1. Uses **database transactions** for atomic record creation
2. Creates: Player → Account → Session → PlayerSession
3. **Verifies** the session after creation
4. Sets `next-auth.session-token` cookie
5. Returns session details for debugging

---

## Integration Testing Patterns

### Pattern 1: Basic Authentication Test

```typescript
test('user can authenticate', async ({ page }) => {
  const timestamp = Date.now();

  // Create test session
  const authData = await page.evaluate(async ({ email, username }) => {
    const res = await fetch('/api/test-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, username }),
    });
    return res.json();
  }, {
    email: `test-${timestamp}@example.com`,
    username: `testuser_${timestamp}`
  });

  expect(authData.success).toBe(true);

  // Verify authentication
  await page.goto('/dashboard');
  await expect(page).toHaveURL('/dashboard');
});
```

### Pattern 2: Login Flow with Screenshots

```typescript
test('capture complete login journey', async ({ page }) => {
  const timestamp = Date.now();
  const screenshotPath = `user-login-flow/${timestamp}`;

  // Step 1: Unauthenticated state
  await page.goto('/');
  await page.waitForURL('/login');
  await page.screenshot({
    path: `tests/screenshots/${screenshotPath}/01-login-page.png`,
    fullPage: true,
  });

  // Step 2: Authenticate
  const authData = await page.evaluate(async ({ email, username }) => {
    const res = await fetch('/api/test-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, username }),
    });
    return res.json();
  }, {
    email: `test-${timestamp}@example.com`,
    username: `testuser_${timestamp}`
  });

  expect(authData.success).toBe(true);

  // Step 3: Verify redirect
  await page.goto('/');
  await page.waitForURL('/dashboard');
  await page.screenshot({
    path: `tests/screenshots/${screenshotPath}/02-dashboard.png`,
    fullPage: true,
  });
});
```

### Pattern 3: Debug Test with Detailed Logging

```typescript
test('debug auth flow', async ({ page }) => {
  console.log('========================================');
  console.log('AUTH DEBUG TEST');
  console.log('========================================\n');

  // Check initial state
  await page.goto('/');
  const initialUrl = page.url();
  console.log('Initial URL:', initialUrl);

  // Create session
  const authData = await page.evaluate(async ({ email, username }) => {
    const res = await fetch('/api/test-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, username }),
    });
    return {
      status: res.status,
      data: await res.json(),
    };
  }, { email: 'debug@test.com', username: 'debuguser' });

  console.log('Auth Response:', authData);

  // Check cookies
  const cookies = await context.cookies();
  console.log('Cookies:', cookies.map(c => ({ name: c.name, domain: c.domain })));

  // Test dashboard access
  await page.goto('/dashboard');
  const finalUrl = page.url();
  console.log('Final URL:', finalUrl);

  expect(finalUrl).toContain('/dashboard');
});
```

---

## Common Pitfalls

### ❌ Using `page.request.post()`

**Problem**: Creates session but cookie isn't accessible to the browser context.

```typescript
// DON'T DO THIS
const response = await page.request.post('/api/test-auth', {
  data: { email, username },
});
```

**Solution**: Use `page.evaluate()` with `fetch()`:

```typescript
// DO THIS
const authData = await page.evaluate(async ({ email, username }) => {
  const res = await fetch('/api/test-auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Critical!
    body: JSON.stringify({ email, username }),
  });
  return res.json();
}, { email, username });
```

### ❌ Missing Cookie Configuration

**Problem**: Auth.js doesn't recognize sessions even though they're in the database.

**Solution**: Add explicit `cookies` configuration to `auth.ts` (see Critical Configuration above).

### ❌ Not Overriding getSessionAndUser()

**Problem**: Base PrismaAdapter looks for `Session.userId` but schema has `Session.playerId`.

**Solution**: Override `getSessionAndUser()` in CustomPrismaAdapter to map fields correctly.

---

## Debugging Authentication Issues

### 1. Check if Session Cookie is Set

```typescript
const cookies = await page.context().cookies();
const sessionCookie = cookies.find(c => c.name === 'next-auth.session-token');
console.log('Session cookie:', sessionCookie);
```

### 2. Verify Session in Database

```typescript
// In test-auth route or via Prisma Studio
const session = await prisma.session.findUnique({
  where: { sessionToken },
  include: { player: true },
});
console.log('DB Session:', session);
```

### 3. Check Server Logs

Add logging to `CustomPrismaAdapter`:

```typescript
async getSessionAndUser(sessionToken) {
  console.log('[CustomAdapter] getSessionAndUser called with token:',
    sessionToken?.substring(0, 20) + '...');

  const sessionAndPlayer = await prisma.session.findUnique({
    where: { sessionToken },
    include: { player: true },
  });

  console.log('[CustomAdapter] Found session:', !!sessionAndPlayer);
  // ...
}
```

### 4. Test Auth API Directly

```bash
curl -X POST http://localhost:3000/api/test-auth \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser"}'
```

Expected response: `{"success":true,"sessionToken":"...","userId":"...","...}`

---

## Best Practices

### ✅ Use Unique Identifiers

Always use timestamps or UUIDs to avoid test collisions:

```typescript
const timestamp = Date.now();
const testEmail = `test-${timestamp}@example.com`;
const testUsername = `user_${timestamp}`;
```

### ✅ Wait for Cookie Propagation

After authentication, give the browser time to process the cookie:

```typescript
await page.evaluate(/* auth call */);
await page.waitForTimeout(500); // Small delay
await page.goto('/dashboard');
```

### ✅ Clean Up Test Data

The test-auth API supports cleanup:

```typescript
await page.request.delete('/api/test-auth', {
  data: { sessionToken },
});
```

### ✅ Use Database Transactions

In test-auth route, wrap related operations in transactions:

```typescript
const { player, sessionToken } = await prisma.$transaction(async (tx) => {
  const player = await tx.player.create(/* ... */);
  await tx.session.create(/* ... */);
  return { player, sessionToken };
});
```

---

## Running Tests

### Individual Test File

```bash
npm run test:e2e -- tests/integration/09-auth-debug.spec.ts --project=chromium
```

### Specific Test

```bash
npm run test:e2e -- tests/integration/09-auth-debug.spec.ts --project=chromium --grep "should debug complete"
```

### With Video Recording

Videos are automatically recorded per Playwright config:

```bash
npm run test:e2e -- tests/integration/08-user-login-flow.spec.ts
# Videos saved to: tests/videos/
```

### With Screenshots

Screenshots are captured explicitly in tests:

```bash
# Saved to: tests/screenshots/user-login-flow/{timestamp}/
```

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Session cookie not set | Using `page.request.post()` | Use `page.evaluate()` with `fetch()` and `credentials: 'include'` |
| Dashboard redirects to login | Missing cookie config | Add `cookies` section to `auth.ts` |
| `getSessionAndUser()` not called | Cookie name mismatch | Ensure cookie name matches Auth.js expectation |
| Session found but user null | Missing adapter override | Implement `getSessionAndUser()` in custom adapter |
| Tests pass but auth fails in browser | Environment mismatch | Check `NODE_ENV` and cookie `secure` setting |

---

## Related Documentation

- [Next.js 15 App Router](https://nextjs.org/docs/app)
- [Auth.js v5 Documentation](https://authjs.dev)
- [Playwright Testing](https://playwright.dev)
- [Prisma Adapters](https://authjs.dev/reference/adapter/prisma)

---

## Summary

The key to successful Auth.js testing:

1. **Explicit cookie configuration** in auth.ts
2. **Custom adapter override** for `getSessionAndUser()`
3. **Transaction-wrapped** session creation in test-auth
4. **`page.evaluate()` with `credentials: 'include'`** for authentication
5. **Detailed logging** for debugging

With these patterns, you can reliably test authentication flows and capture the user journey with screenshots and videos.
