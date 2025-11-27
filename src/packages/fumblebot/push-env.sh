#!/bin/bash
# Push environment variables to FumbleBot production droplet

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DROPLET_IP="159.203.126.144"
DROPLET_USER="root"
FUMBLEBOT_PATH="/home/fumblebot/crit-fumble/src/packages/fumblebot"
ENV_FILE=".env.fumblebot"

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  FumbleBot Environment Variables Deployment${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""

# Check if .env.fumblebot exists locally
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Error: $ENV_FILE not found in current directory${NC}"
    echo "Please ensure you're in the fumblebot package directory"
    exit 1
fi

echo -e "${YELLOW}📋 Checking environment file...${NC}"
echo "Local file: $ENV_FILE"
echo "Lines: $(wc -l < $ENV_FILE)"
echo ""

# Test SSH connection
echo -e "${YELLOW}🔐 Testing SSH connection to $DROPLET_IP...${NC}"
if ! ssh -o ConnectTimeout=5 "$DROPLET_USER@$DROPLET_IP" "echo 'SSH OK'" > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Cannot connect to droplet${NC}"
    echo "Please ensure:"
    echo "  1. SSH key is set up (ssh-copy-id $DROPLET_USER@$DROPLET_IP)"
    echo "  2. Droplet is running"
    echo "  3. Firewall allows SSH"
    exit 1
fi
echo -e "${GREEN}✅ SSH connection successful${NC}"
echo ""

# Backup existing env file (if exists)
echo -e "${YELLOW}💾 Backing up existing environment file...${NC}"
ssh "$DROPLET_USER@$DROPLET_IP" "
    if [ -f $FUMBLEBOT_PATH/$ENV_FILE ]; then
        cp $FUMBLEBOT_PATH/$ENV_FILE $FUMBLEBOT_PATH/${ENV_FILE}.backup.\$(date +%Y%m%d_%H%M%S)
        echo '✅ Backup created'
    else
        echo '⚠️  No existing env file to backup'
    fi
"
echo ""

# Upload new env file
echo -e "${YELLOW}📤 Uploading new environment file...${NC}"
scp "$ENV_FILE" "$DROPLET_USER@$DROPLET_IP:$FUMBLEBOT_PATH/$ENV_FILE"
echo -e "${GREEN}✅ Environment file uploaded${NC}"
echo ""

# Set proper permissions
echo -e "${YELLOW}🔒 Setting secure permissions...${NC}"
ssh "$DROPLET_USER@$DROPLET_IP" "
    chmod 600 $FUMBLEBOT_PATH/$ENV_FILE
    chown fumblebot:fumblebot $FUMBLEBOT_PATH/$ENV_FILE
    echo '✅ Permissions set to 600 (owner read/write only)'
"
echo ""

# Verify upload
echo -e "${YELLOW}✔️  Verifying upload...${NC}"
ssh "$DROPLET_USER@$DROPLET_IP" "
    if [ -f $FUMBLEBOT_PATH/$ENV_FILE ]; then
        echo '✅ File exists on droplet'
        echo 'Lines: \$(wc -l < $FUMBLEBOT_PATH/$ENV_FILE)'
        echo 'Size: \$(du -h $FUMBLEBOT_PATH/$ENV_FILE | cut -f1)'
    else
        echo '❌ File not found after upload'
        exit 1
    fi
"
echo ""

# Display summary
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  ✅ Environment Variables Pushed Successfully!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Restart FumbleBot to apply changes:"
echo "     ssh $DROPLET_USER@$DROPLET_IP 'cd $FUMBLEBOT_PATH && pm2 restart fumblebot'"
echo ""
echo "  2. Check logs for any errors:"
echo "     ssh $DROPLET_USER@$DROPLET_IP 'pm2 logs fumblebot --lines 50'"
echo ""
echo "  3. Verify status:"
echo "     ssh $DROPLET_USER@$DROPLET_IP 'pm2 status'"
echo ""
