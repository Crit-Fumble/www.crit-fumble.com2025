# Digital Ocean Quick Start Guide
## Get Crit-Fumble Running in Under 30 Minutes

This is a condensed version of the full [DIGITALOCEAN_SETUP.md](./DIGITALOCEAN_SETUP.md) guide.

---

## What You'll Create

- **App Server**: $4/month Digital Ocean droplet running your web app and Discord bot
- **Database**: $15/month Managed PostgreSQL with automatic backups
- **Domain**: crit-fumble.com with SSL certificate (free)
- **Total**: $19/month to start (scalable as you grow)

---

## Prerequisites

- Digital Ocean account: https://cloud.digitalocean.com/
- Domain name (crit-fumble.com) ready to point to Digital Ocean nameservers
- API tokens for Discord, World Anvil, Anthropic, and OpenAI

---

## Step 1: Install doctl (5 minutes)

### Windows
```powershell
# Run as Administrator
choco install doctl

# Or use the included script
.\install-doctl.bat
```

### Linux/Mac
```bash
# Linux
wget https://github.com/digitalocean/doctl/releases/download/v1.104.0/doctl-1.104.0-linux-amd64.tar.gz
tar xf doctl-*.tar.gz
sudo mv doctl /usr/local/bin

# Mac
brew install doctl
```

### Authenticate
```bash
# Get API token from: https://cloud.digitalocean.com/account/api/tokens
doctl auth init
# Paste your token when prompted

# Verify
doctl account get
```

---

## Step 2: Set Up SSH Key (2 minutes)

```bash
# Generate key (skip if you have one)
ssh-keygen -t ed25519 -C "crit-fumble-deploy"
# Save as: ~/.ssh/crit_fumble_deploy

# Add to Digital Ocean
doctl compute ssh-key create crit-fumble-deploy \
  --public-key "$(cat ~/.ssh/crit_fumble_deploy.pub)"

# Save the SSH key ID
doctl compute ssh-key list
```

---

## Step 3: Create Database (10 minutes)

```bash
# Create managed PostgreSQL
doctl databases create critfumble-db \
  --engine pg \
  --version 16 \
  --size db-s-1vcpu-1gb \
  --region nyc3 \
  --num-nodes 1

# Wait for it to be ready (5-10 mins)
# Get database ID
doctl databases list

# Create app database and user
DB_ID=<your-database-id>
doctl databases db create $DB_ID critfumble
doctl databases user create $DB_ID critfumble-app

# Get connection string (save this!)
doctl databases connection $DB_ID --format URI
```

---

## Step 4: Create Droplet (5 minutes)

```bash
# Get SSH key ID
SSH_KEY_ID=$(doctl compute ssh-key list --format ID --no-header | head -n 1)

# Create droplet
doctl compute droplet create crit-fumble-app \
  --image ubuntu-22-04-x64 \
  --size s-1vcpu-512mb-10gb \
  --region nyc3 \
  --ssh-keys $SSH_KEY_ID \
  --enable-monitoring \
  --enable-ipv6 \
  --tag-names production,web,crit-fumble \
  --wait

# Get IP address (save this!)
doctl compute droplet list --format PublicIPv4
```

---

## Step 5: Configure DNS (5 minutes)

```bash
# Add domain to Digital Ocean
doctl compute domain create crit-fumble.com

# Get droplet IP
DROPLET_IP=$(doctl compute droplet list --format PublicIPv4 --no-header)

# Create DNS records
doctl compute domain records create crit-fumble.com \
  --record-type A --record-name @ --record-data $DROPLET_IP

doctl compute domain records create crit-fumble.com \
  --record-type A --record-name www --record-data $DROPLET_IP
```

**Important**: Update your domain registrar's nameservers to:
- `ns1.digitalocean.com`
- `ns2.digitalocean.com`
- `ns3.digitalocean.com`

---

## Step 6: Allow Database Access (2 minutes)

```bash
# Get droplet and database IDs
DROPLET_IP=$(doctl compute droplet list --format PublicIPv4 --no-header)
DB_ID=$(doctl databases list --format ID --no-header)

# Allow droplet to connect to database
doctl databases firewalls append $DB_ID --rule ip_addr:$DROPLET_IP
```

---

## Step 7: Deploy Application (10+ minutes)

### SSH into droplet
```bash
ssh -i ~/.ssh/crit_fumble_deploy root@$DROPLET_IP
```

### Run on droplet
```bash
# Update system
apt update && apt upgrade -y

# Create deploy user
adduser deploy
usermod -aG sudo deploy

# Set up Docker
curl -fsSL https://get.docker.com | sh
usermod -aG docker deploy

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Set up firewall
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# Switch to deploy user
su - deploy

# Clone repo
git clone https://github.com/YOUR_USERNAME/crit-fumble.git
cd crit-fumble/www.crit-fumble.com

# Create .env
cp .env.example .env
vim .env  # Add your API keys and DATABASE_URL from Digital Ocean
```

