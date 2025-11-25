import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Header } from '@/components/organisms/Header'
import { isAdmin } from '@/lib/admin'
import { getDetailedDiscordStats, isDiscordConfigured } from '@/lib/discord'
import { AdminDashboardTabs } from '@/components/organisms/AdminDashboardTabs'
import { DiscordManagement } from '@/components/organisms/DiscordManagement'

async function getCritCoinBalance(playerId: string): Promise<number> {
  const transactions = await prisma.critCoinTransaction.findMany({
    where: { playerId },
    select: {
      transactionType: true,
      amount: true,
    },
  })

  return transactions.reduce((balance: number, tx) => {
    return tx.transactionType === 'credit' ? balance + tx.amount : balance - tx.amount
  }, 0)
}

export default async function AdminDashboardPage() {
  const session = await auth()

  // Require authentication
  if (!session?.user) {
    redirect('/login')
  }

  // Get user from database
  const user = await prisma.critUser.findUnique({
    where: { id: session.user.id },
  })

  // Require admin access
  if (!user || !isAdmin(user)) {
    redirect('/dashboard')
  }

  // Get Crit-Coin balance for header
  const critCoinBalance = await getCritCoinBalance(user.id)

  // Get Discord server stats
  const discordData = await getDetailedDiscordStats()
  const discordConfigured = isDiscordConfigured()

  // Discord Tab Content
  const discordContent = (
    <section data-testid="discord-stats-section">
      <div className="bg-white dark:bg-slate-900 rounded-lg px-4 sm:px-8 py-6">
        {discordData.stats ? (
          <>
            {/* Discord Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Members */}
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg p-6 text-white shadow-lg" data-testid="stat-total-members">
                <div className="text-5xl font-bold mb-2">
                  {discordData.stats.memberCount.toLocaleString()}
                </div>
                <div className="text-indigo-100 text-sm font-medium">Total Members</div>
              </div>

              {/* Online Members */}
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg" data-testid="stat-online-members">
                <div className="text-5xl font-bold mb-2">
                  {discordData.stats.onlineCount.toLocaleString()}
                </div>
                <div className="text-green-100 text-sm font-medium">Online Now</div>
              </div>

              {/* Total Channels */}
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg" data-testid="stat-active-channels">
                <div className="text-5xl font-bold mb-2">
                  {discordData.stats.channelCount.toLocaleString()}
                </div>
                <div className="text-purple-100 text-sm font-medium">Total Channels</div>
              </div>

              {/* Total Roles */}
              <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg p-6 text-white shadow-lg" data-testid="stat-total-roles">
                <div className="text-5xl font-bold mb-2">
                  {discordData.roles.length}
                </div>
                <div className="text-pink-100 text-sm font-medium">Total Roles</div>
              </div>
            </div>

            {/* Update Status */}
            <div className="text-center text-sm text-green-400 bg-green-900/20 rounded-lg py-3 px-4 mb-8">
              ✓ Discord stats updated every 60 seconds
            </div>

            {/* Roles and Channels Management */}
            <DiscordManagement
              roles={discordData.roles}
              channels={discordData.channels}
              members={discordData.members}
              channelsByType={discordData.channelsByType}
              rolesByType={discordData.rolesByType}
              membersByType={discordData.membersByType}
            />
          </>
        ) : (
          <>
            {/* Fallback - Discord not configured */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gray-100 dark:bg-slate-800 rounded-lg p-6 text-center" data-testid="stat-total-members">
                <div className="text-4xl font-bold text-indigo-400 mb-2">---</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">Total Members</div>
                <div className="text-xs text-gray-500 mt-2">Not Available</div>
              </div>
              <div className="bg-gray-100 dark:bg-slate-800 rounded-lg p-6 text-center" data-testid="stat-online-members">
                <div className="text-4xl font-bold text-green-400 mb-2">---</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">Online Now</div>
                <div className="text-xs text-gray-500 mt-2">Not Available</div>
              </div>
              <div className="bg-gray-100 dark:bg-slate-800 rounded-lg p-6 text-center" data-testid="stat-active-channels">
                <div className="text-4xl font-bold text-purple-400 mb-2">---</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">Active Channels</div>
                <div className="text-xs text-gray-500 mt-2">Not Available</div>
              </div>
              <div className="bg-gray-100 dark:bg-slate-800 rounded-lg p-6 text-center" data-testid="stat-total-roles">
                <div className="text-4xl font-bold text-pink-400 mb-2">---</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">Total Roles</div>
                <div className="text-xs text-gray-500 mt-2">Not Available</div>
              </div>
            </div>

            {!discordConfigured ? (
              <div className="text-center text-sm text-red-400 bg-red-900/20 rounded-lg py-3 px-4">
                ⚠️ Discord integration not configured (DISCORD_BOT_TOKEN or DISCORD_SERVER_ID missing)
              </div>
            ) : (
              <div className="text-center text-sm text-red-400 bg-red-900/20 rounded-lg py-3 px-4">
                ⚠️ Failed to fetch Discord stats - check bot permissions
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )

  // Multiverse Tab Content (stub)
  const multiverseContent = (
    <section data-testid="multiverse-section">
      <div className="bg-white dark:bg-slate-900 rounded-lg px-8 py-12 sm:py-16">
        <div className="text-center">
          <svg
            className="w-20 h-20 mx-auto mb-6 text-crit-purple-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 dark:text-white mb-4">
            Multiverse Management
          </h3>
          <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto mb-8">
            Manage multiverse of worlds, locations, and interconnected universes. Coming soon!
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="bg-gray-100 dark:bg-slate-800 rounded-lg p-4">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">World Management</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Create and manage connected worlds</div>
            </div>
            <div className="bg-gray-100 dark:bg-slate-800 rounded-lg p-4">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">Location Trees</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Build hierarchical location structures</div>
            </div>
            <div className="bg-gray-100 dark:bg-slate-800 rounded-lg p-4">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">Analytics</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Track world usage and player activity</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )

  return (
    <>
      <Header critCoinBalance={critCoinBalance} />
      {/* Fixed Background Image */}
      <div className="fixed inset-0 bg-dice-hero bg-cover bg-center bg-no-repeat" style={{ zIndex: -2 }} />

      {/* Fixed Overlay for better readability */}
      <div className="fixed inset-0 bg-black/30" style={{ zIndex: -1 }} />

      <div className="min-h-screen relative" data-testid="admin-page">

        {/* Content */}
        <div className="relative z-10 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            {/* Admin Header */}
            <div className="mb-8" data-testid="admin-header">
              <div className="bg-red-600 rounded-t-lg px-4 sm:px-8 py-4 sm:py-6">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-display font-bold text-white break-words" data-testid="admin-title">
                  Admin Dashboard
                </h1>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-b-lg px-4 sm:px-8 py-3 sm:py-4">
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300" data-testid="admin-welcome">
                  Welcome, {user.username}! You have administrative access.
                </p>
              </div>
            </div>

            {/* Tabbed Dashboard */}
            <AdminDashboardTabs
              discordContent={discordContent}
              multiverseContent={multiverseContent}
            />
          </div>
        </div>
      </div>
    </>
  )
}
