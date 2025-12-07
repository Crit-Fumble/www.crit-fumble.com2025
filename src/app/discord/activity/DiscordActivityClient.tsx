'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { DiscordSDK } from '@discord/embedded-app-sdk'
import { LoadingPage, ErrorPage, WaitingPage } from '@crit-fumble/react/activity'
import type {
  ContainerStatus,
  ContainerStartResponse,
  ContainerStatusResponse,
  ActivityAuthResponse,
} from '@crit-fumble/core/types'

type ActivityState = 'loading' | 'authenticating' | 'starting' | 'connecting' | 'ready' | 'error'

interface DiscordContext {
  guildId: string
  channelId: string
  userId: string
  name: string | null
  discordId: string | null
  isAdmin: boolean
}

export function DiscordActivityClient() {
  const [state, setState] = useState<ActivityState>('loading')
  const [error, setError] = useState<string | null>(null)
  const [context, setContext] = useState<DiscordContext | null>(null)
  const [containerInfo, setContainerInfo] = useState<ContainerStartResponse | null>(null)
  const terminalRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)

  // Initialize Discord SDK and get context
  useEffect(() => {
    initializeDiscordSDK()
  }, [])

  async function initializeDiscordSDK() {
    try {
      setState('authenticating')

      // Development mode - use mock context
      if (process.env.NODE_ENV === 'development') {
        const urlParams = new URLSearchParams(window.location.search)
        const frameId = urlParams.get('frame_id')

        if (!frameId) {
          console.log('[Discord Activity] Dev mode - using mock context')
          setContext({
            guildId: 'dev-guild',
            channelId: 'dev-channel',
            userId: 'dev-user',
            name: 'Developer',
            discordId: null,
            isAdmin: false,
          })
          setState('starting')
          return
        }
      }

      // Initialize Discord SDK with client ID
      const discordSdk = new DiscordSDK(process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!)

      console.log('[Discord Activity] Waiting for Discord SDK ready...')
      await discordSdk.ready()

      console.log('[Discord Activity] Authenticating with Discord...')
      // Authenticate and get access token (scopes are returned, not passed)
      const { access_token } = await discordSdk.commands.authenticate({})

      console.log('[Discord Activity] Got access token')

      // Get guild and channel from SDK properties (available after ready())
      const guildId = discordSdk.guildId
      const channelId = discordSdk.channelId

      if (!guildId || !channelId) {
        throw new Error('Could not determine guild or channel context')
      }

      console.log('[Discord Activity] Exchanging token with backend...', { guildId, channelId })
      // Exchange Discord token for our session
      const authResponse = await fetch('/api/discord-activity/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceId: discordSdk.instanceId,
          platform: discordSdk.platform,
          guildId,
          channelId,
          accessToken: access_token,
        }),
      })

      if (!authResponse.ok) {
        const errorData = await authResponse.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to authenticate with backend')
      }

      const authData: ActivityAuthResponse = await authResponse.json()
      console.log('[Discord Activity] Authentication successful', {
        userId: authData.userId,
        name: authData.name,
        isAdmin: authData.isAdmin,
      })

      setContext({
        guildId,
        channelId,
        userId: authData.userId,
        name: authData.name,
        discordId: authData.discordId,
        isAdmin: authData.isAdmin,
      })
      setState('starting')
    } catch (err) {
      console.error('[Discord Activity] Initialization failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to initialize')
      setState('error')
    }
  }

  // Start container when we have context
  useEffect(() => {
    if (state === 'starting' && context) {
      startContainer()
    }
  }, [state, context])

  async function startContainer() {
    if (!context) return

    try {
      const response = await fetch('/api/container/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guildId: context.guildId,
          channelId: context.channelId,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to start container')
      }

      const data: ContainerStartResponse = await response.json()
      setContainerInfo(data)
      setState('connecting')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start container')
      setState('error')
    }
  }

  // Connect to terminal WebSocket
  useEffect(() => {
    if (state === 'connecting' && context && containerInfo) {
      connectTerminal()
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [state, context, containerInfo])

  async function connectTerminal() {
    if (!context) return

    try {
      // Get WebSocket URL from API (connects directly to Core)
      const response = await fetch(`/api/container/terminal?guildId=${context.guildId}&channelId=${context.channelId}`)
      if (!response.ok) {
        throw new Error('Failed to get terminal URL')
      }
      const { wsUrl } = await response.json()

      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        setState('ready')
      }

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        appendToTerminal(data.content, data.type)
      }

      ws.onerror = () => {
        setError('Terminal connection failed')
        setState('error')
      }

      ws.onclose = () => {
        if (state === 'ready') {
          setError('Terminal connection closed')
          setState('error')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to terminal')
      setState('error')
    }
  }

  function appendToTerminal(content: string, type: 'output' | 'error' | 'system' = 'output') {
    if (!terminalRef.current) return

    const line = document.createElement('div')
    line.className = type === 'error' ? 'text-red-400' : type === 'system' ? 'text-yellow-400' : 'text-green-400'
    line.textContent = content
    terminalRef.current.appendChild(line)
    terminalRef.current.scrollTop = terminalRef.current.scrollHeight
  }

  const sendCommand = useCallback((command: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'command', content: command }))
    }
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const input = e.currentTarget
      const command = input.value.trim()
      if (command) {
        appendToTerminal(`$ ${command}`, 'system')
        sendCommand(command)
        input.value = ''
      }
    }
  }, [sendCommand])

  // Render based on state
  if (state === 'loading' || state === 'authenticating') {
    return <LoadingPage message="Connecting to Discord..." />
  }

  if (state === 'starting') {
    return <LoadingPage message="Starting terminal sandbox..." />
  }

  if (state === 'connecting') {
    return <WaitingPage />
  }

  if (state === 'error') {
    return (
      <ErrorPage
        error={new Error(error || 'An unexpected error occurred')}
        onRetry={() => {
          setError(null)
          setState('loading')
          initializeDiscordSDK()
        }}
      />
    )
  }

  // Ready state - show terminal
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white font-mono">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-sm text-gray-300">
            Terminal - {context?.name || 'User'}
          </span>
        </div>
        <div className="text-xs text-gray-500">
          {containerInfo?.containerId?.slice(-8)}
        </div>
      </div>

      {/* Terminal output */}
      <div
        ref={terminalRef}
        className="flex-1 p-4 overflow-y-auto text-sm leading-relaxed"
      >
        <div className="text-yellow-400">Welcome to Crit-Fumble Terminal Sandbox</div>
        <div className="text-gray-500">Type commands below. Use &apos;help&apos; for available commands.</div>
        <div className="text-gray-500">---</div>
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-t border-gray-700">
        <span className="text-green-400">$</span>
        <input
          type="text"
          className="flex-1 bg-transparent outline-none text-white placeholder-gray-500"
          placeholder="Enter command..."
          onKeyDown={handleKeyDown}
          autoFocus
        />
      </div>
    </div>
  )
}
