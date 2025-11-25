@echo off
REM Authentication Flow Test Runner for Windows
REM This script runs the authentication integration tests

echo 🧪 Starting Authentication Flow Tests
echo ========================================
echo.

REM Check if .env file exists
if not exist .env (
  echo ❌ Error: .env file not found
  echo Please create a .env file with the following variables:
  echo   - DEV_PHONE
  echo   - DEV_EMAIL
  echo   - DEV_DISCORD
  echo   - IMPERSONATE_PHONE ^(optional^)
  echo   - IMPERSONATE_EMAIL ^(optional^)
  echo   - IMPERSONATE_DISCORD ^(optional^)
  exit /b 1
)

REM Check if server is running
echo Checking if server is running...
curl -s http://localhost:3000 >nul 2>&1
if errorlevel 1 (
  echo ❌ Server is not running at http://localhost:3000
  echo Please start the server with: npm run dev
  exit /b 1
)

echo ✅ Server is running
echo.

echo Running authentication tests...
echo.

REM Run Playwright tests for auth flow
npx playwright test tests/integration/auth-flow.spec.ts --reporter=list

echo.
echo ========================================
echo ✅ Authentication tests completed
