# FumbleBot - Quick Deployment Guide

Get FumbleBot deployed to your droplet in minutes!

---

## Prerequisites

✅ DNS configured (fumblebot.crit-fumble.com → 134.209.171.178)
✅ Droplet running Ubuntu 22.04
✅ `.env.fumblebot` file with all environment variables
✅ SSH access to droplet

---

## Step 1: Setup SSH Access (First Time Only)

```bash
# Copy your SSH key to the droplet
ssh-copy-id root@134.209.171.178

# Test connection
ssh root@134.209.171.178 "echo 'SSH OK'"
```

**If you don't have an SSH key:**

```bash
# Generate SSH key (press Enter for all prompts)
ssh-keygen -t ed25519 -C "your_email@example.com"

# Copy to droplet
ssh-copy-id root@134.209.171.178
```

---

## Step 2: Verify Environment Variables

Make sure `.env.fumblebot` exists and contains:

```bash
# Required variables
FUMBLEBOT_DISCORD_TOKEN=your_token_here
FUMBLEBOT_DISCORD_CLIENT_ID=your_client_id
FUMBLEBOT_DISCORD_CLIENT_SECRET=your_secret
FUMBLEBOT_DISCORD_PUBLIC_KEY=your_public_key
FUMBLEBOT_DISCORD_GUILD_ID=your_guild_id
FUMBLEBOT_OPENAI_API_KEY=sk-...
FUMBLEBOT_ANTHROPIC_API_KEY=sk-ant-...
FUMBLEBOT_DATABASE_URL=postgresql://doadmin:...

# Optional (for Core Concepts integration)
CORE_CONCEPTS_INTERNAL_URL=http://core-concepts:3001
CORE_CONCEPTS_API_URL=https://core.crit-fumble.com
```

---

## Step 3: Deploy FumbleBot

```bash
# Navigate to fumblebot directory
cd src/packages/fumblebot

# Make deploy script executable
chmod +x scripts/deploy.sh

# Deploy!
bash scripts/deploy.sh
```

The script will:
1. ✅ Build FumbleBot locally
2. ✅ Test SSH connection
3. ✅ Create fumblebot user on droplet
4. ✅ Sync files to droplet
5. ✅ Upload environment variables
6. ✅ Install dependencies on droplet
7. ✅ Run database migrations
8. ✅ Build TypeScript on droplet
9. ✅ Start with PM2

**This takes about 3-5 minutes.** ☕

---

## Step 4: Verify Deployment

```bash
# Check if bot is running
ssh root@134.209.171.178 'su - fumblebot -c "pm2 status"'

# View logs
ssh root@134.209.171.178 'su - fumblebot -c "pm2 logs fumblebot --lines 50"'

# Test health endpoint (will work after Nginx setup)
curl http://134.209.171.178:3000/api/health
```

---

## Step 5: Set Up Nginx and SSL (Optional but Recommended)

```bash
# SSH into droplet
ssh root@134.209.171.178

# Install Nginx
apt update
apt install -y nginx certbot python3-certbot-nginx

# Create Nginx config
cat > /etc/nginx/sites-available/fumblebot << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name fumblebot.crit-fumble.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/health {
        proxy_pass http://localhost:3000/api/health;
        access_log off;
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/fumblebot /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# Set up SSL
certbot --nginx -d fumblebot.crit-fumble.com

# Test HTTPS
curl https://fumblebot.crit-fumble.com/api/health
```

---

## Step 6: Configure Firewall

```bash
# On droplet
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow http
ufw allow https
ufw enable
```

---

## Step 7: Test Discord Bot

1. Go to your Discord server
2. Check if FumbleBot is online
3. Try a command: `/ping` or mention `@FumbleBot`
4. Check logs if issues: `ssh root@134.209.171.178 'su - fumblebot -c "pm2 logs fumblebot"'`

---

## Updating FumbleBot

After making changes to code:

```bash
# From your local machine
cd src/packages/fumblebot
bash scripts/deploy.sh

# Or skip rebuild if no code changes:
bash scripts/deploy.sh --skip-build
```

PM2 will automatically restart the bot with zero downtime.

---

## Useful Commands

### View Logs

```bash
# Live logs
ssh root@134.209.171.178 'su - fumblebot -c "pm2 logs fumblebot"'

# Last 100 lines
ssh root@134.209.171.178 'su - fumblebot -c "pm2 logs fumblebot --lines 100"'

# Error logs only
ssh root@134.209.171.178 'su - fumblebot -c "pm2 logs fumblebot --err"'
```

### Manage Bot

