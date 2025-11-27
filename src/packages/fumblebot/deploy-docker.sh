#!/bin/bash
# FumbleBot Docker Deployment Script

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

DROPLET_IP="159.203.126.144"
DROPLET_USER="root"
DEPLOY_DIR="/root/fumblebot"

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  FumbleBot Docker Deployment${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""

# Step 1: Build locally
echo -e "${YELLOW}🏗️  Building TypeScript locally...${NC}"
npm run build
echo -e "${GREEN}✅ Build complete${NC}"
echo ""

# Step 1.5: Run integration tests
echo -e "${YELLOW}🧪 Running integration tests...${NC}"
if npm run test:integration; then
    echo -e "${GREEN}✅ Integration tests passed${NC}"
else
    echo -e "${RED}❌ Integration tests failed - aborting deployment${NC}"
    exit 1
fi
echo ""

# Step 2: Create deployment package
echo -e "${YELLOW}📦 Creating deployment package...${NC}"
tar -czf fumblebot-docker.tar.gz \
    Dockerfile \
    docker-compose.yml \
    .dockerignore \
    package.json \
    package-lock.json \
    dist \
    prisma \
    tsconfig.json \
    src
echo -e "${GREEN}✅ Package created${NC}"
echo ""

# Step 3: Upload to droplet
echo -e "${YELLOW}📤 Uploading to droplet...${NC}"
scp fumblebot-docker.tar.gz $DROPLET_USER@$DROPLET_IP:$DEPLOY_DIR/
echo -e "${GREEN}✅ Upload complete${NC}"
echo ""

# Step 4: Extract and deploy on droplet
echo -e "${YELLOW}🚀 Deploying on droplet...${NC}"
ssh $DROPLET_USER@$DROPLET_IP << ENDSSH
    cd $DEPLOY_DIR
    
    # Stop and remove existing container
    echo "Stopping existing container..."
    docker compose down || true
    
    # Extract new files
    echo "Extracting deployment package..."
    tar -xzf fumblebot-docker.tar.gz
    
    # Build and start container
    echo "Building and starting Docker container..."
    docker compose up -d --build
    
    # Wait for container to start
    echo "Waiting for container to start..."
    sleep 10
    
    # Show status
    echo "Container status:"
    docker compose ps
    
    echo ""
    echo "Recent logs:"
    docker compose logs --tail 30
ENDSSH
echo -e "${GREEN}✅ Deployment complete${NC}"
echo ""

# Step 5: Health check
echo -e "${YELLOW}🏥 Running health check...${NC}"
ssh $DROPLET_USER@$DROPLET_IP "curl -s http://localhost:3001/api/health || echo 'Health check failed'"
echo ""

# Step 6: Post-deployment integration tests
echo -e "${YELLOW}🧪 Running post-deployment integration tests...${NC}"
export FUMBLEBOT_ADMIN_PORTAL_URL="https://fumblebot.crit-fumble.com"
export FUMBLEBOT_ACTIVITY_PUBLIC_URL="https://1443525084256931880.discordsays.com"
if npm run test:integration -- src/integration/admin-portal.integration.test.ts; then
    echo -e "${GREEN}✅ Post-deployment tests passed${NC}"
else
    echo -e "${YELLOW}⚠️  Some post-deployment tests failed - please review${NC}"
fi
echo ""

# Cleanup local package
echo -e "${YELLOW}🧹 Cleaning up...${NC}"
rm fumblebot-docker.tar.gz
echo -e "${GREEN}✅ Cleanup complete${NC}"
echo ""

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  ✅ Deployment Complete!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "View logs: ssh $DROPLET_USER@$DROPLET_IP 'cd $DEPLOY_DIR && docker compose logs -f'"
echo "Check status: ssh $DROPLET_USER@$DROPLET_IP 'cd $DEPLOY_DIR && docker compose ps'"
echo "Restart: ssh $DROPLET_USER@$DROPLET_IP 'cd $DEPLOY_DIR && docker compose restart'"
echo ""
