# User Tiers and Permissions System

## Overview

The Crit-Fumble platform uses a tier-based system to control access to features and resources. Each user is assigned a tier (FREE, PRO, PLUS, or MAX) that determines their feature limits. Additionally, users can have Admin or Owner roles for platform management.

## User Tiers

### FREE (Default)

**Cost:** Free

**Features:**
- Up to 3 worlds
- Up to 5 characters per world
- 100 MB storage
- Basic features
- Community support

**Limitations:**
- No advanced features
- No AI tools
- No data export
- No API access
- No custom branding

### PRO

**Cost:** $9.99/month

**Features:**
- Up to 10 worlds
- Up to 15 characters per world
- 500 MB storage
- Advanced features
- Data export
- API access
- Priority support

**Upgrade Benefits:**
- More worlds and characters
- 5x more storage
- Export your data
- Integrate with API

### PLUS

**Cost:** $19.99/month

**Features:**
- Up to 25 worlds
- Up to 30 characters per world
- 2 GB storage
- All Pro features
- AI-powered tools
- Campaign analytics
- Advanced automation
- Priority support

**Upgrade Benefits:**
- AI content generation
- Smart recommendations
- Automated world-building
- Campaign insights

### MAX

**Cost:** $49.99/month

**Features:**
- Unlimited worlds
- Unlimited characters
- Unlimited storage
- All Plus features
- Custom branding
- White-label options
- Dedicated support
- Early access to features

**Upgrade Benefits:**
- Remove all limits
- Your brand, your way
- Dedicated account manager
- Beta feature access

## Roles

### Regular User

**Default role for all users.**

Permissions:
- Access based on tier
- Can create and manage own content
- Can join campaigns
- Can use platform features within tier limits

### Admin

**Elevated privileges for platform management.**

Permissions:
- All regular user permissions
- Manage users (view, edit, suspend)
- Manage content (edit any world, character, etc.)
- Access admin dashboard
- View platform analytics
- Configure platform settings
- No tier limits (unlimited resources)

**Who can be Admin:**
- Designated by Owner
- Multiple admins allowed
- Can be added/removed by Owner

### Owner

**Full platform control (you!).**

Permissions:
- All admin permissions
- Manage admins (add, remove)
- Access financial data
- Configure billing
- Platform-level settings
- Cannot be restricted
- No tier limits

**Who can be Owner:**
- Only one owner should exist
- Full unrestricted access
- Cannot be demoted or restricted

## Database Schema

### UserTier Enum

```prisma
enum UserTier {
  FREE  // Default tier
  PRO   // Pro tier
  PLUS  // Plus tier
  MAX   // Max tier
}
```

### CritUser Fields

```prisma
model CritUser {
  // ... other fields ...

  tier    UserTier @default(FREE) // Subscription tier
  isAdmin Boolean  @default(false) // Admin role
  isOwner Boolean  @default(false) // Owner role
}
```

## Permission Checks

### Helper Functions

All permission functions are in [`src/lib/permissions.ts`](../src/lib/permissions.ts).

#### Check User Tier

```typescript
import { getUserPermissions, hasTierOrHigher } from '@/lib/permissions'

const user = await getUserPermissions(userId)
if (!user) throw new Error('User not found')

// Check if user has PRO or higher
if (hasTierOrHigher(user.tier, 'PRO')) {
  // User can access PRO features
}
```

#### Check Admin/Owner

```typescript
import { isAdminOrOwner, isOwner } from '@/lib/permissions'

if (isAdminOrOwner(user)) {
  // User is admin or owner
}

if (isOwner(user)) {
  // User is owner (full control)
}
```

#### Check Feature Access

```typescript
import { canAccessFeature } from '@/lib/permissions'

const canUseAI = canAccessFeature(user, {
  minTier: 'PLUS', // Requires PLUS tier or higher
})

const canManageUsers = canAccessFeature(user, {
  requiresAdmin: true, // Requires admin or owner
})

const canConfigureBilling = canAccessFeature(user, {
  requiresOwner: true, // Requires owner
})
```

#### Check Feature Limits

