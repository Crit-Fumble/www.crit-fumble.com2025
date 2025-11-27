# FumbleBot Deployment Guide
## DigitalOcean Droplet Setup with PM2 and Persistence

This guide covers deploying FumbleBot to a DigitalOcean droplet with persistent process management and cron job support.

---

## Prerequisites

- DigitalOcean account with active droplet (Ubuntu 22.04 LTS recommended)
- Domain DNS configured in Vercel (fumblebot.crit-fumble.com → droplet IP)
- FumbleBot database created on DigitalOcean (fumblebot-prod)
- All environment variables ready in `.env.fumblebot`

---

## 1. Droplet Setup

### Create Droplet (if not exists)

```bash
# Via doctl CLI
doctl compute droplet create fumblebot \
  --size s-1vcpu-2gb \
  --image ubuntu-22-04-x64 \
  --region nyc3 \
  --vpc-uuid <your-vpc-uuid> \
  --enable-private-networking \
  --tag-name fumblebot

# Or via DigitalOcean Dashboard:
# - Ubuntu 22.04 LTS
# - Basic plan: $12/month (1 vCPU, 2GB RAM, 50GB SSD)
# - Enable VPC networking
# - Enable monitoring
```

### Initial Server Configuration

```bash
# SSH into droplet
ssh root@<droplet-ip>

# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PM2 globally
npm install -g pm2

# Install additional dependencies
apt install -y git build-essential nginx certbot python3-certbot-nginx

# Create fumblebot user
useradd -m -s /bin/bash fumblebot
usermod -aG sudo fumblebot

# Set up SSH keys for fumblebot user (optional)
mkdir -p /home/fumblebot/.ssh
cp ~/.ssh/authorized_keys /home/fumblebot/.ssh/
chown -R fumblebot:fumblebot /home/fumblebot/.ssh
chmod 700 /home/fumblebot/.ssh
chmod 600 /home/fumblebot/.ssh/authorized_keys
```

---

## 2. Deploy FumbleBot

### Clone Repository

```bash
# Switch to fumblebot user
su - fumblebot

# Clone repository
cd ~
git clone https://github.com/yourusername/crit-fumble.git
cd crit-fumble/src/packages/fumblebot

# Or if using private repo:
git clone git@github.com:yourusername/crit-fumble.git
```

### Set Up Environment Variables

```bash
# Create .env.fumblebot file
nano .env.fumblebot

# Paste your environment variables:
# FUMBLEBOT_DISCORD_TOKEN=...
# FUMBLEBOT_DISCORD_CLIENT_ID=...
# FUMBLEBOT_DISCORD_CLIENT_SECRET=...
# FUMBLEBOT_DISCORD_PUBLIC_KEY=...
# FUMBLEBOT_DISCORD_GUILD_ID=...
# FUMBLEBOT_OPENAI_API_KEY=...
# FUMBLEBOT_ANTHROPIC_API_KEY=...
# FUMBLEBOT_DATABASE_URL=...
# CORE_CONCEPTS_INTERNAL_URL=http://core-concepts:3001 (or private IP)
# CORE_CONCEPTS_API_URL=https://core.crit-fumble.com

# Secure the file
chmod 600 .env.fumblebot
```

### Install Dependencies and Build

```bash
# Install dependencies
npm install

# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate:prod

# Build TypeScript
npm run build

# Pre-generate common content (optional but recommended)
npm run pre-generate
```

---

## 3. Set Up PM2 Process Manager

### Start FumbleBot with PM2

```bash
# Start bot using ecosystem config
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs fumblebot

# Monitor in real-time
pm2 monit
```

### Configure PM2 Startup

```bash
# Generate startup script (run as fumblebot user)
pm2 startup systemd -u fumblebot --hp /home/fumblebot

# This will output a command like:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u fumblebot --hp /home/fumblebot
# Copy and run that command as root

# Save current PM2 process list
pm2 save

# Test restart
sudo systemctl restart pm2-fumblebot
pm2 status
```

---

## 4. Set Up Nginx Reverse Proxy (Optional)

If you want to expose HTTP endpoints (health checks, webhooks):

```bash
# Create Nginx config (as root)
sudo nano /etc/nginx/sites-available/fumblebot

# Paste the following:
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
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        access_log off;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/fumblebot /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Set up SSL with Let's Encrypt
sudo certbot --nginx -d fumblebot.crit-fumble.com
```

---

## 5. Configure Cron Jobs

PM2 ecosystem.config.js already includes cron jobs, but you can also set up manual cron tasks:

```bash
# Edit crontab (as fumblebot user)
crontab -e

# Add pre-generation task (runs at 2 AM daily)
0 2 * * * cd /home/fumblebot/crit-fumble/src/packages/fumblebot && npm run pre-generate >> logs/pregen.log 2>&1

# Add database backup task (runs at 1 AM daily)
0 1 * * * cd /home/fumblebot/crit-fumble/src/packages/fumblebot && npm run db:backup >> logs/backup.log 2>&1
```

---

## 6. DNS Configuration (Vercel)

### Set Up Custom Domain in Vercel

1. Go to Vercel Dashboard → Settings → Domains
2. Add domain: `fumblebot.crit-fumble.com`
3. Vercel will provide a CNAME or A record

