# Digital Ocean Setup Guide
## Crit-Fumble TTRPG Platform

This guide covers setting up the Crit-Fumble platform on Digital Ocean infrastructure with GPU support and Gradient AI Platform integration.

---

## Infrastructure Overview

### Cost-Effective Scaling Strategy

**Starting Configuration ($19/month):**
- **App Droplet**: $4/month (512MB RAM, 10GB SSD) - Application server
- **Managed PostgreSQL**: $15/month (1GB RAM, 10GB storage, daily backups)
- **Total**: $19/month

**When You Need AI Processing:**
- **GPU Droplet**: $0.76/hour on-demand (only when needed)
- **Gradient AI Platform**: Pay-per-use for model inference

**Future Scaling:**
- Upgrade app droplet to $12/month (2GB RAM) when traffic increases
- Add load balancer ($12/month) for high availability
- Scale PostgreSQL ($30/month for 2GB RAM)

---

## Step 1: Install Digital Ocean CLI (doctl)

### For Windows

**Using Chocolatey (Recommended):**
```powershell
# Install Chocolatey if you don't have it
# Run PowerShell as Administrator
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install doctl
choco install doctl
```

**Manual Installation:**
1. Download from: https://github.com/digitalocean/doctl/releases
2. Extract `doctl.exe` to a folder (e.g., `C:\Program Files\doctl\`)
3. Add to PATH:
   - Search "Environment Variables" in Windows
   - Edit PATH and add `C:\Program Files\doctl\`
   - Restart terminal

### For Linux/WSL

```bash
# Download latest release
cd ~
wget https://github.com/digitalocean/doctl/releases/download/v1.104.0/doctl-1.104.0-linux-amd64.tar.gz

# Extract
tar xf doctl-1.104.0-linux-amd64.tar.gz

# Move to bin
sudo mv doctl /usr/local/bin

# Verify installation
doctl version
```

### For macOS

```bash
# Using Homebrew
brew install doctl

# Or download manually
curl -sL https://github.com/digitalocean/doctl/releases/download/v1.104.0/doctl-1.104.0-darwin-amd64.tar.gz | tar xz
sudo mv doctl /usr/local/bin
```

---

## Step 2: Authenticate with Digital Ocean

### Get API Token

1. Go to https://cloud.digitalocean.com/account/api/tokens
2. Click "Generate New Token"
3. Name it: `crit-fumble-cli`
4. Enable both **Read** and **Write** scopes
5. Copy the token (you won't see it again!)

### Initialize doctl

```bash
# Authenticate
doctl auth init

# Paste your API token when prompted

# Verify authentication
doctl account get
```

You should see your account information if successful.

### Configure Default Context

```bash
# Set up named context
doctl auth init --context crit-fumble

# Switch to context
doctl auth switch --context crit-fumble

# List contexts
doctl auth list
```

---

## Step 3: Set Up SSH Keys

### Generate SSH Key (if you don't have one)

```bash
# Linux/Mac/WSL
ssh-keygen -t ed25519 -C "crit-fumble-deploy"
# Save to: ~/.ssh/crit_fumble_deploy

# Windows (PowerShell)
ssh-keygen -t ed25519 -C "crit-fumble-deploy"
# Save to: C:\Users\YourName\.ssh\crit_fumble_deploy
```

### Add SSH Key to Digital Ocean

```bash
# Add public key
doctl compute ssh-key create crit-fumble-deploy \
  --public-key "$(cat ~/.ssh/crit_fumble_deploy.pub)"

# List your SSH keys
doctl compute ssh-key list

# Note the ID - you'll need it for droplet creation
```

---

## Step 4: Create Managed PostgreSQL Database

### Create Database Cluster

```bash
# Create a basic PostgreSQL cluster
doctl databases create critfumble-db \
  --engine pg \
  --version 16 \
  --size db-s-1vcpu-1gb \
  --region nyc3 \
  --num-nodes 1

# This creates:
# - PostgreSQL 16
# - 1GB RAM, 1 vCPU
# - 10GB storage
# - Daily backups
# - Cost: $15/month

# Get cluster ID
doctl databases list

# Wait for cluster to be ready (takes 5-10 minutes)
doctl databases get <database-id>
```

### Configure Database

```bash
# Get your database ID
DB_ID=$(doctl databases list --format ID --no-header | head -n 1)

# Create the application database
doctl databases db create $DB_ID critfumble

# Create a user for the application
doctl databases user create $DB_ID critfumble-app

# Get connection details
doctl databases connection $DB_ID --format URI

# Save this connection string - you'll need it for DATABASE_URL
```

### Add Trusted Sources (Security)

```bash
# Allow connections from your app droplet (add after creating droplet)
doctl databases firewalls append $DB_ID --rule ip_addr:<droplet-ip>

# Allow your development machine (optional)
doctl databases firewalls append $DB_ID --rule ip_addr:<your-ip>

# List firewall rules
doctl databases firewalls list $DB_ID
```

---

## Step 5: Create Application Droplet

### Create Droplet

```bash
# Get your SSH key ID
SSH_KEY_ID=$(doctl compute ssh-key list --format ID --no-header | head -n 1)

# Create the smallest droplet to start
doctl compute droplet create crit-fumble-app \
  --image ubuntu-22-04-x64 \
  --size s-1vcpu-512mb-10gb \
  --region nyc3 \
  --ssh-keys $SSH_KEY_ID \
  --enable-monitoring \
  --enable-ipv6 \
  --tag-names production,web,crit-fumble \
  --wait

# Cost: $4/month
# Specs: 512MB RAM, 1 vCPU, 10GB SSD

# Get droplet details
doctl compute droplet list --format ID,Name,PublicIPv4,Status
```

### Alternative: Better Performance Droplet

If you need better performance from the start:

```bash
# Create a more capable droplet
doctl compute droplet create crit-fumble-app \
  --image ubuntu-22-04-x64 \
  --size s-2vcpu-2gb \
  --region nyc3 \
  --ssh-keys $SSH_KEY_ID \
  --enable-monitoring \
  --enable-ipv6 \
  --tag-names production,web,crit-fumble \
  --wait

# Cost: $12/month
# Specs: 2GB RAM, 2 vCPU, 50GB SSD
```

### Get Droplet IP

```bash
# Get the IP address
DROPLET_IP=$(doctl compute droplet list --format PublicIPv4 --no-header | head -n 1)
echo "Droplet IP: $DROPLET_IP"

# Add droplet IP to database firewall
DB_ID=$(doctl databases list --format ID --no-header | head -n 1)
doctl databases firewalls append $DB_ID --rule ip_addr:$DROPLET_IP
```

---

## Step 6: Configure DNS

### Add Domain to Digital Ocean

```bash
# Add your domain
doctl compute domain create crit-fumble.com

# List domains
doctl compute domain list
```

### Create DNS Records

```bash
# Get droplet IP
DROPLET_IP=$(doctl compute droplet list --format PublicIPv4 --no-header | head -n 1)

# Create A record for root domain
doctl compute domain records create crit-fumble.com \
  --record-type A \
  --record-name @ \
  --record-data $DROPLET_IP \
  --record-ttl 3600

# Create A record for www subdomain
doctl compute domain records create crit-fumble.com \
  --record-type A \
  --record-name www \
  --record-data $DROPLET_IP \
  --record-ttl 3600

# Create CNAME for api subdomain (optional)
doctl compute domain records create crit-fumble.com \
  --record-type CNAME \
  --record-name api \
  --record-data @ \
  --record-ttl 3600

# List DNS records
doctl compute domain records list crit-fumble.com
```

### Update Domain Nameservers

In your domain registrar, update nameservers to:
- `ns1.digitalocean.com`
- `ns2.digitalocean.com`
- `ns3.digitalocean.com`

Wait for DNS propagation (can take up to 48 hours, usually much faster).

---

## Step 7: Set Up the Droplet

### SSH into Droplet

```bash
# Get droplet IP
DROPLET_IP=$(doctl compute droplet list --format PublicIPv4 --no-header | head -n 1)

# SSH in
ssh -i ~/.ssh/crit_fumble_deploy root@$DROPLET_IP
```

### Initial Server Setup

```bash
# Update system
apt update && apt upgrade -y

# Install essential packages
apt install -y curl git vim ufw fail2ban build-essential

# Create deploy user
adduser deploy
usermod -aG sudo deploy

# Set up SSH for deploy user
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# Switch to deploy user
su - deploy
```

### Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify
docker --version
docker-compose --version

# Logout and login for group changes
exit
```

### Configure Firewall

```bash
# Set up UFW
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Check status
sudo ufw status
```

---

## Step 8: Deploy Application

### Clone Repository

```bash
ssh deploy@$DROPLET_IP

cd ~
git clone https://github.com/YOUR_USERNAME/crit-fumble.git
cd crit-fumble/www.crit-fumble.com
```

### Configure Environment

```bash
# Create .env file
cp .env.example .env
vim .env
```

**Production .env:**
```bash
NODE_ENV=production

# Database (from Digital Ocean Managed DB)
DATABASE_URL="postgresql://critfumble-app:PASSWORD@db-postgresql-nyc3-xxxxx.ondigitalocean.com:25060/critfumble?sslmode=require"

# Redis (local in Docker)
REDIS_URL=redis://redis:6379

# Application
NEXTAUTH_URL=https://crit-fumble.com
NEXTAUTH_SECRET=<your-generated-secret>

# Discord
DISCORD_CLIENT_ID=<your-id>
DISCORD_CLIENT_SECRET=<your-secret>
DISCORD_BOT_TOKEN=<your-token>

# World Anvil
WORLD_ANVIL_CLIENT_ID=<your-id>
WORLD_ANVIL_CLIENT_SECRET=<your-secret>

# AI Services
ANTHROPIC_API_KEY=<your-key>
OPENAI_API_KEY=<your-key>

# Digital Ocean
DO_SPACES_KEY=<your-spaces-key>
DO_SPACES_SECRET=<your-spaces-secret>
DO_SPACES_ENDPOINT=nyc3.digitaloceanspaces.com
DO_SPACES_BUCKET=crit-fumble-assets
```

### Start Application

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

## Step 9: Set Up SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot

# Stop Nginx temporarily
docker-compose stop nginx

# Get certificate
sudo certbot certonly --standalone \
  -d crit-fumble.com \
  -d www.crit-fumble.com \
  --agree-tos \
  --email your@email.com

# Link certificates for Docker
mkdir -p ~/crit-fumble/www.crit-fumble.com/nginx/ssl
sudo ln -s /etc/letsencrypt/live/crit-fumble.com/fullchain.pem ~/crit-fumble/www.crit-fumble.com/nginx/ssl/
sudo ln -s /etc/letsencrypt/live/crit-fumble.com/privkey.pem ~/crit-fumble/www.crit-fumble.com/nginx/ssl/

# Fix permissions
sudo chown -R deploy:deploy ~/crit-fumble/www.crit-fumble.com/nginx/ssl

# Restart Nginx
docker-compose start nginx
```

---

## Step 10: GPU Droplet Integration (On-Demand AI Processing)

### Create GPU Droplet Script

Create a script to spin up GPU droplets on-demand for heavy AI processing:

```bash
# Create script
vim ~/create-gpu-droplet.sh
```

```bash
#!/bin/bash
# Create on-demand GPU droplet for AI processing

SSH_KEY_ID=$(doctl compute ssh-key list --format ID --no-header | head -n 1)

doctl compute droplet create crit-fumble-gpu-$(date +%s) \
  --image gpu-h100x1-base \
  --size gpu-h100x1-80gb \
  --region tor1 \
  --ssh-keys $SSH_KEY_ID \
  --enable-monitoring \
  --tag-names gpu,ai-processing,crit-fumble \
  --user-data-file ~/gpu-init.sh \
  --wait

# Cost: ~$0.76/hour
# Specs: NVIDIA H100 GPU, 80GB GPU RAM

echo "GPU Droplet created. Use 'doctl compute droplet list' to get IP"
```

### GPU Initialization Script

```bash
vim ~/gpu-init.sh
```

```bash
#!/bin/bash
# GPU droplet initialization script

# Update and install dependencies
apt update && apt upgrade -y
apt install -y docker.io nvidia-docker2 python3-pip

# Install AI processing dependencies
pip3 install anthropic openai torch transformers

# Set up communication with main droplet
# (Add your specific setup here)

echo "GPU droplet ready for AI processing"
```

Make executable:
```bash
chmod +x ~/create-gpu-droplet.sh
chmod +x ~/gpu-init.sh
```

### Destroy GPU Droplet When Done

```bash
# List GPU droplets
doctl compute droplet list --tag-name gpu

# Destroy specific droplet
doctl compute droplet delete <droplet-id> --force

# Or destroy all GPU droplets
doctl compute droplet list --tag-name gpu --format ID --no-header | xargs -I {} doctl compute droplet delete {} --force
```

---

## Step 11: Gradient AI Platform Integration

Digital Ocean's Gradient AI Platform can be used for model inference without managing GPU droplets.

### Set Up Gradient AI

1. Enable Gradient AI in Digital Ocean dashboard
2. Get API credentials
3. Add to environment:

```bash
# Add to .env
GRADIENT_API_KEY=<your-gradient-key>
GRADIENT_WORKSPACE_ID=<your-workspace-id>
```

### Use Gradient AI in Application

```typescript
// Example: Using Gradient AI for model inference
import { GradientAI } from '@gradient-ai/sdk'

const gradient = new GradientAI({
  apiKey: process.env.GRADIENT_API_KEY,
  workspaceId: process.env.GRADIENT_WORKSPACE_ID
})

// Deploy a model
const model = await gradient.deployModel({
  modelId: 'llama-2-7b-chat',
  scalingConfig: {
    minReplicas: 0, // Scale to zero when not in use
    maxReplicas: 2
  }
})

// Run inference
const response = await model.complete({
  prompt: 'Generate a D&D encounter for level 5 party',
  maxTokens: 500
})
```

---

## Monitoring and Maintenance

### Set Up Monitoring

```bash
# Install monitoring agent on droplet
curl -sSL https://repos.insights.digitalocean.com/install.sh | sudo bash

# View metrics in Digital Ocean dashboard
# https://cloud.digitalocean.com/monitoring
```

### Create Snapshots (Backups)

```bash
# Create a snapshot of your droplet
DROPLET_ID=$(doctl compute droplet list --format ID --no-header | head -n 1)

doctl compute droplet-action snapshot $DROPLET_ID \
  --snapshot-name "crit-fumble-$(date +%Y%m%d)"

# List snapshots
doctl compute snapshot list
```

### Database Backups

```bash
# Managed PostgreSQL has automatic daily backups
# View backup status
DB_ID=$(doctl databases list --format ID --no-header | head -n 1)
doctl databases backups list $DB_ID

# Create manual backup
doctl databases backups create $DB_ID
```

---

## Cost Breakdown

### Minimum Configuration ($19/month)
| Resource | Specs | Cost |
|----------|-------|------|
| App Droplet | 512MB RAM, 1 vCPU, 10GB SSD | $4/month |
| PostgreSQL | 1GB RAM, 10GB storage | $15/month |
| **Total** | | **$19/month** |

### Recommended Configuration ($27/month)
| Resource | Specs | Cost |
|----------|-------|------|
| App Droplet | 2GB RAM, 2 vCPU, 50GB SSD | $12/month |
| PostgreSQL | 1GB RAM, 10GB storage | $15/month |
| **Total** | | **$27/month** |

### On-Demand Resources (Pay-as-you-go)
| Resource | Cost |
|----------|------|
| GPU Droplet (H100) | $0.76/hour (only when needed) |
| Gradient AI Platform | Pay-per-inference |
| Spaces (Object Storage) | $5/month for 250GB |

### Example AI Processing Costs
- **Light usage** (10 hours GPU/month): $19 + $7.60 = **$26.60/month**
- **Moderate usage** (40 hours GPU/month): $19 + $30.40 = **$49.40/month**
- **Using Gradient AI instead**: $19 + pay-per-use (typically cheaper for sporadic use)

---

## Useful Commands Reference

```bash
# List all droplets
doctl compute droplet list

# Get droplet IP
doctl compute droplet get <droplet-id> --format PublicIPv4

# Resize droplet (scale up)
doctl compute droplet-action resize <droplet-id> --size s-2vcpu-2gb

# List databases
doctl databases list

# Get database connection info
doctl databases connection <db-id>

# List DNS records
doctl compute domain records list crit-fumble.com

# Create firewall rule
doctl compute firewall create \
  --name crit-fumble-fw \
  --inbound-rules "protocol:tcp,ports:22,sources:addresses:0.0.0.0/0 protocol:tcp,ports:80,sources:addresses:0.0.0.0/0 protocol:tcp,ports:443,sources:addresses:0.0.0.0/0"

# Monitor resource usage
doctl monitoring metrics droplet <droplet-id> --start 1h
```

---

## Next Steps

1. ✅ Install doctl
2. ✅ Authenticate with API token
3. ✅ Create managed PostgreSQL database
4. ✅ Create application droplet
5. ✅ Configure DNS for crit-fumble.com
6. ✅ Deploy application with Docker
7. ✅ Set up SSL certificate
8. ⏳ Configure GPU droplet scripts (when needed)
9. ⏳ Integrate Gradient AI Platform (when needed)

You're ready to deploy to Digital Ocean! 🚀
