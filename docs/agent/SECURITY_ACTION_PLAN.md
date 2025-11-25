# Security Action Plan

Priority-ordered list of security fixes needed based on the comprehensive audit.

---

## 🔴 CRITICAL - Fix Immediately (Before Production)

### 1. Add Authentication to Financial API Routes

**Priority**: 🔴 **CRITICAL** - **DO NOT DEPLOY WITHOUT FIXING**

**Affected Files**:
- `src/app/api/crit/coins/balance/route.ts`
- `src/app/api/crit/coins/transactions/route.ts`
- `src/app/api/crit/coins/debit/route.ts`
- `src/app/api/crit/credits/balance/route.ts`
- `src/app/api/crit/credits/transactions/route.ts`
- `src/app/api/crit/credits/cash-out/route.ts`
- `src/app/api/crit/credits/convert/route.ts`

**Fix Pattern**:
```typescript
export async function GET(request: NextRequest) {
  // Add authentication
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Remove userId from query params - use session.user.id instead
  const userId = session.user.id; // Trustworthy

  // Proceed with getting user's own balance only
  const balance = await getBalance(userId);
  return NextResponse.json({ balance });
}
```

**Why Critical**: Anyone can currently view/modify any user's financial data.

**Estimated Time**: 2-4 hours

---

### 2. Fix Marketplace Commission Creation IDOR

**Priority**: 🔴 **CRITICAL** - **DO NOT DEPLOY WITHOUT FIXING**

**Affected File**: `src/app/api/marketplace/commissions/route.ts`

**Current Problem**:
```typescript
const { userId, amount } = await request.json(); // ❌ Client provides userId
```

**Fix**:
```typescript
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Use authenticated user ID, not client-provided
  const userId = session.user.id;
  const { type, title, description, paymentType, budget, deadline } = await request.json();

  // Proceed with commission creation using session.user.id
}
```

**Why Critical**: Users can create commissions as other users, manipulating financial transactions.

**Estimated Time**: 30 minutes

---

### 3. Add Authentication to Game Data API Routes

**Priority**: 🔴 **CRITICAL**

**Affected Files** (47 total, high-priority ones listed):
- `src/app/api/rpg/boards/route.ts`
- `src/app/api/rpg/creatures/route.ts`
- `src/app/api/rpg/sessions/route.ts`
- `src/app/api/rpg/events/route.ts`
- `src/app/api/rpg/locations/route.ts`
- `src/app/api/rpg/tiles/route.ts`
- `src/app/api/rpg/tables/route.ts`
- `src/app/api/rpg/rules/route.ts`
- And 39 more...

**Fix Pattern**:
```typescript
export async function GET(request: NextRequest) {
  // 1. Add authentication
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Filter by user access
  const boards = await prisma.board.findMany({
    where: {
      OR: [
        { ownerId: session.user.id },
        { campaign: { participants: { some: { userId: session.user.id } } } },
        { isPublic: true },
      ],
    },
  });

  return NextResponse.json({ boards });
}
```

**Why Critical**: Exposes all game data to unauthenticated users.

**Estimated Time**: 8-12 hours (can be parallelized across team)

---

## 🟠 HIGH - Fix Within 1 Week

### 4. Apply Rate Limiting to All API Routes

**Priority**: 🟠 **HIGH**

**Action**: Create rate limiting middleware and apply to all routes.

**Implementation**:

Create `src/middleware.ts`:
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { apiRateLimiter, getClientIdentifier, getIpAddress, checkRateLimit } from '@/lib/rate-limit';

