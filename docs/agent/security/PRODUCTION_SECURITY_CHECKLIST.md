# Production Security Checklist

**Target**: Public Staging Environment on Vercel (Auth-Based)
**Date**: November 24, 2025
**Status**: 🟡 IN PROGRESS

---

## Executive Summary

For a public, auth-based staging environment, we need to ensure:
1. ✅ **Financial routes are protected** (COMPLETE)
2. ⚠️ **All API routes require authentication** (IN PROGRESS)
3. ⚠️ **Rate limiting is applied** (PENDING)
4. ⚠️ **Environment variables are secure** (NEEDS REVIEW)
5. ⚠️ **Vercel-specific security** (PENDING)

---

## 🔴 CRITICAL: Must Fix Before Public Launch

### 1. Unprotected API Routes (HIGH PRIORITY)

These routes currently have **NO AUTHENTICATION** and will be exposed to the public internet:

#### Game Data Routes (26 routes) - Should require authentication
```
❌ /api/rpg/campaigns (GET/POST)
❌ /api/rpg/campaigns/[id] (GET/PUT/DELETE)
❌ /api/rpg/campaigns/[id]/players (GET/POST/DELETE)
❌ /api/rpg/campaigns/[id]/worlds (GET/POST)
❌ /api/rpg/attributes (GET/POST)
❌ /api/rpg/boards (GET/POST)
❌ /api/rpg/boards/[id] (GET/PUT/DELETE)
❌ /api/rpg/books (GET/POST)
❌ /api/rpg/cards (GET/POST)
❌ /api/rpg/characters (GET/POST)
❌ /api/rpg/creatures (GET/POST)
❌ /api/rpg/decks (GET/POST)
❌ /api/rpg/dice (GET/POST)
❌ /api/rpg/events (GET/POST)
❌ /api/rpg/goals (GET/POST)
❌ /api/rpg/hands (GET/POST)
❌ /api/rpg/history (GET/POST)
❌ /api/rpg/locations (GET/POST)
❌ /api/rpg/modes (GET/POST)
❌ /api/rpg/objects (GET/POST)
❌ /api/rpg/rules (GET/POST)
❌ /api/rpg/sessions (GET/POST)
❌ /api/rpg/sessions/[id] (GET/PUT/DELETE)
❌ /api/rpg/systems (GET/POST)
❌ /api/rpg/tables (GET/POST)
❌ /api/rpg/tiles (GET/POST)
❌ /api/rpg/tiles/[id] (GET/PUT/DELETE)
❌ /api/rpg/types (GET/POST)
❌ /api/rpg/voxels (GET/POST)
```

**Risk**: Anyone on the internet can:
- List all campaigns, characters, creatures
- Create/modify/delete game data
- Access other users' private game content
- Pollute database with spam

**Recommendation**:
- **GET requests**: Require authentication, show only user's own data
- **POST/PUT/DELETE**: Require authentication + ownership checks
- Consider making campaigns/sessions public-readable but write-protected

---

#### Marketplace Routes (4 routes) - Should require authentication
```
❌ /api/marketplace/commissions/[id]/proposals (GET/POST)
❌ /api/marketplace/commissions/[id]/accept (POST)
❌ /api/marketplace/commissions/[id]/submit (POST)
❌ /api/marketplace/commissions/[id]/review (POST)
```

**Risk**:
- Create fake proposals
- Accept commissions as other users
- Submit work as someone else
- Leave fake reviews

**Recommendation**: Require authentication + strict ownership checks

---

#### Admin Routes (2 routes) - Verify owner-only protection
```
⚠️ /api/admin/users/[userId]/tier (PATCH) - Need to verify owner-only
⚠️ /api/admin/coins/distribute (POST) - Need to verify owner-only
```

**Action Required**: Audit these routes to ensure owner-only access

---

#### AI Routes (3 routes) - Should require authentication + rate limiting
```
❌ /api/ai/assist (POST)
❌ /api/ai/gm (POST)
❌ /api/ai/generate (POST)
```

**Risk**:
- API key abuse (OpenAI/Anthropic costs)
- Unlimited usage = $$$$ bills
- DDoS via expensive AI calls

**Recommendation**:
- Require authentication
- Implement **STRICT** rate limiting (5 requests/minute per user)
- Add cost tracking/budgets
- Consider owner-only for staging

---

#### Foundry Routes (5 routes) - Need authentication
```
❌ /api/foundry/instance (GET/POST/DELETE)
❌ /api/foundry/activity (GET)
❌ /api/foundry/snapshot (POST)
❌ /api/foundry/assets (GET/POST)
❌ /api/foundry/assets/mirror (POST)
```

**Risk**:
- Anyone can spin up/delete Foundry instances (DigitalOcean costs!)
- Access server activity logs
- Mirror assets (bandwidth costs)

