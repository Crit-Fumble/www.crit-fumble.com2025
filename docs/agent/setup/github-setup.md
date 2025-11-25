# GitHub Integration Setup Guide

## Overview

This guide will help you connect your GitHub repository to Vercel for automatic deployments when you push to the `main` branch.

## Step 1: Get Vercel Token

1. Go to: https://vercel.com/account/tokens
2. Click "Create Token"
3. Name: `github-actions-deployment`
4. Scope: `Full Account`
5. Expiration: `No Expiration` (or set as needed)
6. Click "Create"
7. **Copy the token** - you'll need it for GitHub secrets

## Step 2: Add GitHub Repository Secrets

Go to your GitHub repository settings:
https://github.com/Crit-Fumble/www.crit-fumble.com2025/settings/secrets/actions

Click "New repository secret" and add the following secrets:

### Required Secrets

#### 1. VERCEL_TOKEN
- **Value**: The token you created in Step 1
- **Description**: Allows GitHub Actions to deploy to Vercel

#### 2. VERCEL_ORG_ID
- **Value**: `team_fPGO1C2uiCyAmVc1lIrichvz`
- **Description**: Your Vercel organization/team ID

#### 3. VERCEL_PROJECT_ID
- **Value**: `prj_Xy8x1XpRQG6lBzFZC5OfBj4UveQf`
- **Description**: The Vercel project ID for www-crit-fumble-com-2025

#### 4. DATABASE_URL
- **Value**: Your Vercel Postgres connection string (POSTGRES_PRISMA_URL)
- **Description**: Used for running migrations in CI/CD
- **Important**: Get this from Vercel Dashboard after creating the database
- Should look like: `postgres://user:pass@host:5432/db?sslmode=require&pgbouncer=true&connection_limit=1`

### Quick Add Commands

If you have `gh` CLI installed:

```bash
# Set VERCEL_TOKEN (replace YOUR_TOKEN with actual token)
gh secret set VERCEL_TOKEN --body "YOUR_TOKEN"

# Set VERCEL_ORG_ID
gh secret set VERCEL_ORG_ID --body "team_fPGO1C2uiCyAmVc1lIrichvz"

# Set VERCEL_PROJECT_ID
gh secret set VERCEL_PROJECT_ID --body "prj_Xy8x1XpRQG6lBzFZC5OfBj4UveQf"

# Set DATABASE_URL (replace with actual connection string)
gh secret set DATABASE_URL --body "postgres://user:pass@host:5432/db?sslmode=require&pgbouncer=true&connection_limit=1"
```

## Step 3: Connect Vercel to GitHub (Optional but Recommended)

This enables automatic preview deployments for pull requests:

1. Go to: https://vercel.com/hobdaytrains-projects/www-crit-fumble-com-2025/settings/git
2. Click "Connect Git Repository"
3. Select GitHub
4. Choose: `Crit-Fumble/www.crit-fumble.com2025`
5. Click "Connect"

### Configure Git Integration

After connecting:

1. **Production Branch**: `main`
2. **Install Vercel for GitHub**: Click "Install" if prompted
3. **Build & Development Settings**: Leave as default (detected from `vercel.json`)

## Step 4: Configure Branch Protection (Recommended)

Protect your `main` branch to ensure quality:

1. Go to: https://github.com/Crit-Fumble/www.crit-fumble.com2025/settings/branches
2. Add rule for `main` branch
3. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
   - Select: `deploy` (from the Vercel workflow)
   - ✅ Require branches to be up to date before merging

## How the GitHub Actions Workflow Works

### File: `.github/workflows/vercel-deploy.yml`

#### On Push to Main:
1. Checks out code
2. Installs dependencies
3. Pulls Vercel environment info
4. Builds project
5. **Deploys to PRODUCTION**
6. Runs database migrations
7. Verifies deployment

#### On Pull Request:
1. Checks out code
2. Installs dependencies
3. Pulls Vercel environment info
4. Builds project
5. **Deploys to PREVIEW**
6. Comments PR with preview URL
7. Verifies deployment

