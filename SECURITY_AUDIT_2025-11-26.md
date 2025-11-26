# Security Audit Report - Crit Fumble Gaming
**Date:** November 26, 2025
**Auditor:** Claude Code Security Review
**Scope:** Next.js proxy security, environment variable exposure, clickjacking/injection protections

---

## Executive Summary

Overall, the codebase demonstrates **strong security practices** with comprehensive security headers, proper authentication patterns, and good separation between server and client code. However, several issues were identified that require attention.

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 2 | Requires Fix |
| High | 1 | Requires Fix |
| Medium | 2 | Advisory |
| Low | 2 | Advisory |
| Info | 4 | Best Practice Notes |

---

## Detailed Findings

### CRITICAL SEVERITY

#### 1. Missing Authentication - Marketplace Commission Accept Route
**File:** `src/app/api/_future/marketplace/commissions/[id]/accept/route.ts`
**Status:** In `_future/` folder (not deployed), but needs fix before deployment

**Issue:**
- No `await auth()` call - endpoint is completely unauthenticated
- Takes `userId` from request body (line 15) instead of authenticated session
- Allows anyone to accept proposals and move funds to escrow

**Code:**
```typescript
const body = await request.json();
const { proposalId, userId } = body;  // userId from body, no auth!
```

**Risk:** An attacker can accept commission proposals for any user and manipulate funds.

**Recommendation:**
```typescript
const session = await auth();
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
const userId = session.user.id;  // Use authenticated user
```

---

#### 2. Missing Authentication - Foundry Assets Mirror Route
**File:** `src/app/api/foundry/assets/mirror/route.ts`
**Status:** Currently returns 501 (not implemented), but exposed

**Issue:**
- No authentication check on either GET or POST endpoints
- GET allows anyone to query asset mirroring status for any world
- POST allows anyone to trigger asset mirroring operations (when implemented)
- IDOR vulnerability via `worldId` parameter

**Risk:** Unauthorized data access and potential resource manipulation when fully implemented.

**Recommendation:** Add authentication and ownership verification:
```typescript
const session = await auth();
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
// Verify user has access to the world
```

---

### HIGH SEVERITY

#### 3. Plaintext Token Storage - World Anvil Integration
**File:** `src/app/api/linked-accounts/worldanvil/link/route.ts:112`

**Issue:** World Anvil user API token stored in database without encryption.

**Code:**
```typescript
worldAnvilToken: userToken, // TODO: Encrypt this in production
```

**Risk:** If database is compromised, all World Anvil user tokens are exposed, allowing attackers to impersonate users on World Anvil.

**Recommendation:** Use the existing encryption utility:
```typescript
import { encryptApiKey } from '@/lib/foundry-api';
// ...
worldAnvilToken: encryptApiKey(userToken),
```

---

### MEDIUM SEVERITY

#### 4. Legacy Encryption Method
**File:** `src/lib/foundry-api.ts`

**Issue:** Uses deprecated `crypto.createCipher()` without IV.

**Recommendation:** Upgrade to `crypto.createCipheriv()` with random IV for each encryption.

---

#### 5. Dangerous Email Account Linking
**File:** `src/packages/cfg-lib/auth.ts:40`

**Issue:**
```typescript
allowDangerousEmailAccountLinking: true,
```

This allows account linking based on email match. If a user changes their Discord email to match another account, they could potentially access that account.

**Mitigation:** The risk is acceptable for a gaming platform where Discord is the only OAuth provider, but should be reviewed if more providers are added.

---

### LOW SEVERITY

#### 6. TypeScript Build Errors Ignored
**File:** `next.config.js:101-103`

**Issue:**
```javascript
typescript: {
  ignoreBuildErrors: true,
},
```

**Risk:** Type errors that could indicate security issues may be overlooked.

**Recommendation:** Address type errors and enable type checking in builds.

---

#### 7. Unsafe-eval in CSP
**File:** `next.config.js:58`

**Issue:** CSP includes `'unsafe-eval'` which is required by Next.js but reduces XSS protections.

**Status:** This is a known Next.js requirement and is acceptable.

---

## Positive Security Findings

### Environment Variable Protection
- **No NEXT_PUBLIC_ exposure of secrets** - All sensitive variables (API keys, tokens, secrets) are properly server-only
- **No process.env in client components** - Client components receive data via props from server components
- **Proper .gitignore** - All .env files are excluded from version control

