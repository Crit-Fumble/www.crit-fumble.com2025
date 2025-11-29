import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { ActivityFeed } from './ActivityFeed'

export const metadata: Metadata = {
  title: 'Activity | Crit Fumble Gaming',
  description: 'Recent activity in the Crit Fumble Gaming community.',
}

export default async function ActivityPage() {
  const session = await auth()

  // Require authentication
  if (!session?.user?.id) {
    redirect('/api/auth/signin?callbackUrl=/activity')
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-crit-purple-400 hover:text-crit-purple-300 font-display font-bold text-xl">
            Crit Fumble
          </a>
          <nav className="flex items-center gap-4">
            <a href="/wiki" className="text-gray-400 hover:text-white text-sm">
              Wiki
            </a>
            <a href="/dashboard" className="text-gray-400 hover:text-white text-sm">
              Dashboard
            </a>
            <span className="text-white text-sm font-medium">Activity</span>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-display font-bold text-white mb-2">
          Activity
        </h1>
        <p className="text-gray-400 mb-8">
          Recent activity from the Crit Fumble community.
        </p>

        <ActivityFeed userId={session.user.id} />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-16">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Crit Fumble Gaming</p>
        </div>
      </footer>
    </div>
  )
}