### Configure .env
```bash
NODE_ENV=production
DATABASE_URL="<from doctl databases connection>"
NEXTAUTH_URL=https://crit-fumble.com
NEXTAUTH_SECRET=<generate-with: openssl rand -base64 32>

DISCORD_CLIENT_ID=<your-id>
DISCORD_CLIENT_SECRET=<your-secret>
DISCORD_BOT_TOKEN=<your-token>

WORLD_ANVIL_CLIENT_ID=<your-id>
WORLD_ANVIL_CLIENT_SECRET=<your-secret>

ANTHROPIC_API_KEY=<your-key>
OPENAI_API_KEY=<your-key>
```

### Start services
```bash
# Build and start
docker-compose --profile production build
docker-compose --profile production up -d

# Run migrations
docker-compose exec web npx prisma migrate deploy

# Check logs
docker-compose logs -f
```

---

## Step 8: Set Up SSL (5 minutes)

```bash
# Still on droplet as deploy user
sudo apt install -y certbot

# Stop Nginx temporarily
docker-compose stop nginx

# Get certificate
sudo certbot certonly --standalone \
  -d crit-fumble.com \
  -d www.crit-fumble.com \
  --agree-tos \
  --email your@email.com

# Link certificates
mkdir -p ~/crit-fumble/www.crit-fumble.com/nginx/ssl
sudo ln -s /etc/letsencrypt/live/crit-fumble.com/fullchain.pem ~/crit-fumble/www.crit-fumble.com/nginx/ssl/
sudo ln -s /etc/letsencrypt/live/crit-fumble.com/privkey.pem ~/crit-fumble/www.crit-fumble.com/nginx/ssl/

# Restart
docker-compose start nginx
```

---

## You're Live! 🎉

Your app should now be accessible at:
- https://crit-fumble.com
- https://www.crit-fumble.com

---

## Common Commands

```bash
# View logs
docker-compose logs -f web
docker-compose logs -f bot

# Restart services
docker-compose restart

# Update application
git pull
docker-compose build
docker-compose up -d

# Database backup
docker-compose exec postgres pg_dump -U postgres critfumble > backup.sql

# Monitor resources
docker stats
```

---

## Next Steps

### When You Need More Power

**Upgrade Droplet ($12/month):**
```bash
DROPLET_ID=$(doctl compute droplet list --format ID --no-header)
doctl compute droplet-action resize $DROPLET_ID --size s-2vcpu-2gb
```

**Upgrade Database ($30/month):**
```bash
DB_ID=$(doctl databases list --format ID --no-header)
doctl databases resize $DB_ID --size db-s-2vcpu-4gb --num-nodes 1
```

### When You Need AI Processing

**Create GPU Droplet (on-demand):**
```bash
# See DIGITALOCEAN_SETUP.md for GPU droplet setup
# Cost: $0.76/hour only when running
```

**Use Gradient AI Platform:**
- Lower cost for sporadic AI usage
- No infrastructure management
- Pay-per-inference

---

## Troubleshooting

### Can't connect to database
```bash
# Check firewall rules
doctl databases firewalls list $DB_ID

# Add your droplet IP if missing
doctl databases firewalls append $DB_ID --rule ip_addr:$DROPLET_IP
```

### SSL certificate issues
```bash
# Check certificate status
sudo certbot certificates

# Renew manually
sudo certbot renew
```

### Application won't start
```bash
# Check logs
docker-compose logs web

# Verify environment variables
docker-compose exec web printenv | grep DATABASE_URL

# Restart from scratch
docker-compose down
docker-compose up -d
```

---

## Cost Breakdown

| Service | Cost |
|---------|------|
| App Droplet (512MB) | $4/month |
| Managed PostgreSQL | $15/month |
| **Starting Total** | **$19/month** |
| | |
| **Optional Add-ons** | |
| Bigger Droplet (2GB) | $12/month |
| Bigger Database (4GB) | $30/month |
| Object Storage (Spaces) | $5/month |
| GPU Droplet (H100) | $0.76/hour |
| Gradient AI | Pay-per-use |

---

## Support

For detailed instructions, see:
- [DIGITALOCEAN_SETUP.md](./DIGITALOCEAN_SETUP.md) - Complete setup guide
- [DEPLOYMENT.md](./docs/DEPLOYMENT.md) - General deployment info
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) - Technical architecture

Digital Ocean Docs:
- https://docs.digitalocean.com/
- https://docs.digitalocean.com/reference/doctl/
