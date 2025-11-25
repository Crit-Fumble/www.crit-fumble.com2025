#!/usr/bin/env tsx
/**
 * Foundry VTT CLI Tool
 * Command-line interface for managing and controlling Foundry instances
 */

import { Command } from 'commander';
import { foundryManager, FoundryInstanceConfig } from '../src/lib/foundry/instance-manager';
import { createFoundryClient } from '../src/lib/foundry/api-client';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const program = new Command();

program
  .name('foundry-cli')
  .description('CLI tool for managing Foundry VTT instances')
  .version('0.1.0');

// ============================================================================
// INSTANCE MANAGEMENT
// ============================================================================

program
  .command('start')
  .description('Start a Foundry instance')
  .option('-w, --world <worldId>', 'World ID to load', 'test-world')
  .option('-p, --port <port>', 'Foundry HTTP port', '30000')
  .option('-a, --api-port <apiPort>', 'API port', '3001')
  .action(async (options) => {
    try {
      const config: FoundryInstanceConfig = {
        worldId: options.world,
        port: parseInt(options.port),
        apiPort: parseInt(options.apiPort),
      };

      console.log('Starting Foundry instance...');
      console.log('World:', config.worldId);
      console.log('Port:', config.port);
      console.log('API Port:', config.apiPort);

      const info = await foundryManager.startInstance(config);

      console.log('\n✅ Instance started successfully!');
      console.log('URL:', info.url);
      console.log('API URL:', info.apiUrl);
      console.log('PID:', info.pid);
      console.log('\nPress Ctrl+C to stop the instance');

      // Keep process alive
      process.stdin.resume();
    } catch (error) {
      console.error('❌ Failed to start instance:', error);
      process.exit(1);
    }
  });

program
  .command('stop')
  .description('Stop a Foundry instance')
  .requiredOption('-w, --world <worldId>', 'World ID to stop')
  .action(async (options) => {
    try {
      console.log('Stopping instance:', options.world);
      await foundryManager.stopInstance(options.world);
      console.log('✅ Instance stopped');
      process.exit(0);
    } catch (error) {
      console.error('❌ Failed to stop instance:', error);
      process.exit(1);
    }
  });