### Point to DigitalOcean Droplet

**Option A: Direct A Record (Recommended for droplet)**

1. In Vercel, skip the automatic DNS setup
2. Manually add DNS records in your domain registrar or DigitalOcean DNS:
   - Type: `A`
   - Name: `fumblebot`
   - Value: `<your-droplet-ip>`
   - TTL: `3600`

**Option B: Vercel Proxy (Not recommended for persistent bot)**

1. Use Vercel's CNAME: `fumblebot.crit-fumble.com` → `cname.vercel-dns.com`
2. Vercel will proxy requests to your droplet
3. Note: This adds unnecessary latency for a bot that doesn't need Vercel's edge network

**Recommended: Use Option A** since FumbleBot runs directly on the droplet and doesn't benefit from Vercel's edge network.

---

## 7. Monitoring and Maintenance

### View Logs

```bash
# PM2 logs
pm2 logs fumblebot

# PM2 logs with filtering
pm2 logs fumblebot --lines 100 --err

# System logs
journalctl -u pm2-fumblebot -f
```

### Update Deployment

```bash
# As fumblebot user
cd ~/crit-fumble/src/packages/fumblebot

# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Generate Prisma Client (if schema changed)
npm run db:generate

# Run migrations (if schema changed)
npm run db:migrate:prod

# Rebuild
npm run build

# Restart with PM2
pm2 restart fumblebot

# Or use PM2 reload for zero-downtime
pm2 reload fumblebot
```

### Database Backups

```bash
# Manual backup
pg_dump $FUMBLEBOT_DATABASE_URL > backup-$(date +%Y%m%d).sql

# Or use DigitalOcean automated backups (already enabled on fumblebot-prod)
# Backups are taken daily and retained for 7 days
```

### Health Checks

```bash
# Check bot status
pm2 status

# Check HTTP endpoint (if Nginx configured)
curl https://fumblebot.crit-fumble.com/api/health

# Check Discord connection
pm2 logs fumblebot | grep "Connected to Discord"
```

---

## 8. Troubleshooting

### Bot Not Starting

```bash
# Check logs
pm2 logs fumblebot --err --lines 50

# Check environment variables
pm2 show fumblebot

# Restart with fresh logs
pm2 delete fumblebot
pm2 start ecosystem.config.js
```

### Database Connection Issues

```bash
# Test database connection
npm run db:studio

# Check connection string format
echo $FUMBLEBOT_DATABASE_URL

# Ensure VPC networking is enabled
ping fumblebot-prod-do-user-12500135-0.i.db.ondigitalocean.com
```

### Discord API Issues

```bash
# Verify Discord token
curl -H "Authorization: Bot $FUMBLEBOT_DISCORD_TOKEN" \
  https://discord.com/api/v10/users/@me

# Check Discord intents in Developer Portal
# Ensure GUILD_MEMBERS, GUILD_MESSAGES, GUILD_PRESENCES are enabled
```

### High Memory Usage

```bash
# Check memory usage
pm2 monit

# If memory is high, increase max_memory_restart in ecosystem.config.js
# Then reload:
pm2 reload fumblebot
```

---

## 9. Security Checklist

- [ ] Firewall configured (allow ports 22, 80, 443 only)
- [ ] SSH key authentication enabled
- [ ] Password authentication disabled
- [ ] Non-root user (fumblebot) created
- [ ] Environment variables secured (chmod 600)
- [ ] SSL certificate installed (Let's Encrypt)
- [ ] Database connection uses SSL (sslmode=require)
- [ ] VPC networking enabled for private Core Concepts communication
- [ ] Automated backups enabled on database
- [ ] Monitoring enabled (DigitalOcean monitoring + PM2)

```bash
# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable

# Disable password authentication
sudo nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
sudo systemctl restart sshd
```

---

## 10. Cost Optimization

**Current Monthly Costs:**

- Droplet: $12/month (Basic 1 vCPU, 2GB RAM)
- Database: $15/month (fumblebot-prod with backups)
- Bandwidth: Free (1TB included)
- **Total: ~$27/month**

**Cost Saving Tips:**

1. Use scripted content layer to minimize AI API calls
2. Run pre-generation cron job during off-peak hours
3. Consider DigitalOcean Gradient AI for cheaper LLM inference (93-96% cheaper)
4. Monitor API usage with OpenAI/Anthropic dashboards
5. Use Haiku for simple tasks, Sonnet for complex tasks

---

## Support

- **GitHub Issues**: https://github.com/yourusername/crit-fumble/issues
- **Discord**: Join the Crit-Fumble Gaming Discord
- **Docs**: https://www.crit-fumble.com/docs

---

## Quick Reference

```bash
# Start bot
pm2 start ecosystem.config.js

# Stop bot
pm2 stop fumblebot

# Restart bot
pm2 restart fumblebot

# View logs
pm2 logs fumblebot

# Update deployment
git pull && npm install && npm run build && pm2 reload fumblebot

# Pre-generate content
npm run pre-generate

# Database migrations
npm run db:migrate:prod

# Health check
curl https://fumblebot.crit-fumble.com/api/health
```
