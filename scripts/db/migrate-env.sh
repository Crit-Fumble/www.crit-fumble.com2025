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
  # Use .env.staging or .env.production (not .local versions)
  ENV_FILE=".env.${ENVIRONMENT}"
fi

# Check if env file exists
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Error: Environment file not found: $ENV_FILE"
  exit 1
fi

echo "🔧 Running migrations for $ENVIRONMENT environment"
echo "📁 Using: $ENV_FILE"
echo ""

# Load DATABASE_URL from env file (handles special characters properly)
DATABASE_URL=$(grep "^DATABASE_URL=" "$ENV_FILE" | head -1 | cut -d'=' -f2-)

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL not found in $ENV_FILE"
  exit 1
fi

# For production, check for DATABASE_URL_UNPOOLED (Prisma migrations should use direct connection)
if [ "$ENVIRONMENT" = "production" ] || [ "$ENVIRONMENT" = "staging" ]; then
  DATABASE_URL_UNPOOLED=$(grep "^DATABASE_URL_UNPOOLED=" "$ENV_FILE" | head -1 | cut -d'=' -f2-)
  if [ -n "$DATABASE_URL_UNPOOLED" ]; then
    echo "🔗 Using unpooled connection for migrations (recommended for Prisma)"
    DATABASE_URL="$DATABASE_URL_UNPOOLED"
  fi
fi

export DATABASE_URL

# Show which database we're connecting to (mask password)
DB_HOST=$(echo "$DATABASE_URL" | sed -E 's/.*@([^/]+).*/\1/')
echo "🎯 Target database: $DB_HOST"
echo ""

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
