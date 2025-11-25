# Test Authentication Guide

## Overview

This guide explains how to test authenticated routes without using real Discord/GitHub OAuth credentials.

## Test Auth Endpoint

A special `/api/test-auth` endpoint creates test sessions that bypass OAuth flows.

**SECURITY:**
- ✅ Only available in development and test environments
- ❌ Completely disabled in production
- ✅ Auto-cleanup after each test
- ✅ Uses real database sessions (same as OAuth)
- ✅ No Discord/GitHub ToS violations

## Quick Start

### Basic Authenticated Test

```typescript
import { test, expect } from '../utils/fixtures';

test('should access dashboard', async ({ authenticatedPage, screenshotHelper, testUser }) => {
  // authenticatedPage is already logged in!
  await authenticatedPage.goto('/dashboard');

  await screenshotHelper.capture('authenticated/dashboard/overview');

  console.log(`Logged in as: ${testUser.username}`);
});
```

### Unauthenticated Test

```typescript
test('should redirect to login', async ({ page, screenshotHelper }) => {
  // Regular page (not authenticatedPage) - no auth
  await page.goto('/dashboard');

  await page.waitForURL('/login');
  await screenshotHelper.capture('unauthenticated/dashboard/redirect');
});
```

## Fixtures

### `authenticatedPage`

A Playwright page that's already logged in as a test user.

```typescript
test('dashboard test', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/dashboard');
  // User is already authenticated
});
```

### `testUser`

Information about the test user.

```typescript
test('check user info', async ({ authenticatedPage, testUser }) => {
  console.log('User ID:', testUser.userId);
  console.log('Username:', testUser.username);
  console.log('Email:', testUser.email);
  console.log('Role:', testUser.role);
  console.log('Session Token:', testUser.sessionToken);
});
```

### `authenticatedContext`

A browser context with auth cookies set.

```typescript
test('multiple pages', async ({ authenticatedContext }) => {
  const page1 = await authenticatedContext.newPage();
  const page2 = await authenticatedContext.newPage();

  // Both pages share the same auth session
  await page1.goto('/dashboard');
  await page2.goto('/profile');
});
```

## Creating Custom Test Users

### Different Roles

```typescript
test('admin user', async ({ page }) => {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

  // Create admin test user
  const response = await page.request.post(`${baseURL}/api/test-auth`, {
    data: {
      role: 'admin',
      username: 'test_admin',
      email: 'admin@crit-fumble.test',
    },
  });

  const adminUser = await response.json();

  // Set cookie manually
  await page.context().addCookies([
    {
      name: 'next-auth.session-token',
      value: adminUser.sessionToken,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);

  await page.goto('/admin');

  // Cleanup
  await page.request.delete(`${baseURL}/api/test-auth`, {
    data: { userId: adminUser.userId },
  });
});
```

### Specific User Data

```typescript
test('specific user', async ({ page }) => {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

  const response = await page.request.post(`${baseURL}/api/test-auth`, {
    data: {
      role: 'player',
      userId: 'test-user-specific-id',
      username: 'gandalf_the_grey',
      email: 'gandalf@middle-earth.test',
    },
  });

  const user = await response.json();
  // Use user...

  // Cleanup
  await page.request.delete(`${baseURL}/api/test-auth`, {
    data: { userId: user.userId },
  });
});
```

## API Reference

### POST /api/test-auth

Create a test authentication session.

**Request:**
```json
{
  "role": "player" | "admin" | "moderator",
  "userId": "optional-custom-id",
  "username": "optional-username",
  "email": "optional-email"
}
```

**Response:**
```json
{
  "success": true,
  "sessionToken": "abc123...",
  "userId": "test-user-uuid",
  "username": "test_player_1234",
  "email": "test-player@crit-fumble.test",
  "role": "player",
  "expiresAt": "2024-12-19T12:00:00.000Z"
}
```

### DELETE /api/test-auth

Clean up test authentication sessions.

**Delete specific session:**
```json
{
  "sessionToken": "abc123..."
}
```

**Delete specific user:**
```json
{
  "userId": "test-user-uuid"
}
```

**Delete all test users:**
```json
{}
```

## How It Works

1. **Create User** - Test auth creates a real User record in the database
2. **Create Player** - Creates associated Player record
3. **Create Account** - Creates Account record (provider = 'test')
4. **Create Session** - Creates real Session with token
5. **Return Token** - Test uses token to authenticate

