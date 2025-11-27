// PM2 Ecosystem Configuration for FumbleBot
// Provides process management, auto-restart, and clustering support

module.exports = {
  apps: [
    {
      name: 'fumblebot',
      script: './dist/index.js',
      instances: 1,
      exec_mode: 'fork', // Use 'fork' for Discord bots (not 'cluster')
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/error.log',
      out_file: './logs/output.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Restart strategies
      min_uptime: '10s', // Min uptime before restart is considered stable
      max_restarts: 10, // Max restarts within listen_timeout
      listen_timeout: 3000, // Time to wait for app to be ready
      kill_timeout: 5000, // Time to wait for graceful shutdown

      // Graceful shutdown
      wait_ready: true,
      shutdown_with_message: true,

      // Cron restart (optional - restart bot at 3 AM daily)
      cron_restart: '0 3 * * *',

      // Post-deployment hooks
      post_update: [
        'npm install',
        'npx prisma generate --schema=prisma/schema.prisma',
        'npx prisma migrate deploy --schema=prisma/schema.prisma',
        'npm run build',
      ],
    },

    // Pre-generation cron job
    {
      name: 'fumblebot-pregen',
      script: './dist/scripts/pre-generate-content.js',
      instances: 1,
      autorestart: false, // Don't restart after completion
      cron_restart: '0 2 * * *', // Run at 2 AM daily (before bot restart)
      watch: false,
    },
  ],
};
