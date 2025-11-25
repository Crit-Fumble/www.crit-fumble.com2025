#!/bin/bash
# Helper script to set Vercel environment variables from .env file
# Usage: bash scripts/vercel-env-helper.sh

set -e

ENV_FILE=".env.production.local"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: $ENV_FILE not found!"
  echo "Please create it first with your production environment variables."
  exit 1
fi

echo "🔧 Setting up Vercel environment variables from $ENV_FILE"
echo ""
echo "This will set environment variables for PRODUCTION environment."
echo "Press Ctrl+C to cancel, or Enter to continue..."
read

# Read .env file and set each variable
while IFS='=' read -r key value; do
  # Skip empty lines and comments
  [[ -z "$key" || "$key" =~ ^#.*$ ]] && continue

  # Remove quotes from value
  value="${value%\"}"
  value="${value#\"}"

  # Skip if value is empty
  [[ -z "$value" ]] && continue

  echo "Setting: $key"

  # Use Vercel CLI to set the variable
  echo "$value" | npx vercel env add "$key" production --force

done < "$ENV_FILE"

echo ""
echo "✅ Environment variables set successfully!"
echo ""
echo "Next steps:"
echo "1. Verify variables: npx vercel env ls"
echo "2. Deploy to production: npx vercel --prod"
