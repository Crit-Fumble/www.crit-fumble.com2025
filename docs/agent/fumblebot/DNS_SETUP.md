# DNS Setup for FumbleBot
## Pointing fumblebot.crit-fumble.com to DigitalOcean Droplet

---

## Overview

FumbleBot runs on a DigitalOcean droplet, so we need to point the subdomain directly to the droplet's IP address. Vercel is only used for DNS management, not for hosting.

---

## Automated Setup (Recommended)

We've created scripts to automate the DNS setup using `doctl` and `vercel` CLIs.

### Prerequisites

1. **Install doctl** (DigitalOcean CLI):
   ```bash
   # macOS
   brew install doctl

   # Linux
   cd ~
   wget https://github.com/digitalocean/doctl/releases/download/v1.94.0/doctl-1.94.0-linux-amd64.tar.gz
   tar xf ~/doctl-1.94.0-linux-amd64.tar.gz
   sudo mv ~/doctl /usr/local/bin

   # Windows
   # Download from: https://github.com/digitalocean/doctl/releases
   ```

2. **Authenticate doctl**:
   ```bash
   doctl auth init
   # Enter your DigitalOcean API token when prompted
   ```

### Run Automated Setup

```bash
# From fumblebot directory
cd src/packages/fumblebot

# Make script executable
chmod +x scripts/setup-dns.sh

# Run setup
bash scripts/setup-dns.sh
```

The script will:
- ✅ Check for existing fumblebot droplet (or create one)
- ✅ Add domain to DigitalOcean DNS (if needed)
- ✅ Create/update A record pointing to droplet
- ✅ Display configuration summary

### Verify DNS Setup

```bash
# Make script executable
chmod +x scripts/verify-dns.sh

# Run verification
bash scripts/verify-dns.sh
```

The verification script will:
- ✅ Check DNS resolution on multiple nameservers
- ✅ Verify IP matches droplet
- ✅ Test HTTP/HTTPS endpoints
- ✅ Display DigitalOcean DNS records

---

## Manual Setup (Alternative)

If you prefer to set up DNS manually:

### Method 1: Direct A Record (Recommended)

### Step 1: Get Droplet IP

```bash
# Get your droplet IP
doctl compute droplet list fumblebot

# Or via dashboard:
# https://cloud.digitalocean.com/droplets
```

### Step 2: Configure DNS in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to your project settings
3. Go to **Domains** section
4. Click **Add Domain**
5. Enter: `fumblebot.crit-fumble.com`
6. Vercel will show DNS configuration options

### Step 3: Add A Record

Since FumbleBot runs on DO (not Vercel), we need to override Vercel's default CNAME:

1. Go to your domain registrar or DigitalOcean DNS
2. Add an **A record**:
   - **Type**: A
   - **Name**: fumblebot
   - **Value**: `<your-droplet-ip>` (e.g., 159.65.123.45)
   - **TTL**: 3600 (1 hour)

**Example DNS Configuration:**

```
Type  Name       Value              TTL
A     fumblebot  159.65.123.45      3600
```

### Step 4: Verify DNS Propagation

```bash
# Check DNS resolution
dig fumblebot.crit-fumble.com

# Or use nslookup
nslookup fumblebot.crit-fumble.com

# Expected output:
# fumblebot.crit-fumble.com.  3600  IN  A  159.65.123.45
```

DNS propagation typically takes 5-60 minutes.

---

## Method 2: DigitalOcean DNS (Alternative)

If you want to manage all DNS in DigitalOcean instead of Vercel:

### Step 1: Add Domain to DigitalOcean

```bash
# Via doctl
doctl compute domain create crit-fumble.com --ip-address <droplet-ip>

# Or via dashboard:
# https://cloud.digitalocean.com/networking/domains
```

### Step 2: Add A Record for Subdomain

```bash
# Via doctl
doctl compute domain records create crit-fumble.com \
  --record-type A \
  --record-name fumblebot \
  --record-data <droplet-ip> \
  --record-ttl 3600

# Or via dashboard:
# Go to Networking → Domains → crit-fumble.com → Add Record
```

### Step 3: Update Nameservers (at registrar)

Point your domain's nameservers to DigitalOcean:

```
ns1.digitalocean.com
ns2.digitalocean.com
ns3.digitalocean.com
```

