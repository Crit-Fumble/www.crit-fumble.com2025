# Discord Developer Portal Setup Guide

Complete guide for configuring FumbleBot in the Discord Developer Portal.

## Prerequisites

- Discord account
- Access to [Discord Developer Portal](https://discord.com/developers/applications)
- FumbleBot application created

---

## 1. General Information

Navigate to **General Information** tab:

### Required Settings

| Field | Value | Notes |
|-------|-------|-------|
| **Name** | FumbleBot | Your bot's name (no harmful/bad language) |
| **Description** | AI-powered TTRPG Discord bot for Crit-Fumble Gaming | Short description |
| **App Icon** | Upload logo | 512x512px recommended |
| **Tags** | gaming, tabletop, ai, rpg | Up to 5 tags |
| **Terms of Service URL** | https://www.crit-fumble.com/terms | Required for verification |
| **Privacy Policy URL** | https://www.crit-fumble.com/privacy | Required for verification |

### Important Values to Copy

```env
# Copy these to your .env file
FUMBLEBOT_DISCORD_CLIENT_ID=<Application ID from this page>
FUMBLEBOT_DISCORD_PUBLIC_KEY=<Public Key from this page>
```

---

## 2. Bot Configuration

Navigate to **Bot** tab:

### Bot Token

1. Click **Reset Token** (if needed)
2. Copy the token immediately

```env
# Add to .env
FUMBLEBOT_DISCORD_TOKEN=<Your bot token>
```

### Privileged Gateway Intents

Enable these intents:

- ✅ **PRESENCE INTENT** - See user presence updates
- ✅ **SERVER MEMBERS INTENT** - Access member events
- ✅ **MESSAGE CONTENT INTENT** - Read message content (required for AI features)

### Bot Permissions

Recommended permissions:
- ✅ Read Messages/View Channels
- ✅ Send Messages
- ✅ Send Messages in Threads
- ✅ Embed Links
- ✅ Attach Files
- ✅ Read Message History
- ✅ Add Reactions
- ✅ Use Slash Commands
- ✅ Connect (Voice)
- ✅ Speak (Voice)
- ✅ Use Voice Activity

**Permissions Integer:** `534858877008`

---

## 3. OAuth2 Configuration

Navigate to **OAuth2** → **General** tab:

### Client Secret

```env
# Copy to .env
FUMBLEBOT_DISCORD_CLIENT_SECRET=<Your client secret>
```

### Redirects (Required)

**IMPORTANT:** You must add at least one redirect URI for OAuth authentication to work.

Click **"Add Redirect"** and enter these URLs:

**Production:**
```
https://fumblebot.crit-fumble.com/auth/callback
```

**Local Development:**
```
http://localhost:3000/auth/callback
```

**Note:** The redirect URIs in OAuth requests must **exactly match** one of these URIs. Discord is very strict about this - even a trailing slash or different port will cause authentication to fail.

---

## 4. Interactions Endpoint URL (Optional)

Navigate to **General Information** → **Interactions Endpoint URL**

### What is it?

Instead of receiving interactions over the Gateway WebSocket, Discord can send interactions to your server via HTTP POSTs. This is more scalable and allows serverless deployment.

### Setup

1. **Configure endpoint in .env:**
   ```env
   FUMBLEBOT_INTERACTIONS_ENDPOINT_URL=https://fumblebot.crit-fumble.com/api/interactions
   ```

2. **Enter in Discord Portal:**
   ```
   https://fumblebot.crit-fumble.com/api/interactions
   ```

3. **Important:** Your endpoint must:
   - Be HTTPS (no HTTP in production)
   - Respond within 3 seconds
   - Verify request signatures using `FUMBLEBOT_DISCORD_PUBLIC_KEY`
   - Return proper interaction responses

### Verification

Discord will send a `PING` request to verify your endpoint:

```json
{
  "type": 1
}
```

Your endpoint must respond with:

```json
{
  "type": 1
}
```

### When to Use

✅ **Use Interactions Endpoint if:**
- Running on serverless platform (Vercel, AWS Lambda)
- Need to scale horizontally
- Want to reduce Gateway connection overhead

❌ **Use Gateway if:**
- Need real-time events (messages, presence)
- Running traditional server
- Easier local development

---

## 5. Discord Activities (Optional - Advanced Feature)

Navigate to **Activities** tab:

### ⚠️ Authorization Requirements

**Important:** You must be authorized to enable Activities. If you see the error:
```
You are not authorized to perform this action on this application
```

This means:
1. **App is owned by a Team** - You need to be the team owner or have admin permissions
2. **Insufficient Permissions** - Contact the team owner to grant you access
3. **App Type Restriction** - Some app types may not support Activities

### Solutions:

**Option A: Get Team Access**
1. Ask the team owner to add you with admin permissions
2. Go to app **Settings** → **Team** tab
3. Team owner can grant you the "Admin" role

**Option B: Transfer to Personal Account**
1. If you own the team, transfer the app to your personal account temporarily
2. Enable Activities
3. Transfer back to the team

**Option C: Skip Activities (Use Bot Commands Instead)**
Discord Activities are **optional**. You can still use FumbleBot without them:
- ✅ Slash commands work without Activities
- ✅ Context menu commands work without Activities
- ✅ Voice features work without Activities
- ❌ Interactive web UIs (dice roller, character sheets) require Activities

### Create Activity (If Authorized)

1. Click **Create Activity**
2. Fill in details:

| Field | Value |
|-------|-------|
| **Name** | FumbleBot Tools |
| **Description** | Interactive TTRPG tools for your campaigns |
| **Developer** | Crit-Fumble |

### URL Mappings

Add URL mappings for your activities:

```json
{
  "/": "https://fumblebot.crit-fumble.com/discord/activity"
}
```

### Configuration

```json
{
  "name": "FumbleBot Tools",
  "description": "Interactive TTRPG tools",
  "url_mappings": {
    "/": "https://fumblebot.crit-fumble.com/discord/activity"
  },
  "supported_orientations": ["landscape", "portrait"],
  "requires_voice": false,
  "proxy": false,
  "embeds": {
    "width": 800,
    "height": 600,
    "min_width": 400,
    "min_height": 300
  }
}
```

### Activity Settings

- ✅ **Desktop** - Enable for desktop clients
- ✅ **Mobile** - Enable for mobile clients
- ⏹️ **Requires Voice** - Not required (but optional)
- ⏹️ **Age Restricted** - Not age restricted

### Environment Variables

```env
FUMBLEBOT_ACTIVITY_ENABLED=true
FUMBLEBOT_ACTIVITY_PORT=8080
FUMBLEBOT_ACTIVITY_PUBLIC_URL=https://fumblebot.crit-fumble.com
```

---

## 6. Linked Roles Verification (Optional)

Navigate to **Linked Roles** tab:

### What is it?

Linked Roles allow your application to be used as a requirement in a server role's Links settings. Users can connect their Crit-Fumble account to Discord and unlock roles based on their platform data.

### Setup

1. **Configure verification URL:**
   ```
   https://fumblebot.crit-fumble.com/auth/verify
   ```

2. **Add metadata fields:**
   - Gaming Activity Level (integer)
   - Crit-Coins Balance (integer)
   - Active Campaigns (integer)
   - Verified Player (boolean)

### Example Use Cases

- **VIP Role:** Requires 1000+ Crit-Coins
- **Active Player:** Requires 3+ active campaigns
- **Verified Member:** Requires verified Crit-Fumble account

---

## 7. Installation Link

Navigate to **Installation** tab in Discord Developer Portal:

### Option 1: Discord Provided Install Link (Recommended)

Discord will generate an install link for you automatically. This is the easiest option.

1. Go to **Installation** tab
2. Under "Install Link", select **"Discord Provided Link"**
3. Configure the following settings:

**Default Install Settings:**
- ✅ **Guild Install** - Allows bot to be installed on servers
- ✅ **User Install** - (Optional) Allows personal installation

**Guild Install - Scopes:**
- ✅ `bot` - Add bot to server
- ✅ `applications.commands` - Use slash commands
- ✅ `applications.activities.read` - Read activity data
- ✅ `applications.activities.write` - Start activities

**Guild Install - Permissions:**
Select the permissions integer: `534858877008` (or check boxes individually)

**User Install - Scopes (Optional):**
- ✅ `applications.commands` - Use slash commands in DMs

4. Copy the generated install link from the **Install Link** section

### Option 2: Custom Install Link

If you want to redirect users to your own website for a custom onboarding experience:

1. Select **"Custom URL"** under Install Link
2. Enter your custom URL:
   ```
   https://fumblebot.crit-fumble.com/install
   ```

3. When users click "Add to Server", they'll be redirected to your URL with query parameters:
   ```
   ?guild_id=123456789&permissions=534858877008
   ```

4. Your website can then redirect to Discord's OAuth2 URL:
   ```
   https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=534858877008&guild_id=123456789&scope=bot%20applications.commands%20applications.activities.read%20applications.activities.write
   ```

### Manual Installation URL (For Testing)

For development and testing, you can use this manual URL:

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=534858877008&scope=bot%20applications.commands%20applications.activities.read%20applications.activities.write
```

Replace `YOUR_CLIENT_ID` with your actual application ID from the General Information tab.

### Scopes Explained

- `bot` - Adds the bot user to the server
- `applications.commands` - Enables slash commands and context menu commands
- `applications.activities.read` - Allows reading Discord Activity data
- `applications.activities.write` - Allows starting and managing Discord Activities

### Permissions Breakdown (Integer: 534858877008)

The permissions integer `534858877008` includes:
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

---

## 8. Testing & Verification

### Local Testing

1. **Start FumbleBot:**
   ```bash
   cd src/packages/fumblebot
   npm install
   npm run dev
   ```

2. **Start Activity Server:**
   ```bash
   npm run activity:dev
   ```

3. **Test endpoints:**
   - Bot: Check Discord connection
   - Activity: http://localhost:8080/discord/activity
   - Interactions: POST to http://localhost:3000/api/interactions

### Production Checklist

- ✅ All environment variables configured
- ✅ HTTPS certificates installed
- ✅ Reverse proxy configured (Nginx/Caddy)
- ✅ Firewall allows ports 80, 443, 8080
- ✅ Bot token is kept secret (never commit to git)
- ✅ Interactions endpoint verified by Discord
- ✅ Activity URL returns 200 status
- ✅ Commands registered globally or per-guild

---

## 9. Production URLs

### Main Bot API
```
https://api.fumblebot.crit-fumble.com
```

### Discord Activity
```
https://fumblebot.crit-fumble.com/discord/activity
```

### Interactions Endpoint
```
https://fumblebot.crit-fumble.com/api/interactions
```

### OAuth Callback
```
https://fumblebot.crit-fumble.com/auth/callback
```

### Linked Roles Verification
```
https://fumblebot.crit-fumble.com/auth/verify
```

---

## 10. Common Issues

### Issue: "Invalid Interactions Endpoint URL"

**Solution:**
- Ensure endpoint is HTTPS
- Verify endpoint responds to PING with proper JSON
- Check that public key matches your bot's public key

### Issue: "Activity URL not loading"

**Solution:**
- Verify CORS headers allow discord.com
- Check X-Frame-Options allows Discord
- Ensure URL returns 200 status

### Issue: "Bot not responding to commands"

**Solution:**
- Verify bot has `applications.commands` scope
- Check that Gateway intents are enabled
- Ensure commands are registered (run deploy-commands script)

### Issue: "Voice features not working"

**Solution:**
- Add `@discordjs/voice` dependency
- Enable voice permissions in bot settings
- Join a voice channel first before using voice commands

---

## 11. App Verification (Optional but Recommended)

Navigate to **App Verification** section in General Information:

### Why Verify Your App?

Verified apps get:
- ✅ Checkmark badge next to bot name
- ✅ Increased trust from users
- ✅ Ability to join more than 100 servers without requiring verification
- ✅ Access to privileged intents for apps in 100+ servers

### Verification Requirements

Discord requires ALL of the following criteria:

#### 1. ✅ App Must Belong to a Team
- Go to **Settings** → **Team** tab
- Create a team if you haven't already
- Transfer the application to your team

#### 2. ✅ No Harmful or Bad Language
- Ensure your app name, description, commands, and role connection metadata contain no:
  - Profanity or vulgar language
  - Hate speech or discriminatory content
  - Misleading or deceptive information
- Current name: "FumbleBot" ✅
- Current description: "AI-powered TTRPG Discord bot for Crit-Fumble Gaming" ✅

#### 3. ✅ Terms of Service Link
Add to **General Information**:
```
https://www.crit-fumble.com/terms
```
This document should cover:
- What data your bot collects
- How users can contact you
- User responsibilities
- Liability disclaimers
- Age restrictions if applicable

#### 4. ✅ Privacy Policy Link
Add to **General Information**:
```
https://www.crit-fumble.com/privacy
```
This document must include:
- What data you collect (messages, user IDs, etc.)
- How you use the data
- How long you store data
- How users can request data deletion
- Third-party services used (OpenAI, Anthropic)
- GDPR/CCPA compliance if applicable

#### 5. ✅ Install Link
Configure in **Installation** tab (see Section 7)
- Use Discord Provided Link (easiest)
- Or use custom URL: `https://fumblebot.crit-fumble.com/install`

#### 6. ✅ All Team Members Must Have:
- Verified email address
- Two-factor authentication (2FA) enabled

### Verification Checklist

Before submitting for verification:

- [ ] Application belongs to a Team
- [ ] Terms of Service published at `https://www.crit-fumble.com/terms`
- [ ] Privacy Policy published at `https://www.crit-fumble.com/privacy`
- [ ] Both links added to General Information
- [ ] Install link configured
- [ ] No harmful language in name/description/commands
- [ ] All team members have verified emails
- [ ] All team members have 2FA enabled
- [ ] Bot tested in multiple servers
- [ ] Commands properly documented
- [ ] Error handling implemented

### Submitting for Verification

1. Ensure all checklist items are complete
2. Go to **General Information** → **App Verification**
3. Review verification status
4. Click **"Submit for Verification"** (when available)
5. Wait 2-4 weeks for Discord review

### Note About Privileged Intents

If your bot is in 100+ servers and uses privileged intents (Message Content, Presence, Server Members), you'll need to apply for approval:
1. Go to **Bot** tab
2. Scroll to **Privileged Gateway Intents**
3. Click **"Apply"** next to each required intent
4. Explain why you need the intent
5. Submit application

---

## 12. Security Best Practices

### Token Security
- ✅ Never commit tokens to git
- ✅ Use environment variables
- ✅ Rotate tokens periodically
- ✅ Use `.gitignore` for `.env` files

### Endpoint Security
- ✅ Verify request signatures
- ✅ Use HTTPS only
- ✅ Implement rate limiting
- ✅ Validate all input

### Bot Permissions
- ✅ Only request needed permissions
- ✅ Use role-based access control
- ✅ Audit log all sensitive actions
- ✅ Implement command cooldowns

---

## 12. Support & Resources

- [Discord Developer Documentation](https://discord.com/developers/docs)
- [Discord Activities Docs](https://discord.com/developers/docs/activities/overview)
- [Discord.js Guide](https://discordjs.guide/)
- [FumbleBot Documentation](./README.md)

---

## Quick Setup Script

```bash
#!/bin/bash
# Quick setup script for FumbleBot

echo "FumbleBot Discord Setup"
echo "======================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✅ Created .env file from .env.example"
  echo "⚠️  Please edit .env and fill in your Discord credentials"
  exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run db:generate

# Build TypeScript
echo "🏗️  Building TypeScript..."
npm run build

# Start bot
echo "🚀 Starting FumbleBot..."
echo ""
npm start
```

Save as `setup.sh` and run:
```bash
chmod +x setup.sh
./setup.sh
```

---

**Last Updated:** 2025-01-27
**Version:** 1.0.0
