#!/bin/bash
# Vercel Deployment Script for www-crit-fumble-com-2025
# This script handles the complete deployment process

set -e  # Exit on error

echo "🚀 Crit-Fumble Vercel Deployment"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're linked to the right project
if [ ! -f ".vercel/project.json" ]; then
    echo -e "${RED}❌ Error: Not linked to a Vercel project${NC}"
    echo "Run: npx vercel link"
    exit 1
fi

PROJECT_NAME=$(cat .vercel/project.json | grep projectName | cut -d'"' -f4)
echo -e "${GREEN}✓${NC} Linked to project: ${PROJECT_NAME}"
echo ""

# Step 1: Pull environment variables
echo "📥 Step 1: Pulling environment variables..."
npx vercel env pull .env.vercel.local
echo -e "${GREEN}✓${NC} Environment variables pulled"
echo ""

# Step 2: Generate Prisma Client
echo "🔨 Step 2: Generating Prisma client..."
npm run db:generate
echo -e "${GREEN}✓${NC} Prisma client generated"
echo ""

# Step 3: Check database connection (optional)
echo "🗄️  Step 3: Checking database connection..."
if [ -n "$DATABASE_URL" ] || grep -q "DATABASE_URL" .env.vercel.local; then
    echo -e "${GREEN}✓${NC} DATABASE_URL configured"
else
    echo -e "${YELLOW}⚠${NC}  DATABASE_URL not found. Make sure to create Vercel Postgres database first."
    echo "   See: VERCEL_DATABASE_SETUP.md"
fi
echo ""

# Step 4: Build locally to check for errors
echo "🏗️  Step 4: Building project locally..."
npm run build
echo -e "${GREEN}✓${NC} Local build successful"
echo ""

# Step 5: Deploy to Vercel
echo "🌐 Step 5: Deploying to Vercel..."
echo ""
echo "Choose deployment type:"
echo "  1) Preview deployment (for testing)"
echo "  2) Production deployment"
read -p "Enter choice (1 or 2): " choice

case $choice in
    1)
        echo "Deploying to Preview..."
        npx vercel
        ;;
    2)
        echo "Deploying to Production..."
        npx vercel --prod
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Check deployment logs in Vercel Dashboard"
echo "2. Test your deployment URL"
echo "3. If this is first deployment, run Prisma migrations:"
echo "   DATABASE_URL=<vercel-postgres-url> npx prisma migrate deploy"
echo "4. Configure custom domain: new.crit-fumble.com"
