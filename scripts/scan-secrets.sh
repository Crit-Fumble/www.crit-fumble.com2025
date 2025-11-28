#!/bin/bash
# Secret scanner for pre-commit hook
# Scans staged files for potential secrets/credentials

set -e

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "🔍 Scanning for secrets in staged files..."

# Get list of staged files (excluding deleted files)
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

if [ -z "$STAGED_FILES" ]; then
    echo -e "${GREEN}✓ No staged files to scan${NC}"
    exit 0
fi

# Files to always skip
SKIP_PATTERNS=(
    "package-lock.json"
    "yarn.lock"
    "pnpm-lock.yaml"
    "*.min.js"
    "*.min.css"
    "*.map"
    "*.svg"
    "*.png"
    "*.jpg"
    "*.jpeg"
    "*.gif"
    "*.ico"
    "*.woff"
    "*.woff2"
    "*.ttf"
    "*.eot"
    "scripts/scan-secrets.sh"
)

# Secret patterns to detect (regex)
# Format: "pattern|description"
SECRET_PATTERNS=(
    # API Keys and Tokens
    'sk-[a-zA-Z0-9]{20,}|OpenAI API key'
    'sk-ant-[a-zA-Z0-9-]{20,}|Anthropic API key'
    'xoxb-[0-9]{10,}-[0-9]{10,}-[a-zA-Z0-9]{24}|Slack bot token'
    'xoxp-[0-9]{10,}-[0-9]{10,}-[a-zA-Z0-9]{24}|Slack user token'
    'ghp_[a-zA-Z0-9]{36}|GitHub personal access token'
    'gho_[a-zA-Z0-9]{36}|GitHub OAuth token'
    'ghu_[a-zA-Z0-9]{36}|GitHub user-to-server token'
    'ghs_[a-zA-Z0-9]{36}|GitHub server-to-server token'
    'ghr_[a-zA-Z0-9]{36}|GitHub refresh token'

    # Discord
    '[MN][A-Za-z\d]{23,}\.[\w-]{6}\.[\w-]{27}|Discord bot token'

    # AWS
    'AKIA[0-9A-Z]{16}|AWS access key ID'

    # Stripe
    'sk_live_[a-zA-Z0-9]{24,}|Stripe live secret key'
    'rk_live_[a-zA-Z0-9]{24,}|Stripe live restricted key'
    'whsec_[a-zA-Z0-9]{32,}|Stripe webhook secret'

    # Database URLs with passwords
    'postgres(ql)?://[^:]+:[^@]+@[^/]+/|PostgreSQL connection string with password'
    'mysql://[^:]+:[^@]+@[^/]+/|MySQL connection string with password'
    'mongodb(\+srv)?://[^:]+:[^@]+@[^/]+/|MongoDB connection string with password'

    # Private keys (use word boundary to avoid grep treating as option)
    'BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY|Private key'
    'BEGIN PGP PRIVATE KEY BLOCK|PGP private key'

    # Generic secrets (high entropy strings after common variable names)
    '(SECRET|PASSWORD|PASSWD|TOKEN|API_KEY|APIKEY|AUTH|CREDENTIAL)[_=:]["'"'"'][a-zA-Z0-9+/=]{20,}["'"'"']|Generic secret assignment'

    # JWT tokens (be careful - these might be examples)
    'eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}|JWT token'

    # Vercel
    'vercel_[a-zA-Z0-9]{24,}|Vercel token'

    # Neon DB (specific to this project)
    'npg_[a-zA-Z0-9]{20,}|Neon database password'
)

FOUND_SECRETS=0
WARNINGS=0

# Function to check if file should be skipped
should_skip() {
    local file=$1
    for pattern in "${SKIP_PATTERNS[@]}"; do
        if [[ "$file" == $pattern ]] || [[ "$file" == *"$pattern" ]]; then
            return 0
        fi
    done
    return 1
}

# Scan each staged file
for file in $STAGED_FILES; do
    # Skip if file doesn't exist (might have been deleted)
    if [ ! -f "$file" ]; then
        continue
    fi

    # Skip binary and lock files
    if should_skip "$file"; then
        continue
    fi

    # Skip .env.example files (these should have placeholder values)
    if [[ "$file" == *.env.example* ]]; then
        continue
    fi

    # CRITICAL: Block any .env files from being committed
    if [[ "$file" == *.env* ]] && [[ "$file" != *.env.example* ]]; then
        echo -e "${RED}❌ BLOCKED: Attempting to commit .env file: $file${NC}"
        echo -e "${RED}   .env files should NEVER be committed to git!${NC}"
        echo -e "${YELLOW}   Add '$file' to .gitignore${NC}"
        FOUND_SECRETS=$((FOUND_SECRETS + 1))
        continue
    fi

    # Get the staged content of the file
    CONTENT=$(git show ":$file" 2>/dev/null || cat "$file")

    # Check each pattern
    for pattern_desc in "${SECRET_PATTERNS[@]}"; do
        pattern="${pattern_desc%|*}"
        description="${pattern_desc#*|}"

        # Use grep to find matches (-- separates options from pattern)
        if echo "$CONTENT" | grep -qE -- "$pattern"; then
            # Get the matching line (first match only for brevity)
            MATCH=$(echo "$CONTENT" | grep -nE -- "$pattern" | head -1)
            LINE_NUM=$(echo "$MATCH" | cut -d: -f1)

            echo -e "${RED}❌ Potential secret found!${NC}"
            echo -e "   File: ${YELLOW}$file${NC}:$LINE_NUM"
            echo -e "   Type: $description"
            echo ""
            FOUND_SECRETS=$((FOUND_SECRETS + 1))
        fi
    done
done

# Summary
echo ""
if [ $FOUND_SECRETS -gt 0 ]; then
    echo -e "${RED}═══════════════════════════════════════════════════════${NC}"
    echo -e "${RED}❌ COMMIT BLOCKED: Found $FOUND_SECRETS potential secret(s)${NC}"
    echo -e "${RED}═══════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Please remove secrets before committing. Options:"
    echo "  1. Remove the secret from the file"
    echo "  2. Use environment variables instead"
    echo "  3. Add file to .gitignore if it should never be committed"
    echo ""
    echo "If this is a false positive, you can bypass with:"
    echo "  git commit --no-verify"
    echo ""
    echo "⚠️  WARNING: Only bypass if you're CERTAIN there are no real secrets!"
    exit 1
else
    echo -e "${GREEN}✓ No secrets detected in staged files${NC}"
    exit 0
fi
