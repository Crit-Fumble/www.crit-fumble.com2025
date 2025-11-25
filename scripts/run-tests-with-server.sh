#!/bin/bash
# Run E2E tests with dev server check

echo "🧪 Crit-Fumble E2E Test Runner"
echo ""

# Check if server is running
if curl -s http://localhost:3000 > /dev/null 2>&1; then
  echo "✅ Dev server is running on http://localhost:3000"
  echo ""
  echo "Running tests..."
  npm run test:chromium
else
  echo "❌ Dev server is not running on http://localhost:3000"
  echo ""
  echo "Please start the dev server first:"
  echo "  npm run dev"
  echo ""
  echo "Then run tests in another terminal:"
  echo "  npm run test:chromium"
  echo ""
  echo "Or use this script again once the server is running."
  exit 1
fi
