# Wiki System Environment Variables

## Required Environment Variables

### 🤖 AI Content Generation (Required for AI Editor)

Both OpenAI and Anthropic API keys are needed for the AI-powered editor to function:

```bash
# OpenAI API - Get from: https://platform.openai.com/api-keys
# Used for GPT-4 content generation in the editor
OPENAI_API_KEY="sk-..."

# Anthropic API - Get from: https://console.anthropic.com/settings/keys
# Used for Claude content generation in the editor
ANTHROPIC_API_KEY="sk-ant-..."
```

**When to use each:**
- **Claude (Anthropic)**: Deep worldbuilding, complex narratives, character development, GM content
- **GPT-4 (OpenAI)**: Player-facing content, quick iterations, simplification, casual tone

**Cost Estimates:**
- Claude 3.5 Sonnet: $3/1M input tokens, $15/1M output tokens
- GPT-4 Turbo: $10/1M input tokens, $30/1M output tokens

### 👑 Owner Access Control (Required for /owners portal)

At least one of these must be set for owner access to work:

```bash
# Owner emails - JSON array of all 4 founder emails
OWNER_EMAILS='["owner1@example.com","owner2@example.com","owner3@example.com","owner4@example.com"]'

# OR Discord-based owner IDs (for multiple owners)
DISCORD_OWNER_IDS='["discord_id1","discord_id2","discord_id3","discord_id4"]'
```

**How to get your Discord ID:**
1. Enable Developer Mode in Discord (Settings → Advanced → Developer Mode)
2. Right-click your username
3. Click "Copy User ID"

**Recommended Setup:**
- Use `OWNER_EMAILS` for all 4 founders (simplest for email-based login)
- Use `DISCORD_OWNER_IDS` for Discord-based login
- Or use both for maximum flexibility

## Optional Environment Variables

### 🛡️ Admin Access Control

```bash
# Admin Discord IDs - JSON array of admin user IDs
DISCORD_ADMIN_IDS='["discord_id1","discord_id2"]'
```

Admins have:
- Full admin panel access
- AI editor access (but NOT Core Concepts management)
- User management
- Content moderation

### 🌐 Discord Server Integration

```bash
# Discord Server ID - Your community server
DISCORD_SERVER_ID="your_server_id"
```

## Wiki System Access Matrix

| Feature | Required Env Vars | User Type | Access Level |
|---------|------------------|-----------|--------------|
| **Core Concepts Wiki** (Owners Portal) | `OWNER_EMAILS` OR `DISCORD_OWNER_IDS` | Owner (4 founders) | Full CRUD + AI |
| **World Wiki** | None (uses world ownership) | World Owner, Worldbuilder, Storyteller, GM | Full CRUD + AI |
| **View Published Core Concepts** | None | All users | Read-only |
| **View World Wiki** | None (world permissions) | Players in world | Read-only |
| **AI Editor Features** | `OPENAI_API_KEY` + `ANTHROPIC_API_KEY` | Owner, Admin, Worldbuilder, Storyteller, GM | AI assistance |

## Setup Instructions

### 1. Create .env.local file

```bash
# Copy the example file
cp .env.development.local.example .env.local
```

### 2. Add Required Keys

**For Owner Access:**
```bash
# Add all 4 founder emails
OWNER_EMAILS='["owner1@example.com","owner2@example.com","owner3@example.com","owner4@example.com"]'
```

**For AI Features:**
```bash
# Get OpenAI key from https://platform.openai.com/api-keys
OPENAI_API_KEY="sk-..."

# Get Anthropic key from https://console.anthropic.com/settings/keys
ANTHROPIC_API_KEY="sk-ant-..."
```

### 3. Optional: Add Multiple Owners

If you want all 4 founders to have access:

```bash
# Add all Discord IDs
DISCORD_OWNER_IDS='["discord_id1","discord_id2","discord_id3","discord_id4"]'
```

### 4. Test Access

**Test Owner Access:**
1. Sign in with the email set in `OWNER_EMAIL`
2. Navigate to `/owners`
3. You should see the Owners Portal

**Test AI Features:**
1. Create/edit a wiki page
2. Use the AI buttons (Improve, Expand, Simplify)
3. Try switching between Claude and GPT-4

## Troubleshooting

### "Access Denied" when visiting /owners

**Cause:** Your email isn't in `OWNER_EMAILS` or your Discord ID isn't in `DISCORD_OWNER_IDS`

