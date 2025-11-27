# Deployment Guide - Self-Hosting Crit-Fumble

This guide will help you deploy your own instance of Crit-Fumble, whether for development, staging, or production use.

## Table of Contents

- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Deployment Options](#deployment-options)
- [Security Checklist](#security-checklist)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

For the fastest deployment, we recommend using Vercel (same infrastructure as our production site):

```bash
# 1. Clone the repository
git clone https://github.com/your-org/crit-fumble.git
cd crit-fumble

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env.development.local

# 4. Set up your database (see Database Setup below)

# 5. Run database migrations
npx prisma migrate deploy

# 6. Start development server
npm run dev
```

Visit `http://localhost:3000` to see your Crit-Fumble instance!

---

## Prerequisites

### Required

- **Node.js** 18.17 or later
- **PostgreSQL** database (we recommend [Neon](https://neon.tech) for serverless Postgres)
- **npm** or **yarn** package manager

### Recommended

- **Vercel** account (for hosting) - Free tier available
- **Discord** application (for OAuth login)
- **GitHub** OAuth app (for GitHub login)

### Optional

- **Anthropic API key** (for AI features)
- **OpenAI API key** (for structured data generation)
- **World Anvil** application key (for World Anvil integration)
- **DigitalOcean** account (for Foundry VTT provisioning)

---

## Environment Setup

### Step 1: Database Setup

**Option A: Neon (Recommended - Serverless Postgres)**

1. Create account at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string from your Neon dashboard
4. Add to `.env.development.local`:

```env
DATABASE_URL="postgresql://username:password@host/dbname?sslmode=require"
```

**Option B: Self-Hosted PostgreSQL**

```bash
# Install PostgreSQL 14+
# Create database
createdb crit_fumble

# Add connection string
DATABASE_URL="postgresql://localhost:5432/crit_fumble"
```

### Step 2: Authentication Setup

**NextAuth Secret** (Required)

```bash
# Generate a random secret
openssl rand -base64 32

# Add to .env.development.local
NEXTAUTH_SECRET="your-generated-secret"
NEXTAUTH_URL="http://localhost:3000"
```

**Discord OAuth** (Recommended)

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create New Application
3. Go to OAuth2 settings
4. Add redirect URL: `http://localhost:3000/api/auth/callback/discord`
5. Copy Client ID and Client Secret

```env
DISCORD_CLIENT_ID="your-client-id"
DISCORD_CLIENT_SECRET="your-client-secret"
```

**GitHub OAuth** (Optional)

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create New OAuth App
3. Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

```env
GITHUB_CLIENT_ID="your-github-id"
GITHUB_CLIENT_SECRET="your-github-secret"
```

### Step 3: Optional Integrations

**AI Features** (Optional - Owner-only in production)

```env
# Anthropic Claude API
ANTHROPIC_API_KEY="sk-ant-..."

# OpenAI API
OPENAI_API_KEY="sk-..."
```

**World Anvil Integration** (Optional)

```env
WORLD_ANVIL_CLIENT_SECRET="your-app-key-from-worldanvil"
```

**Foundry VTT Provisioning** (Optional)

```env
DO_API_TOKEN="your-digitalocean-token"
FOUNDRY_BRIDGE_URL="http://localhost:30000"
```

### Step 4: Run Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# (Optional) Seed database
npx prisma db seed
```

### Step 5: Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` - your Crit-Fumble instance should be running!

---

## Deployment Options

### Option 1: Vercel (Recommended)

**Pros**: Zero-config, automatic SSL, serverless, free tier
**Cons**: Cold starts on free tier

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts to connect your database
```

**Environment Variables on Vercel:**

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all variables from `.env.example`
3. Redeploy

### Option 2: Docker

**Pros**: Portable, consistent environments
**Cons**: Requires Docker knowledge

```bash
# Build image
docker build -t crit-fumble .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="your-db-url" \
  -e NEXTAUTH_SECRET="your-secret" \
  crit-fumble
```

### Option 3: Traditional VPS (Ubuntu/Debian)

**Pros**: Full control, no platform limits
**Cons**: Requires server management

```bash
# On your VPS
sudo apt update
sudo apt install -y nodejs npm postgresql

# Clone repo
git clone https://github.com/your-org/crit-fumble.git
cd crit-fumble

# Install dependencies
npm install

# Build production bundle
npm run build

# Start with PM2 (process manager)
npm install -g pm2
pm2 start npm --name "crit-fumble" -- start
pm2 save
pm2 startup
```

**Nginx Configuration:**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Security Checklist

Before deploying to production, ensure:

### Environment Security

- [ ] `NODE_ENV` set to `production`
- [ ] `NEXTAUTH_SECRET` is a strong random string (32+ characters)
- [ ] All API keys are kept in environment variables (not committed to git)
- [ ] `.env` files are in `.gitignore`

### Database Security

- [ ] Database uses SSL/TLS connections
- [ ] Database password is strong and unique
- [ ] Database is not publicly accessible (use VPC/firewall)
- [ ] Regular backups are configured

### Application Security

- [ ] HTTPS is enabled (SSL certificate installed)
- [ ] Security headers are enabled (already configured in `next.config.js`)
- [ ] Rate limiting is active on all API routes (already implemented)
- [ ] CORS is properly configured
- [ ] Session cookies are secure (httpOnly, secure, sameSite)

### Infrastructure Security

- [ ] Server OS is up to date
- [ ] Firewall is configured (only ports 80/443 open)
- [ ] SSH uses key-based authentication (no password login)
- [ ] Fail2ban or similar brute-force protection is installed
- [ ] Log monitoring is set up

### Optional Security Enhancements

- [ ] Set up error tracking (Sentry, LogRocket, etc.)
- [ ] Configure uptime monitoring
- [ ] Enable 2FA for all admin accounts
- [ ] Set up automated security scanning
- [ ] Configure DDoS protection (Cloudflare, etc.)

---

## Configuration

### Owner/Admin Setup

To grant owner permissions (for AI features, Foundry management):

```env
# Add Discord IDs of owners (JSON array)
DISCORD_OWNER_IDS='["discord_id_1","discord_id_2"]'

# Or add emails
OWNER_EMAILS='["owner1@example.com","owner2@example.com"]'
```

### Rate Limiting Configuration

Default rate limits (in `src/lib/rate-limit.ts`):

- API routes: 100 requests/minute
- Public routes: 200 requests/minute

To modify:

```typescript
// src/lib/rate-limit.ts
export const apiRateLimiter = new RateLimiterMemory({
  points: 100, // Number of requests
  duration: 60, // Per 60 seconds
});
```

### Feature Flags

Enable/disable features via environment variables:

```env
# Enable AI features (owner-only)
ENABLE_AI_FEATURES=true

# Enable Foundry VTT integration
ENABLE_FOUNDRY=true

# Enable marketplace
ENABLE_MARKETPLACE=true
```

---

## Troubleshooting

### Database Connection Issues

**Error**: `Can't reach database server`

```bash
# Test database connection
npx prisma db pull

# Check connection string format
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require
```

### Authentication Issues

**Error**: `[next-auth][error][OAUTH_CALLBACK_ERROR]`

- Verify OAuth redirect URLs match your domain
- Check CLIENT_ID and CLIENT_SECRET are correct
- Ensure NEXTAUTH_URL matches your deployment URL

### Build Errors

**Error**: `Module not found`

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

### Performance Issues

**Slow API responses:**

1. Check database query performance
2. Enable database connection pooling
3. Consider adding Redis for caching
4. Review rate limiting settings

### AI Features Not Working

**Error**: `Forbidden - Owner access required`

1. Verify you're logged in with an owner account
2. Check `DISCORD_OWNER_IDS` or `OWNER_EMAILS` in `.env`
3. Verify API keys are set (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`)

---

## Monitoring

### Recommended Monitoring Tools

**Application Monitoring:**
- [Sentry](https://sentry.io) - Error tracking
- [LogRocket](https://logrocket.com) - Session replay

**Infrastructure Monitoring:**
- [UptimeRobot](https://uptimerobot.com) - Uptime monitoring
- [Better Stack](https://betterstack.com) - Log aggregation

**Database Monitoring:**
- Neon Dashboard - Built-in metrics
- [Datadog](https://www.datadog.com) - Advanced monitoring

### Health Check Endpoint

```bash
# Check if your instance is running
curl https://your-domain.com/api/health

# Expected response
{"status":"ok","timestamp":"2025-11-24T..."}
```

---

## Updating

To update your Crit-Fumble instance:

```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Run new migrations
npx prisma migrate deploy

# Rebuild
npm run build

# Restart (Vercel deploys automatically)
pm2 restart crit-fumble  # If using PM2
```

---

## Support

Need help deploying? Check these resources:

- [GitHub Issues](https://github.com/your-org/crit-fumble/issues)
- [Documentation](./docs/agent/README.md)
- [Discord Community](https://discord.gg/your-invite)
- [Security Policy](./SECURITY.md)

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on contributing to Crit-Fumble.

---

**Last Updated**: November 24, 2025
**Minimum Version**: Node.js 18.17+
**Recommended**: Vercel + Neon Database

