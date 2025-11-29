import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { getUserRole, hasEarlyAccess } from '@/lib/permissions'

interface DashboardCardProps {
  title: string
  description: string
  href: string
  icon: React.ReactNode
}

function DashboardCard({ title, description, href, icon }: DashboardCardProps) {
  return (
    <a
      href={href}
      className="group block p-6 bg-slate-900 border border-slate-800 rounded-lg hover:border-crit-purple-500 hover:bg-slate-800 transition-all"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-crit-purple-900/50 rounded-lg flex items-center justify-center text-crit-purple-400 group-hover:bg-crit-purple-900 group-hover:text-crit-purple-300 transition-colors">
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white group-hover:text-crit-purple-300 transition-colors">
            {title}
          </h3>
          <p className="mt-1 text-sm text-gray-400">{description}</p>
        </div>
      </div>
    </a>
  )
}

export default async function DashboardPage() {
  const session = await auth()

  // Require login
  if (!session?.user?.id) {
    redirect('/api/auth/signin?callbackUrl=/dashboard')
  }

  // Get user's role and Discord ID
  const { role, discordId } = await getUserRole(session.user.id)

  // Check early access - redirect to home if not authorized
  const hasAccess = await hasEarlyAccess(discordId)
  if (!hasAccess) {
    redirect('/')
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
            <span className="text-gray-400">Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
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
        <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {session.user.name?.split(' ')[0] ?? 'Adventurer'}!</h1>
        <p className="text-gray-400 mb-8">Choose where you want to go:</p>

        <div className="grid gap-6 md:grid-cols-2">
          <DashboardCard
            title="Wiki"
            description="Browse and edit the Crit-Fumble knowledge base. Create guides, document rules, and share your expertise."
            href="https://wiki.crit-fumble.com"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            }
          />
          <DashboardCard
            title="Activity"
            description="Track your campaigns, view session history, and see what's happening across the Crit-Fumble community."
            href="https://activity.crit-fumble.com"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
        </div>
      </main>
    </div>
  )
}
