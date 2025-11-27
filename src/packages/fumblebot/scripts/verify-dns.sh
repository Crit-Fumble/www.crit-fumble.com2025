#!/bin/bash
# Verify DNS setup for FumbleBot
# Checks that fumblebot.crit-fumble.com resolves to the correct IP

set -e

echo "🔍 FumbleBot - DNS Verification"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

DOMAIN="fumblebot.crit-fumble.com"

# Check if doctl is installed and authenticated
if command -v doctl &> /dev/null && doctl auth list &> /dev/null 2>&1; then
  echo "📍 Getting droplet IP from DigitalOcean..."
  DROPLET_IP=$(doctl compute droplet list fumblebot --format PublicIPv4 --no-header 2>/dev/null | tr -d '[:space:]')

  if [ -n "$DROPLET_IP" ]; then
    echo -e "${GREEN}✅ Found fumblebot droplet: $DROPLET_IP${NC}"
    EXPECTED_IP="$DROPLET_IP"
  else
    echo -e "${YELLOW}⚠️  Droplet not found via doctl${NC}"
    EXPECTED_IP=""
  fi
else
  echo -e "${YELLOW}⚠️  doctl not available, skipping droplet IP check${NC}"
  EXPECTED_IP=""
fi

echo ""

# Check DNS resolution using dig
if command -v dig &> /dev/null; then
  echo "🔍 Checking DNS with dig..."
  DIG_OUTPUT=$(dig +short "$DOMAIN" A)

  if [ -n "$DIG_OUTPUT" ]; then
    echo -e "${GREEN}✅ DNS resolves to:${NC}"
    echo "$DIG_OUTPUT" | while read -r ip; do
      echo "   $ip"
    done

    # Verify against expected IP
    if [ -n "$EXPECTED_IP" ]; then
      if echo "$DIG_OUTPUT" | grep -q "$EXPECTED_IP"; then
        echo -e "${GREEN}✅ IP matches droplet IP ($EXPECTED_IP)${NC}"
      else
        echo -e "${RED}❌ IP does not match droplet IP${NC}"
        echo "   Expected: $EXPECTED_IP"
        echo "   Got: $DIG_OUTPUT"
      fi
    fi
  else
    echo -e "${RED}❌ DNS does not resolve${NC}"
    echo "   Domain: $DOMAIN"
    echo ""
    echo "Possible causes:"
    echo "  - DNS not yet propagated (wait 5-60 minutes)"
    echo "  - A record not created"
    echo "  - Incorrect domain name"
  fi

  echo ""

  # Check DNS propagation with trace
  echo "🔍 DNS trace (full resolution path):"
  dig +trace "$DOMAIN" A | tail -n 10

else
  echo -e "${YELLOW}⚠️  dig not available, using nslookup instead${NC}"

  if command -v nslookup &> /dev/null; then
    echo "🔍 Checking DNS with nslookup..."
    NSLOOKUP_OUTPUT=$(nslookup "$DOMAIN" 8.8.8.8 2>&1)

    if echo "$NSLOOKUP_OUTPUT" | grep -q "Address:"; then
      RESOLVED_IP=$(echo "$NSLOOKUP_OUTPUT" | grep "Address:" | tail -n 1 | awk '{print $2}')
      echo -e "${GREEN}✅ DNS resolves to: $RESOLVED_IP${NC}"

      if [ -n "$EXPECTED_IP" ] && [ "$RESOLVED_IP" = "$EXPECTED_IP" ]; then
        echo -e "${GREEN}✅ IP matches droplet IP${NC}"
      elif [ -n "$EXPECTED_IP" ]; then
        echo -e "${RED}❌ IP does not match droplet IP${NC}"
        echo "   Expected: $EXPECTED_IP"
        echo "   Got: $RESOLVED_IP"
      fi
    else
      echo -e "${RED}❌ DNS does not resolve${NC}"
    fi
  else
    echo -e "${RED}❌ Neither dig nor nslookup available${NC}"
  fi
fi

echo ""

# Check multiple DNS servers
echo "🌐 Checking DNS on multiple nameservers:"
echo ""

