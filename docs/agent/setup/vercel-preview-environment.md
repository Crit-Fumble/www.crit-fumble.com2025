# Vercel Preview Environment Setup

This guide explains how to set up a dedicated staging/preview environment in Vercel with its own domain and environment variables.

## Overview

Vercel has three environment types:
- **Production**: Main branch deployments → `new.crit-fumble.com`
- **Preview**: All other branch deployments (including `staging`) → Custom domain
- **Development**: Local development (not used in Vercel)

## Current Setup

- Production Branch: `main`
- Staging Branch: `staging`
- Repository: `Crit-Fumble/www.crit-fumble.com2025`

## Step 1: Configure Preview Domain

### Option A: Vercel-provided Domain (Easiest)
Every preview deployment gets an automatic Vercel domain:
- Pattern: `your-project-git-staging-your-team.vercel.app`
- Example: `www-crit-fumble-com2025-git-staging-crit-fumble.vercel.app`

**No configuration needed** - This works automatically!

### Option B: Custom Domain for Staging (Recommended)
Set up a dedicated subdomain for staging previews:

1. **Add Domain in Vercel Dashboard**
   - Go to: https://vercel.com/crit-fumble/www-crit-fumble-com2025/settings/domains
   - Click "Add"
   - Enter: `staging.crit-fumble.com` (or `preview.crit-fumble.com`)
   - Vercel will provide DNS records

2. **Configure DNS** (at your domain registrar)
   - Add CNAME record:
     ```
     staging.crit-fumble.com → cname.vercel-dns.com
     ```
   - Or A record (if required):
     ```
     staging.crit-fumble.com → 76.76.21.21
     ```

3. **Assign to Branch**
   - In Vercel Domains settings
   - Find `staging.crit-fumble.com`
   - Click the domain → Settings
   - Under "Git Branch", select: `staging`
   - Save

Now all `staging` branch deployments will use `staging.crit-fumble.com`!

## Step 2: Environment Variables for Preview

Vercel environment variables can be scoped to three environments:
- Production
- Preview
- Development (local only)

### Critical Environment Variables Needed for Preview

#### 1. Core Application Variables

```bash
# NextAuth Configuration
NEXTAUTH_URL=https://staging.crit-fumble.com  # Or Vercel-provided URL
NEXTAUTH_SECRET=<generate-unique-secret>      # Different from production!

# Alternative Auth variable name
AUTH_SECRET=<same-as-nextauth-secret>

# Node Environment
NODE_ENV=production  # Yes, "production" even for preview!
```

#### 2. Database (Neon - Staging Database)

Create a separate Neon database for staging or use branches:

**Option A: Separate Database (Recommended)**
```bash
DATABASE_URL=postgresql://user:pass@staging-pooler.region.aws.neon.tech/staging?sslmode=require
DB_POSTGRES_PRISMA_URL=postgresql://user:pass@staging-pooler.region.aws.neon.tech/staging?connect_timeout=15&sslmode=require
DB_POSTGRES_URL=postgresql://user:pass@staging-pooler.region.aws.neon.tech/staging?sslmode=require
DB_POSTGRES_URL_NON_POOLING=postgresql://user:pass@staging.region.aws.neon.tech/staging?sslmode=require
```

**Option B: Neon Branch (Easiest)**
Neon allows you to create instant database branches:
1. Go to: https://console.neon.tech
2. Select your project
3. Click "Branches" → "New Branch"
4. Name: `staging`
5. Copy the new connection strings

#### 3. Vercel Blob Storage

```bash
BLOB_READ_WRITE_TOKEN=<create-separate-token-for-staging>
```

Create at: https://vercel.com/dashboard/stores

#### 4. OAuth Providers (Staging Apps)

**Discord OAuth (Create Staging App)**
1. Go to: https://discord.com/developers/applications
2. Create new application: "Crit-Fumble Staging"
3. Add OAuth redirect URL: `https://staging.crit-fumble.com/api/auth/callback/discord`
4. Set variables:
```bash
DISCORD_CLIENT_ID=<staging-app-id>
DISCORD_CLIENT_SECRET=<staging-app-secret>
```

**GitHub OAuth (Create Staging App)**
1. Go to: https://github.com/settings/developers
2. New OAuth App: "Crit-Fumble Staging"
3. Homepage URL: `https://staging.crit-fumble.com`
4. Callback URL: `https://staging.crit-fumble.com/api/auth/callback/github`
```bash
GITHUB_CLIENT_ID=<staging-app-id>
GITHUB_CLIENT_SECRET=<staging-app-secret>
```

**Twitch OAuth (Optional)**
```bash
TWITCH_CLIENT_ID=<staging-app-id>
TWITCH_CLIENT_SECRET=<staging-app-secret>
```

**Battle.net OAuth (Optional)**
```bash
BATTLENET_CLIENT_ID=<staging-app-id>
BATTLENET_CLIENT_SECRET=<staging-app-secret>
BATTLENET_ISSUER=https://oauth.battle.net
```

#### 5. Admin/Owner Configuration

```bash
# Discord Admin IDs (JSON array)
DISCORD_ADMIN_IDS=["123456789","987654321"]

# Discord Owner IDs (JSON array)
DISCORD_OWNER_IDS=["123456789","987654321","111222333","444555666"]

# Owner Emails (JSON array)
OWNER_EMAILS=["owner1@crit-fumble.com","owner2@crit-fumble.com"]
```

#### 6. Optional Integrations