```typescript
import { getFeatureLimit, canPerformAction } from '@/lib/permissions'

// Get specific limit
const maxWorlds = getFeatureLimit(user.tier, 'maxWorlds')
console.log(`You can create ${maxWorlds} worlds`)

// Check if action is allowed
if (canPerformAction(user.tier, 'canUseAI')) {
  // User can use AI features
}
```

#### Check if Limit Reached

```typescript
import { hasReachedLimit } from '@/lib/permissions'

const reachedWorldLimit = await hasReachedLimit(userId, 'worlds')
if (reachedWorldLimit) {
  throw new Error('You have reached your world limit. Upgrade to create more.')
}
```

### Tier Hierarchy

Tiers have a hierarchy - higher tiers include all features of lower tiers:

```
FREE < PRO < PLUS < MAX
```

When checking tier access:
- `hasTierOrHigher('MAX', 'PRO')` returns `true`
- `hasTierOrHigher('FREE', 'PRO')` returns `false`

### Role Hierarchy

```
Owner > Admin > Regular User
```

- **Owner** can do everything, including managing admins
- **Admins** can manage users and content, but not other admins
- **Regular users** have access based on their tier

## Feature Limits

### Current Limits

Defined in [`src/lib/permissions.ts`](../src/lib/permissions.ts):

| Feature | FREE | PRO | PLUS | MAX |
|---------|------|-----|------|-----|
| Max Worlds | 3 | 10 | 25 | ∞ |
| Max Characters per World | 5 | 15 | 30 | ∞ |
| Max Storage (MB) | 100 | 500 | 2000 | ∞ |
| Advanced Features | ✗ | ✓ | ✓ | ✓ |
| AI Features | ✗ | ✗ | ✓ | ✓ |
| Custom Branding | ✗ | ✗ | ✗ | ✓ |
| Data Export | ✗ | ✓ | ✓ | ✓ |
| API Access | ✗ | ✓ | ✓ | ✓ |

### Bypassing Limits

**Admins and Owner automatically bypass all tier limits:**
- No world limit
- No character limit
- No storage limit
- Access to all features

This allows platform management without restrictions.

## UI Components

### Tier Badge

Display user's tier with color coding:

```typescript
import { getTierDisplayName, getTierColor } from '@/lib/permissions'

const tierName = getTierDisplayName(user.tier) // "Pro"
const colors = getTierColor(user.tier)

<span className={`${colors.bg} ${colors.text} px-2 py-1 rounded`}>
  {tierName}
</span>
```

### Role Badge

Display admin/owner badge:

```typescript
import { getRoleBadge } from '@/lib/permissions'

const badge = getRoleBadge(user)
if (badge) {
  <span className={`${badge.color} px-2 py-1 rounded text-xs font-medium`}>
    {badge.text}
  </span>
}
```

### Feature Gate

Show upgrade prompt when feature is locked:

```typescript
if (!canAccessFeature(user, { minTier: 'PRO' })) {
  return (
    <div className="p-4 border border-blue-300 bg-blue-50 rounded-lg">
      <p>This feature requires a PRO subscription.</p>
      <button>Upgrade to Pro</button>
    </div>
  )
}
```

## API Enforcement

### Protecting API Routes

Always check permissions in API routes:

```typescript
import { auth } from '@/lib/auth'
import { getUserPermissions, canAccessFeature } from '@/lib/permissions'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await getUserPermissions(session.user.id)
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Check if user can access this feature
  if (!canAccessFeature(user, { minTier: 'PRO' })) {
    return NextResponse.json(
      { error: 'This feature requires a PRO subscription' },
      { status: 403 }
    )
  }

  // Proceed with action...
}
```

### Checking Limits

Before creating resources:

```typescript
import { hasReachedLimit } from '@/lib/permissions'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user has reached world limit
  const reachedLimit = await hasReachedLimit(session.user.id, 'worlds')
  if (reachedLimit) {
    return NextResponse.json(
      {
        error: 'You have reached your world limit',
        upgrade: true,
      },
      { status: 403 }
    )
  }

  // Create world...
}
```

## Setting Up Roles

### Make Yourself Owner

After running the migration, set yourself as owner:

**By Email:**
```sql
UPDATE "crit_users"
SET "is_owner" = true
WHERE email = 'your-email@example.com';
```

