'use client'

import { useEffect, useState } from 'react'

interface UserInfo {
  id: string
  username: string | null
  email: string | null
  isOwner: boolean
  isAdmin: boolean
  avatarUrl: string | null
  discordUsername: string | null
  discordId: string | null
}

interface Props {
  userInfo: UserInfo | null
}

export function DiscordActivityClient({ userInfo }: Props) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
        <div className="animate-pulse">Loading...</div>
      </div>
    )
  }

  const getRoleBadge = () => {
    if (!userInfo) return null
    if (userInfo.isOwner) {
      return (
        <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 rounded-full text-sm font-semibold">
          👑 Owner
        </span>
      )
    }
    if (userInfo.isAdmin) {
      return (
        <span className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-sm font-semibold">
          🛡️ Admin
        </span>
      )
    }
    return (
      <span className="px-3 py-1 bg-green-500/20 text-green-300 border border-green-500/30 rounded-full text-sm font-semibold">
        ✓ Verified User
      </span>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-purple-600 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold font-display">
            Crit-Fumble Gaming
          </h1>
          <p className="text-xl text-purple-200">
            Discord Activity Test Page
          </p>
        </div>

        {/* User Authentication Status */}
        {userInfo ? (
          <div className="bg-slate-800/50 backdrop-blur border border-green-500/30 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-green-300">
                ✅ Authenticated as CritUser
              </h2>
              {getRoleBadge()}
            </div>
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between text-gray-300">
                <span className="font-medium">Username:</span>
                <span className="text-white">{userInfo.username || 'Not set'}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span className="font-medium">Email:</span>
                <span className="text-white">{userInfo.email}</span>
              </div>
              {userInfo.discordUsername && (
                <div className="flex justify-between text-gray-300">
                  <span className="font-medium">Discord:</span>
                  <span className="text-white">{userInfo.discordUsername}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-300">
                <span className="font-medium">Role:</span>
                <span className="text-white">
                  {userInfo.isOwner ? 'Owner' : userInfo.isAdmin ? 'Admin' : 'User'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800/50 backdrop-blur border border-yellow-500/30 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-2 text-yellow-300">
              ⚠️ Not Authenticated
            </h2>
            <p className="text-gray-300">
              You are not currently logged in as a CritUser. To access full features, please sign in.
            </p>
          </div>
        )}

        {/* Status Cards */}
        <div className="grid gap-4">
          <div className="bg-slate-800/50 backdrop-blur border border-purple-500/30 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-2 text-purple-300">
              ✅ Page Loaded Successfully
            </h2>
            <p className="text-gray-300">
              This page is rendering correctly and can be embedded in an iframe.
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur border border-purple-500/30 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-2 text-purple-300">
              🎮 Discord Activity Status
            </h2>
            <p className="text-gray-300 mb-3">
              The Discord SDK has not been installed yet. This is a basic test page to verify:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-300 ml-4">
              <li>Next.js app is building correctly</li>
              <li>Page can be embedded in iframe</li>
              <li>Styling works in embedded context</li>
              <li>Client-side rendering functions</li>
              <li>User authentication detection</li>
            </ul>
          </div>

          <div className="bg-slate-800/50 backdrop-blur border border-green-500/30 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-2 text-green-300">
              🔧 Next Steps
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-300 ml-4">
              <li>Install Discord Embedded App SDK</li>
              <li>Set up Discord Application</li>
              <li>Configure OAuth2 credentials</li>
              <li>Implement Discord authentication</li>
              <li>Add activity manifest</li>
            </ol>
          </div>
        </div>

        {/* Test Info */}
        <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4 text-sm">
          <p className="text-gray-400">
            <strong className="text-purple-300">Test URL:</strong>{' '}
            {typeof window !== 'undefined' ? window.location.href : '/discord/activity'}
          </p>
          <p className="text-gray-400 mt-2">
            <strong className="text-purple-300">Timestamp:</strong>{' '}
            {new Date().toLocaleString()}
          </p>
          <p className="text-gray-400 mt-2">
            <strong className="text-purple-300">Auth Status:</strong>{' '}
            {userInfo ? 'Authenticated' : 'Guest'}
          </p>
        </div>
      </div>
    </div>
  )
}
