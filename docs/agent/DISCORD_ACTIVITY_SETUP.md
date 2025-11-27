# Discord Activity Setup Guide

This guide walks you through setting up Discord Activities for the Crit-Fumble application.

## Overview

Discord Activities allow users to launch interactive experiences directly within Discord voice channels. We have two separate Discord applications:

- **Staging**: For testing (App ID from .env.staging)
- **Production**: For live users (App ID from .env.production)

## Prerequisites

- Discord Developer account
- Access to Discord Developer Portal
- Application owner/admin permissions

## Setup Steps

### 1. Access Discord Developer Portal

For **Staging**:
- Go to: https://discord.com/developers/applications/1225663590166691840
- (App ID: `1225663590166691840`)

For **Production**:
- Go to: https://discord.com/developers/applications/[PROD_APP_ID]
- (Get ID from `.env.production`)

### 2. Enable Activities

1. Navigate to **"Activities"** tab in the left sidebar
2. Click **"Enable Activities"** if not already enabled
3. Accept the Terms of Service

### 3. Configure URL Mapping

#### Staging Configuration

Add the following URL mappings:

| Environment | Root Mapping | Target URL |
|------------|--------------|------------|
| Development | `/.proxy` | `http://localhost:3000` |
| Production | `/` | `https://www.crit-fumble.com` |

**Steps:**
1. Click **"Add URL Mapping"**
2. Enter Root Mapping: `/.proxy` (for development)
3. Enter Target URL: `http://localhost:3000`
4. Click **"Save"**
5. Repeat for production mapping

#### Production Configuration

Same as staging, but use your production app ID.

### 4. Set Activity URL

1. In the **"Activities"** section
2. Set **"Activity URL Suffix"**: `/discord/activity`
3. Click **"Save Changes"**

### 5. Configure OAuth2 Scopes

1. Go to **"OAuth2"** tab
2. Under **"OAuth2 URL Generator"**, select scopes:
   - `applications.commands`
   - `bot`
3. Copy the generated URL for installation

### 6. Test the Activity

#### Local Testing

1. Start your dev server: `npm run dev`
2. In Discord, join a voice channel
3. Click the **"Activities"** rocket icon
4. Your app should appear in the list
5. Click to launch

#### Staging Testing

1. Deploy to Vercel staging
2. Join a Discord voice channel
3. Launch the activity from the Activities menu
4. Verify the "Coming Soon" page loads correctly

## Verification Checklist

- [ ] Activities enabled in Developer Portal
- [ ] URL mappings configured (localhost + production)
- [ ] Activity URL suffix set to `/discord/activity`
- [ ] CSP headers allow Discord domains (already configured in `next.config.js`)
- [ ] OAuth2 scopes configured
- [ ] Activity launches in Discord voice channel
- [ ] "Coming Soon" page displays correctly
- [ ] No CSP or CORS errors in console

## Troubleshooting

### "Refused to Connect" Error

This error (`1225663590166691840.discordsays.com refused to connect`) means:

1. **URL mapping not configured**: Add the mapping in Developer Portal
2. **URL not approved**: Discord may need to review/approve the URL
3. **CSP headers blocking**: Check browser console for CSP errors

**Solution**: Ensure URL mappings are saved in Discord Developer Portal and wait a few minutes for changes to propagate.

### "404 Not Found" Error

The activity URL exists but returns 404:

1. Verify route exists: `/discord/activity`
2. Check deployment succeeded
3. Test URL directly: `https://www.crit-fumble.com/discord/activity`

### CSP/CORS Errors

If you see CSP errors in browser console:

1. Verify `frame-ancestors` includes Discord domains in `next.config.js`
2. Current config should include:
   ```javascript
   "frame-ancestors 'self' https://discord.com https://*.discord.com https://*.discordsays.com"
   ```

## Environment Variables

Make sure these are set in Vercel:

**Staging:**
```
DISCORD_CLIENT_ID=1225663590166691840
DISCORD_BOT_TOKEN=[from staging .env]
DISCORD_CLIENT_SECRET=[from staging .env]
```

**Production:**
```
DISCORD_CLIENT_ID_PROD=[from prod .env]
DISCORD_BOT_TOKEN_PROD=[from prod .env]
DISCORD_CLIENT_SECRET_PROD=[from prod .env]
```

## Next Steps

Once Activities are working:

1. Build actual activity features (dice roller, initiative tracker, etc.)
2. Integrate with Core Concepts API for persistent data
3. Add Discord SDK for user interactions
4. Test multiplayer functionality
5. Submit for Discord verification (if going public)

## Resources

- [Discord Activities Documentation](https://discord.com/developers/docs/activities/overview)
- [Discord Developer Portal](https://discord.com/developers/applications)
- [Discord Activities Examples](https://github.com/discord/embedded-app-sdk)

## Support

If you encounter issues:

1. Check Discord Developer Portal settings
2. Verify environment variables in Vercel
3. Check browser console for errors
4. Review Discord's Activity documentation
5. Contact Discord Developer Support if needed
