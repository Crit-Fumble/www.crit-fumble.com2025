# CI/CD Pipeline & Environment Configuration

Complete guide for deploying to staging/production and running local development against staging infrastructure.

## Overview

### Environments

1. **Production** - `https://www.crit-fumble.com`
   - Auto-deploys on push to `main`
   - Production database
   - Production OAuth apps

2. **Staging** - `https://treefarm22-staging.crit-fumble.com`
   - Auto-deploys on push to `staging`
   - Staging database (shared with local dev)
   - Staging OAuth apps (shared with local dev)

3. **Local Development** - `http://localhost:3000`
   - Uses staging database
   - Uses staging blob storage
   - Uses staging bridge API
   - Isolated Next.js dev server

## GitHub Actions Setup

### Required Secrets

Add these to your GitHub repository secrets (Settings → Secrets and variables → Actions):

```
VERCEL_TOKEN=<your-vercel-token>
VERCEL_ORG_ID=<your-vercel-org-id>
VERCEL_PROJECT_ID=<your-vercel-project-id>
```

#### Get Vercel Token
```bash
npx vercel login
npx vercel whoami
# Create token at: https://vercel.com/account/tokens
```

#### Get Organization and Project IDs
```bash
# Link project first
npx vercel link

# IDs are in .vercel/project.json
cat .vercel/project.json
```

### Workflows

#### Staging Deployment (`.github/workflows/deploy-staging.yml`)
- **Trigger**: Push to `staging` branch OR manual dispatch
- **Domain**: `treefarm22-staging.crit-fumble.com`
- **Environment**: Preview/Staging in Vercel

#### Production Deployment (`.github/workflows/deploy-production.yml`)
- **Trigger**: Push to `main` branch OR manual dispatch
- **Domain**: `www.crit-fumble.com`
- **Environment**: Production in Vercel

### Manual Deployment

You can manually trigger deployments from GitHub Actions:

1. Go to **Actions** tab
2. Select workflow (Deploy to Staging/Production)
3. Click **Run workflow**
4. Select branch
5. Click **Run workflow**

## Vercel Configuration

### 1. Configure Custom Domain (Staging)

**In Vercel Dashboard:**
1. Go to your project → Settings → Domains
2. Add domain: `treefarm22-staging.crit-fumble.com`
3. Configure DNS (see below)

**Or via CLI:**
```bash
npx vercel domains add treefarm22-staging.crit-fumble.com
```

### 2. Configure DNS

**Add these DNS records to your domain registrar:**

```
Type: CNAME
Name: treefarm22-staging
Value: cname.vercel-dns.com
TTL: 300
```

**For root domain (www.crit-fumble.com):**
```
Type: A
Name: @
Value: 76.76.21.21
TTL: 300

Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 300
```

### 3. Configure Environment Variables

#### Staging Environment (Preview)

In Vercel Dashboard → Settings → Environment Variables:

Add these for **Preview** environment:

```env
# Database
DATABASE_URL=<staging-neon-database-url>

# Auth
AUTH_SECRET=<generate-with-openssl-rand-base64-32>
NEXTAUTH_URL=https://treefarm22-staging.crit-fumble.com

# Discord OAuth (Staging App)
DISCORD_CLIENT_ID=<staging-discord-app-id>
DISCORD_CLIENT_SECRET=<staging-discord-app-secret>

# GitHub OAuth (Staging App)
GITHUB_ID=<staging-github-app-id>
GITHUB_SECRET=<staging-github-app-secret>

# Stack Auth (Staging)
DB_STACK_SECRET_SERVER_KEY=<staging-stack-key>
NEXT_PUBLIC_DB_STACK_PROJECT_ID=<staging-stack-project-id>
NEXT_PUBLIC_DB_STACK_PUBLISHABLE_CLIENT_KEY=<staging-stack-client-key>

# Blob Storage (Shared between staging and local dev)
BLOB_READ_WRITE_TOKEN=<vercel-blob-token>

# Environment
NODE_ENV=staging
```

#### Production Environment

Same variables but with **Production** environment selected and production values.

## Local Development Setup

### Connect to Staging Infrastructure

Your local dev environment will use staging database, blob storage, and bridge API while running the Next.js dev server locally.

#### 1. Pull Staging Environment Variables

```bash
# Pull from Vercel staging environment
npx vercel env pull .env.development.local --environment=preview
```

#### 2. Update Local Environment

Edit `.env.development.local`:

```env
# Keep these as localhost
NEXTAUTH_URL=http://localhost:3000

# Everything else uses staging
DATABASE_URL=<from-vercel-staging>
AUTH_SECRET=<from-vercel-staging>
DISCORD_CLIENT_ID=<from-vercel-staging>
DISCORD_CLIENT_SECRET=<from-vercel-staging>
GITHUB_ID=<from-vercel-staging>
GITHUB_SECRET=<from-vercel-staging>
BLOB_READ_WRITE_TOKEN=<from-vercel-staging>

# Use staging bridge API
BRIDGE_API_URL=https://treefarm22-staging.crit-fumble.com/api/bridge

# Development mode
NODE_ENV=development
```

