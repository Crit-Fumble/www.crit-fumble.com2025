# Linked Accounts System

## Overview

The linked accounts system allows users to connect multiple OAuth accounts (Discord, GitHub, Twitch, etc.) to a single Crit-Fumble user account. Each user has an internal UUID that remains stable regardless of which accounts are linked or unlinked.

## Key Features

- **Internal User Identity**: Every user has a unique `CritUser.id` (UUID) that never changes
- **Multiple Accounts per Provider**: Users can link multiple Discord accounts, multiple GitHub accounts, etc.
- **Flexible Email/Phone Matching**: Accounts don't need matching emails to be linked
- **Primary Account Selection**: Users can choose which account's username/avatar to display
- **Safe Unlinking**: Users must have at least one linked account (prevents lockout)
- **Rich Metadata Storage**: Provider-specific data (username, avatar, etc.) stored in Account table

## Architecture

### Database Schema

#### CritUser Model
- `id`: Internal UUID (primary user identity)
- `username`: Display username (can be customized)
- `email`: Primary email (optional)
- `primaryAccountId`: Points to the Account used for display
- `accounts`: Relation to all linked OAuth accounts

#### Account Model (NextAuth Standard)
- `id`: Account UUID
- `userId`: Foreign key to CritUser
- `provider`: OAuth provider (discord, github, twitch, etc.)
- `providerAccountId`: Provider's user ID
- `metadata`: JSONB field with provider-specific data
- `displayName`: Optional custom display name
- `access_token`, `refresh_token`: OAuth tokens
- `createdAt`, `updatedAt`: Timestamps

### Metadata Schema

Each provider stores different metadata:

**Discord:**
```json
{
  "username": "user#1234",
  "discriminator": "1234",
  "avatar": "hash",
  "avatarUrl": "https://cdn.discordapp.com/avatars/...",
  "email": "user@example.com"
}
```

**GitHub:**
```json
{
  "login": "username",
  "name": "Full Name",
  "avatar_url": "https://avatars.githubusercontent.com/...",
  "email": "user@example.com"
}
```

**Twitch:**
```json
{
  "preferred_username": "username",
  "picture": "https://...",
  "email": "user@example.com"
}
```

## How It Works

### 1. User Signs In

When a user signs in with any OAuth provider:

1. NextAuth authenticates with the provider
2. `CustomPrismaAdapter.linkAccount()` is called
3. Adapter extracts provider profile data into `metadata`
4. Account record is created/updated with metadata
5. User is signed in (session uses internal `CritUser.id`)

### 2. Linking Additional Accounts

Users can link additional accounts from the Account Settings page:

1. User clicks "Link Account" for a provider
2. NextAuth OAuth flow initiates
3. After successful auth, account is linked to existing `CritUser`
4. Metadata is extracted and stored
5. Page refreshes to show new linked account

### 3. Unlinking Accounts

Users can unlink accounts (with safety check):

1. User clicks "Unlink" on an account
2. API checks if user has more than 1 account
3. If yes, account is deleted
4. If this was the primary account, `primaryAccountId` is cleared
5. If no (last account), request is rejected

### 4. Setting Primary Account

Users can choose which account's identity to display:

1. User clicks "Set as Primary" on an account
2. API updates `CritUser.primaryAccountId`
3. Helper functions use primary account for display name/avatar

## API Endpoints

### GET /api/user/accounts
Get all linked accounts for the current user.

**Response:**
```json
{
  "accounts": [
    {
      "id": "uuid",
      "provider": "discord",
      "providerAccountId": "123456789",
      "metadata": { ... },
      "displayName": null,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "primaryAccountId": "uuid"
}
```

### DELETE /api/user/accounts/:accountId
Unlink an account.

**Safety Check:** Must have at least 2 accounts.

### PATCH /api/user/accounts/:accountId
Update account settings (display name, etc.).

**Body:**
```json
{
  "displayName": "Custom Name"
}
```

### POST /api/user/accounts/primary
Set the primary account for display.

**Body:**
```json
{
  "accountId": "uuid"
}
```

## Helper Functions

All helper functions are in [`src/lib/linked-accounts.ts`](../src/lib/linked-accounts.ts):

### getUserLinkedAccounts(userId)
Get all linked accounts for a user.

### getUserAccountsByProvider(userId, provider)
Get all accounts for a specific provider.

### getUserPrimaryAccount(userId)
Get the user's primary account (or first if none set).

### getAccountDisplayName(account)
Get display name with fallback priority:
1. Custom `displayName`
2. Provider-specific username
3. Email (local part)
4. Provider + ID

### getAccountAvatarUrl(account)
Extract avatar URL from metadata.

### canUnlinkAccount(userId)
Check if user has more than 1 account (can safely unlink).

### unlinkAccount(userId, accountId)
Unlink an account with safety checks.

### setPrimaryAccount(userId, accountId)
Set primary account for display.

## UI Components

### LinkedAccountsManager
Main UI component for managing linked accounts.

**Location:** [`src/components/LinkedAccountsManager.tsx`](../src/components/LinkedAccountsManager.tsx)

