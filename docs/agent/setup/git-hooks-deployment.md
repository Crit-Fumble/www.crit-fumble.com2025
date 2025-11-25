# Git Hooks for Automatic Deployment

This project uses Husky Git hooks to automatically deploy to Vercel when you push to `staging` or `main` branches.

## How It Works

### Post-Push Hook (`post-push`)

Automatically runs **after** you push to GitHub:

```bash
git push origin staging   # → Deploys to staging
git push origin main      # → Deploys to production
git push origin feature   # → No deployment
```

#### What Happens:

**When pushing to `staging`:**
1. Hook detects `staging` branch
2. Runs `vercel --yes` (deploys to preview)
3. Runs `vercel alias treefarm22-staging.crit-fumble.com` (assigns custom domain)
4. Shows deployment URL

**When pushing to `main`:**
1. Hook detects `main` branch
2. Runs `vercel --prod --yes` (deploys to production)
3. Shows deployment URL

**Other branches:**
- No automatic deployment
- Can manually deploy with `vercel` if needed

### Pre-Commit Hook (`pre-commit`)

Runs **before** you commit code:

```bash
git commit -m "message"
  ↓
1. Type checks (npm run type-check)
2. If passes → commit succeeds
3. If fails → commit blocked
```

## Setup

### Installation

Already set up! Husky was installed and hooks are configured.

### Files Created

```
.husky/
├── _/                 # Husky internals
├── pre-commit         # Runs before commits (type check)
└── post-push          # Runs after push (auto-deploy)
```

### Customization

#### Enable/Disable Hooks

**Temporarily skip pre-commit checks:**
```bash
git commit --no-verify -m "message"
```

**Temporarily skip post-push deployment:**
```bash
# No built-in flag, but you can:
mv .husky/post-push .husky/post-push.disabled
git push origin staging
mv .husky/post-push.disabled .husky/post-push
```

#### Modify Pre-Commit Hook

Edit `.husky/pre-commit`:

```bash
# Add linting
npm run lint

# Add unit tests
npm run test:unit

# Add Prisma validation
npx prisma validate
```

#### Modify Post-Push Hook

Edit `.husky/post-push`:

```bash
# Add notifications (Slack, Discord, etc.)
# Run database migrations
# Trigger additional scripts
```

## Workflow Examples

### Feature Development

```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Develop and test locally
npm run dev

# 3. Commit (pre-commit hook runs type check)
git commit -m "feat: add my feature"
# → Type check runs
# → If passes, commit succeeds

# 4. Push to GitHub (no deployment)
git push origin feature/my-feature
# → No post-push deployment (not staging or main)

# 5. Merge to staging
git checkout staging
git merge feature/my-feature

# 6. Push to staging (auto-deploys!)
git push origin staging
# → Post-push hook runs
# → Deploys to Vercel
# → Assigns to treefarm22-staging.crit-fumble.com
# → Shows deployment URL

# 7. Test staging deployment
npm run test:staging

# 8. When ready, deploy to production
git checkout main
git merge staging
git push origin main
# → Post-push hook runs
# → Deploys to production
# → Shows deployment URL
```

### Hotfix Production

```bash
# 1. Create hotfix from main
git checkout -b hotfix/critical-fix main

# 2. Fix the issue
# ... make changes ...

# 3. Commit (type check runs)
git commit -m "fix: critical production issue"

# 4. Merge to main
git checkout main
git merge hotfix/critical-fix

# 5. Push (auto-deploys to production!)
git push origin main
# → Post-push hook deploys to production

# 6. Merge back to staging
git checkout staging
git merge main
git push origin staging
# → Post-push hook deploys to staging
```

## Hook Execution Flow

### Pre-Commit

```
git commit -m "message"
  ↓
[pre-commit hook]
  ↓
npm run type-check
  ↓
✅ Pass → Commit succeeds
❌ Fail → Commit blocked
```

### Post-Push

```
git push origin staging
  ↓
Push to GitHub succeeds
  ↓
[post-push hook]
  ↓
Detect branch = staging
  ↓
vercel --yes
  ↓
vercel alias treefarm22-staging.crit-fumble.com
  ↓
✅ Deployment complete!
```

## Troubleshooting

### Hook Not Running

**Verify hooks are executable:**
```bash
ls -la .husky/
chmod +x .husky/post-push
chmod +x .husky/pre-commit
```

**Verify Husky is installed:**
```bash
npm list husky
# Should show: husky@9.x.x
```

**Check hook is not skipped:**
```bash
# Don't use --no-verify if you want hooks to run
git commit -m "message"  # ✅ Hooks run
git commit --no-verify -m "message"  # ❌ Hooks skipped
```

### Deployment Fails in Post-Push

**Check Vercel is logged in:**
```bash
vercel whoami
# If not logged in:
vercel login
```

**Check project is linked:**
```bash
vercel link
```

**View deployment logs:**
```bash
vercel logs
```

### Type Check Fails in Pre-Commit

**Fix TypeScript errors:**
```bash
npm run type-check
# Fix any errors shown
```

**Temporarily bypass (not recommended):**
```bash
git commit --no-verify -m "message"
```

## Benefits

✅ **Automatic Deployments**
   - No manual `vercel` commands needed
   - Deploy happens when you push

✅ **Consistent Process**
   - Same deployment flow for everyone
   - No forgetting to deploy

✅ **Quality Gates**
   - Type checks before commit
   - Ensures code quality

✅ **Feedback Loop**
   - See deployment status immediately
   - URL shown in terminal

## Advanced Configuration

### Add Deployment Notifications

Edit `.husky/post-push`:

```bash
# After deployment, send notification
if [ "$BRANCH" = "main" ]; then
  curl -X POST https://hooks.slack.com/YOUR_WEBHOOK \
    -d '{"text":"🚀 Production deployed!"}'
fi
```

### Run Database Migrations

Edit `.husky/post-push`:

```bash
if [ "$BRANCH" = "staging" ]; then
  echo "📊 Running database migrations..."
  DATABASE_URL=$STAGING_DB_URL npx prisma migrate deploy
fi
```

### Conditional Deployments

Edit `.husky/post-push`:

```bash
# Only deploy if [deploy] in commit message
LAST_COMMIT=$(git log -1 --pretty=%B)

if [[ $LAST_COMMIT == *"[deploy]"* ]]; then
  echo "🚀 [deploy] tag found, deploying..."
  vercel --prod --yes
else
  echo "ℹ️  No [deploy] tag, skipping deployment"
fi
```

## Disabling Hooks

### Temporarily

```bash
# Skip single commit
git commit --no-verify -m "WIP"

# Skip single push (no built-in flag, manually disable)
mv .husky/post-push .husky/post-push.disabled
git push
mv .husky/post-push.disabled .husky/post-push
```

### Permanently

```bash
# Remove specific hook
rm .husky/post-push

# Disable all hooks
npm pkg delete scripts.prepare
rm -rf .husky
```

## Re-enabling Hooks

```bash
# Reinstall
npm install -D husky
npx husky init

# Recreate hooks
# (see .husky/post-push and .husky/pre-commit above)
```

## Summary

With Git hooks:
- `git push origin staging` → **Auto-deploys to staging**
- `git push origin main` → **Auto-deploys to production**
- `git commit` → **Auto-runs type check**

No manual deployment commands needed - just push and deploy!