### Workflow Triggers

```yaml
on:
  push:
    branches:
      - main          # Automatic production deployment
  pull_request:
    branches:
      - main          # Automatic preview deployment
```

## Step 5: Test the Integration

### Test Production Deployment

1. Make a small change (e.g., update README.md)
2. Commit and push to `main`:
   ```bash
   git add .
   git commit -m "test: verify vercel deployment"
   git push origin main
   ```
3. Watch the deployment:
   - GitHub Actions: https://github.com/Crit-Fumble/www.crit-fumble.com2025/actions
   - Vercel Dashboard: https://vercel.com/hobdaytrains-projects/www-crit-fumble-com-2025

### Test Preview Deployment (PR)

1. Create a new branch:
   ```bash
   git checkout -b test-preview
   ```
2. Make a change and push:
   ```bash
   git add .
   git commit -m "test: preview deployment"
   git push origin test-preview
   ```
3. Create a Pull Request on GitHub
4. Check for:
   - ✅ GitHub Actions workflow runs
   - ✅ Preview deployment created
   - ✅ Comment with preview URL on PR

## Step 6: Verify Automatic Deployments

After setup, every push to `main` will:
- ✅ Automatically build the project
- ✅ Deploy to Vercel production
- ✅ Run database migrations
- ✅ Verify deployment health
- ✅ Show deployment status in GitHub

## Troubleshooting

### Workflow fails with "VERCEL_TOKEN not found"
- Verify secret is set: https://github.com/Crit-Fumble/www.crit-fumble.com2025/settings/secrets/actions
- Make sure you copied the entire token when creating it

### Workflow fails with "Project not found"
- Verify `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` match `.vercel/project.json`
- Ensure Vercel token has access to the organization

### Database migration fails
- Verify `DATABASE_URL` secret is set correctly
- Ensure it uses the Vercel Postgres connection string
- Check that connection string includes `pgbouncer=true&connection_limit=1`

### Deployment succeeds but site shows errors
- Check Vercel deployment logs: https://vercel.com/hobdaytrains-projects/www-crit-fumble-com-2025
- Verify all environment variables are set in Vercel dashboard
- Check runtime logs for errors

## Alternative: Vercel GitHub App (Simpler Option)

Instead of using GitHub Actions, you can use Vercel's GitHub App:

### Pros:
- ✅ Easier setup (no secrets needed)
- ✅ Automatic preview deployments
- ✅ Built-in deployment comments on PRs
- ✅ Vercel manages the build environment

### Cons:
- ❌ Less control over build process
- ❌ Can't run custom scripts before/after deployment
- ❌ Limited to Vercel's build environment

### To use Vercel GitHub App instead:
1. Go to: https://vercel.com/hobdaytrains-projects/www-crit-fumble-com-2025/settings/git
2. Click "Connect Git Repository"
3. Follow Vercel's setup wizard
4. **Delete** `.github/workflows/vercel-deploy.yml`

## Recommended Approach

For most projects, **Vercel GitHub App** is simpler and sufficient. Use GitHub Actions workflow only if you need:
- Custom pre-deployment scripts
- Integration with other CI/CD tools
- Special build configurations
- Custom notification systems

## Summary Checklist

- [ ] Created Vercel token
- [ ] Added all required GitHub secrets
- [ ] Connected Vercel to GitHub repository
- [ ] Configured branch protection rules
- [ ] Tested deployment by pushing to main
- [ ] Verified preview deployments work on PRs
- [ ] Disabled old Digital Ocean workflow (`.yml.disabled`)

## Next Steps

After successful GitHub integration:
1. Create Vercel Postgres database
2. Add DATABASE_URL to GitHub secrets
3. Push to main to trigger first deployment
4. Configure custom domain: `new.crit-fumble.com`
5. Test all features on deployed site

---

**Status**: GitHub Actions workflow ready
**File**: [.github/workflows/vercel-deploy.yml](.github/workflows/vercel-deploy.yml)
**Old Workflow**: Disabled (`.yml.disabled`)
