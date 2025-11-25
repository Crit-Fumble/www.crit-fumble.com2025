# Developer Mode & Test Impersonation Guide

This guide explains how to use the developer privilege system and test impersonation features for local development and testing.

---

## Quick Start

### 1. Configure Environment Variables

Add to your `.env` file:

```env
# Developer Mode (grant admin privileges)
DEV_PHONE="+15551234567"
DEV_EMAIL="your-email@example.com"
DEV_DISCORD="123456789012345678"

# Test Impersonation (optional - for testing specific user scenarios)
IMPERSONATE_PHONE=""
IMPERSONATE_EMAIL=""
IMPERSONATE_DISCORD=""
```

### 2. Set Verification Fields on Your User

Use the developer API to set your verification fields:

```bash
# First, log in to the application via Discord/GitHub

# Then set your verification fields
curl -X POST http://localhost:3000/api/dev/verify \
  -H "Content-Type: application/json" \
  -d '{
    "verifiedPhone": "+15551234567",
    "verifiedEmail": "your-email@example.com",
    "verifiedDiscord": "123456789012345678"
  }'
```

### 3. Verify Developer Status

```bash
curl http://localhost:3000/api/dev/verify
```

---

## How It Works

### Developer Privilege System

When **all three** conditions are met, you are granted admin privileges:

1. ✅ All three `DEV_*` environment variables are set
2. ✅ Your user account has all three verification fields populated
3. ✅ Your verification fields **exactly match** the `DEV_*` values

**Example:**

```typescript
// Environment
DEV_PHONE = "+15551234567"
DEV_EMAIL = "admin@example.com"
DEV_DISCORD = "123456789012345678"

// Your User Record in Database
player.verifiedPhone = "+15551234567"
player.verifiedEmail = "admin@example.com"
player.verifiedDiscord = "123456789012345678"

// Result: isDeveloper(player) === true ✅
```

### Production Safety

In **production**, all `DEV_*` variables **must be blank**:

```env
# Production .env
DEV_PHONE=""
DEV_EMAIL=""
DEV_DISCORD=""
```

This automatically disables the developer privilege system. Even if a user has verification fields set, they won't get admin access because the environment variables are empty.

---

## Test Impersonation

Use impersonation to test different user scenarios without changing your main developer credentials.

### How It Works

```env
# Your developer credentials (always checked first)
DEV_PHONE="+15551234567"
DEV_EMAIL="admin@example.com"
DEV_DISCORD="123456789012345678"

# Impersonate a specific test user
IMPERSONATE_PHONE="+15559876543"
IMPERSONATE_EMAIL="test-user@example.com"
IMPERSONATE_DISCORD="987654321098765432"
```

In tests, use:

```typescript
import { getTestImpersonation } from '@/packages/cfg-lib/developer-privileges';

const credentials = getTestImpersonation();
// Returns IMPERSONATE_* values if set, otherwise falls back to DEV_* values

console.log(credentials);
// {
//   phone: "+15559876543",
//   email: "test-user@example.com",
//   discord: "987654321098765432"
// }
```

### Use Cases

**Testing Non-Admin Users:**
```env
IMPERSONATE_PHONE=""  # Leave blank
IMPERSONATE_EMAIL=""
IMPERSONATE_DISCORD=""
```

**Testing Specific User Scenarios:**
```env
IMPERSONATE_PHONE="+15559876543"
IMPERSONATE_EMAIL="problematic-user@example.com"
IMPERSONATE_DISCORD="999888777666555444"
```

---

## API Reference

### Check Developer Status (Code)

```typescript
import { isDeveloper } from '@/packages/cfg-lib/developer-privileges';

const player = await db.player.findUnique({
  where: { id: userId }
});

if (isDeveloper(player)) {
  // Grant admin access
  console.log('User has admin privileges');
} else {
  // Regular user
  console.log('User has standard privileges');
}
```

### Check If Developer Mode Is Enabled

```typescript
import { isDeveloperModeEnabled } from '@/packages/cfg-lib/developer-privileges';

if (isDeveloperModeEnabled()) {
  console.log('Developer mode is active (all DEV_* vars set)');
} else {
  console.log('Developer mode is disabled (production mode)');
}
```

### Get Developer Credentials

```typescript
import { getDeveloperCredentials } from '@/packages/cfg-lib/developer-privileges';

const devCreds = getDeveloperCredentials();
console.log(devCreds);
// {
//   phone: "+15551234567",
//   email: "admin@example.com",
//   discord: "123456789012345678"
// }
```

---

## Testing with Developer Privileges

### Integration Tests

The authentication test suite includes developer privilege tests:

