#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Looking for dev environment droplet...${NC}"

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
DROPLET_INFO=$(doctl compute droplet list --format Name,ID,PublicIPv4,Status --no-header | grep "^crit-fumble-dev-env" || true)

if [ -z "$DROPLET_INFO" ]; then
  echo -e "${RED}❌ No dev environment droplet found${NC}"
  echo ""
  echo "To start: npm run dev:env:start"
  exit 1
fi

DROPLET_ID=$(echo $DROPLET_INFO | awk '{print $2}')
DROPLET_IP=$(echo $DROPLET_INFO | awk '{print $3}')
DROPLET_STATUS=$(echo $DROPLET_INFO | awk '{print $4}')

echo -e "${GREEN}✅ Found dev environment droplet:${NC}"
echo "  - ID: $DROPLET_ID"
echo "  - IP: $DROPLET_IP"
echo "  - Status: $DROPLET_STATUS"
echo ""

# Optional: Save schema changes
if [ "$1" != "--force" ]; then
    echo -e "${YELLOW}⚠️  Warning: This will destroy the dev environment droplet${NC}"
    echo -e "${YELLOW}   (Database + Website + Bridge)${NC}"
    echo ""
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}ℹ️  Cancelled${NC}"
        exit 0
    fi
fi

echo -e "${BLUE}🛑 Destroying dev environment...${NC}"

# Stop MCP server
echo -e "${BLUE}🛑 Stopping MCP server...${NC}"
if docker ps | grep -q mcp-server; then
    docker compose -f docker-compose.test.yml stop mcp-server > /dev/null 2>&1
    echo -e "${GREEN}✅ MCP server stopped${NC}"
else
    echo -e "${YELLOW}⚠️  MCP server not running${NC}"
fi

# Clean up DNS record
echo -e "${BLUE}🌐 Cleaning up DNS record...${NC}"
EXISTING_DNS=$(doctl compute domain records list crit-fumble.com --format ID,Name --no-header | grep "treefarm22-dev" || true)
if [ -n "$EXISTING_DNS" ]; then
    DNS_RECORD_ID=$(echo $EXISTING_DNS | awk '{print $1}')
    doctl compute domain records delete crit-fumble.com $DNS_RECORD_ID --force > /dev/null 2>&1
    echo -e "${GREEN}✅ DNS record removed${NC}"
fi

# Clean up firewall
echo -e "${BLUE}🔥 Cleaning up firewall...${NC}"
EXISTING_FIREWALL=$(doctl compute firewall list --format Name,ID --no-header | grep "^dev-env-firewall" || true)
if [ -n "$EXISTING_FIREWALL" ]; then
    FIREWALL_ID=$(echo $EXISTING_FIREWALL | awk '{print $2}')
    doctl compute firewall delete $FIREWALL_ID --force > /dev/null 2>&1
    echo -e "${GREEN}✅ Firewall removed${NC}"
fi

# Destroy droplet
echo -e "${BLUE}🛑 Destroying droplet: $DROPLET_ID${NC}"
doctl compute droplet delete $DROPLET_ID --force

echo ""
echo -e "${GREEN}✅ Dev environment destroyed${NC}"
echo -e "${GREEN}💰 Billing stopped${NC}"
echo ""
echo "To start again: npm run dev:env:start"
echo ""