**Features:**
- Shows all linked accounts grouped by provider
- "Link Account" / "Link Another" buttons
- Unlink accounts (with validation)
- Set primary account
- Shows primary account badge
- Displays avatars and usernames
- Error handling

**Usage:**
```tsx
import { LinkedAccountsManager } from '@/components/LinkedAccountsManager'
import { getUserLinkedAccounts } from '@/lib/linked-accounts'

const accounts = await getUserLinkedAccounts(userId)
const user = await prisma.critUser.findUnique({
  where: { id: userId },
  select: { primaryAccountId: true }
})

<LinkedAccountsManager
  accounts={accounts}
  primaryAccountId={user.primaryAccountId}
/>
```

## Migration Guide

### Running the Migration

The migration is located at:
[`prisma/migrations/20251124000001_linked_accounts_system/migration.sql`](../prisma/migrations/20251124000001_linked_accounts_system/migration.sql)

Run it with:
```bash
npx prisma migrate deploy
```

### What the Migration Does

1. **Schema Changes:**
   - Adds `created_at`, `updated_at` to Account table
   - Adds `metadata` JSONB field to Account table
   - Adds `display_name` to Account table
   - Adds `primary_account_id` to CritUser table
   - Creates index on `(provider, user_id)`

2. **Data Migration:**
   - Copies Discord/GitHub/Twitch data to Account.metadata
   - Sets primary account to first linked account for each user
   - Adds deprecation comments to old CritUser provider fields

3. **Backward Compatibility:**
   - Old provider fields (`discordId`, etc.) are kept for now
   - CustomPrismaAdapter updates both old and new fields
   - Can be safely removed in a future migration

## Security Considerations

### Allowing Mismatched Emails

The system uses `allowDangerousEmailAccountLinking: true` in NextAuth config. This is intentional and safe because:

1. **User Control**: Users manually link accounts from authenticated session
2. **Internal Identity**: The internal UUID is the source of truth
3. **Flexibility**: Users can link work/personal accounts with different emails
4. **No Automatic Linking**: Accounts are never linked automatically

### Preventing Account Lockout

Users must keep at least one linked account:
- API validates before unlinking
- Last account unlink requests are rejected
- Error message guides user to link another account first

### Token Security

OAuth tokens are stored in Account table:
- `access_token`, `refresh_token` are NOT returned by API
- Only metadata is returned (username, avatar, email)
- Tokens are only used server-side for OAuth operations

## Future Enhancements

### Possible Improvements

1. **Account Merging**: Merge two separate CritUser accounts
2. **Email Verification**: Verify email before using for display
3. **Account Recovery**: Use linked accounts for account recovery
4. **Two-Factor Auth**: Require 2FA to unlink accounts
5. **Audit Log**: Track when accounts are linked/unlinked
6. **Provider Sync**: Periodically refresh metadata from providers

### Removing Deprecated Fields

Once all code is updated to use the new system:

1. Remove denormalized fields from CritUser model
2. Remove backward compatibility code from CustomPrismaAdapter
3. Create migration to drop old columns
4. Update tests and documentation

## Testing

### Manual Testing Checklist

- [ ] Link Discord account
- [ ] Link GitHub account
- [ ] Link Twitch account
- [ ] Link second Discord account
- [ ] Set primary account
- [ ] Change primary account
- [ ] Try to unlink last account (should fail)
- [ ] Unlink non-primary account
- [ ] Sign in with different linked accounts
- [ ] Verify session works with all accounts
- [ ] Check metadata is populated correctly

### Integration Tests

Add tests for:
- Linking multiple accounts from same provider
- Unlinking accounts (success and failure cases)
- Setting primary account
- Display name fallback logic
- API authorization (can only manage own accounts)

## Troubleshooting

### Account Won't Link
- Check OAuth credentials in `.env`
- Verify provider callback URLs
- Check browser console for errors
- Check server logs for OAuth errors

### Metadata Not Showing
- Check Account.metadata field in database
- Verify CustomPrismaAdapter is extracting profile data
- Check if provider profile callback is working

### Can't Unlink Last Account
- This is expected behavior (safety feature)
- Link another account first
- Or delete entire user account

## Related Files

- Schema: [`prisma/schema.prisma`](../prisma/schema.prisma)
- Auth Config: [`src/packages/cfg-lib/auth.ts`](../src/packages/cfg-lib/auth.ts)
- Adapter: [`src/packages/cfg-lib/prisma-adapter.ts`](../src/packages/cfg-lib/prisma-adapter.ts)
- Helpers: [`src/lib/linked-accounts.ts`](../src/lib/linked-accounts.ts)
- API: [`src/app/api/user/accounts/`](../src/app/api/user/accounts/)
- UI: [`src/components/LinkedAccountsManager.tsx`](../src/components/LinkedAccountsManager.tsx)
- Page: [`src/app/account/page.tsx`](../src/app/account/page.tsx)
- Migration: [`prisma/migrations/20251124000001_linked_accounts_system/`](../prisma/migrations/20251124000001_linked_accounts_system/)
