#!/bin/bash
# Deploy FumbleBot Environment Variables to Vercel
# Run this before deploying to staging/production

set -e

echo "🚀 FumbleBot - Deploy Environment Variables to Vercel"
echo ""

# Check if .env.fumblebot exists
if [ ! -f "../../../.env.fumblebot" ]; then
  echo "❌ .env.fumblebot not found!"
  exit 1
fi

# Load env vars from .env.fumblebot
export $(cat ../../../.env.fumblebot | grep -v '^#' | xargs)

echo "📋 Setting environment variables on Vercel..."
echo ""

# Set each variable (will prompt for value confirmation)
vercel env add FUMBLEBOT_DISCORD_TOKEN production <<< "$FUMBLEBOT_DISCORD_TOKEN"
vercel env add FUMBLEBOT_DISCORD_CLIENT_ID production <<< "$FUMBLEBOT_DISCORD_CLIENT_ID"
vercel env add FUMBLEBOT_DISCORD_CLIENT_SECRET production <<< "$FUMBLEBOT_DISCORD_CLIENT_SECRET"
vercel env add FUMBLEBOT_DISCORD_PUBLIC_KEY production <<< "$FUMBLEBOT_DISCORD_PUBLIC_KEY"
vercel env add FUMBLEBOT_DISCORD_GUILD_ID production <<< "$FUMBLEBOT_DISCORD_GUILD_ID"
vercel env add FUMBLEBOT_OPENAI_API_KEY production <<< "$FUMBLEBOT_OPENAI_API_KEY"
vercel env add FUMBLEBOT_ANTHROPIC_API_KEY production <<< "$FUMBLEBOT_ANTHROPIC_API_KEY"
vercel env add FUMBLEBOT_DATABASE_URL production <<< "$FUMBLEBOT_DATABASE_URL"

# Optional: Core Concepts integration
if [ ! -z "$CORE_CONCEPTS_API_URL" ]; then
  vercel env add CORE_CONCEPTS_API_URL production <<< "$CORE_CONCEPTS_API_URL"
fi

if [ ! -z "$CORE_CONCEPTS_INTERNAL_URL" ]; then
  vercel env add CORE_CONCEPTS_INTERNAL_URL production <<< "$CORE_CONCEPTS_INTERNAL_URL"
fi

echo ""
echo "✅ Environment variables set!"
echo ""
echo "Next steps:"
echo "  1. Build FumbleBot: npm run build"
echo "  2. Deploy to Vercel: vercel --prod"
echo "  3. Verify deployment: https://fumblebot.crit-fumble.com/api/health"