program
  .command('restart')
  .description('Restart a Foundry instance')
  .requiredOption('-w, --world <worldId>', 'World ID to restart')
  .action(async (options) => {
    try {
      console.log('Restarting instance:', options.world);
      const info = await foundryManager.restartInstance(options.world);
      console.log('✅ Instance restarted');
      console.log('URL:', info.url);
      console.log('API URL:', info.apiUrl);
      process.exit(0);
    } catch (error) {
      console.error('❌ Failed to restart instance:', error);
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List all running instances')
  .action(() => {
    const instances = foundryManager.getAllInstances();

    if (instances.length === 0) {
      console.log('No running instances');
      return;
    }

    console.log(`\n${instances.length} running instance(s):\n`);

    instances.forEach((instance, i) => {
      console.log(`${i + 1}. World: ${instance.worldId}`);
      console.log(`   URL: ${instance.url}`);
      console.log(`   API: ${instance.apiUrl}`);
      console.log(`   Status: ${instance.status}`);
      console.log(`   PID: ${instance.pid}`);
      console.log(`   Started: ${instance.startedAt.toLocaleString()}`);
      console.log('');
    });
  });

// ============================================================================
// API COMMANDS
// ============================================================================

const apiCmd = program.command('api').description('API commands');

apiCmd
  .command('health')
  .description('Check API health')
  .option('-u, --url <url>', 'API URL', 'http://localhost:3001')
  .option('-t, --token <token>', 'Auth token', process.env.FOUNDRY_API_TOKEN)
  .action(async (options) => {
    try {
      const client = createFoundryClient(options.url, options.token);
      const health = await client.health();

      console.log('✅ API is healthy');
      console.log('Status:', health.status);
      console.log('Foundry:', health.foundry);
    } catch (error: any) {
      console.error('❌ API health check failed:', error.message);
      process.exit(1);
    }
  });

apiCmd
  .command('world')
  .description('Get world info')
  .option('-u, --url <url>', 'API URL', 'http://localhost:3001')
  .option('-t, --token <token>', 'Auth token', process.env.FOUNDRY_API_TOKEN)
  .action(async (options) => {
    try {
      const client = createFoundryClient(options.url, options.token);
      const world = await client.getWorld();

      console.log('World Info:');
      console.log('ID:', world.id);
      console.log('Title:', world.title);
      console.log('System:', world.system);
      console.log('System Version:', world.systemVersion);
      console.log('Foundry Version:', world.foundryVersion);
    } catch (error: any) {
      console.error('❌ Failed to get world info:', error.message);
      process.exit(1);
    }
  });

// ============================================================================
// ACTOR COMMANDS
// ============================================================================

const actorsCmd = apiCmd.command('actors').description('Actor commands');

actorsCmd
  .command('list')
  .description('List all actors')
  .option('-u, --url <url>', 'API URL', 'http://localhost:3001')
  .option('-t, --token <token>', 'Auth token', process.env.FOUNDRY_API_TOKEN)
  .action(async (options) => {
    try {
      const client = createFoundryClient(options.url, options.token);
      const actors = await client.getActors();

      console.log(`Found ${actors.length} actor(s):\n`);

      actors.forEach((actor, i) => {
        console.log(`${i + 1}. ${actor.name} (${actor.type})`);
        console.log(`   ID: ${actor.id}`);
        console.log('');
      });
    } catch (error: any) {
      console.error('❌ Failed to list actors:', error.message);
      process.exit(1);
    }
  });

actorsCmd
  .command('get <id>')
  .description('Get actor by ID')
  .option('-u, --url <url>', 'API URL', 'http://localhost:3001')
  .option('-t, --token <token>', 'Auth token', process.env.FOUNDRY_API_TOKEN)
  .action(async (id, options) => {
    try {
      const client = createFoundryClient(options.url, options.token);
      const actor = await client.getActor(id);

      console.log('Actor:');
      console.log(JSON.stringify(actor, null, 2));
    } catch (error: any) {
      console.error('❌ Failed to get actor:', error.message);
      process.exit(1);
    }
  });

actorsCmd
  .command('create')
  .description('Create a new actor')
  .requiredOption('-n, --name <name>', 'Actor name')
  .option('-t, --type <type>', 'Actor type', 'character')
  .option('-u, --url <url>', 'API URL', 'http://localhost:3001')
  .option('--token <token>', 'Auth token', process.env.FOUNDRY_API_TOKEN)
  .action(async (options) => {
    try {
      const client = createFoundryClient(options.url, options.token);
      const actor = await client.createActor({
        name: options.name,
        type: options.type
      });

      console.log('✅ Actor created:');
      console.log('ID:', actor.id);
      console.log('Name:', actor.name);
      console.log('Type:', actor.type);
    } catch (error: any) {
      console.error('❌ Failed to create actor:', error.message);
      process.exit(1);
    }
  });

actorsCmd
  .command('delete <id>')
  .description('Delete an actor')
  .option('-u, --url <url>', 'API URL', 'http://localhost:3001')
  .option('-t, --token <token>', 'Auth token', process.env.FOUNDRY_API_TOKEN)
  .action(async (id, options) => {
    try {
      const client = createFoundryClient(options.url, options.token);
      await client.deleteActor(id);

      console.log('✅ Actor deleted:', id);
    } catch (error: any) {
      console.error('❌ Failed to delete actor:', error.message);
      process.exit(1);
    }
  });

// ============================================================================
// CHAT COMMANDS
// ============================================================================

apiCmd
  .command('chat <message>')
  .description('Send a chat message')
  .option('-u, --url <url>', 'API URL', 'http://localhost:3001')
  .option('-t, --token <token>', 'Auth token', process.env.FOUNDRY_API_TOKEN)
  .action(async (message, options) => {
    try {
      const client = createFoundryClient(options.url, options.token);
      await client.sendChatMessage({ content: message });

      console.log('✅ Message sent:', message);
    } catch (error: any) {
      console.error('❌ Failed to send message:', error.message);
      process.exit(1);
    }
  });

// ============================================================================
// MACRO COMMANDS
// ============================================================================

apiCmd
  .command('exec <script>')
  .description('Execute a macro/script')
  .option('-u, --url <url>', 'API URL', 'http://localhost:3001')
  .option('-t, --token <token>', 'Auth token', process.env.FOUNDRY_API_TOKEN)
  .action(async (script, options) => {
    try {
      const client = createFoundryClient(options.url, options.token);
      const result = await client.executeMacro(script);

      console.log('✅ Executed successfully');
      console.log('Result:', result);
    } catch (error: any) {
      console.error('❌ Failed to execute:', error.message);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();