```bash
# World Anvil
WORLD_ANVIL_CLIENT_SECRET=<your-application-key>

# Anthropic Claude (can share with production)
ANTHROPIC_API_KEY=<your-key>

# OpenAI (can share with production)
OPENAI_API_KEY=<your-key>

# Stripe (use test keys for staging!)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Encryption Secret (generate unique for staging)
API_KEY_ENCRYPTION_SECRET=<64-char-hex>  # openssl rand -hex 32
```

## Step 3: Set Variables in Vercel Dashboard

### Via Vercel Dashboard (Recommended)

1. Go to: https://vercel.com/crit-fumble/www-crit-fumble-com2025/settings/environment-variables

2. For each variable above:
   - Click "Add New"
   - **Key**: Variable name (e.g., `NEXTAUTH_URL`)
   - **Value**: The staging value
   - **Environment**: Check **ONLY "Preview"** (uncheck Production & Development)
   - Click "Save"

3. **Critical Variables** (must be set for Preview):
   - `NEXTAUTH_URL`
   - `NEXTAUTH_SECRET` or `AUTH_SECRET`
   - `DATABASE_URL`
   - `DB_POSTGRES_PRISMA_URL`
   - `DISCORD_CLIENT_ID`
   - `DISCORD_CLIENT_SECRET`
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
   - `BLOB_READ_WRITE_TOKEN`

### Via Vercel CLI (Alternative)

```bash
# Install Vercel CLI
npm install -g vercel

# Link project
vercel link

# Add preview environment variable
vercel env add NEXTAUTH_URL preview
# Then paste value when prompted

# Or use file import
vercel env pull .env.preview  # Pull existing
vercel env add < .env.staging preview  # Bulk add (doesn't work well)
```

## Step 4: Redeploy Staging Branch

After setting environment variables:

1. **Trigger Redeploy**:
   ```bash
   git push origin staging
   ```

2. **Or Redeploy from Vercel Dashboard**:
   - Go to: https://vercel.com/crit-fumble/www-crit-fumble-com2025/deployments
   - Find latest staging deployment
   - Click ⋯ → "Redeploy"

3. **Check Deployment**:
   - Visit: `https://staging.crit-fumble.com` (or Vercel-provided URL)
   - Test authentication flows
   - Check database connectivity

## Step 5: Testing OAuth Redirects

Make sure OAuth callback URLs match your staging domain:

### Discord Application Settings
- Redirects: `https://staging.crit-fumble.com/api/auth/callback/discord`

### GitHub Application Settings
- Callback URL: `https://staging.crit-fumble.com/api/auth/callback/github`

### Testing
1. Visit staging site
2. Click "Sign in with Discord"
3. Should redirect to Discord OAuth
4. After auth, should return to staging site (not production!)

## Step 6: Database Migrations

Your staging database needs the same schema as production:

```bash
# Pull staging DATABASE_URL
vercel env pull .env.vercel.local

# Run migrations
DATABASE_URL="<staging-db-url>" npx prisma migrate deploy

# Or use npx with .env.vercel.local
npx dotenv -e .env.vercel.local -- prisma migrate deploy
```

## Common Issues

### Issue: "Invalid callback URL"
**Solution**: Update OAuth app callback URLs to include staging domain

### Issue: "Database connection failed"
**Solution**: Verify `DATABASE_URL` is set for Preview environment

### Issue: "NEXTAUTH_SECRET must be set"
**Solution**: Add `NEXTAUTH_SECRET` or `AUTH_SECRET` to Preview environment

### Issue: Preview uses production database
**Solution**: Verify Preview environment variables are set (not just Production)

## Environment Variable Checklist

Use this checklist when setting up Preview environment:

- [ ] `NEXTAUTH_URL` = staging domain
- [ ] `NEXTAUTH_SECRET` = unique secret
- [ ] `DATABASE_URL` = staging database
- [ ] `DB_POSTGRES_PRISMA_URL` = staging database (pooled)
- [ ] `DISCORD_CLIENT_ID` = staging Discord app
- [ ] `DISCORD_CLIENT_SECRET` = staging Discord app secret
- [ ] `GITHUB_CLIENT_ID` = staging GitHub app
- [ ] `GITHUB_CLIENT_SECRET` = staging GitHub app secret
- [ ] `BLOB_READ_WRITE_TOKEN` = staging blob storage
- [ ] `DISCORD_ADMIN_IDS` = admin Discord IDs (JSON array)
- [ ] `DISCORD_OWNER_IDS` = owner Discord IDs (JSON array)
- [ ] `API_KEY_ENCRYPTION_SECRET` = unique encryption key
- [ ] OAuth redirect URLs updated in provider apps

## Quick Setup Commands

```bash
# 1. Generate secrets
openssl rand -base64 32  # For NEXTAUTH_SECRET
openssl rand -hex 32     # For API_KEY_ENCRYPTION_SECRET

# 2. Create Neon database branch
# Via Dashboard: https://console.neon.tech → Branches → New Branch

# 3. Set critical variables via CLI
vercel env add NEXTAUTH_URL preview
vercel env add NEXTAUTH_SECRET preview
vercel env add DATABASE_URL preview

# 4. Push to staging to trigger deployment
git push origin staging
```

## References

- Vercel Environments: https://vercel.com/docs/concepts/projects/environment-variables
- Vercel Domains: https://vercel.com/docs/concepts/projects/domains
- Neon Branching: https://neon.tech/docs/guides/branching
- NextAuth.js: https://next-auth.js.org/configuration/options#nextauth_url