**Note**: This changes nameservers for the entire domain, which may affect existing records.

---

## SSL Certificate Setup

Once DNS is pointing to your droplet, set up SSL with Let's Encrypt:

```bash
# SSH into droplet
ssh fumblebot@<droplet-ip>

# Install Certbot (if not already installed)
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d fumblebot.crit-fumble.com

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (recommended: Yes)

# Certbot will automatically:
# - Obtain certificate from Let's Encrypt
# - Update Nginx configuration
# - Set up auto-renewal (runs twice daily via systemd timer)
```

### Verify SSL

```bash
# Check certificate
sudo certbot certificates

# Test auto-renewal
sudo certbot renew --dry-run

# Visit in browser
https://fumblebot.crit-fumble.com/api/health
```

---

## Testing the Setup

### 1. Health Check

```bash
# Test HTTP endpoint
curl http://fumblebot.crit-fumble.com/api/health

# Expected response:
# {"status":"ok","timestamp":"2025-01-27T12:00:00.000Z"}

# Test HTTPS (after SSL setup)
curl https://fumblebot.crit-fumble.com/api/health
```

### 2. Discord Bot Verification

```bash
# Check Discord integration
curl https://fumblebot.crit-fumble.com/api/discord/verify

# This should return verification data for Discord
```

### 3. Monitor Logs

```bash
# On droplet, check PM2 logs
pm2 logs fumblebot

# Check Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Check SSL certificate logs
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

---

## Troubleshooting

### DNS Not Resolving

```bash
# Check DNS propagation
dig fumblebot.crit-fumble.com +trace

# Check if Vercel is interfering
dig fumblebot.crit-fumble.com @8.8.8.8

# Clear DNS cache (local machine)
# Windows:
ipconfig /flushdns

# macOS:
sudo dscacheutil -flushcache

# Linux:
sudo systemd-resolve --flush-caches
```

### SSL Certificate Issues

```bash
# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Verify Nginx configuration
sudo nginx -t

# Check if port 80/443 are open
sudo ufw status

# Manually renew certificate
sudo certbot renew
```

### Connection Timeout

```bash
# Check if Nginx is running
sudo systemctl status nginx

# Check if FumbleBot is running
pm2 status fumblebot

# Check firewall rules
sudo ufw status

# Ensure ports 80 and 443 are allowed
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
```

---

## DNS Configuration Summary

**Recommended Setup:**

- **Domain**: crit-fumble.com
- **Subdomain**: fumblebot.crit-fumble.com
- **DNS Type**: A record
- **DNS Value**: DigitalOcean droplet IP
- **DNS Manager**: DigitalOcean DNS or domain registrar
- **SSL**: Let's Encrypt (via Certbot)
- **Reverse Proxy**: Nginx (on droplet)
- **Bot Process**: PM2 (on droplet)

**Why not Vercel for FumbleBot?**

Vercel is designed for serverless functions and static sites. FumbleBot needs:
- Persistent WebSocket connection to Discord
- Long-running process (not request-based)
- Ability to run background tasks
- Direct database connections
- Lower latency (no cold starts)

Therefore, running on a DigitalOcean droplet is the correct choice.

---

## Quick Reference

### Automated Scripts

```bash
# Setup DNS (automated)
bash scripts/setup-dns.sh

# Verify DNS (automated)
bash scripts/verify-dns.sh
```

### Manual Commands

```bash
# Check droplet IP
doctl compute droplet list fumblebot

# Add A record (via DO)
doctl compute domain records create crit-fumble.com \
  --record-type A --record-name fumblebot \
  --record-data <droplet-ip> --record-ttl 3600

# Verify DNS
dig fumblebot.crit-fumble.com

# Set up SSL
sudo certbot --nginx -d fumblebot.crit-fumble.com

# Test health endpoint
curl https://fumblebot.crit-fumble.com/api/health
```

---

## Next Steps

After DNS is configured:

1. ✅ DNS pointing to droplet IP
2. ✅ SSL certificate installed
3. ⏳ Deploy FumbleBot to droplet (see [DEPLOYMENT.md](DEPLOYMENT.md))
4. ⏳ Start PM2 process
5. ⏳ Test Discord bot functionality
6. ⏳ Monitor logs and performance
