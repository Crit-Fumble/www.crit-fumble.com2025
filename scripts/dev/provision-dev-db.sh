#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Provisioning on-demand dev environment...${NC}"
echo -e "${BLUE}   (Database + Website + Bridge)${NC}"

# Check if doctl is installed
if ! command -v doctl &> /dev/null; then
    echo -e "${RED}❌ doctl is not installed. Please install it first.${NC}"
    echo "Visit: https://docs.digitalocean.com/reference/doctl/how-to/install/"
    exit 1
fi

# Check if authenticated
if ! doctl account get &> /dev/null; then
    echo -e "${RED}❌ doctl is not authenticated. Please run: doctl auth init${NC}"
    exit 1
fi

# Check if dev droplet already exists
EXISTING_DROPLET=$(doctl compute droplet list --format Name,ID --no-header | grep "^crit-fumble-dev-env" || true)

if [ -n "$EXISTING_DROPLET" ]; then
  echo -e "${GREEN}✅ Dev environment already running${NC}"
  DROPLET_ID=$(echo $EXISTING_DROPLET | awk '{print $2}')
  IP=$(doctl compute droplet get $DROPLET_ID --format PublicIPv4 --no-header)
  echo -e "${BLUE}📍 IP: $IP${NC}"
  echo ""
  echo "Services:"
  echo -e "${GREEN}  Database: postgresql://critfumble:devpassword@$IP:5432/critfumble_dev${NC}"
  echo -e "${GREEN}  Website:  http://$IP:3000${NC}"
  echo -e "${GREEN}  Bridge:   http://$IP:3001${NC}"
  echo ""
  echo "Add to .env.local:"
  echo "DATABASE_URL=\"postgresql://critfumble:devpassword@$IP:5432/critfumble_dev\""
  echo "BRIDGE_API_URL=\"http://$IP:3001\""
  exit 0
fi

echo -e "${BLUE}📦 Creating new dev environment droplet...${NC}"

# Get SSH key ID (use first available)
SSH_KEY_ID=$(doctl compute ssh-key list --format ID --no-header | head -n 1)

if [ -z "$SSH_KEY_ID" ]; then
    echo -e "${RED}❌ No SSH keys found. Please add an SSH key to your DigitalOcean account.${NC}"
    echo "Run: doctl compute ssh-key create my-key --public-key \"\$(cat ~/.ssh/id_rsa.pub)\""
    exit 1
fi

echo -e "${BLUE}🔑 Using SSH key: $SSH_KEY_ID${NC}"

# Create droplet (no VPC for simplicity, will use firewall)
# Use 2GB RAM to handle all three services
echo -e "${BLUE}⏳ Creating droplet (this takes ~60 seconds)...${NC}"

DROPLET_ID=$(doctl compute droplet create crit-fumble-dev-env \
  --size s-2vcpu-2gb \
  --image ubuntu-22-04-x64 \
  --region nyc1 \
  --ssh-keys $SSH_KEY_ID \
  --tag-name dev-environment \
  --wait \
  --format ID \
  --no-header)

echo -e "${GREEN}✅ Droplet created: $DROPLET_ID${NC}"

# Get IP address
IP=$(doctl compute droplet get $DROPLET_ID --format PublicIPv4 --no-header)
echo -e "${BLUE}📍 IP: $IP${NC}"