```bash
# Status
ssh root@134.209.171.178 'su - fumblebot -c "pm2 status"'

# Restart
ssh root@134.209.171.178 'su - fumblebot -c "pm2 restart fumblebot"'

# Stop
ssh root@134.209.171.178 'su - fumblebot -c "pm2 stop fumblebot"'

# Monitor in real-time
ssh root@134.209.171.178 'su - fumblebot -c "pm2 monit"'
```

### Database Operations

```bash
# Open Prisma Studio (on droplet)
ssh root@134.209.171.178 'su - fumblebot -c "cd /home/fumblebot/fumblebot && npm run db:studio"'

# Run migrations
ssh root@134.209.171.178 'su - fumblebot -c "cd /home/fumblebot/fumblebot && npm run db:migrate:prod"'
```

### Pre-generate Content

```bash
# Pre-generate all content (reduces AI costs)
ssh root@134.209.171.178 'su - fumblebot -c "cd /home/fumblebot/fumblebot && npm run pre-generate"'

# Pre-generate specific types
ssh root@134.209.171.178 'su - fumblebot -c "cd /home/fumblebot/fumblebot && npm run pre-generate:behaviors"'
```

---

## Troubleshooting

### Bot Not Starting

```bash
# Check logs for errors
ssh root@134.209.171.178 'su - fumblebot -c "pm2 logs fumblebot --err --lines 50"'

# Check environment variables
ssh root@134.209.171.178 'su - fumblebot -c "cat /home/fumblebot/fumblebot/.env.fumblebot"'

# Restart with fresh logs
ssh root@134.209.171.178 'su - fumblebot -c "pm2 delete fumblebot && pm2 start /home/fumblebot/fumblebot/ecosystem.config.js"'
```

### Database Connection Issues

```bash
# Test database connection
ssh root@134.209.171.178 'su - fumblebot -c "cd /home/fumblebot/fumblebot && npx prisma db pull --schema=prisma/schema.prisma"'

# Check if DATABASE_URL is correct
ssh root@134.209.171.178 'su - fumblebot -c "grep DATABASE_URL /home/fumblebot/fumblebot/.env.fumblebot"'
```

### Discord Connection Issues

```bash
# Check Discord token
ssh root@134.209.171.178 'su - fumblebot -c "grep DISCORD_TOKEN /home/fumblebot/fumblebot/.env.fumblebot"'

# Verify token is valid
curl -H "Authorization: Bot YOUR_TOKEN_HERE" https://discord.com/api/v10/users/@me
```

### Memory Issues

```bash
# Check memory usage
ssh root@134.209.171.178 'free -h'

# If high, increase max_memory_restart in ecosystem.config.js
# Then redeploy
```

---

## Monitoring

### DigitalOcean Monitoring

- Go to: https://cloud.digitalocean.com/droplets
- Click on your fumblebot droplet
- View graphs: CPU, Memory, Disk, Bandwidth

### PM2 Monitoring

```bash
# Real-time monitoring
ssh root@134.209.171.178 'su - fumblebot -c "pm2 monit"'

# CPU and memory stats
ssh root@134.209.171.178 'su - fumblebot -c "pm2 status"'
```

---

## Cost Optimization

**Monthly Costs:**
- Droplet: $12/month (s-1vcpu-2gb)
- Database: $15/month (fumblebot-prod)
- **Total: ~$27/month**

**Reduce AI API Costs:**
1. Run pre-generation regularly: `npm run pre-generate`
2. Use scripted content for common queries
3. Consider DigitalOcean Gradient AI (future) for 93-96% savings

---

## Next Steps

After successful deployment:

1. ✅ Set up SSL certificate (Step 5)
2. ✅ Configure firewall (Step 6)
3. ✅ Test Discord bot (Step 7)
4. ⏳ Set up monitoring alerts in DigitalOcean
5. ⏳ Configure automated backups
6. ⏳ Add more Discord commands
7. ⏳ Pre-generate content to reduce costs

---

## Support

- **Issues**: Check logs with `pm2 logs fumblebot`
- **Discord**: Test bot with `/ping` command
- **Health**: `curl https://fumblebot.crit-fumble.com/api/health`
- **Docs**: See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed guide

---

## Quick Reference Card

```bash
# Deploy/Update
cd src/packages/fumblebot && bash scripts/deploy.sh

# View Logs
ssh root@134.209.171.178 'su - fumblebot -c "pm2 logs fumblebot"'

# Restart Bot
ssh root@134.209.171.178 'su - fumblebot -c "pm2 restart fumblebot"'

# Check Status
ssh root@134.209.171.178 'su - fumblebot -c "pm2 status"'

# Test Health
curl https://fumblebot.crit-fumble.com/api/health

# Pre-generate Content
ssh root@134.209.171.178 'su - fumblebot -c "cd /home/fumblebot/fumblebot && npm run pre-generate"'
```

**Happy Gaming! 🎲**
