# FumbleBot Deployment Guide

## Overview

FumbleBot is deployed to a DigitalOcean droplet at IP address `159.203.126.144` running as a systemd service behind a Caddy reverse proxy for HTTPS.

## DNS Configuration

### Vercel DNS Setup

**REQUIRED:** Before the admin portal can be accessed, update the Vercel DNS settings for `crit-fumble.com`:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to your project → Settings → Domains
3. Click on `crit-fumble.com` domain settings
4. Add an A record:
   - **Type:** A
   - **Name:** `fumblebot` (creates fumblebot.crit-fumble.com)
   - **Value:** `159.203.126.144`
   - **TTL:** 3600 (or default)

5. Wait for DNS propagation (usually 5-15 minutes)

You can verify DNS propagation with:
```bash
dig fumblebot.crit-fumble.com
# or
nslookup fumblebot.crit-fumble.com
```

### Discord OAuth Configuration

Update Discord Developer Portal with the following OAuth2 redirect URL:
- `https://fumblebot.crit-fumble.com/auth/callback/discord`

## Deployment URLs

- **Admin Portal:** https://fumblebot.crit-fumble.com
  - Login: https://fumblebot.crit-fumble.com/login
  - Admin Dashboard: https://fumblebot.crit-fumble.com/admin
  - API Health Check: https://fumblebot.crit-fumble.com/api/health

- **Discord Activity:** https://1443525084256931880.discordsays.com
  - Served through Discord's CDN with Cloudflare

## Environment Variables

### Required Environment Variables

The bot requires the following environment variables in `.env`:

```bash
# Discord Bot Configuration
FUMBLEBOT_DISCORD_CLIENT_ID=<client-id>
FUMBLEBOT_DISCORD_TOKEN=<bot-token>
FUMBLEBOT_DISCORD_CLIENT_SECRET=<client-secret>
FUMBLEBOT_DISCORD_GUILD_ID=1002008886137589771
FUMBLEBOT_DISCORD_TEST_GUILD_ID=1153767296867770378

# Auth Secret (defaults to FUMBLEBOT_DISCORD_CLIENT_SECRET if not set)
AUTH_SECRET=<client-secret>  # Can use same value as FUMBLEBOT_DISCORD_CLIENT_SECRET

# AI Services
FUMBLEBOT_OPENAI_API_KEY=<openai-key>
FUMBLEBOT_ANTHROPIC_API_KEY=<anthropic-key>

# Discord Activity Server
FUMBLEBOT_ACTIVITY_ENABLED=true
FUMBLEBOT_ACTIVITY_PORT=3000
FUMBLEBOT_ACTIVITY_PUBLIC_URL=https://1443525084256931880.discordsays.com

# Database (production)
DATABASE_URL=<production-database-url>

# Node Environment
NODE_ENV=production
```

**Note:** `AUTH_SECRET` is used for session management. It defaults to `FUMBLEBOT_DISCORD_CLIENT_SECRET` if not explicitly set.

## Deployment Architecture

### Server Components

1. **FumbleBot Process** - Node.js application running via systemd
   - Service: `/etc/systemd/system/fumblebot.service`
   - Location: `/root/fumblebot`
   - Logs: `/root/fumblebot/fumblebot.log`

2. **Caddy Reverse Proxy** - HTTPS termination and routing
   - Config: `/etc/caddy/Caddyfile`
   - Handles SSL certificates automatically via Let's Encrypt
   - Routes traffic to bot on localhost:3001

3. **Discord Bot Client** - Connects to Discord Gateway
   - Handles slash commands and interactions
   - Manages Discord activity server

4. **API Server** - Express.js application
   - Port: 3001 (internal)
   - Handles OAuth, webhooks, admin dashboard
   - Auth.js integration for Discord login

### Port Mapping

- **3001** - Internal API server (Express)
- **3000** - Internal Activity server
- **443** - External HTTPS (Caddy → 3001)

## Deployment Process

### Using Docker (Recommended for Future)

```bash
./deploy-docker.sh
```

This script:
1. Builds TypeScript locally
2. Runs pre-deployment integration tests
3. Creates deployment package
4. Uploads to droplet
5. Builds and starts Docker container
6. Runs health checks
7. Runs post-deployment integration tests

**Note:** Docker deployment is prepared but currently using systemd due to npm install issues in container. Docker will be enabled once resolved.

### Using Systemd (Current Method)

```bash
# On local machine - build and upload
npm run build
scp -r dist root@159.203.126.144:/root/fumblebot/
scp package.json root@159.203.126.144:/root/fumblebot/
scp .env root@159.203.126.144:/root/fumblebot/

# On droplet - restart service
ssh root@159.203.126.144
cd /root/fumblebot
npm install --production
npx prisma generate --schema=prisma/schema.prisma
systemctl restart fumblebot
systemctl status fumblebot
```

## Systemd Service Management

### Service Commands

```bash
# Start the bot
systemctl start fumblebot

# Stop the bot
systemctl stop fumblebot

# Restart the bot
systemctl restart fumblebot

# Check status
systemctl status fumblebot

# View logs (live)
journalctl -u fumblebot -f

# View last 100 lines
journalctl -u fumblebot -n 100
```

### Service File Location

`/etc/systemd/system/fumblebot.service`

```ini
[Unit]
Description=FumbleBot Discord Bot
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/fumblebot
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
StandardOutput=append:/root/fumblebot/fumblebot.log
StandardError=append:/root/fumblebot/fumblebot.log

[Install]
WantedBy=multi-user.target
```

