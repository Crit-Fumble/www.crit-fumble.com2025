# Vercel Free Tier Setup (Alternative to CLI Deployments)

This guide shows how to set up automatic deployments using Vercel's free tier with GitHub integration.

## Why Use Vercel's GitHub Integration?

The Vercel CLI approach (`vercel deploy --prebuilt`) requires a **Pro plan** ($20/month). For free tier, we use Vercel's automatic GitHub integration which:

- ✅ Works on free tier
- ✅ Auto-deploys on push
- ✅ Supports custom domains
- ✅ Provides preview deployments
- ✅ No GitHub Actions secrets needed
- ✅ Simpler setup

## Setup Steps

### 1. Connect GitHub Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository: `www.crit-fumble.com`
4. Configure project:
   - **Framework Preset:** Next.js
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
   - **Install Command:** `npm install`

### 2. Configure Git Branches

In Vercel Dashboard → Settings → Git:

1. **Production Branch:** `main`
   - Deploys to: `www.crit-fumble.com`

2. **Enable "Automatic deployments for all branches"**
   - This makes `staging` branch deploy as a preview

### 3. Configure Custom Domains

#### Production Domain

Vercel Dashboard → Settings → Domains:
1. Add domain: `www.crit-fumble.com`
2. Configure DNS (provided by Vercel)

#### Staging Domain

1. Add domain: `treefarm22-staging.crit-fumble.com`
2. Assign to branch: `staging`
3. Configure DNS:
   ```
   Type: CNAME
   Name: treefarm22-staging
   Value: cname.vercel-dns.com
   TTL: 300
   ```

### 4. Configure Environment Variables

Vercel Dashboard → Settings → Environment Variables:

#### For Production Environment:
```env
DATABASE_URL=<production-database-url>
AUTH_SECRET=<production-auth-secret>
NEXTAUTH_URL=https://www.crit-fumble.com
# ... other production env vars
```

#### For Preview Environment (Staging):
```env
DATABASE_URL=<staging-database-url>
AUTH_SECRET=<staging-auth-secret>
NEXTAUTH_URL=https://treefarm22-staging.crit-fumble.com
# ... other staging env vars
```

**Important:** Set environment scope for each variable:
- Production: Check "Production"
- Staging: Check "Preview" and select `staging` branch

### 5. Update GitHub Actions Workflows

We've created simplified workflows that work with the free tier:

- `.github/workflows/deploy-staging-free.yml` - Notifies on staging push
- Keep the original workflows commented out or delete them

The actual deployment is handled by Vercel's GitHub integration, not GitHub Actions.

## How It Works

### Staging Deployment Flow

```
1. git push origin staging
   ↓
2. Vercel detects push to staging branch
   ↓
3. Vercel builds and deploys automatically
   ↓
4. Deployment available at:
   - Preview URL: https://www-crit-fumble-com-2025-git-staging-*.vercel.app
   - Custom domain: https://treefarm22-staging.crit-fumble.com
   ↓
5. GitHub Actions posts notification comment
```

### Production Deployment Flow

```
1. git push origin main
   ↓
2. Vercel detects push to main (production branch)
   ↓
3. Vercel builds and deploys to production
   ↓
4. Deployment available at:
   - Production URL: https://www.crit-fumble.com
```

## Deployment Commands

```bash
# Deploy to staging (automatic via Vercel)
git push origin staging

# Deploy to production (automatic via Vercel)
git push origin main

# View deployments
npx vercel ls

# Check specific deployment
npx vercel inspect <url>

# View logs (last 1 hour on free tier)
npx vercel logs <url>
```

## Manual Deployments

### Option 1: Push Empty Commit (Free)

```bash
# Trigger staging deployment
git commit --allow-empty -m "trigger staging deployment"
git push origin staging

# Trigger production deployment
git commit --allow-empty -m "trigger production deployment"
git push origin main
```

### Option 2: Redeploy in Dashboard (Free)

1. Go to Vercel Dashboard
2. Find the deployment
3. Click "..." → "Redeploy"

### Option 3: Use Vercel CLI (Requires upgrade)

The `vercel --prod` or `vercel deploy` commands work, but `--prebuilt` requires Pro tier.

## Local Development with Staging

Your local dev setup remains the same:

```bash
# Pull staging environment variables
npx vercel env pull .env.development.local --environment=preview

# Run local dev (uses staging database/services)
npm run dev

# Test against staging deployment
npm run test:staging
```

## Limitations of Free Tier

### What You Get:
- ✅ Unlimited deployments
- ✅ Automatic branch deployments
- ✅ Custom domains
- ✅ Environment variables
- ✅ 100GB bandwidth/month
- ✅ 100GB-hours compute/month

### What You Don't Get:
- ❌ Deployment protection (password-protect previews)
- ❌ Logs older than 1 hour
- ❌ Advanced analytics
- ❌ Manual CLI deployments with `--prebuilt`
- ❌ Team collaboration features
- ❌ Priority support

## Upgrade Considerations

Consider upgrading to Pro ($20/month) if you need:
- Password-protected staging environments
- Longer log retention
- Manual CLI deployments
- Team collaboration
- Commercial use

## Troubleshooting

### Staging Not Deploying

1. Check Vercel Dashboard → Settings → Git
2. Ensure "Automatic deployments" is enabled
3. Verify `staging` branch is not ignored
4. Check deployment logs in Vercel Dashboard

### Custom Domain Not Working

1. Verify DNS records are correct
2. Allow 24-48 hours for DNS propagation
3. Check domain is assigned to correct branch in Vercel
4. Try removing and re-adding domain

### Environment Variables Not Applied

1. Check variable scope (Production vs Preview)
2. For Preview scope, ensure branch is selected
3. Redeploy after changing environment variables
4. Check build logs for errors

## Migration Path to Pro Tier

If you later upgrade to Pro, you can:

1. Enable the original GitHub Actions workflows
2. Add `VERCEL_TOKEN` secret
3. Use `vercel deploy --prebuilt` for faster deployments
4. Enable deployment protection
5. Get advanced features

The setup is compatible with Pro tier - just uncomment the original workflows.

## Summary

**Free Tier Setup:**
- Simpler configuration
- Uses Vercel's automatic GitHub integration
- No GitHub secrets needed
- Perfect for personal projects and testing

**Pro Tier Setup:**
- More control via CLI
- Faster deployments with `--prebuilt`
- Advanced features
- Better for production/commercial use

For your current needs (learning, testing, development), the **free tier is perfect**!
