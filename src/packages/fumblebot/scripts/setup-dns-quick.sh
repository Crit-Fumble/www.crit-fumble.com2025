#!/bin/bash
# Quick DNS setup for FumbleBot
# Uses the known droplet IP: 134.209.171.178

set -e

echo "🌐 FumbleBot - Quick DNS Setup"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

DROPLET_IP="134.209.171.178"
DOMAIN="crit-fumble.com"
SUBDOMAIN="fumblebot"
FULL_DOMAIN="$SUBDOMAIN.$DOMAIN"

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

echo "📋 Configuration:"
echo "   Domain: $FULL_DOMAIN"
echo "   Droplet IP: $DROPLET_IP"
echo ""

# Check if domain exists in DigitalOcean DNS
echo "🔍 Checking if domain '$DOMAIN' exists in DigitalOcean DNS..."
DOMAIN_EXISTS=$(doctl compute domain list --format Domain --no-header | grep -w "$DOMAIN" || echo "")

if [ -z "$DOMAIN_EXISTS" ]; then
  echo -e "${YELLOW}⚠️  Domain '$DOMAIN' not found in DigitalOcean DNS${NC}"
  echo ""
  echo "Would you like to add it? (y/n)"
  echo "Note: This will require updating nameservers at your registrar"
  read -r ADD_DOMAIN

  if [ "$ADD_DOMAIN" = "y" ]; then
    echo ""
    echo "Adding domain to DigitalOcean DNS..."
    doctl compute domain create "$DOMAIN"
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
    echo "   Name: $SUBDOMAIN"
    echo "   Value: $DROPLET_IP"
    echo "   TTL: 3600"
    echo ""
    exit 0
  fi
fi

# Check if A record already exists
echo "🔍 Checking for existing A record for $FULL_DOMAIN..."
EXISTING_RECORD=$(doctl compute domain records list "$DOMAIN" --format Type,Name,Data --no-header | grep -E "^A\s+$SUBDOMAIN" || echo "")

if [ -n "$EXISTING_RECORD" ]; then
  EXISTING_IP=$(echo "$EXISTING_RECORD" | awk '{print $3}')
  echo -e "${YELLOW}⚠️  A record already exists:${NC}"
  echo "   $FULL_DOMAIN → $EXISTING_IP"
  echo ""

  if [ "$EXISTING_IP" = "$DROPLET_IP" ]; then
    echo -e "${GREEN}✅ A record is already pointing to the correct IP!${NC}"
    echo ""
  else
    echo "IP mismatch! Do you want to update it to point to $DROPLET_IP? (y/n)"
    read -r UPDATE_RECORD

    if [ "$UPDATE_RECORD" = "y" ]; then
      # Get record ID
      RECORD_ID=$(doctl compute domain records list "$DOMAIN" --format ID,Type,Name --no-header | grep -E "A\s+$SUBDOMAIN" | awk '{print $1}')

      echo "Updating A record..."
      doctl compute domain records update "$DOMAIN" \
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
  echo "Creating A record: $FULL_DOMAIN → $DROPLET_IP"
  doctl compute domain records create "$DOMAIN" \
    --record-type A \
    --record-name "$SUBDOMAIN" \
    --record-data "$DROPLET_IP" \
    --record-ttl 3600

  echo ""
  echo -e "${GREEN}✅ A record created!${NC}"
fi

echo ""
echo "📋 DNS Configuration Summary:"
echo "   Domain: $DOMAIN"
echo "   Subdomain: $FULL_DOMAIN"
echo "   Type: A"
echo "   Value: $DROPLET_IP"
echo "   TTL: 3600"
echo ""

echo -e "${GREEN}✅ DNS setup complete!${NC}"
echo ""
echo "⏳ DNS propagation may take 5-60 minutes"
echo ""
echo "Verify with:"
echo "  bash scripts/verify-dns.sh"
echo "  dig $FULL_DOMAIN"
echo "  nslookup $FULL_DOMAIN"
echo ""
echo "Next steps:"
echo "  1. Wait for DNS propagation (run verify-dns.sh to check)"
echo "  2. Deploy FumbleBot to droplet (see DEPLOYMENT.md)"
echo "  3. Set up SSL: sudo certbot --nginx -d $FULL_DOMAIN"
echo "  4. Test: curl https://$FULL_DOMAIN/api/health"
echo ""
