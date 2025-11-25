# Quick Guide: Setting Up Vercel Preview Environment

This is a **quick reference** for setting up your staging/preview environment in Vercel. For detailed explanations, see [docs/agent/setup/vercel-preview-environment.md](../docs/agent/setup/vercel-preview-environment.md).

## Current Project Info

- **Project**: `www-crit-fumble-com-2025`
- **Org**: `crit-fumble`
- **Project ID**: `prj_Xy8x1XpRQG6lBzFZC5OfBj4UveQf`
- **Dashboard**: https://vercel.com/crit-fumble/www-crit-fumble-com2025

## Quick Steps

### 1. Set Up Staging Domain (5 minutes)

**Option A: Use Vercel-provided URL (Easiest - No DNS needed)**
- URL: `www-crit-fumble-com2025-git-staging-crit-fumble.vercel.app`
- ✅ Works automatically - skip to step 2!

**Option B: Custom Domain (Recommended)**
1. Go to: https://vercel.com/crit-fumble/www-crit-fumble-com2025/settings/domains
2. Add domain: `staging.crit-fumble.com`
3. Add DNS CNAME at registrar:
   ```
   staging → cname.vercel-dns.com
   ```
4. Assign to `staging` branch in Vercel

### 2. Create Staging Database (10 minutes)

**Use Neon Database Branching:**
1. Go to: https://console.neon.tech
2. Select your project
3. Click "Branches" → "New Branch"
4. Name: `staging`
5. Source: `main` (or your production branch)
6. Click "Create Branch"
7. Copy the **pooled** connection string

### 3. Create OAuth Apps (15 minutes)

**Discord Staging App:**
1. Go to: https://discord.com/developers/applications
2. Click "New Application" → Name: "Crit-Fumble Staging"
3. OAuth2 → Add redirect:
   ```
   https://staging.crit-fumble.com/api/auth/callback/discord
   ```
4. Save Client ID & Client Secret

**GitHub Staging App:**
1. Go to: https://github.com/settings/developers
2. "New OAuth App"
3. **Application name**: `Crit-Fumble Staging`
4. **Homepage URL**: `https://staging.crit-fumble.com`
5. **Authorization callback URL**:
   ```
   https://staging.crit-fumble.com/api/auth/callback/github
   ```
6. Register application
7. Save Client ID & Client Secret

### 4. Generate Secrets (2 minutes)

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate API_KEY_ENCRYPTION_SECRET
openssl rand -hex 32
```

Save these outputs for the next step!

### 5. Set Environment Variables in Vercel (15 minutes)

Go to: https://vercel.com/crit-fumble/www-crit-fumble-com2025/settings/environment-variables

For each variable below, click "Add New" and **CHECK ONLY "Preview"**:

#### Required Variables:

| Variable | Value | Notes |
|----------|-------|-------|
| `NEXTAUTH_URL` | `https://staging.crit-fumble.com` | Your staging domain |
| `NEXTAUTH_SECRET` | Output from `openssl rand -base64 32` | Must be unique! |
| `AUTH_SECRET` | Same as `NEXTAUTH_SECRET` | Duplicate for compatibility |
| `NODE_ENV` | `production` | Yes, "production" for preview too |
| `DATABASE_URL` | From Neon staging branch | Pooled connection string |
| `DB_POSTGRES_PRISMA_URL` | From Neon staging branch | With `?connect_timeout=15` |
| `DB_POSTGRES_URL` | From Neon staging branch | Pooled URL |
| `DB_POSTGRES_URL_NON_POOLING` | From Neon staging branch | Non-pooled URL |
| `DISCORD_CLIENT_ID` | From Discord staging app | OAuth client ID |
| `DISCORD_CLIENT_SECRET` | From Discord staging app | OAuth client secret |
| `GITHUB_CLIENT_ID` | From GitHub staging app | OAuth client ID |
| `GITHUB_CLIENT_SECRET` | From GitHub staging app | OAuth client secret |
| `BLOB_READ_WRITE_TOKEN` | Create at Vercel stores | Separate token |
| `API_KEY_ENCRYPTION_SECRET` | Output from `openssl rand -hex 32` | 64 hex chars |

