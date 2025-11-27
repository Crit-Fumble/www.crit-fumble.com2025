#!/bin/bash
# Complete FumbleBot deployment script for fresh droplet

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

DROPLET_IP="159.203.126.144"
DROPLET_USER="root"

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  FumbleBot Complete Deployment${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""

# Step 1: Install Node.js
echo -e "${YELLOW}📦 Installing Node.js 20...${NC}"
ssh $DROPLET_USER@$DROPLET_IP << 'ENDSSH'
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    node --version
    npm --version
ENDSSH
echo -e "${GREEN}✅ Node.js installed${NC}"
echo ""

# Step 2: Install PM2
echo -e "${YELLOW}📦 Installing PM2...${NC}"
ssh $DROPLET_USER@$DROPLET_IP "npm install -g pm2 && pm2 --version"
echo -e "${GREEN}✅ PM2 installed${NC}"
echo ""

# Step 3: Install Git
echo -e "${YELLOW}📦 Installing Git...${NC}"
ssh $DROPLET_USER@$DROPLET_IP "apt-get install -y git && git --version"
echo -e "${GREEN}✅ Git installed${NC}"
echo ""

# Step 4: Clone repository
echo -e "${YELLOW}📂 Cloning repository...${NC}"
ssh $DROPLET_USER@$DROPLET_IP << 'ENDSSH'
    cd /root
    if [ -d "crit-fumble" ]; then
        echo "Repository already exists, pulling latest..."
        cd crit-fumble && git pull
    else
        git clone https://github.com/Crit-Fumble/www.crit-fumble.com2025.git crit-fumble
    fi
ENDSSH
echo -e "${GREEN}✅ Repository cloned${NC}"
echo ""

# Step 5: Copy environment file
echo -e "${YELLOW}📝 Copying environment file...${NC}"
ssh $DROPLET_USER@$DROPLET_IP "cp /root/.env.fumblebot /root/crit-fumble/src/packages/fumblebot/.env && chmod 600 /root/crit-fumble/src/packages/fumblebot/.env"
echo -e "${GREEN}✅ Environment file copied${NC}"
echo ""

# Step 6: Install root dependencies
echo -e "${YELLOW}📦 Installing root dependencies...${NC}"
ssh $DROPLET_USER@$DROPLET_IP << 'ENDSSH'
    cd /root/crit-fumble
    npm install
ENDSSH
echo -e "${GREEN}✅ Root dependencies installed${NC}"
echo ""

# Step 7: Generate Prisma client
echo -e "${YELLOW}🔧 Generating Prisma client...${NC}"
ssh $DROPLET_USER@$DROPLET_IP "cd /root/crit-fumble/src/packages/fumblebot && npm run db:generate"
echo -e "${GREEN}✅ Prisma client generated${NC}"
echo ""

# Step 8: Build TypeScript
echo -e "${YELLOW}🏗️  Building TypeScript...${NC}"
ssh $DROPLET_USER@$DROPLET_IP "cd /root/crit-fumble/src/packages/fumblebot && npm run build"
echo -e "${GREEN}✅ TypeScript built${NC}"
echo ""

# Step 9: Start with PM2
echo -e "${YELLOW}🚀 Starting FumbleBot with PM2...${NC}"
ssh $DROPLET_USER@$DROPLET_IP << 'ENDSSH'
    cd /root/crit-fumble/src/packages/fumblebot
    pm2 start dist/index.js --name fumblebot --time
    pm2 save
    pm2 startup systemd -u root --hp /root
ENDSSH
echo -e "${GREEN}✅ FumbleBot started${NC}"
echo ""

# Step 10: Show status
echo -e "${YELLOW}📊 Current status:${NC}"
ssh $DROPLET_USER@$DROPLET_IP "pm2 status && echo '' && pm2 logs fumblebot --lines 20 --nostream"
echo ""

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  ✅ Deployment Complete!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "Monitor logs: ssh $DROPLET_USER@$DROPLET_IP 'pm2 logs fumblebot'"
echo "Check status: ssh $DROPLET_USER@$DROPLET_IP 'pm2 status'"
echo ""
