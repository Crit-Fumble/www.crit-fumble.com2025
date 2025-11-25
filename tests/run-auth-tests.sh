#!/bin/bash

# Authentication Flow Test Runner
# This script runs the authentication integration tests

echo "🧪 Starting Authentication Flow Tests"
echo "========================================"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
  echo "❌ Error: .env file not found"
  echo "Please create a .env file with the following variables:"
  echo "  - DEV_PHONE"
  echo "  - DEV_EMAIL"
  echo "  - DEV_DISCORD"
  echo "  - IMPERSONATE_PHONE (optional)"
  echo "  - IMPERSONATE_EMAIL (optional)"
  echo "  - IMPERSONATE_DISCORD (optional)"
  exit 1
fi

# Load environment variables
source .env

# Check if dev credentials are set
if [ -z "$DEV_PHONE" ] || [ -z "$DEV_EMAIL" ] || [ -z "$DEV_DISCORD" ]; then
  echo "⚠️  Warning: DEV_ credentials not fully set"
  echo "Developer privilege tests will be skipped"
  echo ""
fi

# Check if server is running
echo "Checking if server is running..."
if curl -s http://localhost:3000 > /dev/null; then
  echo "✅ Server is running"
else
  echo "❌ Server is not running at http://localhost:3000"
  echo "Please start the server with: npm run dev"
  exit 1
fi

echo ""
echo "Running authentication tests..."
echo ""

# Run Playwright tests for auth flow
npx playwright test tests/integration/auth-flow.spec.ts --reporter=list

echo ""
echo "========================================"
echo "✅ Authentication tests completed"
