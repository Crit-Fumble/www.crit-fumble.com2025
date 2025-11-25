# Security Best Practices Guide

Quick reference for maintaining security while developing the Crit-Fumble Gaming platform.

---

## 🔐 API Route Security Template

### ✅ Secure API Route Pattern

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isAdmin } from '@/lib/admin';
import { apiRateLimiter, getClientIdentifier, getIpAddress, checkRateLimit } from '@/lib/rate-limit';

/**
 * GET /api/resource
 * Description of what this endpoint does
 */
export async function GET(request: NextRequest) {
  try {
    // 1. RATE LIMITING (Apply first, before auth to prevent brute force)
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

    // 2. AUTHENTICATION (Check user is logged in)
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 3. AUTHORIZATION (Check user has permission)
    const user = await prisma.critUser.findUnique({
      where: { id: session.user.id },
    });

    // Example: Admin-only endpoint
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // 4. INPUT VALIDATION
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Cap at 100
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0); // Min 0

    // 5. RESOURCE OWNERSHIP CHECK (if accessing specific resource)
    const resourceId = searchParams.get('id');
    if (resourceId) {
      const resource = await prisma.resource.findUnique({
        where: { id: resourceId },
      });

      if (!resource) {
        return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
      }

      // Check ownership or appropriate permission
      if (resource.ownerId !== session.user.id && !isAdmin(user)) {
        return NextResponse.json({ error: 'Forbidden - Not authorized for this resource' }, { status: 403 });
      }
    }

    // 6. PERFORM OPERATION
    const data = await prisma.resource.findMany({
      where: { /* filters */ },
      take: limit,
      skip: offset,
    });

    // 7. RETURN SUCCESS
    return NextResponse.json({ data, count: data.length });

  } catch (error) {
    console.error('API error:', error);
    // Don't leak sensitive error details to client
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## 🚫 Common Security Mistakes

### ❌ **BAD**: Trusting Client-Provided User ID

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId'); // ❌ Can be spoofed!

  const balance = await getBalance(userId); // ❌ Anyone can access any user's balance
  return NextResponse.json({ balance });
}
```

### ✅ **GOOD**: Using Authenticated Session User ID

```typescript
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id; // ✅ Trustworthy!
  const balance = await getBalance(userId);
  return NextResponse.json({ balance });
}
```

---

### ❌ **BAD**: No Authentication

```typescript
export async function GET(request: NextRequest) {
  const boards = await prisma.board.findMany(); // ❌ Anyone can list all boards
  return NextResponse.json({ boards });
}
```

### ✅ **GOOD**: Always Check Authentication

```typescript
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only return boards user has access to
  const boards = await prisma.board.findMany({
    where: {
      OR: [
        { ownerId: session.user.id },
        { participants: { some: { userId: session.user.id } } },
      ],
    },
  });

  return NextResponse.json({ boards });
}
```

---

### ❌ **BAD**: Accepting Amount from Client Without Validation

```typescript
export async function POST(request: NextRequest) {
  const { userId, amount } = await request.json();

  await debitAccount(userId, amount); // ❌ No validation!
  return NextResponse.json({ success: true });
}
```

### ✅ **GOOD**: Validate All Financial Inputs

```typescript
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { amount } = await request.json();
  const userId = session.user.id; // ✅ From session, not client

  // Validate amount
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  }

  if (amount > 1000000) {
    return NextResponse.json({ error: 'Amount too large' }, { status: 400 });
  }

  // Check balance first
  const currentBalance = await getBalance(userId);
  if (currentBalance < amount) {
    return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
  }

  // Perform debit with audit trail
  await debitAccount(userId, amount, {
    reason: 'user_withdrawal',
    timestamp: new Date(),
  });

  return NextResponse.json({ success: true });
}
```

---

## 🔒 Environment Variables

### ✅ Server-Side Only (NEVER use `NEXT_PUBLIC_`)

```bash
# API Keys
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
FOUNDRY_API_TOKEN="..."

# Secrets
AUTH_SECRET="..."
NEXTAUTH_SECRET="..."

# Owner/Admin Access
OWNER_EMAILS='["owner@example.com"]'
DISCORD_OWNER_IDS='["id1","id2"]'
DISCORD_ADMIN_IDS='["id1","id2"]'

# Database
DATABASE_URL="postgresql://..."
```

### ✅ Client-Safe (Can use `NEXT_PUBLIC_`)

```bash
# Public URLs
NEXT_PUBLIC_STAGING_URL="https://staging.example.com"
NEXT_PUBLIC_APP_URL="https://example.com"