# Get your current IP for firewall
echo -e "${BLUE}🔍 Detecting your IP address...${NC}"
YOUR_IP=$(curl -s https://api.ipify.org)
echo -e "${GREEN}📍 Your IP: $YOUR_IP${NC}"

# Delete old firewall if it exists (cleanup before provisioning)
echo -e "${BLUE}🔥 Checking for old firewall...${NC}"
EXISTING_FIREWALL=$(doctl compute firewall list --format Name,ID --no-header | grep "^dev-env-firewall" || true)
if [ -n "$EXISTING_FIREWALL" ]; then
    FIREWALL_ID=$(echo $EXISTING_FIREWALL | awk '{print $2}')
    echo -e "${YELLOW}⚠️  Deleting old firewall: $FIREWALL_ID${NC}"
    doctl compute firewall delete $FIREWALL_ID --force
fi
echo -e "${GREEN}✅ Ready for new firewall (will apply after SSH is ready)${NC}"

# Configure DNS record for dev subdomain
echo -e "${BLUE}🌐 Configuring DNS: treefarm22-dev.crit-fumble.com...${NC}"

# Delete old DNS record if it exists
EXISTING_DNS=$(doctl compute domain records list crit-fumble.com --format ID,Name --no-header | grep "treefarm22-dev" || true)
if [ -n "$EXISTING_DNS" ]; then
    DNS_RECORD_ID=$(echo $EXISTING_DNS | awk '{print $1}')
    doctl compute domain records delete crit-fumble.com $DNS_RECORD_ID --force > /dev/null 2>&1
fi

# Create A record pointing to droplet IP
doctl compute domain records create crit-fumble.com \
  --record-type A \
  --record-name treefarm22-dev \
  --record-data $IP \
  --record-ttl 300 \
  --no-header > /dev/null

echo -e "${GREEN}✅ DNS configured: treefarm22-dev.crit-fumble.com → $IP${NC}"

# Wait for droplet to be fully ready
echo -e "${BLUE}⏳ Waiting for droplet to be ready...${NC}"

# First, wait for droplet to reach "active" state
MAX_ATTEMPTS=24  # 2 minutes max (24 attempts * 5 seconds)
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    ATTEMPT=$((ATTEMPT + 1))

    DROPLET_STATUS=$(doctl compute droplet get $DROPLET_ID --format Status --no-header)

    if [ "$DROPLET_STATUS" = "active" ]; then
        echo -e "${GREEN}✅ Droplet is active${NC}"
        break
    fi

    if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
        echo -e "${RED}❌ Droplet failed to become active after $MAX_ATTEMPTS attempts${NC}"
        echo -e "${RED}   Current status: $DROPLET_STATUS${NC}"
        exit 1
    fi

    echo -e "${BLUE}   Droplet status: $DROPLET_STATUS (attempt $ATTEMPT/$MAX_ATTEMPTS)${NC}"
    sleep 5
done

# Wait a bit for cloud-init to finish
echo -e "${BLUE}⏳ Waiting for cloud-init to complete...${NC}"
sleep 30

# Now test SSH connectivity (should be quick since droplet is ready)
echo -e "${BLUE}⏳ Testing SSH connection...${NC}"
MAX_SSH_ATTEMPTS=12  # 60 seconds max (12 attempts * 5 seconds)
SSH_ATTEMPT=0

while [ $SSH_ATTEMPT -lt $MAX_SSH_ATTEMPTS ]; do
    SSH_ATTEMPT=$((SSH_ATTEMPT + 1))

    if ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=5 -o BatchMode=yes root@$IP exit 2>/dev/null; then
        echo -e "${GREEN}✅ SSH connection ready!${NC}"
        break
    fi

    if [ $SSH_ATTEMPT -eq $MAX_SSH_ATTEMPTS ]; then
        echo -e "${RED}❌ SSH connection failed after droplet became active${NC}"
        echo -e "${RED}   This is unexpected - droplet may have boot issues${NC}"
        echo -e "${RED}   Droplet ID: $DROPLET_ID${NC}"
        echo -e "${YELLOW}   Try manual SSH: ssh root@$IP${NC}"
        exit 1
    fi

    echo -e "${BLUE}   SSH attempt $SSH_ATTEMPT/$MAX_SSH_ATTEMPTS...${NC}"
    sleep 5
done

# Install Docker and services (PostgreSQL, Redis, Node.js)
echo -e "${BLUE}📦 Installing services...${NC}"

ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null root@$IP << 'EOF'
  set -e

  # Update system
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq
  apt-get install -y -qq docker.io docker-compose postgresql-client git curl > /dev/null 2>&1

  # Install Node.js 20
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
  apt-get install -y -qq nodejs > /dev/null 2>&1

  # Start Docker
  systemctl enable docker > /dev/null 2>&1
  systemctl start docker

  # Create docker-compose.yml for dev services
  mkdir -p /app
  cat > /app/docker-compose.yml << 'DOCKER_EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: dev-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: critfumble
      POSTGRES_PASSWORD: devpassword
      POSTGRES_DB: critfumble_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: dev-redis
    restart: unless-stopped
    command: redis-server --requirepass devredispass
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
DOCKER_EOF

  # Start database services
  cd /app
  docker-compose up -d

  # Wait for services to start
  sleep 15

  echo "✅ Database services ready"
EOF

echo -e "${GREEN}✅ Database services installed and running${NC}"

# Clone production database (if .env.production.local exists)
if [ -f .env.production.local ]; then
    echo -e "${BLUE}📋 Cloning production database...${NC}"

    # Source production env
    set -a
    source .env.production.local
    set +a

    if [ -n "$DATABASE_URL_PUBLIC" ]; then
        # Extract connection details from DATABASE_URL_PUBLIC
        PROD_HOST=$(echo $DATABASE_URL_PUBLIC | sed -n 's|.*@\([^:]*\):.*|\1|p')
        PROD_PORT=$(echo $DATABASE_URL_PUBLIC | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
        PROD_USER=$(echo $DATABASE_URL_PUBLIC | sed -n 's|.*://\([^:]*\):.*|\1|p')
        PROD_PASSWORD=$(echo $DATABASE_URL_PUBLIC | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')
        PROD_DB=$(echo $DATABASE_URL_PUBLIC | sed -n 's|.*/\([^?]*\).*|\1|p')

        # Export production data
        echo -e "${BLUE}📤 Exporting production data...${NC}"
        PGPASSWORD=$PROD_PASSWORD pg_dump \
            -h $PROD_HOST \
            -p $PROD_PORT \
            -U $PROD_USER \
            -d $PROD_DB \
            --no-owner \
            --no-acl \
            --clean \
            --if-exists \
            -f /tmp/prod-backup.sql 2>/dev/null

        echo -e "${GREEN}✅ Production data exported${NC}"

        # Import to dev database
        echo -e "${BLUE}📥 Importing to dev database...${NC}"
        PGPASSWORD=devpassword psql \
            -h $IP \
            -U critfumble \
            -d critfumble_dev \
            -f /tmp/prod-backup.sql \
            > /dev/null 2>&1

        # Clean up backup
        rm /tmp/prod-backup.sql

        echo -e "${GREEN}✅ Production data imported to dev database${NC}"
    else
        echo -e "${YELLOW}⚠️  DATABASE_URL_PUBLIC not found in .env.production.local${NC}"
        echo -e "${YELLOW}⚠️  Skipping production data clone${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  .env.production.local not found${NC}"
    echo -e "${YELLOW}⚠️  Skipping production data clone${NC}"
    echo -e "${BLUE}ℹ️  Dev database created with empty schema${NC}"
fi

# Deploy application code
echo -e "${BLUE}📦 Deploying application code...${NC}"

# Get current git branch and repo URL
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
GIT_REMOTE=$(git config --get remote.origin.url 2>/dev/null || echo "")

if [ -z "$GIT_REMOTE" ]; then
    echo -e "${YELLOW}⚠️  Not in a git repository. Skipping code deployment.${NC}"
else
    # Create temporary deployment key or use SSH agent forwarding
    ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -A root@$IP << EOF
      set -e
      cd /app

      # Clone repository (use HTTPS for simplicity)
      if [ ! -d "crit-fumble" ]; then
        echo "📥 Cloning repository..."
        git clone ${GIT_REMOTE} crit-fumble > /dev/null 2>&1 || true
      fi

      cd crit-fumble
      git fetch origin > /dev/null 2>&1 || true
      git checkout ${GIT_BRANCH} > /dev/null 2>&1 || true
      git pull origin ${GIT_BRANCH} > /dev/null 2>&1 || true

      echo "✅ Code deployed"
EOF

    # Create .env file on droplet
    echo -e "${BLUE}⚙️  Configuring environment...${NC}"

    ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null root@$IP << EOF
      set -e
      cd /app/crit-fumble

      # Create .env.local with dev settings
      cat > .env.local << 'ENV_EOF'
# Dev Environment Configuration
NODE_ENV=development
DATABASE_URL="postgresql://critfumble:devpassword@localhost:5432/critfumble_dev"
REDIS_URL="redis://:devredispass@localhost:6379"

# Bridge API
BRIDGE_API_URL="http://localhost:3001"
BRIDGE_JWT_SECRET="dev-jwt-secret-change-in-production"

# NextAuth
NEXTAUTH_URL="http://${IP}:3000"
NEXTAUTH_SECRET="dev-nextauth-secret-change-in-production"
ENV_EOF

      echo "✅ Environment configured"
EOF

    # Install dependencies and build
    echo -e "${BLUE}📦 Installing dependencies...${NC}"

    ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null root@$IP << 'EOF'
      set -e
      cd /app/crit-fumble

      # Install dependencies
      npm install --production=false > /dev/null 2>&1

      # Build bridge package
      cd src/packages/ttrpg-core-concepts-bridge-api
      npm install > /dev/null 2>&1
      npm run build > /dev/null 2>&1
      cd /app/crit-fumble

      # Run Prisma migrations
      npx prisma generate > /dev/null 2>&1
      npx prisma migrate deploy > /dev/null 2>&1

      echo "✅ Dependencies installed"
EOF

    # Start services with PM2
    echo -e "${BLUE}🚀 Starting services...${NC}"

    ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null root@$IP << 'EOF'
      set -e
      cd /app/crit-fumble

      # Install PM2 globally
      npm install -g pm2 > /dev/null 2>&1

      # Start bridge server
      pm2 start src/packages/ttrpg-core-concepts-bridge-api/dist/standalone.js \
        --name bridge \
        --time \
        --max-memory-restart 500M

      # Build Next.js
      npm run build > /dev/null 2>&1

      # Start Next.js app
      pm2 start npm --name website --time -- start

      # Save PM2 process list
      pm2 save > /dev/null 2>&1

      # Setup PM2 startup script
      pm2 startup systemd -u root --hp /root > /dev/null 2>&1 || true

      echo "✅ Services started"
EOF

    echo -e "${GREEN}✅ Application deployed and running${NC}"
fi

# Apply firewall rules now that services are running
echo -e "${BLUE}🔥 Applying firewall rules...${NC}"
doctl compute firewall create \
  --name dev-env-firewall \
  --inbound-rules "protocol:tcp,ports:5432,sources:addresses:${YOUR_IP}/32" \
  --inbound-rules "protocol:tcp,ports:3000,sources:addresses:${YOUR_IP}/32" \
  --inbound-rules "protocol:tcp,ports:3001,sources:addresses:${YOUR_IP}/32" \
  --inbound-rules "protocol:tcp,ports:6379,sources:addresses:${YOUR_IP}/32" \
  --inbound-rules "protocol:tcp,ports:22,sources:addresses:${YOUR_IP}/32" \
  --outbound-rules "protocol:tcp,ports:all,destinations:addresses:0.0.0.0/0" \
  --outbound-rules "protocol:udp,ports:all,destinations:addresses:0.0.0.0/0" \
  --outbound-rules "protocol:icmp,destinations:addresses:0.0.0.0/0" \
  --droplet-ids $DROPLET_ID \
  --no-header > /dev/null

echo -e "${GREEN}✅ Firewall configured (allows only your IP: $YOUR_IP)${NC}"

# Start MCP server locally
echo -e "${BLUE}🚀 Starting MCP server locally...${NC}"

# Check if MCP server is already running
if docker ps | grep -q mcp-server; then
    echo -e "${YELLOW}⚠️  MCP server already running${NC}"
else
    # Start MCP server
    docker compose -f docker-compose.test.yml up -d mcp-server > /dev/null 2>&1

    # Wait for MCP to be ready
    sleep 5

    # Check if MCP is healthy
    if curl -s http://localhost:3333/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ MCP server started${NC}"
    else
        echo -e "${YELLOW}⚠️  MCP server may not be ready yet${NC}"
    fi
fi

echo ""
echo -e "${GREEN}🎉 Dev environment ready!${NC}"
echo ""
echo "Remote Services (on droplet):"
echo -e "${GREEN}  Database: postgresql://critfumble:devpassword@$IP:5432/critfumble_dev${NC}"
echo -e "${GREEN}  Website:  http://$IP:3000${NC}"
echo -e "${GREEN}  Bridge:   http://$IP:3001${NC}"
echo -e "${GREEN}  Redis:    redis://:devredispass@$IP:6379${NC}"
echo ""
echo "Local Services:"
echo -e "${GREEN}  MCP:      http://localhost:3333${NC}"
echo ""
echo "Add to .env.local:"
echo "DATABASE_URL=\"postgresql://critfumble:devpassword@$IP:5432/critfumble_dev\""
echo "BRIDGE_API_URL=\"http://$IP:3001\""
echo "REDIS_URL=\"redis://:devredispass@$IP:6379\""
echo ""
echo "Droplet info:"
echo "  - ID: $DROPLET_ID"
echo "  - IP: $IP"
echo "  - Size: 2GB RAM, 2 vCPUs"
echo "  - Cost: \$0.024/hour (~\$0.20 for 8-hour session)"
echo ""
echo "Commands:"
echo "  - SSH:        ssh root@$IP"
echo "  - Logs:       ssh root@$IP 'cd /app/crit-fumble && pm2 logs'"
echo "  - Status:     ssh root@$IP 'cd /app/crit-fumble && pm2 status'"
echo "  - MCP Status: curl http://localhost:3333/health"
echo "  - Destroy:    npm run dev:env:stop"
echo ""