```bash
# Run auth tests
npx playwright test tests/integration/auth-flow.spec.ts

# Run only developer privilege tests
npx playwright test tests/integration/auth-flow.spec.ts -g "Developer Privileges"
```

### Manual Testing

1. **Set up environment variables** in `.env`
2. **Log in** via Discord or GitHub
3. **Set verification fields** via API:
   ```bash
   curl -X POST http://localhost:3000/api/dev/verify \
     -H "Content-Type: application/json" \
     -d '{
       "verifiedPhone": "<your-dev-phone>",
       "verifiedEmail": "<your-dev-email>",
       "verifiedDiscord": "<your-dev-discord>"
     }'
   ```
4. **Verify status**:
   ```bash
   curl http://localhost:3000/api/dev/verify
   ```
5. **Test admin functionality** (once implemented)

---

## Security Best Practices

### ✅ Do's

- **DO** use unique, complex values for `DEV_*` variables
- **DO** keep `.env` in `.gitignore`
- **DO** clear `DEV_*` variables in staging/production
- **DO** document who has developer access
- **DO** rotate credentials periodically

### ❌ Don'ts

- **DON'T** commit `.env` to version control
- **DON'T** use production user data for `DEV_*` values
- **DON'T** share your developer credentials
- **DON'T** enable developer mode in production
- **DON'T** use simple/guessable values like "123456"

---

## Troubleshooting

### "I'm not getting admin privileges"

**Check:**
1. Are all three `DEV_*` environment variables set?
   ```bash
   echo $DEV_PHONE $DEV_EMAIL $DEV_DISCORD
   ```

2. Did you restart the server after setting env vars?
   ```bash
   npm run dev
   ```

3. Are your verification fields set correctly?
   ```bash
   curl http://localhost:3000/api/dev/verify
   ```

4. Do the values **exactly match** (case-sensitive)?
   ```typescript
   "+15551234567" !== "+1 555 123 4567"
   "admin@example.com" !== "Admin@example.com"
   ```

### "The /api/dev/verify endpoint returns 404"

**Possible causes:**
- Server not running
- Not logged in (needs authentication)
- Endpoint disabled in production mode

**Solution:**
```bash
# Check server is running
curl http://localhost:3000

# Check you're logged in (has session cookie)
# Visit http://localhost:3000/login and authenticate

# Check environment
echo $NODE_ENV $APP_ENV
```

### "Tests are failing with authentication errors"

**Check:**
1. Is the dev server running?
   ```bash
   curl http://localhost:3000
   ```

2. Are the environment variables loaded in the test environment?
   ```bash
   # In playwright.config.ts, env vars should be passed to tests
   ```

3. Is the database accessible?
   ```bash
   npx prisma db pull
   ```

---

## Integration Test Features

### CLI Input for OAuth Flows

Tests that require OAuth authorization include CLI prompts:

```typescript
// Test will pause and wait for your input
test('should complete Discord OAuth flow', async ({ page }) => {
  await page.goto('/login');
  await page.click('button:has-text("Discord")');

  // Test pauses here
  const input = await getCLIInput('Press Enter after authorizing Discord...');

  // Test continues after you press Enter
  await page.waitForURL(/dashboard/);
});
```

### Test User Management

Tests automatically create and clean up test users:

```typescript
test('my test', async ({ authenticatedPage, testUser }) => {
  // testUser is automatically created
  console.log(testUser.username); // "test_user_1234567890"

  // authenticatedPage already has valid session
  await authenticatedPage.goto('/dashboard');

  // User is automatically deleted after test
});
```

---

## Environment Variable Reference

| Variable | Required | Purpose | Example |
|----------|----------|---------|---------|
| `DEV_PHONE` | No | Developer phone (for admin check) | `"+15551234567"` |
| `DEV_EMAIL` | No | Developer email (for admin check) | `"admin@example.com"` |
| `DEV_DISCORD` | No | Developer Discord ID (for admin check) | `"123456789012345678"` |
| `IMPERSONATE_PHONE` | No | Test impersonation phone | `"+15559876543"` |
| `IMPERSONATE_EMAIL` | No | Test impersonation email | `"test@example.com"` |
| `IMPERSONATE_DISCORD` | No | Test impersonation Discord ID | `"987654321098765432"` |

---

## Related Documentation

- [Authentication Test Findings](./AUTH_TEST_FINDINGS.md) - Test results and issues
- [Playwright Configuration](../../playwright.config.ts) - Test configuration
- [Test Fixtures](../../tests/utils/fixtures.ts) - Reusable test utilities
- [Developer Privileges Source](../../src/packages/cfg-lib/developer-privileges.ts) - Implementation

---

**Last Updated:** 2025-11-20
**Maintained By:** Crit-Fumble Development Team