#### NEXT_PUBLIC_ Variable Audit

All `NEXT_PUBLIC_` variables were reviewed - only public URLs are exposed:

| Variable | Location | Risk | Notes |
|----------|----------|------|-------|
| `NEXT_PUBLIC_BASE_URL` | .env.example, steam route | None | Public site URL |
| `NEXT_PUBLIC_APP_URL` | src/lib/qr-utils.ts | None | Public site URL |

**No sensitive variables use the `NEXT_PUBLIC_` prefix.** The previous issue with `NEXT_PUBLIC_FOUNDRY_API_TOKEN` was already fixed - the token is now server-only with a proxy at `/api/foundry/sync`.

Variables that could be candidates for renaming (removing `NEXT_PUBLIC_`):
- None found - all current public variables are appropriately public

### Security Headers (next.config.js)
All major security headers are properly configured:

| Header | Value | Status |
|--------|-------|--------|
| Strict-Transport-Security | max-age=63072000; includeSubDomains; preload | Excellent |
| X-Frame-Options | SAMEORIGIN | Protected |
| X-Content-Type-Options | nosniff | Protected |
| X-XSS-Protection | 1; mode=block | Protected |
| Referrer-Policy | strict-origin-when-cross-origin | Good |
| Content-Security-Policy | Comprehensive policy | Good |
| frame-ancestors | 'self' | Clickjacking protected |
| Permissions-Policy | camera=(), microphone=(), geolocation=() | Good |

### Authentication & Authorization
- **Database sessions** with 30-day max age
- **Secure cookies** (httpOnly, secure in production, sameSite: lax)
- **Rate limiting** on auth endpoints (5 attempts/15 minutes)
- **Consistent auth patterns** in API routes using `await auth()`

### Injection Protection
- **No dangerouslySetInnerHTML usage** in the codebase
- **No eval() or new Function()** usage
- **Prisma ORM** with parameterized queries (no raw SQL injection risk)
- **React auto-escaping** prevents XSS

### Proxy/API Security
- **Foundry API token kept server-side** via proxy at `/api/foundry/sync`
- **Rate limiting** on API routes (100 req/min general, stricter for auth)
- **Owner-only access** for expensive AI routes

---

## Compliance Checklist

### OWASP Top 10 Coverage

| Risk | Status | Notes |
|------|--------|-------|
| A01 Broken Access Control | Partial | Fix Critical #1, #2 |
| A02 Cryptographic Failures | Partial | Fix High #3, Medium #4 |
| A03 Injection | Pass | Prisma + React escaping |
| A04 Insecure Design | Pass | Good architecture |
| A05 Security Misconfiguration | Pass | Headers configured |
| A06 Vulnerable Components | Review | Run `npm audit` |
| A07 Auth Failures | Pass | NextAuth properly configured |
| A08 Data Integrity Failures | Pass | N/A |
| A09 Security Logging | Pass | Console logging for admin actions |
| A10 SSRF | Pass | No user-controlled URLs in fetch |

---

## Recommendations Summary

### Immediate Action Required
1. Add authentication to `/api/_future/marketplace/commissions/[id]/accept`
2. Add authentication to `/api/foundry/assets/mirror`
3. Encrypt World Anvil tokens before database storage

### Short-term Improvements
4. Upgrade crypto methods in `foundry-api.ts` to use IV
5. Run `npm audit` and address vulnerabilities
6. Enable TypeScript build checks

### Best Practices
7. Consider implementing a centralized auth middleware
8. Add request logging for security audit trail
9. Implement CSRF tokens for state-changing forms
10. Review `allowDangerousEmailAccountLinking` if adding OAuth providers

---

## Files Reviewed

- `next.config.js` - Security headers, CSP
- `src/packages/cfg-lib/auth.ts` - NextAuth configuration
- `src/packages/cfg-lib/rate-limit.ts` - Rate limiting
- `src/app/api/**/*.ts` - API route authentication patterns
- `src/components/**/*.tsx` - Client components for env exposure
- `src/lib/*.ts` - Utility functions and encryption

---

## Conclusion

The codebase shows mature security practices with comprehensive headers, proper authentication patterns, and good client/server separation. The critical issues identified are in stub/future code that is not yet deployed, but should be fixed before deployment. The high-severity token storage issue should be addressed in the current production code.

**Overall Security Posture:** Good, with specific improvements needed

---

*Report generated by security audit on 2025-11-26*
