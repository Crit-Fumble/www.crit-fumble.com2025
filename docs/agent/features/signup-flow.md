# Sign-Up and Profile Completion Flow

## Overview

The sign-up flow requires new users to complete their profile after their first OAuth login. This ensures users have control over their username, email, and avatar before accessing the platform.

## User Journey

### 1. Initial OAuth Login

When a user signs in for the first time with Discord, GitHub, or Twitch:

1. OAuth provider authenticates the user
2. `CustomPrismaAdapter.createUser()` is called
3. A new `CritUser` is created with:
   - Temporary username (from provider or email)
   - `profileCompleted: false`
   - Basic OAuth account link
4. User is redirected to `/dashboard`

### 2. Profile Completion Redirect

Middleware intercepts the dashboard request:

1. Checks if `profileCompleted` is false
2. Redirects to `/signup` page
3. User cannot access protected routes until profile is completed

### 3. Sign-Up Form ([/signup](../src/app/signup/page.tsx))

The sign-up page shows:

- **Username field** (pre-filled with temporary name, editable)
- **Email field** (optional, pre-filled if available)
- **Avatar selection**:
  - No avatar option
  - Avatars from linked OAuth accounts
- **Link additional accounts** section:
  - Buttons to link Discord, GitHub, Twitch
  - Shows which providers are already linked
  - Linking adds more avatar options

When user submits:
1. POST to `/api/user/profile/complete`
2. Validates username uniqueness
3. Updates user profile with:
   - Custom username
   - Email (if provided)
   - Selected avatar URL
   - `profileCompleted: true`
4. Redirects to `/dashboard`

### 4. Profile Editing ([/account](../src/app/account/page.tsx))

After sign-up, users can edit their profile:

1. Navigate to Account Settings
2. Profile tab shows current info
3. Click "Edit Profile"
4. Same fields as sign-up (username, email, avatar)
5. Save changes via PATCH `/api/user/profile`

## Technical Architecture

### Database Schema

```prisma
model CritUser {
  id               String   @id @default(uuid())
  username         String   @unique
  email            String?  @unique
  profileCompleted Boolean  @default(false)
  avatarUrl        String?  // User's chosen avatar
  accounts         Account[] // Linked OAuth accounts
}
```

### Components

#### [SignUpForm](../src/components/SignUpForm.tsx)
Client component for profile completion during sign-up.

**Features:**
- Username validation and uniqueness check
- Optional email field
- Avatar selection from linked accounts
- Link additional OAuth accounts
- Real-time validation feedback

**Props:**
```typescript
{
  userId: string
  defaultUsername: string
  defaultEmail: string
  defaultAvatarUrl?: string
  linkedAccounts: LinkedAccount[]
}
```

#### [ProfileEditor](../src/components/ProfileEditor.tsx)
Client component for editing profile from Account page.

**Features:**
- Same fields as SignUpForm
- View/Edit toggle
- Success/error messaging
- Live avatar preview

**Props:**
```typescript
{
  userId: string
  currentUsername: string
  currentEmail: string | null
  currentAvatarUrl: string | null
  linkedAccounts: LinkedAccount[]
}
```

### API Endpoints

#### POST /api/user/profile/complete

Complete profile during sign-up.

**Request Body:**
```json
{
  "username": "mycoolusername",
  "email": "user@example.com",
  "avatarUrl": "https://cdn.discordapp.com/avatars/..."
}
```

