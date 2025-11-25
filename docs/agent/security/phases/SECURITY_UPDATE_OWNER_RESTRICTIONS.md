# Security Update: Owner-Only Restrictions

**Date**: November 24, 2025
**Update Type**: Critical Security Enhancement
**Scope**: Financial API Routes (Crit-Coins & Story Credits)

---

## Summary

All financial API routes for Crit-Coins and Story Credits have been restricted to **Owner-only access**. This significantly reduces the attack surface and ensures that only the platform owner can manage the financial systems during the development phase.

---

## Changes Applied

### ✅ Crit-Coins Routes (Owner-Only)

All Crit-Coins routes now require:
1. Authentication (`await auth()`)
2. Owner verification (`isOwner(user)`)
3. Session-based user identification (no client-provided userIds)

#### Fixed Routes:

1. **`/api/crit/coins/balance` (GET)**
   - **Before**: No authentication, accepted userId from query params
   - **After**: Owner-only, uses session.user.id
   - **File**: `src/app/api/crit/coins/balance/route.ts`

2. **`/api/crit/coins/transactions` (GET/POST)**
   - **Before**: No authentication on GET, admin-only on POST
   - **After**: Owner-only for both GET and POST
   - **File**: `src/app/api/crit/coins/transactions/route.ts`
   - **POST Changes**: Owner can create transactions for any user (administrative function)

3. **`/api/crit/coins/debit` (POST)**
   - **Before**: Authentication only, userId from session but no role check
   - **After**: Owner-only access
   - **File**: `src/app/api/crit/coins/debit/route.ts`
   - **Security**: Always uses `session.user.id`, never accepts userId from client

---

### ✅ Story Credits Routes (Owner-Only)

All Story Credits routes now require:
1. Authentication (`await auth()`)
2. Owner verification (`isOwner(user)`)
3. Session-based user identification (no client-provided userIds)

#### Fixed Routes:

1. **`/api/crit/credits/balance` (GET)**
   - **Before**: No authentication, required userId in query params
   - **After**: Owner-only, uses session.user.id or optional userId query param
   - **File**: `src/app/api/crit/credits/balance/route.ts`

2. **`/api/crit/credits/transactions` (GET/POST)**
   - **Before**: No authentication on GET, no authentication on POST
   - **After**: Owner-only for both GET and POST
   - **File**: `src/app/api/crit/credits/transactions/route.ts`
   - **POST Changes**: Owner can create transactions for any user (for awarding credits)
   - **Added**: Audit logging for all owner transactions

3. **`/api/crit/credits/cash-out` (GET/POST)**
   - **Before**: No authentication, accepted userId from request body
   - **After**: Owner-only access on both methods
   - **File**: `src/app/api/crit/credits/cash-out/route.ts`
   - **POST Security**: Uses `session.user.id`, removed userId from request body
   - **Added**: Audit logging for cash-out operations

4. **`/api/crit/credits/convert` (POST)**
   - **Before**: No authentication, accepted userId from request body
   - **After**: Owner-only access
   - **File**: `src/app/api/crit/credits/convert/route.ts`
   - **Security**: Uses `session.user.id`, removed userId from request body
   - **Added**: Audit logging for conversion operations

---

### ✅ Marketplace Routes (Owner-Only)

1. **`/api/marketplace/commissions` (GET/POST)**
   - **Before**: No authentication, accepted userId from request body
   - **After**: Owner-only access on both methods
   - **File**: `src/app/api/marketplace/commissions/route.ts`
   - **POST Security**: Uses `session.user.id`, removed userId from request body
   - **Added**: Audit logging for commission creation

---

## Security Pattern Applied

All fixed routes now follow this consistent pattern:

