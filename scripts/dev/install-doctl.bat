@echo off
REM Install Digital Ocean CLI (doctl) on Windows

echo.
echo 🌊 Installing Digital Ocean CLI (doctl)
echo ========================================
echo.

REM Check if Chocolatey is installed
where choco >nul 2>&1
if errorlevel 1 (
    echo ❌ Chocolatey is not installed.
    echo.
    echo Installing Chocolatey first...
    echo Please run this command in PowerShell as Administrator:
    echo.
    echo Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    echo.
    echo After Chocolatey is installed, run this script again.
    pause
    exit /b 1
)

echo ✅ Chocolatey is installed
echo.

echo 📦 Installing doctl via Chocolatey...
choco install doctl -y

if errorlevel 1 (
    echo ❌ Failed to install doctl
    pause
    exit /b 1
)

echo.
echo ✅ doctl installed successfully!
echo.

REM Verify installation
doctl version
if errorlevel 1 (
    echo ⚠️  doctl command not found. You may need to restart your terminal.
) else (
    echo.
    echo 🎉 Installation complete!
    echo.
    echo Next steps:
    echo 1. Get your Digital Ocean API token from:
    echo    https://cloud.digitalocean.com/account/api/tokens
    echo.
    echo 2. Authenticate doctl:
    echo    doctl auth init
    echo.
    echo 3. See DIGITALOCEAN_SETUP.md for full deployment guide
    echo.
)

pause
