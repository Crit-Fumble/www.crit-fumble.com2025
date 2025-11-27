#!/bin/bash
# Setup DNS for FumbleBot in Vercel
# Points fumblebot.crit-fumble.com to the droplet IP

set -e

echo "🌐 FumbleBot - Vercel DNS Setup"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

DROPLET_IP="134.209.171.178"
DOMAIN="fumblebot.crit-fumble.com"
ROOT_DOMAIN="crit-fumble.com"

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
  echo -e "${RED}❌ vercel CLI is not installed${NC}"
  echo ""
  echo "Install it with:"
  echo "  npm install -g vercel"
  echo ""
  exit 1
fi

echo -e "${GREEN}✅ vercel CLI is installed${NC}"
echo ""

# Check if user is logged in
echo "🔐 Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
  echo -e "${YELLOW}⚠️  Not logged in to Vercel${NC}"
  echo ""
  echo "Logging in..."
  vercel login
  echo ""
fi

VERCEL_USER=$(vercel whoami)
echo -e "${GREEN}✅ Logged in as: $VERCEL_USER${NC}"
echo ""

# Get the project/team scope
echo "📋 Vercel Configuration:"
echo "   Domain: $DOMAIN"
echo "   Droplet IP: $DROPLET_IP"
echo ""

# Add domain to Vercel project (if not already added)
echo "🔧 Adding domain to Vercel project..."
echo ""

# Navigate to project root
cd ../../../

# Check if domain already exists
EXISTING_DOMAINS=$(vercel domains ls 2>/dev/null | grep "$DOMAIN" || echo "")

if [ -n "$EXISTING_DOMAINS" ]; then
  echo -e "${YELLOW}⚠️  Domain already exists in Vercel${NC}"
  echo ""
  echo "Do you want to remove and re-add it? (y/n)"
  read -r READD_DOMAIN

  if [ "$READD_DOMAIN" = "y" ]; then
    echo "Removing domain..."
    vercel domains rm "$DOMAIN" --yes 2>/dev/null || true
    echo ""
  else
    echo "Keeping existing domain configuration"
    echo ""
  fi
fi

# Add the domain
if [ -z "$EXISTING_DOMAINS" ] || [ "$READD_DOMAIN" = "y" ]; then
  echo "Adding $DOMAIN to Vercel..."
  vercel domains add "$DOMAIN" 2>/dev/null || echo "Domain may already be configured"
  echo ""
fi

# Important: Vercel domains use DNS from your registrar/DNS provider
# We need to configure the A record there, not in Vercel
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: DNS Configuration Required${NC}"
echo ""
echo "Vercel doesn't manage DNS records directly for custom domains."
echo "You need to configure the A record in your DNS provider."
echo ""
echo "Choose your DNS provider:"
echo ""
echo "1. DigitalOcean DNS"
echo "2. Cloudflare"
echo "3. Other DNS provider (manual setup)"
echo ""
read -p "Enter your choice (1-3): " DNS_CHOICE

case $DNS_CHOICE in
  1)
    echo ""
    echo "Using DigitalOcean DNS..."
    echo ""

    if ! command -v doctl &> /dev/null; then
      echo -e "${RED}❌ doctl is not installed${NC}"
      echo "Install it from: https://docs.digitalocean.com/reference/doctl/how-to/install/"
      exit 1
    fi

    # Check if domain exists in DO DNS
    DOMAIN_EXISTS=$(doctl compute domain list --format Domain --no-header | grep -w "$ROOT_DOMAIN" || echo "")

    if [ -z "$DOMAIN_EXISTS" ]; then
      echo "Domain $ROOT_DOMAIN not found in DigitalOcean DNS"
      echo "Would you like to add it? (y/n)"
      read -r ADD_DOMAIN

      if [ "$ADD_DOMAIN" = "y" ]; then
        doctl compute domain create "$ROOT_DOMAIN"
        echo ""
        echo -e "${YELLOW}⚠️  Update nameservers at your registrar to:${NC}"
        echo "   ns1.digitalocean.com"
        echo "   ns2.digitalocean.com"
        echo "   ns3.digitalocean.com"
        echo ""
      else
        exit 0
      fi
    fi

    # Check for existing A record
    EXISTING_RECORD=$(doctl compute domain records list "$ROOT_DOMAIN" --format Type,Name,Data --no-header | grep -E "^A\s+fumblebot" || echo "")

    if [ -n "$EXISTING_RECORD" ]; then
      EXISTING_IP=$(echo "$EXISTING_RECORD" | awk '{print $3}')
      echo "A record already exists: fumblebot.$ROOT_DOMAIN → $EXISTING_IP"

      if [ "$EXISTING_IP" = "$DROPLET_IP" ]; then
        echo -e "${GREEN}✅ A record is already correct!${NC}"
        exit 0
      else
        echo "Updating A record to point to $DROPLET_IP..."
        RECORD_ID=$(doctl compute domain records list "$ROOT_DOMAIN" --format ID,Type,Name --no-header | grep -E "A\s+fumblebot" | awk '{print $1}')
        doctl compute domain records update "$ROOT_DOMAIN" \
          --record-id "$RECORD_ID" \
          --record-data "$DROPLET_IP"
        echo -e "${GREEN}✅ A record updated!${NC}"
      fi
    else
      echo "Creating A record: fumblebot.$ROOT_DOMAIN → $DROPLET_IP"
      doctl compute domain records create "$ROOT_DOMAIN" \
        --record-type A \
        --record-name fumblebot \
        --record-data "$DROPLET_IP" \
        --record-ttl 3600
      echo -e "${GREEN}✅ A record created!${NC}"
    fi
    ;;

  2)
    echo ""
    echo "Cloudflare DNS Setup:"
    echo ""
    echo "1. Go to https://dash.cloudflare.com"
    echo "2. Select your domain: $ROOT_DOMAIN"
    echo "3. Go to DNS → Records"
    echo "4. Add an A record:"
    echo "   Type: A"
    echo "   Name: fumblebot"
    echo "   IPv4 address: $DROPLET_IP"
    echo "   Proxy status: DNS only (click the cloud to disable proxy)"
    echo "   TTL: Auto"
    echo ""
    ;;

  3)
    echo ""
    echo "Manual DNS Setup:"
    echo ""
    echo "Add the following A record in your DNS provider:"
    echo ""
    echo "   Type: A"
    echo "   Name: fumblebot"
    echo "   Value: $DROPLET_IP"
    echo "   TTL: 3600"
    echo ""
    ;;

  *)
    echo "Invalid choice"
    exit 1
    ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}✅ DNS setup complete!${NC}"
echo ""
echo "⏳ DNS propagation may take 5-60 minutes"
echo ""
echo "Verify with:"
echo "  bash scripts/verify-dns.sh"
echo "  dig $DOMAIN"
echo ""
echo "Next steps:"
echo "  1. Wait for DNS propagation"
echo "  2. Deploy FumbleBot to droplet (see DEPLOYMENT.md)"
echo "  3. Set up SSL: sudo certbot --nginx -d $DOMAIN"
echo "  4. Test: curl https://$DOMAIN/api/health"
echo ""
