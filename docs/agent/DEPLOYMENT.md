# Deployment Guide - Self-Hosting Crit-Fumble

This guide will help you deploy your own instance of Crit-Fumble.

## Table of Contents

- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Deployment Options](#deployment-options)
- [Security Checklist](#security-checklist)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

For the fastest deployment, we recommend using Vercel:

```bash
# 1. Clone the repository
git clone https://github.com/your-org/crit-fumble.git
cd crit-fumble

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env.development.local

# 4. Configure environment variables (see below)

# 5. Start development server
npm run dev
```

Visit `http://localhost:3000` to see your Crit-Fumble instance!

---

## Prerequisites

### Required

- **Node.js** 22.x or later
- **npm** 10+ package manager
- **Core API** access (for authentication)

### Recommended

- **Vercel** account (for hosting) - Free tier available
- **Discord** application (for OAuth login)

### Optional

- **FumbleBot** instance (for AI chat features)

---

## Environment Setup

### Step 1: Core API Configuration

Crit-Fumble uses the Core API for authentication and shared identity:

```env
CORE_API_URL="https://core.crit-fumble.com"
CORE_API_SECRET="your-shared-secret"
```

### Step 2: Authentication Setup

**Auth.js Secret** (Required)

```bash
# Generate a random secret
openssl rand -base64 32

# Add to .env.development.local
AUTH_SECRET="your-generated-secret"
```

**Discord OAuth** (Required)

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create New Application
3. Go to OAuth2 settings
4. Add redirect URLs:
   - `http://localhost:3000/api/auth/callback/discord` (development)
   - `https://your-domain.com/api/auth/callback/discord` (production)
5. Copy Client ID and Client Secret

```env
DISCORD_CLIENT_ID="your-client-id"
DISCORD_CLIENT_SECRET="your-client-secret"
```

### Step 3: Permissions Setup

Configure owner and admin users via Discord IDs:

```env
OWNER_DISCORD_IDS="discord_id_1,discord_id_2"
ADMIN_DISCORD_IDS="discord_id_3,discord_id_4"
```

### Step 4: Optional - FumbleBot Integration

```env
BOT_API_SECRET="shared-secret-with-bot"
FUMBLEBOT_API_URL="https://your-fumblebot-api.com"
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
```

**Environment Variables on Vercel:**

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all variables from `.env.example`
3. Redeploy

### Option 2: Docker

```bash
# Build image
docker build -t crit-fumble .

# Run container
docker run -p 3000:3000 \
  -e CORE_API_URL="your-core-url" \
  -e CORE_API_SECRET="your-secret" \
  -e AUTH_SECRET="your-auth-secret" \
  -e DISCORD_CLIENT_ID="your-id" \
  -e DISCORD_CLIENT_SECRET="your-secret" \
  crit-fumble
```

### Option 3: Traditional VPS (Ubuntu/Debian)

```bash
# On your VPS
sudo apt update
sudo apt install -y nodejs npm

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

---

## Security Checklist

Before deploying to production, ensure:

### Environment Security

- [ ] `NODE_ENV` set to `production`
- [ ] `AUTH_SECRET` is a strong random string (32+ characters)
- [ ] All API keys are kept in environment variables (not committed to git)
- [ ] `.env` files are in `.gitignore`

### Application Security

- [ ] HTTPS is enabled (SSL certificate installed)
- [ ] Security headers are enabled (configured in `next.config.js`)
- [ ] Rate limiting is active on all API routes
- [ ] CORS is properly configured
- [ ] Session cookies are secure (httpOnly, secure, sameSite)

### Infrastructure Security

- [ ] Server OS is up to date
- [ ] Firewall is configured (only ports 80/443 open)
- [ ] SSH uses key-based authentication (no password login)
- [ ] Log monitoring is set up

---

## Configuration

### Owner/Admin Setup

Grant owner permissions via Discord IDs:

```env
OWNER_DISCORD_IDS="discord_id_1,discord_id_2"
ADMIN_DISCORD_IDS="discord_id_3,discord_id_4"
```

### Rate Limiting Configuration

Default rate limits (in `src/lib/rate-limit.ts`):

- Auth routes: 5 requests/15 minutes
- API routes: 100 requests/minute
- Public routes: 20 requests/minute
- Chat routes: 30 messages/minute

---

## Troubleshooting

### Authentication Issues

**Error**: `[next-auth][error][OAUTH_CALLBACK_ERROR]`

- Verify OAuth redirect URLs match your domain
- Check CLIENT_ID and CLIENT_SECRET are correct
- Ensure AUTH_SECRET is set

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

### Core API Connection Issues

**Error**: `Failed to connect to Core API`

1. Verify `CORE_API_URL` is correct
2. Check `CORE_API_SECRET` matches the Core API configuration
3. Ensure Core API is running and accessible

---

## Health Check Endpoint

```bash
# Check if your instance is running
curl https://your-domain.com/api/health

# Expected response
{"status":"ok","timestamp":"2025-11-29T..."}
```

---

## Updating

To update your Crit-Fumble instance:

```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install

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

---

**Last Updated**: November 29, 2025
**Minimum Version**: Node.js 22.x
**Recommended**: Vercel deployment
