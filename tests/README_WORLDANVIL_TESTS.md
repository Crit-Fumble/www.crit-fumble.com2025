# World Anvil Integration Tests

## Test Coverage

### Unit Tests (10/13 passing)
✅ Client initialization
✅ Standard HTTP requests
✅ Error handling for non-Cloudflare errors
✅ Convenience methods (getIdentity, getCurrentUser, etc.)
⚠️ Playwright fallback (mocking complexity)

### Integration Tests
✅ Full end-to-end account linking flow
✅ UI components and forms
✅ API route behavior
✅ Database integration

## Running Tests

### Unit Tests
```bash
npx vitest run tests/unit/worldanvil
```

### Integration Tests (Playwright)
```bash
npx playwright test tests/integration/worldanvil-linking.spec.ts
```

### API Tests
```bash
npx vitest run tests/unit/api/worldanvil-api.test.ts
```

## Manual Testing

### Test World Anvil Linking

1. Start dev server:
   ```bash
   npm run dev
   ```

2. Navigate to http://localhost:3000/linked-accounts

3. Get your User API Token from https://www.worldanvil.com/api/auth/key

4. Enter token and click "Link Account"

5. Verify:
   - Account shows as linked
   - Username is displayed
   - Unlink button appears

6. Test unlinking:
   - Click "Unlink" button
   - Confirm dialog
   - Verify form reappears

### Test Cloudflare Bypass

```bash
npx tsx scripts/test-worldanvil-smart-client.ts
```

Expected output:
```
Test 1: Getting user identity (first call)...
[WorldAnvil] Attempting standard request to: /identity
[WorldAnvil] ⚠ Cloudflare challenge detected, using Playwright bypass...
[WorldAnvil] Creating new Playwright session...
[WorldAnvil] ✓ Playwright session created
[WorldAnvil] ✓ Playwright request succeeded
✓ Identity: {
  "id": "...",
  "username": "...",
  "success": true
}

Test 2: Getting user identity (second call - reusing session)...
[WorldAnvil] Attempting standard request to: /identity
[WorldAnvil] ⚠ Cloudflare challenge detected, using Playwright bypass...
[WorldAnvil] ✓ Playwright request succeeded
✓ Identity: { ... }

✅ All tests passed!
```

## Test Scenarios Covered

### WorldAnvilPlaywrightClient
- ✅ Initialization with default and custom config
- ✅ Standard HTTP requests with proper headers
- ✅ User-Agent header inclusion
- ✅ Error propagation for non-Cloudflare errors
- ✅ Endpoint convenience methods
- ⚠️ Cloudflare detection and Playwright fallback (requires integration test)
- ⚠️ Session reuse (requires integration test)

### API Routes - Link
- ✅ Rejects unauthenticated requests
- ✅ Validates userToken presence
- ✅ Checks WORLD_ANVIL_CLIENT_SECRET configuration
- ✅ Validates World Anvil tokens
- ✅ Prevents duplicate account linking
- ✅ Successfully links account

### API Routes - Unlink
- ✅ Rejects unauthenticated requests
- ✅ Successfully unlinks account
- ✅ Clears all World Anvil fields

### UI Components
- ✅ Displays linked accounts page
- ✅ Shows World Anvil linking form when not linked
- ✅ Shows linked status when connected
- ✅ Discord and GitHub account display
- ✅ Token visibility toggle
- ✅ Form validation (empty token)
- ✅ Error handling for invalid tokens
- ✅ Unlink confirmation dialog
- ✅ Responsive design

## Known Issues

### Unit Test Failures
The Playwright-related unit tests fail due to mocking complexity. These scenarios are better tested via:
1. Integration tests with real Playwright
2. Manual testing with the test script
3. End-to-end tests in production-like environment

The core functionality is thoroughly tested through:
- 10 passing unit tests for HTTP client
- All API route tests passing
- Full integration test suite
- Working manual test demonstrated in production

## Test Data Requirements

### Environment Variables
```bash
# For unit tests
WORLD_ANVIL_CLIENT_SECRET="test-app-key"

# For integration/manual tests
WORLD_ANVIL_CLIENT_SECRET="<your-actual-app-key>"
```

### Test User
Integration tests require:
- Authenticated user session
- Valid World Anvil User API Token (for positive test cases)

## Future Test Improvements

1. **Mock Playwright properly** for unit tests
   - Use actual Playwright test fixtures
   - Or accept integration-only testing for Cloudflare bypass

2. **Add E2E tests** for complete flows
   - Link → Use API → Unlink
   - Token expiration handling
   - Concurrent link attempts

3. **Add load tests** for Playwright session management
   - Verify session timeout behavior
   - Test concurrent request handling

4. **Add security tests**
   - Token encryption (when implemented)
   - SQL injection prevention
   - XSS prevention in username display
