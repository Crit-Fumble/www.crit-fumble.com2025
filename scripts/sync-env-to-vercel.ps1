# PowerShell script to sync environment variables from .env.production.local to Vercel
# Usage: powershell -ExecutionPolicy Bypass -File scripts/sync-env-to-vercel.ps1

$envFile = ".env.production.local"

if (-Not (Test-Path $envFile)) {
    Write-Host "Error: $envFile not found!" -ForegroundColor Red
    Write-Host "Please create it first with your production environment variables."
    exit 1
}

Write-Host "🔧 Setting up Vercel environment variables from $envFile" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will set environment variables for PRODUCTION environment."
Write-Host "Press Ctrl+C to cancel, or Enter to continue..."
Read-Host

$content = Get-Content $envFile
$count = 0
$skipped = 0

foreach ($line in $content) {
    # Skip empty lines and comments
    if ([string]::IsNullOrWhiteSpace($line) -or $line.StartsWith('#')) {
        continue
    }

    # Parse key=value
    if ($line -match '^([^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()

        # Remove quotes from value
        $value = $value.Trim('"', "'")

        # Skip if value is empty
        if ([string]::IsNullOrWhiteSpace($value)) {
            $skipped++
            continue
        }

        Write-Host "Setting: $key" -ForegroundColor Green

        # Use Vercel CLI to set the variable
        # Use echo to pipe value to avoid issues with special characters
        $value | npx vercel env add $key production --force

        $count++
    }
}

Write-Host ""
Write-Host "✅ Set $count environment variables successfully!" -ForegroundColor Green
Write-Host "⏭️  Skipped $skipped empty variables" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Verify variables: npx vercel env ls"
Write-Host "2. Deploy to production: npx vercel --prod"
