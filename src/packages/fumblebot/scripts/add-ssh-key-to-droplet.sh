#!/bin/bash
# Add SSH key to fumblebot droplet via DigitalOcean console commands

set -e

echo "🔐 Adding SSH Key to FumbleBot Droplet"
echo ""

DROPLET_ID="532814816"
DROPLET_IP="134.209.171.178"
SSH_KEY_ID="52244224"  # DadsGamingDesktop-New

echo "📋 Configuration:"
echo "   Droplet ID: $DROPLET_ID"
echo "   Droplet IP: $DROPLET_IP"
echo "   SSH Key: DadsGamingDesktop-New"
echo ""

# Get the public key content
echo "🔍 Fetching SSH key from DigitalOcean..."
SSH_KEY_CONTENT=$(doctl compute ssh-key get "$SSH_KEY_ID" --format PublicKey --no-header)

echo "✅ SSH Key retrieved"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "To add this SSH key to your droplet, follow these steps:"
echo ""
echo "1. Go to: https://cloud.digitalocean.com/droplets/$DROPLET_ID"
echo "2. Click 'Access' tab"
echo "3. Click 'Launch Droplet Console'"
echo "4. Login as 'root' with your password (check your email for initial password)"
echo ""
echo "5. Once logged in, run these commands in the console:"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "# Create SSH directory if it doesn't exist"
echo "mkdir -p ~/.ssh"
echo "chmod 700 ~/.ssh"
echo ""
echo "# Add your SSH key"
cat << EOF
echo '$SSH_KEY_CONTENT' >> ~/.ssh/authorized_keys
EOF
echo ""
echo "# Set correct permissions"
echo "chmod 600 ~/.ssh/authorized_keys"
echo ""
echo "# Test that file was created correctly"
echo "cat ~/.ssh/authorized_keys"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "6. After running those commands, exit the console and try SSH:"
echo "   ssh root@$DROPLET_IP"
echo ""
echo "If you can't access the console or don't have the root password:"
echo "  1. Reset root password: https://cloud.digitalocean.com/droplets/$DROPLET_ID"
echo "  2. Click 'Access' → 'Reset Root Password'"
echo "  3. Check your email for the new password"
echo ""
