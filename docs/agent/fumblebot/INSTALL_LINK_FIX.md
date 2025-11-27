# FumbleBot Install Link Fix

## Problem
Getting error: `Integration requires code grant` when trying to install FumbleBot

## Solution

### Step 1: Generate Correct OAuth2 URL

Go to Discord Developer Portal → FumbleBot → OAuth2 → OAuth2 URL Generator

**Select these scopes:**
- ✅ `bot`
- ✅ `applications.commands`
- ✅ `activities.read` (optional - for Discord Activities)
- ✅ `activities.write` (optional - for Discord Activities)

**Select redirect URL:**
- `https://fumblebot.crit-fumble.com/auth/callback`

**Bot Permissions:**
Enter this integer: `534858877008`

Or check these boxes:
- View Channels
- Send Messages
- Send Messages in Threads
- Embed Links
- Attach Files
- Read Message History
- Add Reactions
- Use Slash Commands
- Connect (Voice)
- Speak (Voice)
- Use Voice Activity

### Step 2: Copy Generated URL

The generated URL will look like:
```
https://discord.com/oauth2/authorize?client_id=1443525084256931880&permissions=534858877008&integration_type=0&scope=bot+applications.commands
```

### Step 3: Use This URL to Install

Share this URL to install FumbleBot on servers.

## Alternative: Update Installation Tab

You can also set this in the **Installation** tab:

1. Go to **Installation** tab
2. Select **"Discord Provided Link"**
3. Under **Guild Install**:
   - Add scopes: `bot`, `applications.commands`
   - Add permissions: `534858877008`
4. Copy the install link from the top

## Why This Happens

The error "Integration requires code grant" occurs when:
- Using a simple bot invite link without OAuth2 flow
- Missing required scopes
- Redirect URI not configured properly

The OAuth2 authorization code flow is required for bots with:
- Complex permissions
- OAuth-based features
- Activity integration
- Linked roles

---

**Current Client ID:** `1443525084256931880`
**Permissions Integer:** `534858877008`
