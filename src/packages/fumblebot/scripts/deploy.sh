#!/bin/bash
# Deploy FumbleBot to DigitalOcean Droplet
# Run this script from your local machine to deploy to production

set -e

echo "🚀 FumbleBot - Deploy to Production"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

DROPLET_IP="134.209.171.178"
DROPLET_USER="root"  # Change to 'fumblebot' after initial setup
DEPLOY_PATH="/home/fumblebot/fumblebot"

# Parse command line arguments
SKIP_BUILD=false
SKIP_INSTALL=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    --skip-install)
      SKIP_INSTALL=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Check prerequisites
echo "🔍 Checking prerequisites..."

if [ ! -f ".env.fumblebot" ]; then
  echo -e "${RED}❌ .env.fumblebot not found!${NC}"
  echo "Create this file with your environment variables"
  exit 1
fi

echo -e "${GREEN}✅ Environment file found${NC}"
echo ""

# Build locally (optional)
if [ "$SKIP_BUILD" = false ]; then
  echo "🔨 Building FumbleBot locally..."
  npm run build
  echo -e "${GREEN}✅ Build complete${NC}"
  echo ""
else
  echo -e "${YELLOW}⚠️  Skipping local build${NC}"
  echo ""
fi

# Test SSH connection
echo "🔌 Testing SSH connection to droplet..."
if ! ssh -o ConnectTimeout=5 "$DROPLET_USER@$DROPLET_IP" "echo 'SSH OK'" &> /dev/null; then
  echo -e "${RED}❌ Cannot connect to droplet${NC}"
  echo ""
  echo "Make sure:"
  echo "  1. SSH keys are set up: ssh-copy-id $DROPLET_USER@$DROPLET_IP"
  echo "  2. Droplet is running"
  echo "  3. IP address is correct: $DROPLET_IP"
  echo ""
  exit 1
fi

echo -e "${GREEN}✅ SSH connection successful${NC}"
echo ""

# Create fumblebot user if it doesn't exist
echo "👤 Setting up fumblebot user..."
ssh "$DROPLET_USER@$DROPLET_IP" << 'ENDSSH'
if ! id fumblebot &>/dev/null; then
  echo "Creating fumblebot user..."
  useradd -m -s /bin/bash fumblebot
  mkdir -p /home/fumblebot/.ssh
  cp ~/.ssh/authorized_keys /home/fumblebot/.ssh/ || true
  chown -R fumblebot:fumblebot /home/fumblebot/.ssh
  chmod 700 /home/fumblebot/.ssh
  chmod 600 /home/fumblebot/.ssh/authorized_keys || true
  echo "✅ User created"
else
  echo "✅ User already exists"
fi
ENDSSH

echo ""

# Create deployment directory
echo "📁 Creating deployment directory..."
ssh "$DROPLET_USER@$DROPLET_IP" << ENDSSH
mkdir -p $DEPLOY_PATH
mkdir -p $DEPLOY_PATH/logs
chown -R fumblebot:fumblebot /home/fumblebot
ENDSSH

echo -e "${GREEN}✅ Directory created${NC}"
echo ""

# Sync files to droplet
echo "📤 Syncing files to droplet..."
echo ""

# Using rsync to sync only necessary files
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'dist' \
  --exclude '.env.fumblebot' \
  --include 'package*.json' \
  --include 'tsconfig.json' \
  --include 'prisma/***' \
  --include 'src/***' \
  --include 'scripts/***' \
  --include 'ecosystem.config.js' \
  --include 'Dockerfile' \
  --include '*.md' \
  ./ "$DROPLET_USER@$DROPLET_IP:$DEPLOY_PATH/"

echo ""
echo -e "${GREEN}✅ Files synced${NC}"
echo ""

# Upload environment file separately (secure)
echo "🔐 Uploading environment variables..."
scp .env.fumblebot "$DROPLET_USER@$DROPLET_IP:$DEPLOY_PATH/.env.fumblebot"
ssh "$DROPLET_USER@$DROPLET_IP" "chmod 600 $DEPLOY_PATH/.env.fumblebot && chown fumblebot:fumblebot $DEPLOY_PATH/.env.fumblebot"
echo -e "${GREEN}✅ Environment variables uploaded${NC}"
echo ""

# Install dependencies and build on droplet
echo "📦 Installing dependencies on droplet..."
echo ""

ssh "$DROPLET_USER@$DROPLET_IP" << ENDSSH
cd $DEPLOY_PATH

# Load environment variables
export \$(cat .env.fumblebot | grep -v '^#' | xargs)

# Install Node.js if not present
if ! command -v node &> /dev/null; then
  echo "Installing Node.js..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

# Install PM2 globally if not present
if ! command -v pm2 &> /dev/null; then
  echo "Installing PM2..."
  npm install -g pm2
fi

# Install dependencies
echo "Installing npm packages..."
npm install --production=false

# Generate Prisma Client
echo "Generating Prisma Client..."
npx prisma generate --schema=prisma/schema.prisma

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy --schema=prisma/schema.prisma

# Build TypeScript
echo "Building TypeScript..."
npm run build

# Fix permissions
chown -R fumblebot:fumblebot $DEPLOY_PATH

echo "✅ Installation complete"
ENDSSH

echo ""
echo -e "${GREEN}✅ Dependencies installed and built${NC}"
echo ""

# Start/restart PM2
echo "🔄 Starting FumbleBot with PM2..."
echo ""

ssh "$DROPLET_USER@$DROPLET_IP" << ENDSSH
cd $DEPLOY_PATH

# Switch to fumblebot user for PM2 commands
su - fumblebot << 'ENDSU'
cd $DEPLOY_PATH

# Stop existing process if running
pm2 delete fumblebot 2>/dev/null || true

# Start bot with ecosystem config
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Setup PM2 startup script (first time only)
pm2 startup systemd -u fumblebot --hp /home/fumblebot | grep "sudo" || true
ENDSU
ENDSSH

echo ""
echo -e "${GREEN}✅ FumbleBot started with PM2${NC}"
echo ""

# Show status
echo "📊 Deployment Status:"
echo ""

ssh "$DROPLET_USER@$DROPLET_IP" << 'ENDSSH'
su - fumblebot -c "cd /home/fumblebot/fumblebot && pm2 status"
ENDSSH

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "📋 Useful commands:"
echo ""
echo "  # View logs"
echo "  ssh $DROPLET_USER@$DROPLET_IP 'su - fumblebot -c \"pm2 logs fumblebot\"'"
echo ""
echo "  # Check status"
echo "  ssh $DROPLET_USER@$DROPLET_IP 'su - fumblebot -c \"pm2 status\"'"
echo ""
echo "  # Restart bot"
echo "  ssh $DROPLET_USER@$DROPLET_IP 'su - fumblebot -c \"pm2 restart fumblebot\"'"
echo ""
echo "  # Monitor in real-time"
echo "  ssh $DROPLET_USER@$DROPLET_IP 'su - fumblebot -c \"pm2 monit\"'"
echo ""
echo "🌐 Test endpoints:"
echo "  http://fumblebot.crit-fumble.com/api/health"
echo "  https://fumblebot.crit-fumble.com/api/health (after SSL setup)"
echo ""
echo "Next steps:"
echo "  1. Set up SSL: ssh $DROPLET_USER@$DROPLET_IP 'sudo certbot --nginx -d fumblebot.crit-fumble.com'"
echo "  2. Test Discord bot in your server"
echo "  3. Run pre-generation: ssh $DROPLET_USER@$DROPLET_IP 'su - fumblebot -c \"cd /home/fumblebot/fumblebot && npm run pre-generate\"'"
echo ""
