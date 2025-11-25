# Staging Environment Setup Guide

This guide walks you through setting up a staging environment on Vercel with a dedicated staging database for testing.

## Overview

The staging environment allows you to:
- Test changes before deploying to production
- Run automated Playwright tests against a live deployment
- Test database migrations and schema changes safely
- Review UI changes with real data

## Step 1: Create Staging Branch

```bash
# Create and checkout staging branch
git checkout -b staging

# Push to remote
git push -u origin staging
```

## Step 2: Configure Vercel Staging Environment

### Option A: Via Vercel Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `www-crit-fumble-com-2025`
3. Go to **Settings** → **Git**
4. Under **Production Branch**, ensure `main` is set
5. Under **Preview Branches**, enable the `staging` branch

### Option B: Via Vercel CLI

```bash
# Link project (if not already linked)
npx vercel link

# Deploy staging branch
git checkout staging
npx vercel --env staging

# Set staging as preview branch
npx vercel project set production-branch main
```

## Step 3: Create Staging Database

### Using Neon (Current Setup)

1. Go to [Neon Console](https://console.neon.tech)
2. Select your project
3. Click **Create Branch** → Name it `staging`
4. Copy the connection string

### Using Vercel Postgres

```bash
# Create staging database store
npx vercel postgres create crit-fumble-staging --region iad1

# Link to staging environment
npx vercel env add DATABASE_URL staging
# Paste the staging database URL when prompted
```

## Step 4: Configure Staging Environment Variables

### Via Vercel Dashboard

1. Go to **Settings** → **Environment Variables**
2. Add/Update these variables for **Preview (staging branch only)**:

```env
# Database
DATABASE_URL=<your-staging-database-url>

# Auth
AUTH_SECRET=<generate-new-secret-for-staging>

# Discord OAuth (Staging App)
DISCORD_CLIENT_ID=<staging-discord-app-id>
DISCORD_CLIENT_SECRET=<staging-discord-app-secret>

# GitHub OAuth (Staging App)
GITHUB_ID=<staging-github-app-id>
GITHUB_SECRET=<staging-github-app-secret>

# Other required vars
NODE_ENV=staging
NEXTAUTH_URL=https://www-crit-fumble-com-2025-git-staging-<your-team>.vercel.app
```

### Via Vercel CLI

```bash
# Pull current env vars to see what's needed
npx vercel env pull .env.staging

# Add staging-specific vars
npx vercel env add DATABASE_URL preview
npx vercel env add AUTH_SECRET preview
```

## Step 5: Run Database Migrations on Staging

```bash
# Set DATABASE_URL to staging database
export DATABASE_URL="<your-staging-database-url>"

# Or on Windows
set DATABASE_URL=<your-staging-database-url>

# Run migrations
npm run db:migrate:staging

# Or manually
npx prisma migrate deploy
```

## Step 6: Deploy Staging

```bash
# Commit any changes
git add .
git commit -m "Set up staging environment"

# Push to staging branch
git push origin staging
```

Vercel will automatically deploy the staging branch to:
`https://www-crit-fumble-com-2025-git-staging-<your-team>.vercel.app`

## Step 7: Configure Local Testing Against Staging

1. Update `.env.staging` with the staging URL:

```env
PLAYWRIGHT_BASE_URL=https://www-crit-fumble-com-2025-git-staging-<your-team>.vercel.app
```

2. Run tests against staging:

```bash
# Load staging env vars and run tests
export $(cat .env.staging | xargs) && npx playwright test

# Or on Windows (PowerShell)
Get-Content .env.staging | ForEach-Object {
  $name, $value = $_.split('=')
  Set-Item -Path "env:$name" -Value $value
}
npx playwright test

# Or create a script (recommended)
npm run test:e2e:staging
```

## Step 8: Add Test Script to package.json

Add this to your `package.json` scripts:

```json
{
  "scripts": {
    "test:e2e:staging": "dotenv -e .env.staging -- playwright test",
    "test:e2e:staging:ui": "dotenv -e .env.staging -- playwright test --ui"
  }
}
```

Install dotenv-cli:
```bash
npm install -D dotenv-cli
```

## Workflow: Testing Changes

1. **Make changes** on a feature branch
2. **Merge to staging** branch
3. **Vercel auto-deploys** to staging URL
4. **Run tests** locally against staging:
   ```bash
   npm run test:e2e:staging
   ```
5. **Review screenshots** in `tests/screenshots/`
6. **If tests pass**, merge staging → main
7. **Vercel deploys** to production

## Troubleshooting

### Tests Failing with 404
- Verify staging URL is accessible
- Check Vercel deployment logs
- Ensure `PLAYWRIGHT_BASE_URL` is set correctly

### Database Connection Errors
- Verify `DATABASE_URL` is set in Vercel staging environment
- Check database is accessible (not paused/deleted)
- Run migrations on staging database

### Auth Errors
- Create separate Discord/GitHub OAuth apps for staging
- Update callback URLs to staging domain
- Verify `AUTH_SECRET` and `NEXTAUTH_URL` are set

## Quick Reference

```bash
# Deploy to staging
git push origin staging

# Pull staging env vars
npx vercel env pull .env.staging

# Run tests against staging
npm run test:e2e:staging

# View staging deployment
npx vercel inspect <deployment-url>

# Check staging logs
npx vercel logs <deployment-url>
```

## Security Notes

- **Never commit `.env.staging`** - add to `.gitignore`
- Use **separate OAuth apps** for staging
- Use **separate database** from production
- **Rotate secrets** regularly
- **Limit access** to staging environment