## Caddy Configuration

### Caddyfile Location

`/etc/caddy/Caddyfile`

### Configuration

```caddy
# Discord Activity - served at the Discord-provided domain
1443525084256931880.discordsays.com {
    reverse_proxy localhost:3001

    header {
        X-Frame-Options "ALLOW-FROM https://discord.com"
        Content-Security-Policy "frame-ancestors https://discord.com"
        Access-Control-Allow-Origin "https://discord.com"
        Access-Control-Allow-Credentials "true"
    }
}

# FumbleBot Admin Portal
fumblebot.crit-fumble.com {
    reverse_proxy localhost:3001

    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "SAMEORIGIN"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
}
```

### Caddy Commands

```bash
# Reload configuration
systemctl reload caddy

# Restart Caddy
systemctl restart caddy

# Check status
systemctl status caddy

# View logs
journalctl -u caddy -f
```

## Integration Tests

Integration tests verify the admin portal is accessible and functioning correctly.

### Run Tests Locally

```bash
# Set environment variables for test URLs
export FUMBLEBOT_ADMIN_PORTAL_URL="https://fumblebot.crit-fumble.com"
export FUMBLEBOT_ACTIVITY_PUBLIC_URL="https://1443525084256931880.discordsays.com"

# Run all integration tests
npm run test:integration

# Run only admin portal tests
npm run test:integration -- src/integration/admin-portal.integration.test.ts
```

### Test Coverage

Admin portal integration tests verify:
- Health check endpoint responds correctly
- Login page is accessible
- Admin page redirects unauthenticated users
- HTTPS security headers are properly configured
- Discord activity server responds
- OAuth endpoints are configured
- API endpoints exist
- Performance is acceptable
- Error handling works correctly
- SSL/TLS is properly configured

## Health Checks

### API Health Check

```bash
curl https://fumblebot.crit-fumble.com/api/health
# Expected: {"status":"ok"}
```

### Discord Bot Status

Check the bot is online in Discord:
- Bot should appear as "FumbleBot#5295"
- Status should be "Online"
- Activity should show "Playing Crit-Fumble Gaming"

### Activity Server Check

```bash
curl https://1443525084256931880.discordsays.com
# Should return 200 OK
```

## Troubleshooting

### Bot Not Responding

1. Check systemd service status:
   ```bash
   systemctl status fumblebot
   ```

2. Check logs:
   ```bash
   journalctl -u fumblebot -n 100
   # or
   tail -n 100 /root/fumblebot/fumblebot.log
   ```

3. Verify environment variables are loaded:
   ```bash
   cat /root/fumblebot/.env
   ```

### HTTPS Not Working

1. Check Caddy status:
   ```bash
   systemctl status caddy
   ```

2. Verify Caddy configuration:
   ```bash
   caddy validate --config /etc/caddy/Caddyfile
   ```

3. Check Caddy logs:
   ```bash
   journalctl -u caddy -f
   ```

4. Verify DNS is pointing to correct IP:
   ```bash
   dig fumblebot.crit-fumble.com
   ```

### Admin Portal Not Accessible

1. Verify DNS is configured in Vercel (see DNS Configuration section)
2. Check OAuth redirect URL in Discord Developer Portal
3. Verify `AUTH_SECRET` or `FUMBLEBOT_DISCORD_CLIENT_SECRET` is set
4. Run integration tests to diagnose specific issues

### Commands Not Registering

1. Check bot has proper permissions in Discord server
2. Verify `FUMBLEBOT_DISCORD_GUILD_ID` is correct
3. Check logs for registration errors
4. Manually trigger command registration:
   ```bash
   ssh root@159.203.126.144
   cd /root/fumblebot
   systemctl restart fumblebot
   ```

## Security Considerations

1. **Environment Variables** - Never commit `.env` to version control
2. **HTTPS Only** - All production traffic must use HTTPS
3. **Session Security** - Sessions use httpOnly cookies with secure flag in production
4. **Admin Verification** - Admin endpoints verify Discord guild admin permissions
5. **CORS** - Configured to allow Discord.com for activity embedding
6. **Security Headers** - Caddy adds HSTS, X-Frame-Options, CSP headers

## Monitoring

### Key Metrics to Monitor

- Bot uptime (systemd service status)
- API response times (health check latency)
- Discord command success rate
- Memory usage
- Log error frequency

### Log Locations

- **Application logs:** `/root/fumblebot/fumblebot.log`
- **Systemd logs:** `journalctl -u fumblebot`
- **Caddy logs:** `journalctl -u caddy`

## Rollback Procedure

If deployment fails:

1. Stop the new service:
   ```bash
   systemctl stop fumblebot
   ```

2. Restore previous dist directory (keep backups):
   ```bash
   cd /root/fumblebot
   rm -rf dist
   cp -r dist.backup dist
   ```

3. Restart service:
   ```bash
   systemctl start fumblebot
   ```

4. Verify service is working:
   ```bash
   curl https://fumblebot.crit-fumble.com/api/health
   ```

## Next Steps

- [ ] Complete Vercel DNS configuration
- [ ] Verify admin portal is accessible at https://fumblebot.crit-fumble.com
- [ ] Test Discord OAuth login flow
- [ ] Run full integration test suite
- [ ] Resolve Docker build issues for future container-based deployment
- [ ] Set up monitoring and alerting
- [ ] Configure automated backups
- [ ] Document admin dashboard features
