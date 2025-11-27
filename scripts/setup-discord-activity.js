#!/usr/bin/env node

/**
 * Discord Activity Setup Script
 *
 * This script uses the Discord API to configure Activities (Embedded Apps)
 * for your Discord application.
 *
 * Usage:
 *   node scripts/setup-discord-activity.js staging
 *   node scripts/setup-discord-activity.js production
 */

const https = require('https');

// Configuration
const ENVIRONMENTS = {
  staging: {
    clientId: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    botToken: process.env.DISCORD_BOT_TOKEN,
    activityUrl: 'https://www.crit-fumble.com/discord/activity',
  },
  production: {
    clientId: process.env.DISCORD_CLIENT_ID_PROD,
    clientSecret: process.env.DISCORD_CLIENT_SECRET_PROD,
    botToken: process.env.DISCORD_BOT_TOKEN_PROD,
    activityUrl: 'https://www.crit-fumble.com/discord/activity',
  },
};

/**
 * Make an API request to Discord
 */
function discordApiRequest(method, path, data, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'discord.com',
      port: 443,
      path: `/api/v10${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bot ${token}`,
      },
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`Discord API error: ${res.statusCode} - ${JSON.stringify(parsed)}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${responseData}`));
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Get application information
 */
async function getApplication(config) {
  console.log(`Fetching application info for ${config.clientId}...`);
  return await discordApiRequest('GET', `/applications/${config.clientId}`, null, config.botToken);
}

/**
 * Update application with Activity configuration
 */
async function updateActivity(config) {
  console.log('Configuring Activity...');

  // Discord Activities API endpoint
  const updateData = {
    // Enable embedded activities
    flags: 1 << 23, // APPLICATION_FLAG_EMBEDDED

    // Set custom install URL to include the activity
    custom_install_url: config.activityUrl,

    // Install params
    install_params: {
      scopes: ['applications.commands', 'bot'],
      permissions: '0',
    },
  };

  return await discordApiRequest(
    'PATCH',
    `/applications/${config.clientId}`,
    updateData,
    config.botToken
  );
}

/**
 * Get or create Activity URL mapping
 * Note: This endpoint may require special access from Discord
 */
async function configureActivityUrlMapping(config) {
  console.log('Attempting to configure Activity URL mapping...');
  console.log(`  Activity URL: ${config.activityUrl}`);

  try {
    // Try to get existing URL mappings
    const mappings = await discordApiRequest(
      'GET',
      `/applications/${config.clientId}/embedded-activity-config`,
      null,
      config.botToken
    );

    console.log('Existing URL mappings:', mappings);
  } catch (error) {
    console.log('Note: URL mapping endpoint may require Discord approval.');
    console.log('You may need to configure this in the Discord Developer Portal.');
    console.log('Error:', error.message);
  }
}

/**
 * Main setup function
 */
async function setup() {
  const env = process.argv[2] || 'staging';

  if (!ENVIRONMENTS[env]) {
    console.error(`Invalid environment: ${env}`);
    console.error(`Valid options: ${Object.keys(ENVIRONMENTS).join(', ')}`);
    process.exit(1);
  }

  const config = ENVIRONMENTS[env];

  if (!config.clientId || !config.botToken) {
    console.error(`Missing configuration for ${env} environment`);
    console.error(`Please ensure DISCORD_CLIENT_ID${env === 'production' ? '_PROD' : ''} and DISCORD_BOT_TOKEN${env === 'production' ? '_PROD' : ''} are set`);
    process.exit(1);
  }

  console.log(`\n🎮 Setting up Discord Activity for ${env.toUpperCase()}`);
  console.log(`Application ID: ${config.clientId}`);
  console.log(`Activity URL: ${config.activityUrl}\n`);

  try {
    // Get application info
    const app = await getApplication(config);
    console.log(`✓ Application: ${app.name}`);
    console.log(`  ID: ${app.id}`);
    console.log(`  Owner: ${app.owner?.username || app.team?.name || 'Unknown'}\n`);

    // Update application to enable activities
    const updated = await updateActivity(config);
    console.log('✓ Application updated with Activity configuration\n');

    // Try to configure URL mapping (may not work without special access)
    await configureActivityUrlMapping(config);

    console.log('\n✅ Discord Activity setup complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. Go to https://discord.com/developers/applications/' + config.clientId);
    console.log('2. Navigate to "Activities" section');
    console.log('3. Add URL Mapping:');
    console.log(`   - Target URL: ${config.activityUrl}`);
    console.log('4. Test the activity in a Discord voice channel\n');

  } catch (error) {
    console.error('❌ Error:', error.message);

    if (error.message.includes('401')) {
      console.error('\nThe bot token may be invalid or expired.');
      console.error('Please check your environment variables.');
    } else if (error.message.includes('403')) {
      console.error('\nThe bot may not have permission to modify this application.');
      console.error('Ensure the bot token belongs to the application owner.');
    }

    process.exit(1);
  }
}

// Run the script
setup();
