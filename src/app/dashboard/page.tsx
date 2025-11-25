import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Header } from '@/components/organisms/Header'
import Link from 'next/link'

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

async function getPlayerCharacters(playerId: string) {
  try {
    // Query RpgSheet for character sheets
    return await prisma.rpgSheet.findMany({
      where: {
        createdBy: playerId,
        type: {
          in: ['character', 'hand'],
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 5, // Limit to recent characters for dashboard
    })
  } catch (error) {
    console.warn('Failed to fetch characters:', error)
    return []
  }
}

async function getPlayerCampaigns(playerId: string) {
  try {
    // TODO: Implement when RpgCampaign table is ready
    return []
  } catch (error) {
    console.warn('Failed to fetch campaigns:', error)
    return []
  }
}

async function getPlayerWorlds(playerId: string) {
  try {
    // TODO: Implement when RpgWorld table is ready
    return []
  } catch (error) {
    console.warn('Failed to fetch worlds:', error)
    return []
  }
}

export default async function DashboardPage() {
  const session = await auth()

  // Require authentication
  if (!session?.user) {
    redirect('/login')
  }

  // Get player from database
  const player = await prisma.critUser.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      username: true,
      email: true,
      discordUsername: true,
      githubUsername: true,
    },
  })

  if (!player) {
    redirect('/login')
  }

  // Get Crit-Coin balance for header
  const critCoinBalance = await getCritCoinBalance(player.id)

  // Get player's data
  const characters = await getPlayerCharacters(player.id)
  const campaigns = await getPlayerCampaigns(player.id)
  const worlds = await getPlayerWorlds(player.id)

  return (
    <>
      <Header critCoinBalance={critCoinBalance} />
      <div className="min-h-screen relative overflow-hidden overflow-x-hidden" data-testid="dashboard-page">
        {/* Background Image */}
        <div className="absolute inset-0 bg-dice-hero bg-cover bg-center bg-no-repeat" />

        {/* Overlay for better readability */}
        <div className="absolute inset-0 bg-black/30" />

        {/* Content */}
        <div className="relative z-10 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            {/* Welcome Header */}
            <div className="mb-8" data-testid="welcome-header">
              <div className="bg-crit-purple-600 rounded-t-lg px-4 sm:px-8 py-4 sm:py-6">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-display font-bold text-white break-words" data-testid="welcome-message">
                  Welcome back, {player.username}!
                </h1>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-b-lg px-4 sm:px-8 py-3 sm:py-4">
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 break-all" data-testid="player-email">
                  {player.email || 'No email on file'}
                </p>
              </div>
            </div>

            {/* Coming Soon Section */}
            <section data-testid="coming-soon-section" className="mb-8">
              <div className="bg-crit-purple-600 rounded-t-lg px-4 sm:px-8 py-3 sm:py-4">
                <h2 className="text-lg sm:text-xl md:text-2xl font-display font-bold text-white">
                  Game Management
                </h2>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-b-lg px-8 py-12 sm:py-16">
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
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 dark:text-white mb-4">
                    Coming March 2026
                  </h3>
                  <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
                    Character sheets, campaign management, and world-building tools are currently in development.
                    Stay tuned for exciting updates!
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  )
}
