/**
 * FumbleBot API Server
 * Handles Discord OAuth, webhooks, and other endpoints
 * Runs independently at https://fumblebot.crit-fumble.com
 */

import { createServer, IncomingMessage, ServerResponse } from 'http'
import { parse as parseUrl } from 'url'
import { loadConfig } from '../config.js'
import { db } from '../db/index.js'

export interface APIServerConfig {
  port: number
  host: string
}

export class APIServer {
  private server: ReturnType<typeof createServer> | null = null
  private config: ReturnType<typeof loadConfig>

  constructor() {
    this.config = loadConfig()
  }

  /**
   * Start the API server
   */
  start(serverConfig: APIServerConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = createServer((req, res) => this.handleRequest(req, res))

      this.server.on('error', (error) => {
        console.error('[API Server] Error:', error)
        reject(error)
      })

      this.server.listen(serverConfig.port, serverConfig.host, () => {
        console.log(`[API Server] Listening on http://${serverConfig.host}:${serverConfig.port}`)
        resolve()
      })
    })
  }

  /**
   * Stop the API server
   */
  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('[API Server] Stopped')
          resolve()
        })
      } else {
        resolve()
      }
    })
  }

  /**
   * Main request handler
   */
  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = parseUrl(req.url || '', true)
    const path = url.pathname || '/'
    const method = req.method || 'GET'

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }

    try {
      // Route handling
      if (path === '/api/health') {
        await this.handleHealth(req, res)
      } else if (path === '/api/discord/verify') {
        await this.handleDiscordVerify(req, res)
      } else if (path === '/api/discord/interactions') {
        await this.handleDiscordInteractions(req, res)
      } else if (path === '/api/stats') {
        await this.handleStats(req, res)
      } else {
        this.send404(res)
      }
    } catch (error) {
      console.error('[API Server] Error handling request:', error)
      this.send500(res, error)
    }
  }

  /**
   * Health check endpoint
   */
  private async handleHealth(req: IncomingMessage, res: ServerResponse): Promise<void> {
    this.sendJSON(res, 200, {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'fumblebot-api',
    })
  }

  /**
   * Discord OAuth verification endpoint
   * Verifies Discord user and links to FumbleBot database
   */
  private async handleDiscordVerify(req: IncomingMessage, res: ServerResponse): Promise<void> {
    if (req.method !== 'POST') {
      this.sendJSON(res, 405, { error: 'Method not allowed' })
      return
    }

    const body = await this.readBody(req)
    const { discordId, username, guildId } = body

    if (!discordId || !username || !guildId) {
      this.sendJSON(res, 400, { error: 'Missing required fields: discordId, username, guildId' })
      return
    }

    try {
      // Ensure guild exists
      await db.ensureGuild(guildId)

      // Ensure member exists
      await db.ensureGuildMember(guildId, discordId, username)

      // Get member info
      const guild = await db.getGuild(guildId)

      this.sendJSON(res, 200, {
        success: true,
        isHomeGuild: guild?.isHome || false,
        message: 'User verified and linked',
      })
    } catch (error) {
      console.error('[Discord Verify] Error:', error)
      this.sendJSON(res, 500, { error: 'Failed to verify user' })
    }
  }

  /**
   * Discord interactions webhook endpoint
   * Handles Discord interactions (slash commands, buttons, etc.)
   */
  private async handleDiscordInteractions(req: IncomingMessage, res: ServerResponse): Promise<void> {
    if (req.method !== 'POST') {
      this.sendJSON(res, 405, { error: 'Method not allowed' })
      return
    }

    // Read raw body for signature verification
    const rawBody = await this.readRawBody(req)
    const signature = req.headers['x-signature-ed25519'] as string
    const timestamp = req.headers['x-signature-timestamp'] as string

    if (!signature || !timestamp) {
      this.sendJSON(res, 401, { error: 'Missing signature headers' })
      return
    }

    // Verify Discord signature
    if (!this.verifyDiscordSignature(rawBody, signature, timestamp)) {
      this.sendJSON(res, 401, { error: 'Invalid signature' })
      return
    }

    const body = JSON.parse(rawBody)

    // Handle ping
    if (body.type === 1) {
      this.sendJSON(res, 200, { type: 1 })
      return
    }

    // For other interactions, respond with "processing" and handle async
    // Real implementation would dispatch to Discord bot handlers
    this.sendJSON(res, 200, {
      type: 5, // Deferred response
    })
  }

  /**
   * Stats endpoint - returns bot usage statistics
   */
  private async handleStats(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = parseUrl(req.url || '', true)
    const guildId = url.query.guildId as string

    if (!guildId) {
      this.sendJSON(res, 400, { error: 'Missing guildId parameter' })
      return
    }

    try {
      const stats = await db.getCommandStats(guildId, 30)

      this.sendJSON(res, 200, {
        guildId,
        period: '30 days',
        commands: stats,
      })
    } catch (error) {
      console.error('[Stats] Error:', error)
      this.sendJSON(res, 500, { error: 'Failed to fetch stats' })
    }
  }

  // ===========================================
  // Helper Methods
  // ===========================================

  private async readBody(req: IncomingMessage): Promise<any> {
    const rawBody = await this.readRawBody(req)
    return JSON.parse(rawBody)
  }

  private readRawBody(req: IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = []
      req.on('data', (chunk) => chunks.push(chunk))
      req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
      req.on('error', reject)
    })
  }

  private verifyDiscordSignature(body: string, signature: string, timestamp: string): boolean {
    // Placeholder - real implementation would use tweetnacl or similar
    // to verify Ed25519 signature using FUMBLEBOT_DISCORD_PUBLIC_KEY
    // For now, accept all (ONLY for development - implement proper verification!)
    console.warn('[Security] Discord signature verification not implemented - accepting all requests')
    return true
  }

  private sendJSON(res: ServerResponse, status: number, data: any): void {
    res.writeHead(status, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(data))
  }

  private send404(res: ServerResponse): void {
    this.sendJSON(res, 404, { error: 'Not found' })
  }

  private send500(res: ServerResponse, error: any): void {
    this.sendJSON(res, 500, {
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
