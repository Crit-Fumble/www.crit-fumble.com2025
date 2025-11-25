@echo off
REM Install Playwright browsers for local development (Windows)

echo Installing Playwright browsers...
echo.
echo This will download browser binaries (~400MB total)
echo Location: %LOCALAPPDATA%\ms-playwright
echo.

REM Install all browsers with system dependencies
call npx playwright install --with-deps

echo.
echo ✅ Playwright browsers installed successfully!
echo.
echo You can now run:
echo   npm run test:e2e        # Run all E2E tests
echo   npm run test:e2e:ui     # Run tests in UI mode
echo   npm run test:chromium   # Run Chromium tests only