**Validations:**
- Username: 3-30 chars, letters/numbers/hyphens/underscores
- Username uniqueness check
- Email uniqueness check (if provided)

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "username": "mycoolusername",
    "email": "user@example.com",
    "avatarUrl": "https://..."
  }
}
```

#### PATCH /api/user/profile

Update profile from Account page.

**Request Body:**
```json
{
  "username": "newusername",
  "email": "newemail@example.com",
  "avatarUrl": "https://..."
}
```

All fields are optional - only send fields to update.

**Same validations and response format as complete endpoint.**

### Middleware ([src/middleware.ts](../src/middleware.ts))

Intercepts requests to protected routes:

1. Checks if user is authenticated
2. Queries `profileCompleted` field
3. Redirects to `/signup` if false
4. Allows through if true

**Protected Routes:**
- `/dashboard`
- `/account`
- `/worlds`
- Add more as needed

**Public Routes (no check):**
- `/login`
- `/signup`
- `/api/*`
- Static assets

## Avatar System

### Avatar Priority

When displaying a user's avatar, the system uses this priority:

1. **User-selected avatar** (`CritUser.avatarUrl`)
   - Chosen during sign-up or from Account settings
   - Can be from any linked account

2. **Primary account avatar** (if `primaryAccountId` is set)
   - Avatar from the account marked as primary

3. **First linked account avatar**
   - Fallback to first chronological account

4. **No avatar**
   - Shows default user icon

### Avatar Sources

Users can choose avatars from any linked OAuth account:

- **Discord**: `https://cdn.discordapp.com/avatars/{id}/{hash}.png`
- **GitHub**: `https://avatars.githubusercontent.com/...`
- **Twitch**: CDN URL from profile

When a user links a new account during sign-up, the avatar is immediately available for selection.

## Linking Accounts During Sign-Up

Users can link additional OAuth accounts during the sign-up process:

1. Click "Link Discord" / "Link GitHub" / "Link Twitch"
2. Redirected to OAuth flow
3. After auth, returns to `/signup` with new account linked
4. New avatar appears in selection grid
5. User can select it before completing profile

**Benefits:**
- More sign-in options
- More avatar choices
- Better account recovery

## Username Generation

For new users, temporary username is generated:

```typescript
const baseUsername =
  data.name ||           // Provider name (Discord username, etc.)
  data.email?.split('@')[0] || // Email local part
  'user'                 // Fallback

// Add random suffix if taken
username = `${baseUsername}_${Date.now()}_${randomString}`
```

User can customize this on the sign-up form.

## Validation Rules

### Username
- **Format**: `^[a-zA-Z0-9_-]{3,30}$`
- **Min length**: 3 characters
- **Max length**: 30 characters
- **Allowed chars**: Letters, numbers, hyphens, underscores
- **Uniqueness**: Must be unique across all users

### Email
- **Optional**: Can be null
- **Format**: Valid email address
- **Uniqueness**: Must be unique if provided

### Avatar URL
- **Optional**: Can be null
- **Format**: Valid URL string
- **No validation**: Assumes URL is valid from OAuth provider

## Security Considerations

### Profile Completion Enforcement

Middleware ensures users cannot bypass the sign-up form:
- All protected routes check `profileCompleted`
- Cannot access dashboard without completing profile
- Cannot access account settings without completing profile

### Username Squatting Prevention

- Temporary usernames use timestamps and random strings
- Makes it hard to predict/squat usernames
- Users must actively choose their final username

### Email Verification

Currently, emails are NOT verified:
- OAuth providers may or may not verify emails
- Email is optional
- Future: Add email verification flow

## Migration

The migration [20251124000002_signup_profile_completion](../prisma/migrations/20251124000002_signup_profile_completion/migration.sql) adds:

1. `profile_completed` column (default false)
2. `avatar_url` column (nullable)
3. Marks existing users as completed (backward compatibility)

**Run migration:**
```bash
npx prisma migrate deploy
```

**Existing users:**
- Automatically marked as `profileCompleted: true`
- Can use platform immediately
- Can edit profile from Account page

**New users:**
- Start with `profileCompleted: false`
- Must complete sign-up form
- Then can access platform

## Testing Checklist

### New User Flow
- [ ] Sign in with Discord (new user)
- [ ] Redirected to `/signup`
- [ ] See temporary username pre-filled
- [ ] Change username
- [ ] Select Discord avatar
- [ ] Click "Link GitHub"
- [ ] Complete GitHub OAuth
- [ ] Return to `/signup`
- [ ] See GitHub avatar in grid
- [ ] Select GitHub avatar
- [ ] Click "Complete Profile"
- [ ] Redirected to `/dashboard`
- [ ] Can access all pages

### Existing User Flow
- [ ] Sign in with existing account
- [ ] Go directly to `/dashboard` (no redirect)
- [ ] Can access all pages
- [ ] Go to `/account`
- [ ] See Profile tab with current info
- [ ] Click "Edit Profile"
- [ ] Change username
- [ ] Change avatar
- [ ] Save changes
- [ ] See success message
- [ ] Changes persist after refresh

### Validation
- [ ] Try duplicate username (should fail)
- [ ] Try duplicate email (should fail)
- [ ] Try invalid username format (should fail)
- [ ] Try username < 3 chars (should fail)
- [ ] Try username > 30 chars (should fail)
- [ ] Try to access `/dashboard` before completing profile (should redirect)

### Avatar System
- [ ] Select "No Avatar" option
- [ ] Select Discord avatar
- [ ] Select GitHub avatar
- [ ] Link new account, see new avatar appear
- [ ] Avatar displays correctly on Account page
- [ ] Avatar displays correctly in header/profile

## Future Enhancements

### Potential Improvements

1. **Email Verification**
   - Send verification email
   - Mark email as verified
   - Require verification for certain features

2. **Profile Pictures Upload**
   - Allow custom avatar upload
   - Image processing/resizing
   - CDN storage

3. **Progressive Profiling**
   - Collect more info over time
   - Bio, location, interests
   - Privacy controls

4. **Skip Profile Completion**
   - Allow "Skip for now" option
   - Nag user later to complete
   - Limited access until completed

5. **Social Preview**
   - Show preview of how profile appears
   - In-game avatar preview
   - Profile card preview

6. **Onboarding Tour**
   - Guide new users through features
   - Interactive tutorial
   - Feature highlights

## Troubleshooting

### User Stuck on Sign-Up Page

**Problem:** User cannot complete sign-up, page refreshes back to form.

**Solutions:**
- Check browser console for errors
- Verify API endpoint is accessible
- Check username/email isn't already taken
- Verify database connection
- Check middleware isn't redirecting incorrectly

### Profile Not Saving

**Problem:** User submits form but changes don't persist.

**Solutions:**
- Check API response status
- Verify database update succeeded
- Check if `profileCompleted` is being set to true
- Clear browser cache
- Check if router.refresh() is being called

### Avatar Not Showing

**Problem:** Selected avatar doesn't display.

**Solutions:**
- Check avatar URL is valid
- Verify CORS allows loading image
- Check if OAuth metadata was captured correctly
- Verify `avatarUrl` field is being saved
- Check image URL isn't expired (Twitch URLs can expire)

## Related Files

- Sign-up page: [src/app/signup/page.tsx](../src/app/signup/page.tsx)
- Sign-up form: [src/components/SignUpForm.tsx](../src/components/SignUpForm.tsx)
- Profile editor: [src/components/ProfileEditor.tsx](../src/components/ProfileEditor.tsx)
- Account page: [src/app/account/page.tsx](../src/app/account/page.tsx)
- Middleware: [src/middleware.ts](../src/middleware.ts)
- Complete API: [src/app/api/user/profile/complete/route.ts](../src/app/api/user/profile/complete/route.ts)
- Profile API: [src/app/api/user/profile/route.ts](../src/app/api/user/profile/route.ts)
- Prisma adapter: [src/packages/cfg-lib/prisma-adapter.ts](../src/packages/cfg-lib/prisma-adapter.ts)
- Schema: [prisma/schema.prisma](../prisma/schema.prisma)
- Migration: [prisma/migrations/20251124000002_signup_profile_completion/](../prisma/migrations/20251124000002_signup_profile_completion/)