export async function middleware(request: NextRequest) {
  // Only rate limit API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = getIpAddress(request);
    const rateLimitResult = await checkRateLimit(
      apiRateLimiter,
      getClientIdentifier(undefined, ip)
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: { 'Retry-After': rateLimitResult.retryAfter.toString() }
        }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

**Why High Priority**: Prevents DoS attacks and API abuse.

**Estimated Time**: 2-3 hours

---

### 5. Add Input Validation to All Routes

**Priority**: 🟠 **HIGH**

**Action**: Install Zod and create validation schemas for all API routes.

**Implementation**:
```bash
npm install zod
```

Create `src/lib/validation/campaigns.ts`:
```typescript
import { z } from 'zod';

export const createCampaignSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  systemName: z.enum(['dnd5e', 'pathfinder2e', 'cypher']),
  maxPlayers: z.number().int().min(1).max(20),
  isPublic: z.boolean().default(false),
});

export const updateCampaignSchema = createCampaignSchema.partial();
```

Apply to routes:
```typescript
import { createCampaignSchema } from '@/lib/validation/campaigns';

export async function POST(request: NextRequest) {
  // ... auth checks ...

  try {
    const body = await request.json();
    const validated = createCampaignSchema.parse(body);

    // Use validated data
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    throw error;
  }
}
```

**Why High Priority**: Prevents invalid data, injection attacks, and crashes.

**Estimated Time**: 6-8 hours

---

### 6. Add Audit Logging for Financial Operations

**Priority**: 🟠 **HIGH**

**Action**: Create audit log table and log all financial transactions.

**Schema Addition** to `prisma/schema.prisma`:
```prisma
model AuditLog {
  id        String   @id @default(uuid())
  createdAt DateTime @default(now()) @map("created_at")

  // Who performed the action
  userId    String   @map("user_id")
  user      CritUser @relation(fields: [userId], references: [id])

  // What action was performed
  action    String   @db.VarChar(100) // 'debit', 'credit', 'transfer', etc.
  entity    String   @db.VarChar(100) // 'crit_coin', 'story_credit', etc.
  entityId  String?  @map("entity_id") // ID of affected resource

  // Action details
  amount    Int?     // For financial transactions
  metadata  Json     @default("{}")

  // Request context
  ipAddress String?  @map("ip_address") @db.VarChar(50)
  userAgent String?  @map("user_agent") @db.Text

  @@index([userId, createdAt])
  @@index([action, createdAt])
  @@map("audit_logs")
}
```

**Implementation**:
```typescript
async function logAudit(data: {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  amount?: number;
  metadata?: any;
  request: NextRequest;
}) {
  const ip = getIpAddress(data.request);
  const userAgent = data.request.headers.get('user-agent');

  await prisma.auditLog.create({
    data: {
      userId: data.userId,
      action: data.action,
      entity: data.entity,
      entityId: data.entityId,
      amount: data.amount,
      metadata: data.metadata || {},
      ipAddress: ip,
      userAgent,
    },
  });
}

// Usage in financial route:
await logAudit({
  userId: session.user.id,
  action: 'debit',
  entity: 'crit_coin',
  amount: debitAmount,
  metadata: { reason: 'commission_payment', commissionId },
  request,
});
```

**Why High Priority**: Required for fraud detection, debugging, and compliance.

**Estimated Time**: 4-6 hours

---

## 🟡 MEDIUM - Fix Within 2 Weeks

### 7. Remove Dangerous Email Account Linking

**Priority**: 🟡 **MEDIUM**

**Action**: Remove `allowDangerousEmailAccountLinking: true` from OAuth providers.

**File**: `src/packages/cfg-lib/auth.ts`

**Change**:
```typescript
Discord({
  clientId: process.env.DISCORD_CLIENT_ID!,
  clientSecret: process.env.DISCORD_CLIENT_SECRET!,
  allowDangerousEmailAccountLinking: true, // ❌ Remove this
  // ... rest of config
}),
```

To:
```typescript
Discord({
  clientId: process.env.DISCORD_CLIENT_ID!,
  clientSecret: process.env.DISCORD_CLIENT_SECRET!,
  // Removed dangerous account linking
  // ... rest of config
}),
```

**Alternative**: Implement email verification before linking.

**Why Medium Priority**: Risk is present but requires specific attack conditions.

**Estimated Time**: 1 hour + testing

---

### 8. Add Security Headers

**Priority**: 🟡 **MEDIUM**

**Action**: Configure security headers in Next.js.

**File**: `next.config.js`

**Add**:
```javascript
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

module.exports = {
  // ... existing config
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

**Why Medium Priority**: Defense-in-depth, not critical for current functionality.

**Estimated Time**: 30 minutes

---

### 9. Implement Request/Response Logging Middleware

**Priority**: 🟡 **MEDIUM**

**Action**: Log all API requests for monitoring and debugging.

**Create**: `src/lib/logging.ts`

```typescript
export async function logRequest(request: NextRequest, userId?: string) {
  const ip = getIpAddress(request);
  const timestamp = new Date().toISOString();

  console.log(JSON.stringify({
    timestamp,
    method: request.method,
    path: request.nextUrl.pathname,
    userId: userId || 'anonymous',
    ip,
    userAgent: request.headers.get('user-agent'),
  }));
}
```

**Why Medium Priority**: Helps with debugging and security monitoring.

**Estimated Time**: 2-3 hours

---

## 🔵 LOW - Nice to Have

### 10. Add Content Security Policy (CSP)

**Priority**: 🔵 **LOW**

**Action**: Configure CSP headers to prevent XSS.

**Why Low Priority**: React already prevents most XSS, CSP is additional layer.

**Estimated Time**: 2-4 hours

---

### 11. Implement API Versioning

**Priority**: 🔵 **LOW**

**Action**: Add `/api/v1/` prefix to all routes for future versioning.

**Why Low Priority**: Not critical for current development stage.

**Estimated Time**: 4-6 hours

---

### 12. Add Monitoring and Alerting

**Priority**: 🔵 **LOW**

**Action**: Integrate Sentry or similar for error tracking and security alerts.

**Why Low Priority**: Can be added after core security fixes.

**Estimated Time**: 4-8 hours

---

## 📋 Completion Checklist

Track progress on fixes:

### Critical (Must Complete Before Production)
- [ ] Add authentication to financial API routes (Task #1)
- [ ] Fix marketplace IDOR vulnerability (Task #2)
- [ ] Add authentication to game data routes (Task #3)

### High Priority (Within 1 Week)
- [ ] Apply rate limiting middleware (Task #4)
- [ ] Add input validation with Zod (Task #5)
- [ ] Implement audit logging (Task #6)

### Medium Priority (Within 2 Weeks)
- [ ] Remove dangerous email linking (Task #7)
- [ ] Add security headers (Task #8)
- [ ] Add request/response logging (Task #9)

### Low Priority (Future Enhancement)
- [ ] Add Content Security Policy (Task #10)
- [ ] Implement API versioning (Task #11)
- [ ] Add monitoring and alerting (Task #12)

---

## 🚀 Recommended Implementation Order

**Week 1** (Critical - Do Not Deploy Without):
1. Day 1-2: Fix financial route authentication (Tasks #1, #2)
2. Day 3-5: Add authentication to game data routes (Task #3)

**Week 2** (High Priority):
3. Day 1: Apply rate limiting middleware (Task #4)
4. Day 2-3: Add input validation (Task #5)
5. Day 4-5: Implement audit logging (Task #6)

**Week 3** (Medium Priority):
6. Day 1: Remove dangerous email linking (Task #7)
7. Day 1: Add security headers (Task #8)
8. Day 2-3: Add request logging (Task #9)

**Week 4+** (Low Priority):
9. As time permits: CSP, versioning, monitoring

---

## 📊 Progress Tracking

**Started**: November 24, 2025
**Target Completion**: December 15, 2025 (3 weeks)

**Current Status**:
- ✅ Completed: Initial security audit
- ✅ Completed: Fixed FoundrySyncUI env var exposure
- ⚠️ In Progress: Critical authentication fixes
- 🔲 Pending: High priority tasks
- 🔲 Pending: Medium priority tasks

---

## 📞 Support

If you need help implementing any of these fixes:

1. Refer to `docs/agent/SECURITY_BEST_PRACTICES.md` for code examples
2. Refer to `docs/agent/SECURITY_AUDIT_REPORT.md` for detailed analysis
3. Ask team leads for code review before merging security fixes

**Remember**: Security fixes should be reviewed by at least one other team member before deployment.
