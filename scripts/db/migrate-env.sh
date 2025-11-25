#!/bin/bash
##
# Run Prisma migrations for a specific environment
#
# Usage: ./scripts/db/migrate-env.sh <environment> [migration-name]
#   environment: dev, staging, or production
#   migration-name: optional name for new migration
#
# Examples:
#   ./scripts/db/migrate-env.sh dev
#   ./scripts/db/migrate-env.sh production add_campaigns
##

set -e

ENVIRONMENT=$1
MIGRATION_NAME=$2

if [ -z "$ENVIRONMENT" ]; then
  echo "❌ Error: Environment required"
  echo "Usage: $0 <dev|staging|production> [migration-name]"
  exit 1
fi

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|production)$ ]]; then
  echo "❌ Error: Invalid environment '$ENVIRONMENT'"
  echo "Valid options: dev, staging, production"
  exit 1
fi

# Determine env file
if [ "$ENVIRONMENT" = "dev" ]; then
  ENV_FILE=".env"
else
  ENV_FILE=".env.${ENVIRONMENT}.local"
fi

# Check if env file exists
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Error: Environment file not found: $ENV_FILE"
  exit 1
fi

echo "🔧 Running migrations for $ENVIRONMENT environment"
echo "📁 Using: $ENV_FILE"
echo ""

# Load environment variables from file
export $(cat "$ENV_FILE" | grep -v '^#' | xargs)

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL not found in $ENV_FILE"
  exit 1
fi

# For production, prefer DATABASE_URL_PUBLIC if available (allows running migrations locally)
if [ "$ENVIRONMENT" = "production" ] && [ -n "$DATABASE_URL_PUBLIC" ]; then
  echo "🌐 Using public database endpoint for local migration"
  echo "⚠️  Note: Public endpoint is slower than VPC-internal connection"
  export DATABASE_URL="$DATABASE_URL_PUBLIC"
fi

# Run migration based on environment
if [ "$ENVIRONMENT" = "dev" ]; then
  # Development: Create new migration or apply existing
  if [ -n "$MIGRATION_NAME" ]; then
    echo "📝 Creating new migration: $MIGRATION_NAME"
    npx prisma migrate dev --name "$MIGRATION_NAME"
  else
    echo "📝 Applying pending migrations..."
    npx prisma migrate dev
  fi
else
  # Staging/Production: Only apply existing migrations
  echo "🚀 Deploying migrations to $ENVIRONMENT..."
  npx prisma migrate deploy

  echo ""
  echo "✅ Migrations deployed successfully!"
  echo ""
  echo "💡 Next steps:"
  echo "   - Verify migrations applied correctly"
  echo "   - Check database schema"
  echo "   - Run application tests"
fi

echo ""
echo "✨ Done!"