**Fix:**
1. Check your account email matches one in the array: `/account` → verify email shown
2. Add your email to `OWNER_EMAILS` array: `OWNER_EMAILS='["your-email@example.com","other@example.com"]'`
3. OR get your Discord ID and add to `DISCORD_OWNER_IDS`
4. Restart dev server after env changes

### "AI Error: OPENAI_API_KEY is not configured"

**Cause:** Missing or invalid OpenAI API key

**Fix:**
1. Get key from https://platform.openai.com/api-keys
2. Add to `.env.local`: `OPENAI_API_KEY="sk-..."`
3. Restart dev server

### "AI Error: ANTHROPIC_API_KEY is not configured"

**Cause:** Missing or invalid Anthropic API key

**Fix:**
1. Get key from https://console.anthropic.com/settings/keys
2. Add to `.env.local`: `ANTHROPIC_API_KEY="sk-ant-..."`
3. Restart dev server

### AI requests work but are slow

**Cause:** Using Anthropic Claude with large context or complex prompts

**Solutions:**
- Switch to GPT-4 for faster responses
- Reduce prompt complexity
- Check Anthropic API status

### Can't see Core Concepts pages

**Cause:** Pages are unpublished (draft status)

**Fix:**
- Only owners can see unpublished pages
- Publish pages to make them visible to all users
- Or sign in as an owner to view drafts

## Security Best Practices

### 🔒 Never Commit .env.local

```bash
# Already in .gitignore, but double-check:
cat .gitignore | grep .env.local
```

### 🔑 Rotate API Keys Regularly

- Rotate OpenAI keys every 90 days
- Rotate Anthropic keys every 90 days
- Use separate keys for dev/staging/production

### 👥 Limit Owner Access

- Only set `OWNER_EMAIL` for the primary founder
- Use `DISCORD_OWNER_IDS` for the other 3 founders
- Never share owner credentials

### 💰 Monitor AI Usage

Both providers have usage dashboards:
- OpenAI: https://platform.openai.com/usage
- Anthropic: https://console.anthropic.com/settings/usage

Set up billing alerts to avoid surprises!

## Production Deployment

### Vercel Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

**Required:**
- `OPENAI_API_KEY` → All environments
- `ANTHROPIC_API_KEY` → All environments
- `OWNER_EMAILS` → All environments

**Optional:**
- `DISCORD_OWNER_IDS` → All environments
- `DISCORD_ADMIN_IDS` → All environments

### Environment-Specific Values

```bash
# Development
OWNER_EMAILS='["dev1@example.com","dev2@example.com","dev3@example.com","dev4@example.com"]'

# Staging
OWNER_EMAILS='["staging1@example.com","staging2@example.com","staging3@example.com","staging4@example.com"]'

# Production
OWNER_EMAILS='["owner1@crit-fumble.com","owner2@crit-fumble.com","owner3@crit-fumble.com","owner4@crit-fumble.com"]'
```

## Quick Reference

### Minimal Setup (Owner + AI)

```bash
# .env.local
OWNER_EMAILS='["your-email@example.com"]'
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
```

### Full Setup (All 4 Owners + AI)

```bash
# .env.local
OWNER_EMAILS='["owner1@example.com","owner2@example.com","owner3@example.com","owner4@example.com"]'
DISCORD_OWNER_IDS='["id1","id2","id3","id4"]'
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
DISCORD_ADMIN_IDS='["admin_id1","admin_id2"]'
DISCORD_SERVER_ID="your_server_id"
```

## What's NOT Required

These are **NOT** needed for wiki functionality:

- ❌ Database migrations (schema already exists)
- ❌ Additional authentication setup
- ❌ Separate wiki service/API
- ❌ Redis/caching layer
- ❌ Search service (uses database indexes)

The wiki system works with your existing:
- ✅ PostgreSQL database
- ✅ NextAuth authentication
- ✅ Existing user roles
- ✅ World ownership system

## Summary

**To enable the wiki system, you need:**

1. **Owner Access** (choose one or both):
   - `OWNER_EMAILS` - JSON array of owner emails (recommended)
   - `DISCORD_OWNER_IDS` - JSON array of owner Discord IDs

2. **AI Features** (both required):
   - `OPENAI_API_KEY`
   - `ANTHROPIC_API_KEY`

That's it! Everything else is optional or already configured.
