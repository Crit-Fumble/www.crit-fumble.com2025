#!/bin/bash
# Setup DNS for FumbleBot using DigitalOcean CLI
# Points fumblebot.crit-fumble.com to the droplet

set -e

echo "🌐 FumbleBot - DNS Setup"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if doctl is installed
if ! command -v doctl &> /dev/null; then
  echo -e "${RED}❌ doctl is not installed${NC}"
  echo "Install it from: https://docs.digitalocean.com/reference/doctl/how-to/install/"
  exit 1
fi

# Check if doctl is authenticated
if ! doctl auth list &> /dev/null; then
  echo -e "${RED}❌ doctl is not authenticated${NC}"
  echo "Run: doctl auth init"
  exit 1
fi

echo -e "${GREEN}✅ doctl is installed and authenticated${NC}"
echo ""

# Get or create fumblebot droplet
echo "📍 Looking for fumblebot droplet..."
DROPLET_INFO=$(doctl compute droplet list fumblebot --format ID,Name,PublicIPv4 --no-header 2>/dev/null || echo "")

if [ -z "$DROPLET_INFO" ]; then
  echo -e "${YELLOW}⚠️  No droplet named 'fumblebot' found${NC}"
  echo ""
  echo "Do you want to create a new droplet? (y/n)"
  read -r CREATE_DROPLET

  if [ "$CREATE_DROPLET" = "y" ]; then
    echo ""
    echo "Creating fumblebot droplet..."
    echo "  - Size: s-1vcpu-2gb (\$12/month)"
    echo "  - Image: ubuntu-22-04-x64"
    echo "  - Region: nyc3"
    echo ""

    # Get VPC UUID (filter for nyc3 region after listing)
    VPC_UUID=$(doctl vpcs list --format ID,Region --no-header | grep nyc3 | awk '{print $1}' | head -n 1)

    if [ -n "$VPC_UUID" ]; then
      echo "Using VPC: $VPC_UUID"
      doctl compute droplet create fumblebot \
        --size s-1vcpu-2gb \
        --image ubuntu-22-04-x64 \
        --region nyc3 \
        --vpc-uuid "$VPC_UUID" \
        --enable-monitoring \
        --tag-names fumblebot \
        --wait
    else
      echo "No VPC found for nyc3, creating without VPC (you can add later)"
      doctl compute droplet create fumblebot \
        --size s-1vcpu-2gb \
        --image ubuntu-22-04-x64 \
        --region nyc3 \
        --enable-monitoring \
        --tag-names fumblebot \
        --wait
    fi

    echo ""
    echo -e "${GREEN}✅ Droplet created!${NC}"
    echo ""

    # Get new droplet info
    DROPLET_INFO=$(doctl compute droplet list fumblebot --format ID,Name,PublicIPv4 --no-header)
  else
    echo -e "${RED}❌ Cannot proceed without a droplet${NC}"
    exit 1
  fi
fi

DROPLET_ID=$(echo "$DROPLET_INFO" | awk '{print $1}')
DROPLET_IP=$(echo "$DROPLET_INFO" | awk '{print $3}')

echo -e "${GREEN}✅ Found droplet: fumblebot${NC}"
echo "   ID: $DROPLET_ID"
echo "   IP: $DROPLET_IP"
echo ""

# Check if domain exists in DigitalOcean
echo "🔍 Checking if domain 'crit-fumble.com' exists in DigitalOcean DNS..."
DOMAIN_EXISTS=$(doctl compute domain list --format Domain --no-header | grep -w "crit-fumble.com" || echo "")

if [ -z "$DOMAIN_EXISTS" ]; then
  echo -e "${YELLOW}⚠️  Domain 'crit-fumble.com' not found in DigitalOcean DNS${NC}"
  echo ""
  echo "Would you like to add it? (y/n)"
  echo "Note: This will require updating nameservers at your registrar"
  read -r ADD_DOMAIN

  if [ "$ADD_DOMAIN" = "y" ]; then
    echo ""
    echo "Adding domain to DigitalOcean DNS..."
    doctl compute domain create crit-fumble.com
    echo ""
    echo -e "${GREEN}✅ Domain added!${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT: Update nameservers at your registrar to:${NC}"
    echo "   ns1.digitalocean.com"
    echo "   ns2.digitalocean.com"
    echo "   ns3.digitalocean.com"
    echo ""
  else
    echo ""
    echo -e "${YELLOW}ℹ️  You can manually add an A record in your DNS provider:${NC}"
    echo "   Type: A"
    echo "   Name: fumblebot"
    echo "   Value: $DROPLET_IP"
    echo "   TTL: 3600"
    echo ""
    exit 0
  fi
fi

# Check if A record already exists
echo "🔍 Checking for existing A record for fumblebot.crit-fumble.com..."
EXISTING_RECORD=$(doctl compute domain records list crit-fumble.com --format Type,Name,Data --no-header | grep -E "^A\s+fumblebot" || echo "")

if [ -n "$EXISTING_RECORD" ]; then
  EXISTING_IP=$(echo "$EXISTING_RECORD" | awk '{print $3}')
  echo -e "${YELLOW}⚠️  A record already exists:${NC}"
  echo "   fumblebot.crit-fumble.com → $EXISTING_IP"
  echo ""

  if [ "$EXISTING_IP" = "$DROPLET_IP" ]; then
    echo -e "${GREEN}✅ A record is already pointing to the correct IP!${NC}"
    echo ""
    exit 0
  else
    echo "Would you like to update it to point to $DROPLET_IP? (y/n)"
    read -r UPDATE_RECORD

    if [ "$UPDATE_RECORD" = "y" ]; then
      # Get record ID
      RECORD_ID=$(doctl compute domain records list crit-fumble.com --format ID,Type,Name --no-header | grep -E "A\s+fumblebot" | awk '{print $1}')

      echo "Updating A record..."
      doctl compute domain records update crit-fumble.com \
        --record-id "$RECORD_ID" \
        --record-data "$DROPLET_IP"

      echo ""
      echo -e "${GREEN}✅ A record updated!${NC}"
    else
      echo "Skipping update."
      exit 0
    fi
  fi
else
  # Create new A record
  echo "Creating A record: fumblebot.crit-fumble.com → $DROPLET_IP"
  doctl compute domain records create crit-fumble.com \
    --record-type A \
    --record-name fumblebot \
    --record-data "$DROPLET_IP" \
    --record-ttl 3600

  echo ""
  echo -e "${GREEN}✅ A record created!${NC}"
fi

echo ""
echo "📋 DNS Configuration Summary:"
echo "   Domain: crit-fumble.com"
echo "   Subdomain: fumblebot.crit-fumble.com"
echo "   Type: A"
echo "   Value: $DROPLET_IP"
echo "   TTL: 3600"
echo ""

echo -e "${GREEN}✅ DNS setup complete!${NC}"
echo ""
echo "⏳ DNS propagation may take 5-60 minutes"
echo ""
echo "Verify with:"
echo "  dig fumblebot.crit-fumble.com"
echo "  nslookup fumblebot.crit-fumble.com"
echo ""
echo "Next steps:"
echo "  1. Wait for DNS propagation"
echo "  2. Deploy FumbleBot to droplet (see DEPLOYMENT.md)"
echo "  3. Set up SSL: sudo certbot --nginx -d fumblebot.crit-fumble.com"
echo "  4. Test: curl https://fumblebot.crit-fumble.com/api/health"
echo ""
