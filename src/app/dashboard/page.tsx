import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/core-auth'
import { hasEarlyAccess } from '@/lib/permissions'
import { Card, CardContent, Badge } from '@crit-fumble/react/shared'

interface DashboardCardProps {
  title: string
  description: string
  href: string
  icon: React.ReactNode
}

function DashboardCard({ title, description, href, icon }: DashboardCardProps) {
  return (
    <Link href={href}>
      <Card variant="interactive">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-crit-purple-900/50 rounded-lg flex items-center justify-center text-crit-purple-400">
              {icon}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                {title}
              </h3>
              <p className="mt-1 text-sm text-gray-400">{description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default async function DashboardPage() {
  const user = await getCurrentUser()

  // Require login
  if (!user) {
    redirect('/api/auth/signin?callbackUrl=/dashboard')
  }

  // Get user's role
  const role = user.isAdmin ? 'admin' : 'user'

  // Check early access - redirect to home if not authorized
  const hasAccess = await hasEarlyAccess(user)
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
              {user.image && (
                <Image
                  src={user.image}
                  alt={user.name ?? 'User'}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              )}
              <span className="text-sm text-gray-300">{user.name}</span>
              <Badge size="sm" variant="default">
                {role}
              </Badge>
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
        <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {user.name?.split(' ')[0] ?? 'Adventurer'}!</h1>
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
          {user.isAdmin && (
            <DashboardCard
              title="Economy"
              description="Manage Crit-Coins, Story Credits, transactions, and payouts. Admin access only."
              href="/dashboard/economy"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          )}
        </div>
      </main>
    </div>
  )
}
