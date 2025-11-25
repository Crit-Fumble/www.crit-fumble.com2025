# Deploying to Vercel from Private GitHub Repository

Since Vercel's free tier requires public repos for GitHub integration, we'll deploy using Vercel CLI from your local machine.

## Why This Approach?

- ✅ Works with private GitHub repositories
- ✅ Works on Vercel free tier
- ✅ No GitHub Actions needed (saves Actions minutes)
- ✅ Deploy from your machine when ready
- ✅ Full control over deployments

## One-Time Setup

### 1. Install and Link Vercel

```bash
# Install Vercel CLI globally (if not already)
npm install -g vercel

# Login to Vercel
vercel login

# Link project (from project root)
vercel link
```

When prompted:
- **Set up and deploy:** Yes
- **Which scope:** Select your account
- **Link to existing project:** Yes (or create new)
- **Project name:** `www-crit-fumble-com-2025`
- **Override settings:** No

This creates `.vercel/` directory with project configuration.

### 2. Configure Environment Variables in Vercel

Since we can't use GitHub integration, set env vars in Vercel Dashboard:

**Vercel Dashboard → Settings → Environment Variables**

Add for **Production**:
```env
DATABASE_URL=<production-db-url>
AUTH_SECRET=<production-secret>
NEXTAUTH_URL=https://www.crit-fumble.com
# ... other vars
```

Add for **Preview**:
```env
DATABASE_URL=<staging-db-url>
AUTH_SECRET=<staging-secret>
NEXTAUTH_URL=https://treefarm22-staging.crit-fumble.com
# ... other vars
```

### 3. Pull Environment Variables Locally

```bash
# Pull staging/preview env vars
vercel env pull .env.development.local --environment=preview

# Pull production env vars (if needed)
vercel env pull .env.production.local --environment=production
```

## Deployment Workflows

### Deploy to Staging

```bash
# 1. Switch to staging branch
git checkout staging

# 2. Make your changes and commit
git add .
git commit -m "feat: add new feature"

# 3. Deploy to Vercel (preview/staging)
vercel

# 4. Optional: Assign to staging subdomain
vercel alias set <deployment-url> treefarm22-staging.crit-fumble.com

# 5. Push to GitHub to backup code
git push origin staging
```

**What happens:**
- `vercel` command builds and deploys to a preview URL
- You manually assign it to your staging domain
- Preview deployment uses Preview environment variables

### Deploy to Production

```bash
# 1. Merge staging to main
git checkout main
git merge staging

# 2. Deploy to production
vercel --prod

# 3. Push to GitHub
git push origin main
```

**What happens:**
- `vercel --prod` deploys directly to production
- Uses your production environment variables
- Automatically uses `www.crit-fumble.com` domain

## Automated Deployment Scripts

Add these to `package.json`:

```json
{
  "scripts": {
    "deploy:staging": "vercel",
    "deploy:staging:alias": "vercel alias set $(vercel ls | grep staging | head -1 | awk '{print $2}') treefarm22-staging.crit-fumble.com",
    "deploy:prod": "vercel --prod",
    "deploy:staging:full": "vercel && npm run deploy:staging:alias"
  }
}
```

Then deploy with:

```bash
# Deploy to staging with custom domain
npm run deploy:staging:full

# Deploy to production
npm run deploy:prod
```

## Configuration Files

### vercel.json

Your existing `vercel.json` works perfectly:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"]
}
```

### .vercelignore

Create `.vercelignore` to exclude unnecessary files:

```
node_modules
.git
.env*
!.env.example
tests
docs
*.md
!README.md
.vscode
.idea
```

## Setting Up Custom Domains

### Production Domain (www.crit-fumble.com)

1. In Vercel Dashboard → Settings → Domains
2. Add `www.crit-fumble.com`
3. Configure DNS:
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

### Staging Domain (treefarm22-staging.crit-fumble.com)

1. Add domain in Vercel Dashboard
2. Configure DNS:
   ```
   Type: CNAME
   Name: treefarm22-staging
   Value: cname.vercel-dns.com
   ```
3. Deploy to staging and manually assign:
   ```bash
   vercel
   vercel alias set <deployment-url> treefarm22-staging.crit-fumble.com
   ```

## Local Development Against Staging

```bash
# 1. Pull staging environment variables
vercel env pull .env.development.local --environment=preview

# 2. Update NEXTAUTH_URL to localhost
# Edit .env.development.local:
NEXTAUTH_URL=http://localhost:3000

# 3. Run local dev
npm run dev

# 4. Local dev now uses:
# - Staging database
# - Staging blob storage
# - Staging OAuth apps
# - Local Next.js server
```

## Testing Deployments

```bash
# List recent deployments
vercel ls

# Inspect specific deployment
vercel inspect <url>

# View deployment logs
vercel logs <url>

# Open deployment in browser
vercel open
```

## Typical Workflow

### Feature Development

```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Develop locally (uses staging infra)
npm run dev

# 3. Commit changes
git commit -m "feat: my feature"

# 4. Merge to staging
git checkout staging
git merge feature/my-feature

# 5. Deploy to staging
npm run deploy:staging:full

# 6. Test at: https://treefarm22-staging.crit-fumble.com

# 7. When ready, merge to main and deploy prod
git checkout main
git merge staging
npm run deploy:prod

# 8. Push all branches to GitHub
git push origin main
git push origin staging
```

### Hotfix Production

```bash
# 1. Create hotfix from main
git checkout -b hotfix/critical-fix main

# 2. Fix issue
# ... make changes ...

# 3. Test locally
npm run dev

# 4. Merge to main
git checkout main
git merge hotfix/critical-fix

# 5. Deploy immediately
npm run deploy:prod

# 6. Merge back to staging
git checkout staging
git merge main

# 7. Push everything
git push origin main
git push origin staging
```

## Advantages of This Approach

✅ **Works with private repos**
✅ **No GitHub Actions quota used**
✅ **Full deployment control**
✅ **Instant feedback** (see build in terminal)
✅ **No secrets configuration needed**
✅ **Works on Vercel free tier**

## Limitations

⚠️ **Manual deployment** (not automatic on push)
⚠️ **Must deploy from local machine**
⚠️ **Can't deploy from CI/CD** (unless you pay for GitHub Actions private minutes or Vercel Pro)

## When to Upgrade

Consider Vercel Pro ($20/month) if you need:
- Automatic deployments from private repos
- Password-protected staging
- Team collaboration
- Advanced analytics
- Longer log retention

Or make your repo public to use free GitHub integration.

## Quick Reference

```bash
# Deploy to staging
vercel

# Deploy to staging with custom domain
npm run deploy:staging:full

# Deploy to production
npm run deploy:prod

# Pull environment variables
vercel env pull .env.development.local --environment=preview

# List deployments
vercel ls

# View logs
vercel logs <url>
```

This approach gives you full control while staying on the free tier!