**Recommendation**: Owner-only access for staging

---

#### Test/Dev Routes (3 routes) - MUST DISABLE IN PRODUCTION
```
🔴 /api/test-worldanvil (DELETE BEFORE PRODUCTION)
🔴 /api/test-auth (DELETE BEFORE PRODUCTION)
🔴 /api/dev/verify (DELETE BEFORE PRODUCTION)
```

**Action**: Remove these routes or add environment checks:
```typescript
if (process.env.NODE_ENV === 'production') {
  return NextResponse.json({ error: 'Not available' }, { status: 404 });
}
```

---

#### User Profile Routes (6 routes) - Verify authentication
```
⚠️ /api/user/profile (GET/POST) - Verify auth
⚠️ /api/user/profile/complete (POST) - Verify auth
⚠️ /api/user/accounts (GET/POST) - Verify auth
⚠️ /api/user/accounts/[accountId] (DELETE) - Verify auth + ownership
⚠️ /api/user/accounts/primary (PUT) - Verify auth
```

**Action Required**: Audit to ensure all have authentication

---

#### Wiki Routes (2 routes) - Decide access level
```
❓ /api/wiki (GET) - Public or auth?
❓ /api/wiki/[slug] (GET/POST/PUT/DELETE) - Write needs auth
```

**Recommendation**:
- GET: Public (for SEO/discovery)
- POST/PUT/DELETE: Owner-only

---

#### Linked Account Routes (3 routes) - Verify authentication
```
⚠️ /api/linked-accounts/worldanvil/link (POST) - Verify auth
⚠️ /api/linked-accounts/worldanvil/unlink (POST) - Verify auth
⚠️ /api/auth/foundry/link (POST) - Verify auth
```

---

### 2. Rate Limiting (CRITICAL for Public API)

Currently, rate limiting exists but is **NOT APPLIED** to most routes.

**Required Rate Limits**:

```typescript
// High-cost operations (AI, Foundry)
- /api/ai/* → 5 requests/minute per user
- /api/foundry/* → 10 requests/minute per user

// Financial operations
- /api/crit/* → Already owner-only, 20 requests/minute

// Game data mutations
- POST/PUT/DELETE on /api/rpg/* → 100 requests/minute per user

// Read operations
- GET on /api/rpg/* → 200 requests/minute per user

// Unauthenticated
- Public routes → 20 requests/minute per IP
```

**Implementation**: Apply rate limiting middleware to ALL routes

---

### 3. Environment Variables (NEEDS AUDIT)

**Must Verify**:
```bash
# These should NEVER have NEXT_PUBLIC_ prefix
✅ OPENAI_API_KEY (server-only)
✅ ANTHROPIC_API_KEY (server-only)
✅ FOUNDRY_API_TOKEN (server-only)
✅ DATABASE_URL (server-only)
✅ AUTH_SECRET (server-only)
✅ DISCORD_BOT_TOKEN (server-only)

# Check Vercel environment variable settings
⚠️ Ensure all secrets are marked as "Encrypted"
⚠️ Different values for Production/Preview/Development
```

**Audit Command**:
```bash
# Find any NEXT_PUBLIC_ variables that might contain secrets
grep -r "NEXT_PUBLIC_" .env* src/
```

---

### 4. Vercel-Specific Security

#### A. Environment Variables in Vercel
- ✅ All secrets stored in Vercel dashboard
- ⚠️ Preview deployments should NOT use production database
- ⚠️ Set up separate DATABASE_URL for staging

#### B. Vercel Configuration (`vercel.json`)
```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

#### C. CORS Configuration
If you have external frontends:
```typescript
// Add CORS middleware to API routes
const allowedOrigins = [
  'https://crit-fumble.com',
  'https://staging.crit-fumble.com'
];
```

---

### 5. Database Security

#### Staging Database Setup
```bash
# Use separate database for staging
DATABASE_URL="postgresql://staging_user:password@host/staging_db"

