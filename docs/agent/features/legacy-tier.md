# LEGACY Tier System

## Overview

The **LEGACY** tier is a special admin-only tier designed to reward long-time community members (5+ years) with monthly Crit-Coins as a thank you for their loyalty. It cannot be purchased or self-assigned - only admins can grant it.

## Tier Structure

### Tier Values

The tier enum is ordered specifically:

```typescript
enum UserTier {
  LEGACY  // -1: Admin-only, for 5+ year members
  FREE    //  0: Default tier (everyone starts here)
  PRO     //  1: Paid tier (stubbed, TBD)
  PLUS    //  2: Paid tier (stubbed, TBD)
  MAX     //  3: Paid tier (stubbed, TBD)
}
```

### Monthly Coin Allocations

```typescript
const MONTHLY_COINS_BY_TIER = {
  LEGACY: 5,  // Grants 5 coins per month (free loyalty benefit)
  FREE: 0,    // No monthly coins
  PRO: -1,    // Costs platform (paid tier, stubbed)
  PLUS: -1,   // Costs platform (paid tier, stubbed)
  MAX: -1,    // Costs platform (paid tier, stubbed)
}
```

**Key Points:**
- **LEGACY** grants **5 Crit-Coins** per month automatically
- **FREE** grants **0 coins** (default tier)
- **Paid tiers** (PRO/PLUS/MAX) have negative values indicating they cost the platform money (stubbed out for future implementation)

## LEGACY Tier Details

### Eligibility

LEGACY tier is for:
- Community members who have been active for **5+ years**
- Players who have significantly contributed to the community
- At admin's discretion

### Benefits

1. **5 Crit-Coins per month** - Automatically credited
2. **Same feature access as FREE tier** - No additional premium features (for now)
3. **Special badge** - Shows LEGACY status in UI
4. **Permanent** - Once granted, not revoked unless necessary

### Limitations

- Cannot be purchased or self-assigned
- Only admins can grant LEGACY tier
- Does not grant additional features (same as FREE)
- Monthly coins are the primary benefit

## Assigning LEGACY Tier

### Via Admin API

**Endpoint:** `PATCH /api/admin/users/:userId/tier`

**Request:**
```typescript
PATCH /api/admin/users/user-uuid-here/tier
Authorization: <admin session>
Content-Type: application/json

{
  "tier": "LEGACY"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-uuid",
    "username": "longtime_member",
    "tier": "LEGACY"
  },
  "message": "Tier updated to LEGACY"
}
```

### Via SQL (Manual)

```sql
-- Assign LEGACY tier to a user
UPDATE "crit_users"
SET "tier" = 'LEGACY'
WHERE email = 'longtime-member@example.com';

-- Or by username
UPDATE "crit_users"
SET "tier" = 'LEGACY'
WHERE username = 'longtime_member';

-- Or by Discord ID
UPDATE "crit_users"
SET "tier" = 'LEGACY'
WHERE discord_id = 'discord-id-here';
```

### Verification

Check if assignment worked:

```sql
SELECT id, username, tier, created_at, last_monthly_coins_granted
FROM "crit_users"
WHERE tier = 'LEGACY';
```

## Monthly Coin Distribution

### Automatic Distribution

Monthly coins should be distributed via a **cron job** that runs once per day (or once per month):

```bash
# Example cron (daily at 1 AM)
0 1 * * * curl -X POST https://your-domain.com/api/admin/coins/distribute \
  -H "Authorization: Bearer <admin-token>"
```

### Manual Distribution (Admin)

**Trigger distribution for all eligible users:**

```typescript
POST /api/admin/coins/distribute
Authorization: <admin session>
```

**Response:**
```json
{
  "success": true,
  "processed": 10,
  "granted": 8,
  "errors": 0,
  "message": "Distributed coins to 8 out of 10 eligible users"
}
```

**Check who's eligible (without distributing):**

```typescript
GET /api/admin/coins/distribute
Authorization: <admin session>
```

**Response:**
```json
{
  "eligible": [
    {
      "id": "user-1",
      "username": "legacy_member_1",
      "tier": "LEGACY",
      "monthlyCoins": 5,
      "lastGranted": "2024-10-15T12:00:00.000Z"
    },
    {
      "id": "user-2",
      "username": "legacy_member_2",
      "tier": "LEGACY",
      "monthlyCoins": 5,
      "lastGranted": null
    }
  ],
  "count": 2,
  "totalCoins": 10
}
```

### Distribution Logic

The system prevents duplicate grants:

1. Checks if user's tier grants positive coins (LEGACY = 5)
2. Checks `lastMonthlyCoinsGranted` timestamp
3. Only grants if:
   - Never granted before, OR
   - Different month/year than last grant
4. Creates `CritCoinTransaction` with `transactionType: 'credit'`
5. Updates `lastMonthlyCoinsGranted` to current timestamp

### Transaction Record

When coins are granted, a transaction is created:

```typescript
{
  playerId: "user-uuid",
  amount: 5,
  transactionType: "credit",
  description: "Monthly tier bonus (LEGACY)",
  metadata: {
    source: "monthly_tier_grant",
    tier: "LEGACY",
    grantedAt: "2024-11-24T12:00:00.000Z"
  }
}
```

## Helper Functions

All functions are in [`src/lib/coin-distribution.ts`](../src/lib/coin-distribution.ts):

### Check Eligibility

```typescript
import { isEligibleForMonthlyCoins } from '@/lib/coin-distribution'

const eligible = await isEligibleForMonthlyCoins(userId)
// Returns true if user should receive coins this month
```

### Grant Coins to One User

```typescript
import { grantMonthlyCoins } from '@/lib/coin-distribution'

const result = await grantMonthlyCoins(userId)
// { success: true, coins: 5 } or { success: false, error: "..." }
```

