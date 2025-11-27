# FumbleBot Discord Activity Access Guide

## Understanding the "This content is blocked" Message

When you see "This content is blocked. Contact the site owner to fix the issue." while trying to access `localhost:3000`, this is **expected behavior** and not an error.

### Why This Happens

The Discord Activity server at `localhost:3000` (or `https://1443525084256931880.discordsays.com` in production) is configured with strict security headers designed for Discord iframe embedding:

```http
Content-Security-Policy: frame-ancestors 'self' https://discord.com
X-Frame-Options: ALLOW-FROM https://discord.com
Access-Control-Allow-Origin: https://discord.com
```

These headers:
1. Only allow the content to be embedded in iframes from Discord.com
2. Block direct browser access in certain contexts to prevent clickjacking attacks
3. Are required for Discord Activities to work properly

### How to Access the Activity Correctly

#### ✅ Method 1: Access Through Discord (Recommended)
The activity is meant to be accessed through Discord:

1. Open Discord
2. Go to your server where FumbleBot is installed
3. Use the activity launcher command or UI element
4. The activity will open in an iframe within Discord
5. Click "show in browser" to open in a separate tab (this uses the Discord-provided URL)

#### ✅ Method 2: Direct Browser Access (Development)
For development/testing, you can access the activity directly:

**Local Development:**
```
http://localhost:3000/discord/activity
```

**Production:**
```
https://1443525084256931880.discordsays.com/discord/activity
```

When accessing directly (not in Discord iframe), you may see browser warnings, but the content should still load.

#### ✅ Method 3: Testing Individual Routes
Test specific activity routes:

```bash
# Main activity landing page
curl http://localhost:3000/discord/activity

# Dice roller
curl http://localhost:3000/discord/activity/dice

# Initiative tracker
curl http://localhost:3000/discord/activity/initiative

# Health check
curl http://localhost:3000/health
```

### Discord Activity URL Mapping

**Important:** The Discord Activity URL Mapping in the Discord Developer Portal should point to:

```
https://1443525084256931880.discordsays.com/discord/activity
```

**NOT:**
```
https://www.crit-fumble.com/discord/activity
```

The `discordsays.com` domain is provided by Discord specifically for serving Discord Activities.

### Activity Server Architecture

```
┌─────────────────────────────────────────┐
│ Discord Client (Desktop/Web/Mobile)    │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ Discord Activity Iframe           │ │
│  │                                   │ │
│  │ https://1443525084...discord...   │ │
│  │                                   │ │
│  │ ┌─────────────────────────────┐  │ │
│  │ │ FumbleBot Activity UI       │  │ │
│  │ │ - Dice Roller              │  │ │
│  │ │ - Initiative Tracker       │  │ │
│  │ │ - Character Sheets         │  │ │
│  │ └─────────────────────────────┘  │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
           │
           │ HTTPS
           ↓
┌─────────────────────────────────────────┐
│ Caddy Reverse Proxy                     │
│ (fumblebot.crit-fumble.com)             │
│ Port 443 → Port 3001                    │
└─────────────────────────────────────────┘
           │
           ↓
┌─────────────────────────────────────────┐
│ Activity Server (Express)               │
│ Port 3000 (Internal)                    │
│ - Routes: /discord/activity/*           │
│ - Security Headers for Discord          │
└─────────────────────────────────────────┘
```

### Troubleshooting

#### Issue: "This content is blocked"
**Solution:** This is expected when accessing outside of Discord. Try:
1. Access through Discord app
2. Use curl to verify content is being served
3. Check browser console for specific CSP errors

#### Issue: Activity not loading in Discord
**Solution:**
1. Verify Discord Activity URL Mapping in Discord Developer Portal
2. Check that activity server is running: `curl http://localhost:3000/health`
3. Verify Caddy is routing correctly
4. Check Discord Activity is enabled: `FUMBLEBOT_ACTIVITY_ENABLED=true`

#### Issue: "Refused to connect"
**Solution:**
1. Check activity server is running: `netstat -an | findstr 3000`
2. Verify environment variable: `echo $FUMBLEBOT_ACTIVITY_ENABLED`
3. Check logs: `tail -f /root/fumblebot/fumblebot.log`

### Development vs Production

**Development (localhost:3000):**
- Access directly in browser for testing
- May see CSP warnings (expected)
- Not accessible from Discord (Discord can't reach localhost)

**Production (https://1443525084256931880.discordsays.com):**
- Access through Discord Activity launcher
- Full Discord integration
- HTTPS with valid certificate
- Proxied through Caddy

### Next Steps

1. **Update Discord Developer Portal**
   - Go to Discord Developer Portal → Applications → FumbleBot
   - Navigate to Activities → URL Mappings
   - Update the activity URL to: `https://1443525084256931880.discordsays.com/discord/activity`

2. **Test in Discord**
   - Use the activity launcher in your Discord server
   - Verify the activity loads correctly
   - Test dice roller and other features

3. **Monitor Logs**
   ```bash
   # Watch activity server logs
   ssh root@159.203.126.144 'tail -f /root/fumblebot/fumblebot.log | grep Activity'
   ```

### Security Considerations

The CSP and CORS headers are intentionally restrictive to:
1. Prevent clickjacking attacks
2. Ensure the activity only runs in authorized contexts (Discord)
3. Protect user data and session information
4. Comply with Discord's security requirements

**Do not remove or weaken these security headers** unless you understand the security implications.

---

**Last Updated:** November 27, 2025
**Status:** Production Ready
