@echo off
REM Run E2E tests with dev server check (Windows)

echo 🧪 Crit-Fumble E2E Test Runner
echo.

REM Check if server is running
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
  echo ✅ Dev server is running on http://localhost:3000
  echo.
  echo Running tests...
  call npm run test:chromium
) else (
  echo ❌ Dev server is not running on http://localhost:3000
  echo.
  echo Please start the dev server first:
  echo   npm run dev
  echo.
  echo Then run tests in another terminal:
  echo   npm run test:chromium
  echo.
  echo Or use this script again once the server is running.
  exit /b 1
)