# NOT production database
# DATABASE_URL="postgresql://prod_user:password@host/prod_db" ❌
```

#### Connection Pooling (Vercel Serverless)
```bash
# For Vercel, use Prisma connection pooling
DATABASE_URL="postgresql://..." # Direct connection
DATABASE_POOL_URL="postgresql://...?pgbouncer=true" # For serverless
```

---

## 🟡 MEDIUM PRIORITY: Should Fix Soon

### 1. Input Validation
Many routes accept arbitrary input without validation:
- Use Zod for request body validation
- Validate all query parameters
- Sanitize user-provided strings

### 2. CSRF Protection
NextAuth provides CSRF protection, but verify:
- All state-changing operations use POST/PUT/DELETE (not GET)
- No sensitive operations via query parameters

### 3. Security Headers (Next.js Config)
```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ]
  }
}
```

### 4. Logging & Monitoring
- Set up Vercel logging/analytics
- Monitor for suspicious activity patterns
- Alert on repeated 401/403 responses (potential attack)
- Track API usage (especially AI routes - cost management)

---

## 🟢 NICE TO HAVE: Future Improvements

### 1. Web Application Firewall (WAF)
- Vercel Pro includes DDoS protection
- Consider Cloudflare for additional WAF

### 2. Audit Logging
- Store all owner/admin actions in database
- Track financial transactions
- Log authentication events

### 3. Automated Security Scanning
```bash
# Add to CI/CD
npm audit
npm install -g snyk
snyk test
```

### 4. Content Security Policy (CSP)
```typescript
// Add CSP headers
'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; ..."
```

---

## 📋 Pre-Launch Checklist

### Week Before Launch
- [ ] Remove all test/dev routes
- [ ] Audit all API routes for authentication
- [ ] Apply rate limiting to all routes
- [ ] Set up staging database (separate from prod)
- [ ] Configure Vercel environment variables
- [ ] Add security headers
- [ ] Test owner-only routes as non-owner user
- [ ] Test unauthenticated access to protected routes

### Day Before Launch
- [ ] Final security scan (`npm audit`)
- [ ] Verify no secrets in code
- [ ] Check Vercel dashboard settings
- [ ] Test rate limiting
- [ ] Verify HTTPS certificate
- [ ] Test authentication flows

### Launch Day
- [ ] Monitor logs for errors
- [ ] Watch for suspicious activity
- [ ] Monitor AI API costs
- [ ] Check database connection pool

### Week After Launch
- [ ] Review audit logs
- [ ] Check for failed auth attempts
- [ ] Monitor API usage patterns
- [ ] Gather feedback on performance

---

## 🎯 Recommended Implementation Order

### Phase 1: Critical Security (DO THIS FIRST)
1. Remove test/dev routes from production
2. Add authentication to all RPG routes
3. Add authentication to marketplace routes
4. Add authentication + rate limiting to AI routes
5. Verify admin routes are owner-only

### Phase 2: Rate Limiting (DO THIS SECOND)
1. Create rate limiting middleware
2. Apply to all API routes
3. Test with rate limit exceeded scenarios

### Phase 3: Environment & Infrastructure (DO THIS THIRD)
1. Set up staging database
2. Configure Vercel environment variables
3. Add security headers
4. Test end-to-end

### Phase 4: Monitoring (DO THIS FOURTH)
1. Set up logging
2. Configure alerts
3. Monitor for 1 week

---

## 📊 Current Security Status

**Routes Secured**: 8/71 (11%)
- ✅ Crit-Coins (3 routes)
- ✅ Story Credits (4 routes)
- ✅ Marketplace commissions list (1 route)

**Routes Unsecured**: 63/71 (89%)
- ❌ Game data routes (26)
- ❌ Marketplace detail routes (4)
- ❌ AI routes (3)
- ❌ Foundry routes (5)
- ❌ Wiki routes (2)
- ❌ User routes (6)
- ❌ Linked accounts (3)
- ❌ Test routes (3)
- ❌ Admin routes (2)
- ❌ Asset routes (2)
- ❌ Auth routes (7)

**Estimated Work**: 2-3 days of focused security hardening

---

## 💰 Cost Considerations for Public Staging

### Potential Attack Vectors & Costs

1. **AI Route Abuse**
   - GPT-4: $0.03/1K tokens (input) + $0.06/1K tokens (output)
   - Claude: $0.015/1K tokens (input) + $0.075/1K tokens (output)
   - **Without rate limiting**: Could cost hundreds/thousands per day!

2. **Foundry Instance Spam**
   - DigitalOcean droplet: $6-48/month each
   - **Without auth**: Anyone could spin up 100 instances = $600-4,800/month!

3. **Database Abuse**
   - Neon/Vercel Postgres: $0.10/GB storage + $0.16/compute hour
   - **Without auth**: Spam data could fill database quickly

4. **Bandwidth**
   - Vercel: 100GB free, then $0.15/GB
   - **Without auth**: Asset mirroring could consume bandwidth

**Total Potential Loss Without Security**: $1,000-10,000/month

**With Proper Security**: ~$50-100/month (normal staging usage)

---

## 🔗 Related Documentation

- [Security Audit Report](./SECURITY_AUDIT_REPORT.md)
- [Security Best Practices](./SECURITY_BEST_PRACTICES.md)
- [Owner Restrictions Update](./SECURITY_UPDATE_OWNER_RESTRICTIONS.md)

---

**Status**: 🔴 **NOT PRODUCTION READY**
**Next Steps**: Implement Phase 1 (Critical Security) before public launch
**Target**: Complete all 4 phases before staging goes public