# Public IDs (designed to be public)
NEXT_PUBLIC_STACK_PROJECT_ID="..."
NEXT_PUBLIC_STACK_PUBLISHABLE_KEY="..."
```

### ❌ Never Do This

```typescript
// ❌ BAD: Client component with env var
'use client';
export function MyComponent() {
  const apiKey = process.env.MY_API_KEY; // ❌ Exposes to browser!
  // ...
}
```

```typescript
// ✅ GOOD: Only use in server components or API routes
export async function MyServerComponent() {
  const apiKey = process.env.MY_API_KEY; // ✅ Server-side only
  // ...
}
```

---

## 🎯 Quick Security Checklist

Before merging any PR, verify:

- [ ] All API routes have authentication (`await auth()`)
- [ ] All API routes have authorization (check user permissions)
- [ ] No `process.env` in client components (unless `NEXT_PUBLIC_`)
- [ ] Input validation on all user input
- [ ] Resource ownership checks before access/modification
- [ ] Rate limiting applied to new endpoints
- [ ] No sensitive data in error messages
- [ ] Financial operations validated and logged
- [ ] No hardcoded credentials or secrets

---

## 🛡️ Authorization Patterns

### Pattern 1: Owner-Only Access

```typescript
const session = await auth();
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

const resource = await prisma.resource.findUnique({
  where: { id: resourceId },
});

if (resource.ownerId !== session.user.id) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

### Pattern 2: Admin or Owner Access

```typescript
const session = await auth();
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

const user = await prisma.critUser.findUnique({
  where: { id: session.user.id },
});

const resource = await prisma.resource.findUnique({
  where: { id: resourceId },
});

const isOwner = resource.ownerId === session.user.id;
const isAdminUser = user && isAdmin(user);

if (!isOwner && !isAdminUser) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

### Pattern 3: Campaign Participant Access

```typescript
const session = await auth();
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

const campaign = await prisma.campaign.findUnique({
  where: { id: campaignId },
  include: {
    gameMasters: true,
    players: true,
  },
});

const isGM = campaign.gameMasters.some(gm => gm.userId === session.user.id);
const isPlayer = campaign.players.some(p => p.userId === session.user.id);
const isOwner = campaign.ownerId === session.user.id;

if (!isGM && !isPlayer && !isOwner) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

---

## 🔍 Input Validation Examples

### Validating Query Parameters

```typescript
const { searchParams } = new URL(request.url);

// String validation
const status = searchParams.get('status');
const validStatuses = ['active', 'archived', 'draft'];
if (status && !validStatuses.includes(status)) {
  return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
}

// Number validation with limits
const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50'), 1), 100);
const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

// UUID validation
const id = searchParams.get('id');
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (id && !uuidRegex.test(id)) {
  return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
}
```

### Validating Request Body with Zod

```typescript
import { z } from 'zod';

const createCampaignSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  systemName: z.enum(['dnd5e', 'pathfinder2e', 'cypher']),
  maxPlayers: z.number().int().min(1).max(20),
  isPublic: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = createCampaignSchema.parse(body);

    // Use validated data (type-safe and validated)
    const campaign = await prisma.campaign.create({
      data: {
        ...validated,
        ownerId: session.user.id,
      },
    });

    return NextResponse.json({ campaign });
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

---

## 📊 Logging Security Events

### What to Log

```typescript
// Authentication events
console.log(`[AUTH] User ${userId} logged in via ${provider}`);
console.log(`[AUTH] Failed login attempt for ${email}`);

// Authorization failures
console.log(`[AUTHZ] User ${userId} denied access to ${resource}`);

// Financial transactions
console.log(`[TRANSACTION] User ${userId} debited ${amount} coins. Reason: ${reason}`);

// Admin actions
console.log(`[ADMIN] ${adminId} granted admin to ${userId}`);
console.log(`[ADMIN] ${adminId} distributed ${amount} coins to ${recipientCount} users`);

// Security events
console.log(`[SECURITY] Rate limit exceeded for IP ${ip}`);
console.log(`[SECURITY] Suspicious activity detected: ${description}`);
```

### What NOT to Log

```typescript
// ❌ DON'T log passwords or secrets
console.log(`User password: ${password}`); // ❌ NEVER

// ❌ DON'T log full auth tokens
console.log(`Auth token: ${token}`); // ❌ NEVER

// ❌ DON'T log sensitive personal data
console.log(`User SSN: ${ssn}`); // ❌ NEVER

// ✅ DO log partial/masked data if needed
console.log(`User email: ${email.substring(0, 3)}***@${email.split('@')[1]}`);
```

---

## 🚨 Incident Response

If you discover a security vulnerability:

1. **DO NOT commit the fix to public repo immediately**
2. Report to team leads privately
3. Assess impact and affected users
4. Prepare patch
5. Deploy patch to production
6. Notify affected users if needed
7. Document incident and response

---

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/security)
- [Prisma Security](https://www.prisma.io/docs/guides/security)
- [NextAuth.js Security](https://next-auth.js.org/security)

---

**Remember**: Security is not a one-time task, it's an ongoing process. Review this guide regularly and update as new patterns emerge.
