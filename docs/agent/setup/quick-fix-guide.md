# Quick Fix Guide - Development Issues

## Issue 1: Missing AUTH_SECRET

**Error:**
```
[auth][error] MissingSecret: Please define a `secret`
```

**Fix:**
Add `AUTH_SECRET` to your `.env` file:

```bash
# Generate a random secret
openssl rand -base64 32

# Or use npx
npx auth secret
```

Then add to `.env`:
```env
AUTH_SECRET="your-generated-secret-here"
NEXTAUTH_SECRET="your-generated-secret-here"  # For compatibility
```

**Why both?** NextAuth v5 uses `AUTH_SECRET`, but some legacy code may still check `NEXTAUTH_SECRET`.

## Issue 2: Conflicting public/favicon.ico

**Error:**
```
⨯ A conflicting public file and page file was found for path /favicon.ico
```

**Fix:**
Remove the conflicting file:

```bash
# If you have both:
rm public/favicon.ico
# OR
rm src/app/favicon.ico

# Keep only ONE of them (preferably in /public)
```

## Issue 3: Tests Need Server Running

**Problem:** Integration tests fail with `ERR_CONNECTION_REFUSED` because the dev server isn't running.

**Fix Option 1: Manual Server Start**
```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run tests (after server is ready)
npm run test:e2e
```

**Fix Option 2: Auto-start Server (Playwright Config)**

Uncomment in `playwright.config.ts`:
```typescript
webServer: {
  command: 'npm run dev',
  url: 'http://localhost:3000',
  reuseExistingServer: !process.env.CI,
  timeout: 120000, // 2 minutes to start
},
```

## Issue 4: Slow Server Startup

**Problem:** `npm run dev` takes 26+ seconds to start.

**Causes:**
- Large codebase compilation
- Prisma client generation
- Next.js optimization

**Improvements:**
1. **Use Turbopack (experimental)**:
   ```bash
   npm run dev -- --turbo
   ```

2. **Clear Next.js cache**:
   ```bash
   rm -rf .next
   npm run dev
   ```

3. **Optimize imports** (check for circular dependencies)

4. **For tests**: Start server once, run all tests

## Issue 5: Blank Screenshots

**Problem:** Integration tests capture blank images.

**Fix:** Already applied! The screenshot helper now:
- Waits for `networkidle` state
- Waits for body to be visible
- Adds 500ms buffer for animations
- Has 10s timeout for screenshots

**Test it:**
```bash
# Start server first!
npm run dev

# In another terminal:
npx playwright test tests/integration/00-screenshot-test.spec.ts --project=chromium
```

## Development Workflow

### 1. Initial Setup
```bash
# Copy env example
cp .env.example .env

# Generate secrets
openssl rand -base64 32  # Copy this to AUTH_SECRET and NEXTAUTH_SECRET

# Set up database
npm run db:push

# Start dev server
npm run dev
```

### 2. Running Tests

**Unit Tests** (don't need server):
```bash
npm run test:unit
```

**Integration Tests** (need server):
```bash
# Terminal 1
npm run dev

# Terminal 2 (wait for "Ready")
npm run test:e2e
```

### 3. Before Deploying
```bash
# Run unit tests
npm run test:unit

# Build check
npm run build

# If build succeeds, deploy
git push
```

## Common Commands

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Build for production
npm run start                  # Start production server

# Testing
npm run test:unit             # Unit tests (fast, no server needed)
npm run test:e2e              # Integration tests (needs server)
npm run capture:ui            # Capture UI screenshots

# Database
npm run db:push               # Push schema changes
npm run db:studio             # Open Prisma Studio
npm run db:migrate            # Create migration

# Cleanup
rm -rf .next                  # Clear Next.js cache
rm -rf node_modules && npm install  # Fresh install
```

## Troubleshooting

### "Module not found" errors
```bash
npm install
npm run build
```

### Database errors
```bash
npm run db:push
```

### Auth errors
Check `.env` has:
- `AUTH_SECRET`
- `NEXTAUTH_SECRET`
- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`

### Tests timeout
- Increase timeout in `playwright.config.ts`
- Check server is running on correct port
- Check `PLAYWRIGHT_BASE_URL` in `.env`

---

**Need more help?** Check the main README.md or tests/README.md
