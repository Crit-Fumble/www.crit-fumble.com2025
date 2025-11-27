# Vercel DNS Setup for FumbleBot

## Quick Setup Instructions

To enable access to the FumbleBot admin portal at `https://fumblebot.crit-fumble.com`, you need to add a DNS record in Vercel.

### Steps:

1. Go to https://vercel.com/dashboard
2. Select your project for `crit-fumble.com`
3. Navigate to **Settings** → **Domains**
4. Click on the domain `crit-fumble.com`
5. Add a new DNS record:

   ```
   Type: A
   Name: fumblebot
   Value: 159.203.126.144
   TTL: 3600
   ```

6. Save the record
7. Wait 5-15 minutes for DNS propagation

### Verify DNS Setup

After adding the record, verify it's working:

```bash
# Check DNS resolution
dig fumblebot.crit-fumble.com

# Or use nslookup
nslookup fumblebot.crit-fumble.com
```

Expected result should show IP address: `159.203.126.144`

### Test Admin Portal

Once DNS propagates, test the admin portal:

```bash
# Health check
curl https://fumblebot.crit-fumble.com/api/health

# Should return: {"status":"ok"}
```

Or visit in browser:
- https://fumblebot.crit-fumble.com/login

### Additional DNS Records (if needed)

If you need to add www subdomain or other records:

```
Type: CNAME
Name: www.fumblebot
Value: fumblebot.crit-fumble.com
```

## Troubleshooting

**DNS not resolving after 15 minutes:**
- Clear your local DNS cache: `ipconfig /flushdns` (Windows) or `sudo dscacheutil -flushcache` (Mac)
- Try a different DNS server: `dig @8.8.8.8 fumblebot.crit-fumble.com`
- Check Vercel dashboard for any error messages

**HTTPS certificate not working:**
- Caddy automatically provisions Let's Encrypt certificates
- May take a few minutes after DNS propagation
- Check Caddy logs: `ssh root@159.203.126.144 'journalctl -u caddy -n 50'`

**Admin portal not loading:**
- Verify bot is running: `ssh root@159.203.126.144 'systemctl status fumblebot'`
- Check health endpoint: `curl https://fumblebot.crit-fumble.com/api/health`
- Review integration tests: `npm run test:integration -- src/integration/admin-portal.integration.test.ts`

## Related Documentation

- Full deployment guide: [DEPLOYMENT.md](./DEPLOYMENT.md)
- Discord OAuth setup: See DEPLOYMENT.md → Discord OAuth Configuration
- Integration testing: See DEPLOYMENT.md → Integration Tests