#### 3. Configure OAuth Callback URLs

**Discord Developer Portal:**
- Add redirect URI: `http://localhost:3000/api/auth/callback/discord`

**GitHub OAuth App:**
- Add callback URL: `http://localhost:3000/api/auth/callback/github`

#### 4. Run Local Dev Server

```bash
npm run dev
```

Your local server will:
- ✅ Run at `http://localhost:3000`
- ✅ Use staging database (shared data)
- ✅ Use staging blob storage (shared files)
- ✅ Use staging bridge API (shared infrastructure)
- ✅ Hot reload for fast development

## Workflows

### Feature Development

```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Develop locally (uses staging infrastructure)
npm run dev

# 3. Run tests against staging
PLAYWRIGHT_BASE_URL=https://treefarm22-staging.crit-fumble.com npx playwright test

# 4. Commit changes
git add .
git commit -m "feat: add my feature"

# 5. Merge to staging for testing
git checkout staging
git merge feature/my-feature
git push origin staging

# 6. GitHub Actions auto-deploys to staging
# 7. Test at https://treefarm22-staging.crit-fumble.com

# 8. When ready, merge to main for production
git checkout main
git merge staging
git push origin main

# 9. GitHub Actions auto-deploys to production
```

### Hotfix Production

```bash
# 1. Create hotfix branch from main
git checkout -b hotfix/critical-fix main

# 2. Fix the issue
# ... make changes ...

# 3. Test locally
npm run dev

# 4. Commit
git commit -m "fix: critical production issue"

# 5. Merge to main
git checkout main
git merge hotfix/critical-fix
git push origin main

# 6. Manually trigger deployment (if needed immediately)
# Go to GitHub Actions → Deploy to Production → Run workflow

# 7. Also merge to staging to keep in sync
git checkout staging
git merge main
git push origin staging
```

## Database Migrations

### Staging Database

```bash
# Set DATABASE_URL to staging
export DATABASE_URL="<staging-database-url>"

# Run migration
npx prisma migrate deploy

# Or use script
npm run db:migrate:staging
```

### Production Database

```bash
# Set DATABASE_URL to production
export DATABASE_URL="<production-database-url>"

# Run migration (be careful!)
npx prisma migrate deploy

# Or use script
npm run db:migrate:prod
```

## Testing

### Test Against Staging

```bash
# Set base URL to staging
export PLAYWRIGHT_BASE_URL=https://treefarm22-staging.crit-fumble.com

# Run tests
npx playwright test

# Or use MCP server to run in background
# (see MCP_SERVER_SETUP.md)
```

### Test Locally

```bash
# Uses localhost:3000 by default
npm run test:e2e
```

## Monitoring

### Check Deployment Status

```bash
# List recent deployments
npx vercel ls

# Check specific deployment
npx vercel inspect <deployment-url>

# View logs
npx vercel logs <deployment-url>
```

### Check Database

```bash
# Open Prisma Studio (staging)
export DATABASE_URL="<staging-url>"
npx prisma studio

# Open Prisma Studio (production)
export DATABASE_URL="<production-url>"
npx prisma studio
```

## Troubleshooting

### GitHub Action Fails

1. Check secrets are set correctly
2. Verify Vercel token has correct permissions
3. Check workflow logs for specific errors

### Domain Not Working

1. Verify DNS records are configured
2. Check domain is added in Vercel dashboard
3. Allow 24-48 hours for DNS propagation
4. Use `dig` or `nslookup` to verify:
   ```bash
   nslookup treefarm22-staging.crit-fumble.com
   ```

### Local Dev Can't Connect to Staging

1. Verify `.env.development.local` has correct values
2. Check staging is deployed and accessible
3. Verify OAuth callback URLs include localhost
4. Check firewall/network settings

### OAuth Errors

1. Verify callback URLs match exactly
2. Check client ID and secret are correct
3. Ensure OAuth app is approved/published
4. Test with different browser (clear cookies)

## Security Notes

- **Never commit** `.env.development.local` or `.env.production.local`
- **Use different OAuth apps** for staging and production
- **Rotate secrets** regularly
- **Use separate databases** for staging and production
- **Monitor** access logs and deployments
- **Limit** who can manually trigger production deployments

## Quick Reference

```bash
# Deploy to staging
git push origin staging

# Deploy to production
git push origin main

# Pull staging env vars
npx vercel env pull .env.development.local --environment=preview

# Run local dev (uses staging infrastructure)
npm run dev

# Run tests against staging
PLAYWRIGHT_BASE_URL=https://treefarm22-staging.crit-fumble.com npx playwright test

# Manual deployment
# GitHub Actions → Select workflow → Run workflow
```