**By Discord ID:**
```sql
UPDATE "crit_users"
SET "is_owner" = true
WHERE discord_id = 'your-discord-id';
```

**By Username:**
```sql
UPDATE "crit_users"
SET "is_owner" = true
WHERE username = 'your-username';
```

### Promoting Users to Admin

Via SQL:
```sql
UPDATE "crit_users"
SET "is_admin" = true
WHERE email = 'admin@example.com';
```

Via API (owner only):
```typescript
// TODO: Create admin management API endpoint
PATCH /api/admin/users/:userId
{
  "isAdmin": true
}
```

## Upgrading Tiers

### Manual Upgrade (for testing)

```sql
UPDATE "crit_users"
SET "tier" = 'PRO'
WHERE id = 'user-uuid';
```

### Stripe Integration (future)

1. User clicks "Upgrade to Pro"
2. Redirected to Stripe checkout
3. After payment, webhook updates tier
4. User gains immediate access

**Webhook handler:**
```typescript
export async function POST(req: NextRequest) {
  const event = await stripe.webhooks.constructEvent(...)

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const userId = session.metadata.userId
    const tier = session.metadata.tier as UserTier

    await prisma.critUser.update({
      where: { id: userId },
      data: { tier },
    })
  }
}
```

## Migration

Run the migration to add tiers:

```bash
npx prisma migrate deploy
```

**What it does:**
1. Creates `UserTier` enum
2. Adds `tier` column (defaults to FREE)
3. Adds `is_owner` column
4. Creates indexes for efficient queries
5. All existing users are FREE tier

## Security Considerations

### Owner Protection

- Only one owner should exist
- Owner cannot be demoted or restricted
- Owner access should be audited
- Use environment variables for owner identification

### Admin Permissions

- Admins can manage users but not other admins
- Only owner can promote/demote admins
- Admin actions should be logged
- Admins bypass tier limits (for management purposes)

### Tier Enforcement

- Always check tier in API routes
- Client-side checks are for UX only (not security)
- Log tier violations for abuse detection
- Implement rate limiting for free tier

## Monitoring & Analytics

### Track Feature Usage by Tier

```typescript
// Log feature usage
await prisma.featureUsageLog.create({
  data: {
    userId,
    feature: 'ai_generation',
    tier: user.tier,
    timestamp: new Date(),
  },
})
```

### Conversion Tracking

Track when users upgrade:

```typescript
await prisma.tierChange.create({
  data: {
    userId,
    fromTier: 'FREE',
    toTier: 'PRO',
    timestamp: new Date(),
    source: 'upgrade_button',
  },
})
```

## Testing

### Test Tier Access

```typescript
import { canAccessFeature } from '@/lib/permissions'

describe('Tier Permissions', () => {
  it('FREE tier cannot use AI', () => {
    const user = { tier: 'FREE', isAdmin: false, isOwner: false }
    expect(canPerformAction(user.tier, 'canUseAI')).toBe(false)
  })

  it('PLUS tier can use AI', () => {
    const user = { tier: 'PLUS', isAdmin: false, isOwner: false }
    expect(canPerformAction(user.tier, 'canUseAI')).toBe(true)
  })

  it('Owner bypasses all checks', () => {
    const user = { tier: 'FREE', isAdmin: false, isOwner: true }
    expect(canAccessFeature(user, { requiresOwner: true })).toBe(true)
  })
})
```

## Future Enhancements

### Potential Features

1. **Team Plans**
   - Organization accounts
   - Shared resources
   - Multiple team members

2. **Custom Tiers**
   - Enterprise pricing
   - Custom limits
   - Negotiated features

3. **Trial Periods**
   - Free PRO trial
   - Temporary tier upgrade
   - Convert to paid

4. **Usage-Based Pricing**
   - Pay per world
   - Pay per storage
   - Flexible pricing

5. **Referral Program**
   - Earn tier upgrades
   - Discount on subscriptions
   - Credit system

## Related Files

- Schema: [prisma/schema.prisma](../prisma/schema.prisma)
- Permissions lib: [src/lib/permissions.ts](../src/lib/permissions.ts)
- Migration: [prisma/migrations/20251124000003_add_user_tiers/](../prisma/migrations/20251124000003_add_user_tiers/)