```typescript
export async function GET/POST(request: NextRequest) {
  try {
    // 1. AUTHENTICATION: Require user to be logged in
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. AUTHORIZATION: Require owner role
    const user = await prisma.critUser.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !isOwner(user)) {
      return NextResponse.json(
        { error: 'Forbidden - Owner access required' },
        { status: 403 }
      );
    }

    // 3. USE TRUSTWORTHY USER ID: From session, not client
    const userId = session.user.id;
    // OR allow owner to specify other userId:
    // const userId = requestedUserId || session.user.id;

    // 4. VALIDATE INPUT: Check all user-provided data
    // ... validation logic ...

    // 5. PERFORM OPERATION
    // ... business logic ...

    // 6. AUDIT LOG: Record owner action
    console.log(`[OWNER_ACTION] Owner ${userId} performed action...`);

    // 7. RETURN RESPONSE
    return NextResponse.json({ success: true, ... });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

---

## Audit Logging Added

All financial operations now include audit logging:

- **`[OWNER_TRANSACTION]`**: Crit-Coins transaction creation
- **`[OWNER_COMMISSION]`**: Marketplace commission creation
- **`[OWNER_CASHOUT]`**: Story Credits cash-out
- **`[OWNER_CONVERT]`**: Story Credits → Crit-Coins conversion

Example log format:
```
[OWNER_TRANSACTION] Owner abc123 created credit transaction of 1000 coins for user xyz789. Reason: Welcome bonus
[OWNER_CASHOUT] Owner abc123 cashed out 5000 story credits ($45.00 after fees)
[OWNER_CONVERT] Owner abc123 converted 250 story credits → 300 crit-coins (bonus: 50)
```

---

## Import Changes

All fixed routes now import:
```typescript
import { auth } from '@/lib/auth';
import { isOwner } from '@/lib/admin';
```

Note: Changed from `isAdmin` to `isOwner` for stricter access control.

---

## Files Modified

### Crit-Coins (3 files)
- ✅ `src/app/api/crit/coins/balance/route.ts`
- ✅ `src/app/api/crit/coins/transactions/route.ts`
- ✅ `src/app/api/crit/coins/debit/route.ts`

### Story Credits (4 files)
- ✅ `src/app/api/crit/credits/balance/route.ts`
- ✅ `src/app/api/crit/credits/transactions/route.ts`
- ✅ `src/app/api/crit/credits/cash-out/route.ts`
- ✅ `src/app/api/crit/credits/convert/route.ts`

### Marketplace (1 file)
- ✅ `src/app/api/marketplace/commissions/route.ts`

**Total Files Modified**: 8

---

## Security Impact

### Before This Update
- ❌ Anyone could view any user's Crit-Coins balance
- ❌ Anyone could view any user's Story Credits balance
- ❌ Anyone could view transaction history for any user
- ❌ Anyone could create marketplace commissions as any user
- ❌ Anyone could cash out any user's Story Credits
- ❌ Anyone could convert any user's Story Credits to Crit-Coins
- ❌ No audit trail for financial operations

### After This Update
- ✅ Only the owner can access financial data
- ✅ Only the owner can perform financial operations
- ✅ All operations use trustworthy session-based user IDs
- ✅ Complete audit trail for all owner actions
- ✅ Clear separation between owner and user capabilities
- ✅ Ready for future role-based access when platform goes public

---

## Rationale: Why Owner-Only?

During the development/early access phase, restricting financial operations to the owner:

1. **Reduces Attack Surface**: Minimizes who can interact with critical financial systems
2. **Simplifies Testing**: Owner can test all financial flows without worrying about user abuse
3. **Protects Platform Economics**: Prevents manipulation of virtual economies before launch
4. **Enables Manual Oversight**: Owner can review all transactions during development
5. **Prepares for Future RBAC**: Easy to expand to admin/moderator/user roles later

---

## Future Enhancements

When the platform is ready for public access, consider:

1. **User Access to Own Data**:
   - Allow users to view their own balances and transactions
   - Implement user-level debit operations (purchases, etc.)
   - Add rate limiting for user financial operations

2. **Admin/Moderator Roles**:
   - Create admin role for customer support
   - Allow admins to view (but not modify) user balances
   - Implement approval workflows for large transactions

3. **Automated Systems**:
   - Allow system services to credit Story Credits (for content creation)
   - Implement Stripe webhooks for automated Crit-Coins purchases
   - Add scheduled jobs for subscription billing

4. **Enhanced Auditing**:
   - Store audit logs in database (not just console)
   - Create admin dashboard for reviewing financial activity
   - Implement alerts for suspicious transactions

---

## Testing Recommendations

1. **Verify Owner Access**:
   - Log in as owner
   - Confirm all financial routes are accessible
   - Test CRUD operations on all endpoints

2. **Verify Non-Owner Blocking**:
   - Log in as non-owner user
   - Attempt to access financial routes
   - Confirm 403 Forbidden responses

3. **Verify Unauthenticated Blocking**:
   - Send requests without authentication
   - Confirm 401 Unauthorized responses

4. **Verify Audit Logs**:
   - Perform financial operations
   - Check server logs for audit entries
   - Confirm all sensitive operations are logged

---

## Related Documentation

- **[Security Best Practices](./SECURITY_BEST_PRACTICES.md)**: Development guidelines
- **[Security Audit Report](./SECURITY_AUDIT_REPORT.md)**: Complete security audit findings
- **[Admin Permissions](../../src/lib/admin.ts)**: Owner/admin role implementation

---

**Status**: ✅ **COMPLETE**
**Next Steps**: Continue with game data API routes authentication (see Security Audit Report)
