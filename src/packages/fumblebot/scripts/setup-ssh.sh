#!/bin/bash
# Setup SSH access to FumbleBot droplet
# This script helps you set up passwordless SSH authentication

set -e

echo "🔐 FumbleBot - SSH Setup"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

DROPLET_IP="134.209.171.178"

# Check if SSH key exists
echo "🔍 Checking for SSH keys..."
echo ""

if [ ! -f ~/.ssh/id_rsa ] && [ ! -f ~/.ssh/id_ed25519 ]; then
  echo -e "${YELLOW}⚠️  No SSH key found${NC}"
  echo ""
  echo "Would you like to generate a new SSH key? (y/n)"
  read -r GENERATE_KEY

  if [ "$GENERATE_KEY" = "y" ]; then
    echo ""
    echo "Generating SSH key (ed25519)..."
    echo ""
    echo "Press Enter for all prompts (or set a passphrase if you prefer)"
    echo ""
    ssh-keygen -t ed25519 -C "fumblebot-deploy"
    echo ""
    echo -e "${GREEN}✅ SSH key generated!${NC}"
  else
    echo ""
    echo -e "${RED}❌ Cannot proceed without SSH key${NC}"
    exit 1
  fi
else
  echo -e "${GREEN}✅ SSH key found${NC}"
fi

echo ""

# Determine which key to use
if [ -f ~/.ssh/id_ed25519 ]; then
  SSH_KEY=~/.ssh/id_ed25519.pub
  echo "Using: $SSH_KEY"
elif [ -f ~/.ssh/id_rsa ]; then
  SSH_KEY=~/.ssh/id_rsa.pub
  echo "Using: $SSH_KEY"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${BLUE}📋 Manual SSH Key Setup${NC}"
echo ""
echo "Since password authentication is disabled or not working,"
echo "you'll need to add your SSH key via the DigitalOcean dashboard."
echo ""
echo -e "${YELLOW}Method 1: Via DigitalOcean Dashboard (Easiest)${NC}"
echo ""
echo "1. Copy your public key:"
echo ""
cat "$SSH_KEY"
echo ""
echo ""
echo "2. Go to: https://cloud.digitalocean.com/account/security"
echo "3. Click 'Add SSH Key'"
echo "4. Paste the key above"
echo "5. Name it 'fumblebot-deploy'"
echo "6. Click 'Add SSH Key'"
echo ""
echo "7. Then, add the key to your existing droplet:"
echo "   https://cloud.digitalocean.com/droplets"
echo "   → Click on your fumblebot droplet"
echo "   → Access tab"
echo "   → Add SSH key"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}Method 2: Via DigitalOcean Console (If you have root password)${NC}"
echo ""
echo "1. Go to: https://cloud.digitalocean.com/droplets"
echo "2. Click on your fumblebot droplet"
echo "3. Click 'Access' → 'Launch Droplet Console'"
echo "4. Login as root with your password"
echo "5. Run these commands:"
echo ""
echo "   mkdir -p ~/.ssh"
echo "   chmod 700 ~/.ssh"
echo "   echo '$(cat $SSH_KEY)' >> ~/.ssh/authorized_keys"
echo "   chmod 600 ~/.ssh/authorized_keys"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}Method 3: Create new droplet with SSH key (Nuclear option)${NC}"
echo ""
echo "If you can't access the droplet at all:"
echo ""
echo "1. Take a snapshot of your current droplet (optional)"
echo "2. Create a new droplet with your SSH key:"
echo ""
echo "   doctl compute droplet create fumblebot-new \\"
echo "     --size s-1vcpu-2gb \\"
echo "     --image ubuntu-22-04-x64 \\"
echo "     --region nyc3 \\"
echo "     --enable-monitoring \\"
echo "     --ssh-keys \$(doctl compute ssh-key list --format ID --no-header | head -n 1) \\"
echo "     --wait"
echo ""
echo "3. Update DNS to point to new droplet IP"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Press Enter after you've added your SSH key..."
read -r

echo ""
echo "🔌 Testing SSH connection..."
echo ""

if ssh -o ConnectTimeout=10 -o BatchMode=yes root@$DROPLET_IP "echo 'SSH OK'" 2>/dev/null; then
  echo -e "${GREEN}✅ SSH connection successful!${NC}"
  echo ""
  echo "You can now deploy FumbleBot:"
  echo "  bash scripts/deploy.sh"
  echo ""
else
  echo -e "${RED}❌ SSH connection failed${NC}"
  echo ""
  echo "Troubleshooting:"
  echo ""
  echo "1. Make sure you added the SSH key correctly"
  echo "2. Wait 1-2 minutes for the key to propagate"
  echo "3. Try again: ssh root@$DROPLET_IP"
  echo "4. If still failing, check DigitalOcean console logs"
  echo ""
  echo "Need help? The key you should add is:"
  echo ""
  cat "$SSH_KEY"
  echo ""
fi