### Grant Coins to All Eligible Users

```typescript
import { grantMonthlyCoinsToAll } from '@/lib/coin-distribution'

const result = await grantMonthlyCoinsToAll()
// { processed: 10, granted: 8, errors: 0 }
```

### Get Eligible Users

```typescript
import { getEligibleUsersForMonthlyCoins } from '@/lib/coin-distribution'

const users = await getEligibleUsersForMonthlyCoins()
// Returns array of users eligible for coins this month
```

## Paid Tiers (PRO/PLUS/MAX)

Paid tiers are **currently stubbed out** and will be implemented when features are ready.

### Current State

- **Feature access**: Currently same as FREE (all features stubbed)
- **Monthly coins**: Set to `-1` (placeholder for "costs platform money")
- **Pricing**: Not yet determined
- **Features**: To be defined when implemented

### When to Implement

Implement paid tiers when you have:
1. Premium features to offer
2. Clear value proposition for each tier
3. Stripe integration set up
4. Pricing determined

### Updating Paid Tiers

When ready to implement, update:

1. **Feature limits** in `src/lib/permissions.ts`:
   ```typescript
   const TIER_FEATURES = {
     maxWorlds: {
       FREE: 3,
       LEGACY: 3,
       PRO: 10,    // Update when ready
       PLUS: 25,   // Update when ready
       MAX: Infinity,  // Update when ready
     },
     // ... other features
   }
   ```

2. **Monthly coins** (if giving coins to paid tiers):
   ```typescript
   const MONTHLY_COINS_BY_TIER = {
     LEGACY: 5,
     FREE: 0,
     PRO: 10,    // Example: PRO gets 10 coins/month
     PLUS: 20,   // Example: PLUS gets 20 coins/month
     MAX: 50,    // Example: MAX gets 50 coins/month
   }
   ```

3. **Pricing** in Stripe dashboard and `getTierPricing()` function

## Monitoring

### View All LEGACY Users

```sql
SELECT
  id,
  username,
  email,
  tier,
  created_at,
  last_monthly_coins_granted,
  (SELECT COUNT(*) FROM "crit_coin_transactions"
   WHERE player_id = crit_users.id AND transaction_type = 'credit') as total_transactions
FROM "crit_users"
WHERE tier = 'LEGACY'
ORDER BY created_at ASC;
```

### View Coin Distribution History

```sql
SELECT
  u.username,
  u.tier,
  t.amount,
  t.description,
  t.created_at,
  t.metadata
FROM "crit_coin_transactions" t
JOIN "crit_users" u ON t.player_id = u.id
WHERE t.description LIKE '%Monthly tier bonus%'
ORDER BY t.created_at DESC
LIMIT 50;
```

### Check Distribution Status

```sql
-- Users who haven't received coins this month yet
SELECT
  username,
  tier,
  last_monthly_coins_granted,
  EXTRACT(MONTH FROM last_monthly_coins_granted) as last_grant_month,
  EXTRACT(MONTH FROM CURRENT_DATE) as current_month
FROM "crit_users"
WHERE tier = 'LEGACY'
  AND (
    last_monthly_coins_granted IS NULL
    OR EXTRACT(MONTH FROM last_monthly_coins_granted) != EXTRACT(MONTH FROM CURRENT_DATE)
    OR EXTRACT(YEAR FROM last_monthly_coins_granted) != EXTRACT(YEAR FROM CURRENT_DATE)
  );
```

## Security

### Admin-Only Access

- Only users with `isAdmin: true` or `isOwner: true` can:
  - Assign LEGACY tier
  - Trigger coin distribution
  - View distribution status

### Audit Trail

All tier changes and coin distributions are logged:

```typescript
console.log(`[Admin] ${adminId} changed ${username}'s tier from ${oldTier} to ${newTier}`)
console.log(`[CoinDistribution] Granted ${coins} coins to ${username} (${tier})`)
```

### Preventing Abuse

- Monthly coins can only be granted once per month
- `lastMonthlyCoinsGranted` timestamp prevents duplicate grants
- Admin actions are logged for audit
- Only eligible tiers (positive coin values) receive grants

## Future Enhancements

### Potential Improvements

1. **Variable Legacy Benefits**
   - Different LEGACY levels (LEGACY_1, LEGACY_2, etc.)
   - More coins for longer membership

2. **Automatic LEGACY Promotion**
   - Check account age in background job
   - Auto-promote 5+ year members
   - Send notification email

3. **LEGACY Perks**
   - Exclusive content access
   - Priority support
   - Special events
   - Cosmetic badges/flair

4. **Coin Marketplace**
   - Spend coins on platform features
   - Buy/sell assets
   - Gift coins to other users

5. **Analytics Dashboard**
   - Track coin economy
   - Monitor distribution costs
   - User tier breakdown

## Related Files

- Schema: [prisma/schema.prisma](../prisma/schema.prisma)
- Permissions: [src/lib/permissions.ts](../src/lib/permissions.ts)
- Coin Distribution: [src/lib/coin-distribution.ts](../src/lib/coin-distribution.ts)
- Admin Tier API: [src/app/api/admin/users/[userId]/tier/route.ts](../src/app/api/admin/users/[userId]/tier/route.ts)
- Admin Coin API: [src/app/api/admin/coins/distribute/route.ts](../src/app/api/admin/coins/distribute/route.ts)
- Migration: [prisma/migrations/20251124000003_add_user_tiers/](../prisma/migrations/20251124000003_add_user_tiers/)
- General Tiers Doc: [TIERS_AND_PERMISSIONS.md](./TIERS_AND_PERMISSIONS.md)