check_dns_server() {
  local server=$1
  local name=$2

  if command -v dig &> /dev/null; then
    local result=$(dig +short @"$server" "$DOMAIN" A 2>/dev/null | head -n 1)
    if [ -n "$result" ]; then
      echo -e "   ${GREEN}✅${NC} $name ($server): $result"
    else
      echo -e "   ${RED}❌${NC} $name ($server): No response"
    fi
  fi
}

check_dns_server "8.8.8.8" "Google DNS"
check_dns_server "1.1.1.1" "Cloudflare DNS"
check_dns_server "208.67.222.222" "OpenDNS"

echo ""

# Check HTTP endpoint if DNS resolves
if [ -n "$DIG_OUTPUT" ] || [ -n "$RESOLVED_IP" ]; then
  echo "🔌 Checking HTTP endpoint..."

  # Try HTTP first
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://$DOMAIN/api/health" --connect-timeout 5 2>/dev/null || echo "000")

  if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ HTTP endpoint is reachable (status: $HTTP_STATUS)${NC}"
    echo "   http://$DOMAIN/api/health"
  elif [ "$HTTP_STATUS" = "000" ]; then
    echo -e "${YELLOW}⚠️  HTTP endpoint not reachable (connection timeout)${NC}"
    echo "   This is normal if FumbleBot is not yet deployed"
  else
    echo -e "${YELLOW}⚠️  HTTP endpoint returned status: $HTTP_STATUS${NC}"
  fi

  echo ""

  # Try HTTPS
  HTTPS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/api/health" --connect-timeout 5 2>/dev/null || echo "000")

  if [ "$HTTPS_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ HTTPS endpoint is reachable (status: $HTTPS_STATUS)${NC}"
    echo "   https://$DOMAIN/api/health"
  elif [ "$HTTPS_STATUS" = "000" ]; then
    echo -e "${YELLOW}⚠️  HTTPS endpoint not reachable${NC}"
    echo "   This is normal if SSL certificate is not yet installed"
    echo "   Run: sudo certbot --nginx -d $DOMAIN"
  else
    echo -e "${YELLOW}⚠️  HTTPS endpoint returned status: $HTTPS_STATUS${NC}"
  fi
fi

echo ""

# Check DigitalOcean DNS records
if command -v doctl &> /dev/null && doctl auth list &> /dev/null 2>&1; then
  echo "📋 DigitalOcean DNS Records for crit-fumble.com:"
  echo ""

  DOMAIN_EXISTS=$(doctl compute domain list --format Domain --no-header | grep -w "crit-fumble.com" || echo "")

  if [ -n "$DOMAIN_EXISTS" ]; then
    doctl compute domain records list crit-fumble.com --format Type,Name,Data,TTL --no-header | grep fumblebot || echo "   (no fumblebot records found)"
  else
    echo -e "${YELLOW}⚠️  Domain not found in DigitalOcean DNS${NC}"
  fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Final summary
if [ -n "$DIG_OUTPUT" ] && [ -n "$EXPECTED_IP" ]; then
  if echo "$DIG_OUTPUT" | grep -q "$EXPECTED_IP"; then
    echo -e "${GREEN}✅ DNS is configured correctly!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Deploy FumbleBot: see DEPLOYMENT.md"
    echo "  2. Set up SSL: sudo certbot --nginx -d $DOMAIN"
    echo "  3. Test: curl https://$DOMAIN/api/health"
  else
    echo -e "${RED}❌ DNS is not pointing to the correct IP${NC}"
    echo ""
    echo "Run setup-dns.sh to fix the configuration"
  fi
elif [ -n "$DIG_OUTPUT" ]; then
  echo -e "${GREEN}✅ DNS resolves!${NC}"
  echo ""
  echo "Could not verify droplet IP (doctl not available)"
else
  echo -e "${RED}❌ DNS does not resolve yet${NC}"
  echo ""
  echo "Possible solutions:"
  echo "  1. Wait for DNS propagation (5-60 minutes)"
  echo "  2. Run setup-dns.sh to configure DNS"
  echo "  3. Manually add A record in your DNS provider"
fi

echo ""