The session works exactly like a real OAuth session:
- ✅ Same database tables
- ✅ Same session validation
- ✅ Same middleware checks
- ✅ Same cookies

The only difference: it bypasses the OAuth redirect flow.

## Examples

### Test Complete Auth Flow

```typescript
test.describe('Authentication Flow', () => {
  test('should create, use, and cleanup session', async ({ page }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

    // 1. Create test session
    const authResponse = await page.request.post(`${baseURL}/api/test-auth`, {
      data: { role: 'player' },
    });

    const testUser = await authResponse.json();
    expect(testUser.success).toBe(true);

    // 2. Set cookie
    await page.context().addCookies([
      {
        name: 'next-auth.session-token',
        value: testUser.sessionToken,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);

    // 3. Access protected route
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/dashboard');

    // 4. Cleanup
    await page.request.delete(`${baseURL}/api/test-auth`, {
      data: { userId: testUser.userId },
    });

    // 5. Verify cleanup - should redirect to login
    await page.goto('/dashboard');
    await page.waitForURL('/login');
  });
});
```

### Test Multiple Users

```typescript
test('multiple users simultaneously', async ({ browser }) => {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

  // Create two users
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();

  const page1 = await context1.newPage();
  const page2 = await context2.newPage();

  // User 1
  const user1Response = await page1.request.post(`${baseURL}/api/test-auth`, {
    data: { role: 'player', username: 'player1' },
  });
  const user1 = await user1Response.json();

  await context1.addCookies([
    {
      name: 'next-auth.session-token',
      value: user1.sessionToken,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);

  // User 2
  const user2Response = await page2.request.post(`${baseURL}/api/test-auth`, {
    data: { role: 'player', username: 'player2' },
  });
  const user2 = await user2Response.json();

  await context2.addCookies([
    {
      name: 'next-auth.session-token',
      value: user2.sessionToken,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);

  // Both users access dashboard
  await page1.goto('/dashboard');
  await page2.goto('/dashboard');

  // Cleanup
  await page1.request.delete(`${baseURL}/api/test-auth`, {
    data: { userId: user1.userId },
  });
  await page2.request.delete(`${baseURL}/api/test-auth`, {
    data: { userId: user2.userId },
  });

  await context1.close();
  await context2.close();
});
```

## Security

### Why This is Safe

1. **Environment Check** - Only works in development/test
2. **Production Block** - Throws error if loaded in production
3. **Test Users Only** - Uses `@crit-fumble.test` emails
4. **Auto Cleanup** - Tests clean up after themselves
5. **Real Sessions** - Uses actual Auth.js session mechanism

### What's Blocked in Production

```typescript
// This will fail in production:
POST /api/test-auth
// Response: 403 Forbidden
// { error: "Test auth not available in production" }
```

The route file won't even load in production - it throws at import time.

## Troubleshooting

### Test auth endpoint not found

**Problem:** `404 Not Found` when calling `/api/test-auth`

**Solution:** Ensure dev server is running:
```bash
npm run dev
```

### Session not working

**Problem:** Still redirected to login despite auth

**Solution:** Check cookie domain matches:
```typescript
await context.addCookies([
  {
    name: 'next-auth.session-token',
    value: testUser.sessionToken,
    domain: 'localhost', // Must match your baseURL domain
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
  },
]);
```

### Database connection error

**Problem:** Test auth returns 500 error

**Solution:** Ensure database is running and migrations are applied:
```bash
npm run db:push
```

## Best Practices

### ✅ DO

- Use `authenticatedPage` fixture for most tests
- Clean up test users in test cleanup
- Use descriptive usernames for debugging
- Create separate users for different test scenarios

### ❌ DON'T

- Use real Discord/GitHub credentials
- Hardcode session tokens
- Forget to clean up test users
- Use test auth in production (it won't work anyway)

## Next Steps

- See [tests/integration/04-dashboard-authenticated.spec.ts](./integration/04-dashboard-authenticated.spec.ts) for examples
- Check [tests/utils/fixtures.ts](./utils/fixtures.ts) for fixture implementation
- Review [src/app/api/test-auth/route.ts](../src/app/api/test-auth/route.ts) for endpoint code
