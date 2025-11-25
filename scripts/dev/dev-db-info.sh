#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Checking dev environment status...${NC}"
echo ""

# Check if doctl is installed
if ! command -v doctl &> /dev/null; then
    echo -e "${RED}❌ doctl is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if authenticated
if ! doctl account get &> /dev/null; then
    echo -e "${RED}❌ doctl is not authenticated. Please run: doctl auth init${NC}"
    exit 1
fi

# Find dev droplet
DROPLET_INFO=$(doctl compute droplet list --format Name,ID,PublicIPv4,Status,CreatedAt --no-header | grep "^crit-fumble-dev-env" || true)

if [ -z "$DROPLET_INFO" ]; then
  echo -e "${RED}❌ No dev environment droplet running${NC}"
  echo ""
  echo "To start: npm run dev:env:start"
  exit 1
fi

DROPLET_ID=$(echo $DROPLET_INFO | awk '{print $2}')
DROPLET_IP=$(echo $DROPLET_INFO | awk '{print $3}')
DROPLET_STATUS=$(echo $DROPLET_INFO | awk '{print $4}')
CREATED_AT=$(echo $DROPLET_INFO | awk '{print $5}')

echo -e "${GREEN}✅ Dev environment droplet running:${NC}"
echo ""
echo "  Name: crit-fumble-dev-env"
echo "  ID: $DROPLET_ID"
echo "  IP: $DROPLET_IP"
echo "  Status: $DROPLET_STATUS"
echo "  Created: $CREATED_AT"
echo ""

# Check MCP server status
echo "Checking MCP server..."
if docker ps | grep -q mcp-server; then
    MCP_STATUS="${GREEN}running${NC}"
else
    MCP_STATUS="${RED}stopped${NC}"
fi

echo ""
echo "Remote Services (on droplet):"
echo -e "${GREEN}  Database: postgresql://critfumble:devpassword@$DROPLET_IP:5432/critfumble_dev${NC}"
echo -e "${GREEN}  Website:  http://$DROPLET_IP:3000${NC}"
echo -e "${GREEN}  Bridge:   http://$DROPLET_IP:3001${NC}"
echo -e "${GREEN}  Redis:    redis://:devredispass@$DROPLET_IP:6379${NC}"
echo ""
echo "Local Services:"
echo -e "  MCP:      http://localhost:3333 (${MCP_STATUS})"
echo ""
echo "Add to .env.local:"
echo "DATABASE_URL=\"postgresql://critfumble:devpassword@$DROPLET_IP:5432/critfumble_dev\""
echo "BRIDGE_API_URL=\"http://$DROPLET_IP:3001\""
echo "REDIS_URL=\"redis://:devredispass@$DROPLET_IP:6379\""
echo ""
echo "Current cost: \$0.024/hour (~\$0.20 for 8-hour session)"
echo ""
echo "Commands:"
echo "  - To destroy:  npm run dev:env:stop"
echo "  - SSH:         ssh root@$DROPLET_IP"
echo "  - Logs:        ssh root@$DROPLET_IP 'cd /app/crit-fumble && pm2 logs'"
echo "  - Status:      ssh root@$DROPLET_IP 'cd /app/crit-fumble && pm2 status'"
echo "  - Connect DB:  psql postgresql://critfumble:devpassword@$DROPLET_IP:5432/critfumble_dev"
echo "  - MCP Status:  curl http://localhost:3333/health"
echo ""
