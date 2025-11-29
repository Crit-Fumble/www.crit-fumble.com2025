import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { getUserRole, canViewWiki } from '@/lib/permissions'
import { CampaignActivityFeed } from './CampaignActivityFeed'

export const metadata: Metadata = {
  title: 'Activity | Crit Fumble Gaming',
  description: 'Your campaigns, sessions, and characters across Discord servers.',
}

export default async function ActivityPage() {
  const session = await auth()

  // Require authentication
  if (!session?.user?.id) {
    redirect('/api/auth/signin?callbackUrl=/activity')
  }

  // Get user's role - only admins and owners can view for now
  const { role } = await getUserRole(session.user.id)

  if (!canViewWiki(role)) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Restricted</h1>
          <p className="text-gray-400 mb-6">This page is currently only available to admins and owners.</p>
          <Link href="/dashboard" className="text-crit-purple-400 hover:text-crit-purple-300">
            Return to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-bold text-white hover:text-crit-purple-400 transition-colors">
              Crit-Fumble
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-gray-400">Activity</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">
              Dashboard
            </Link>
            <div className="flex items-center gap-2">
              {session.user.image && (
                <Image
                  src={session.user.image}
                  alt={session.user.name ?? 'User'}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              )}
              <span className="text-sm text-gray-300">{session.user.name}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-gray-400 capitalize">
                {role}
              </span>
            </div>
            <a
              href="/api/auth/signout"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Sign out
            </a>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-white mb-2">Your Activity</h1>
        <p className="text-gray-400 mb-8">
          Campaigns, sessions, and characters across your Discord servers.
        </p>

        <CampaignActivityFeed />
      </main>
    </div>
  )
}
