import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Header } from '@/components/organisms/Header'
import { isAdmin } from '@/lib/admin'
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

export default async function HistoriesPage() {
  const session = await auth()

  // Require authentication
  if (!session?.user) {
    redirect('/login')
  }

  // Get user from database
  const user = await prisma.critUser.findUnique({
    where: { id: session.user.id },
  })

  // Require admin/owner access
  if (!user || !isAdmin(user)) {
    redirect('/dashboard')
  }

  // Get Crit-Coin balance for header
  const critCoinBalance = await getCritCoinBalance(user.id)

  // Get worlds for the owner
  const worlds = await prisma.rpgWorld.findMany({
    where: {
      ownerId: user.id,
      deletedAt: null,
    },
    orderBy: {
      updatedAt: 'desc',
    },
    select: {
      id: true,
      name: true,
      description: true,
      updatedAt: true,
      createdAt: true,
    },
  })

  return (
    <>
      <Header critCoinBalance={critCoinBalance} />
      <div className="min-h-screen relative overflow-hidden overflow-x-hidden" data-testid="histories-page">
        {/* Background Image */}
        <div className="absolute inset-0 bg-dice-hero bg-cover bg-center bg-no-repeat" />

        {/* Overlay for better readability */}
        <div className="absolute inset-0 bg-black/30" />

        {/* Content */}
        <div className="relative z-10 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            {/* Header */}
            <div className="mb-8" data-testid="histories-header">
              <div className="bg-crit-purple-600 rounded-t-lg px-4 sm:px-8 py-4 sm:py-6">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-display font-bold text-white break-words" data-testid="histories-title">
                  World Histories
                </h1>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-b-lg px-4 sm:px-8 py-3 sm:py-4">
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300" data-testid="histories-description">
                  Build living world wikis between game sessions. Chronicle events, document lore, and create rich histories for your campaigns.
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-900 rounded-lg p-4" data-testid="worlds-stat">
                <div className="text-2xl font-bold text-crit-purple-400">{worlds.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Active Worlds</div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-lg p-4" data-testid="events-stat">
                <div className="text-2xl font-bold text-blue-400">0</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Events</div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-lg p-4" data-testid="articles-stat">
                <div className="text-2xl font-bold text-green-400">0</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Wiki Articles</div>
              </div>
            </div>

            {/* Worlds List */}
            <section data-testid="worlds-section">
              <div className="bg-white dark:bg-slate-900 rounded-lg px-4 sm:px-8 py-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Your Worlds</h2>

                {worlds.length === 0 ? (
                  <div className="text-center py-12">
                    <svg
                      className="w-20 h-20 mx-auto mb-6 text-gray-400"
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
                    <p className="text-gray-500 dark:text-gray-400">No worlds found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {worlds.map((world) => (
                      <div
                        key={world.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:border-crit-purple-400 transition-colors"
                        data-testid={`world-${world.id}`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                              {world.name}
                            </h3>
                            {world.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                {world.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* World Actions */}
                        <div className="grid grid-cols-2 gap-3 mt-4">
                          <button
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
                            disabled
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Event
                          </button>
                          <button
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                            disabled
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Write Article
                          </button>
                        </div>

                        {/* Stats */}
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-3 gap-2 text-center">
                          <div>
                            <div className="text-lg font-bold text-crit-purple-600">0</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Events</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-blue-600">0</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Articles</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-green-600">0</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Characters</div>
                          </div>
                        </div>

                        {/* Last Updated */}
                        <div className="mt-4 text-xs text-gray-500 dark:text-gray-500">
                          Last updated: {new Date(world.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Feature Info */}
            <div className="mt-8 bg-white dark:bg-slate-900 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                World History Features (Coming Soon)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Timeline Events</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Chronicle major events, battles, discoveries, and milestones in your world's history.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Wiki Articles</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Write detailed articles about locations, factions, NPCs, and lore. Link them together.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Character Dossiers</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Track NPC relationships, motivations, and story arcs. Keep notes for recurring characters.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Session Journals</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Record what happened in each session. Track plot threads and player choices.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