#### Admin Configuration (JSON arrays):

```bash
# Your Discord user IDs
DISCORD_ADMIN_IDS=["YOUR_DISCORD_ID"]
DISCORD_OWNER_IDS=["OWNER1_ID","OWNER2_ID","OWNER3_ID","OWNER4_ID"]
OWNER_EMAILS=["owner1@crit-fumble.com","owner2@crit-fumble.com"]
```

**How to find your Discord ID:**
1. Enable Developer Mode in Discord (Settings → Advanced → Developer Mode)
2. Right-click your username → "Copy User ID"

### 6. Create Blob Storage Token (5 minutes)

1. Go to: https://vercel.com/dashboard/stores
2. Create or select a store
3. Click "Create Token"
4. Name: `staging-blob-token`
5. Copy token
6. Add as `BLOB_READ_WRITE_TOKEN` in Preview environment

### 7. Deploy & Test (5 minutes)

```bash
# Push to staging to trigger deployment
git push origin staging
```

Or redeploy from dashboard:
1. Go to: https://vercel.com/crit-fumble/www-crit-fumble-com2025/deployments
2. Find latest staging deployment
3. Click ⋯ → "Redeploy"

**Test checklist:**
- [ ] Visit staging URL
- [ ] Click "Sign in with Discord"
- [ ] Should redirect to Discord OAuth
- [ ] After auth, returns to staging (not production)
- [ ] Signed in successfully
- [ ] Check that you're using staging database (not production data)

## Common Issues

### "NEXTAUTH_SECRET must be set"
→ Add `NEXTAUTH_SECRET` to Preview environment in Vercel

### "Invalid redirect_uri"
→ Update Discord/GitHub app with staging callback URL

### Redirects to production after OAuth
→ Verify `NEXTAUTH_URL` is set for Preview environment

### Database connection error
→ Check `DATABASE_URL` is set for Preview (not just Production)

### Using production data in staging
→ Confirm Preview environment has its own `DATABASE_URL`

## Environment Variable Reference

See `.env.preview.example` for complete list of variables with placeholder values.

## Troubleshooting

### Check Environment Variables
```bash
# In Vercel deployment logs, you'll see:
# "Environment variables loaded"

# To verify which variables are set:
# Go to deployment → Build Logs → Look for environment section
```

### Check OAuth Redirect URLs

**Discord App:**
- URL should be: `https://staging.crit-fumble.com/api/auth/callback/discord`

**GitHub App:**
- URL should be: `https://staging.crit-fumble.com/api/auth/callback/github`

### Database Migration

After setting up staging database:

```bash
# Pull staging env vars locally
vercel env pull .env.vercel.local

# Run migrations
DATABASE_URL="<staging-db-url>" npx prisma migrate deploy
```

## Next Steps

After preview environment is working:

1. **Test thoroughly** - Ensure all features work in staging
2. **Automate deployments** - Staging branch auto-deploys on push
3. **Monitor staging** - Check Vercel logs for errors
4. **Update docs** - Keep this guide updated as you add services

## Resources

- Vercel Environments: https://vercel.com/docs/concepts/projects/environment-variables
- Neon Branching: https://neon.tech/docs/guides/branching
- Discord OAuth: https://discord.com/developers/docs/topics/oauth2
- GitHub OAuth: https://docs.github.com/en/developers/apps/building-oauth-apps

## Summary Checklist

- [ ] Staging domain configured (custom or Vercel URL)
- [ ] Neon database branch created
- [ ] Discord staging OAuth app created
- [ ] GitHub staging OAuth app created
- [ ] Secrets generated (NEXTAUTH_SECRET, API_KEY_ENCRYPTION_SECRET)
- [ ] All required variables added to Preview environment in Vercel
- [ ] Blob storage token created for staging
- [ ] Admin/Owner IDs configured
- [ ] Staging branch deployed
- [ ] OAuth flows tested and working
- [ ] Confirmed using staging database (not production)
