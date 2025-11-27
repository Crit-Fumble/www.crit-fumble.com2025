import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Header } from '@/components/organisms/Header'
import { isAdmin } from '@/lib/admin'

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

export default async function WorldsPage() {
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

  // Get all worlds
  const worlds = await prisma.rpgWorld.findMany({
    where: {
      deletedAt: null,
    },
    include: {
      owner: {
        select: {
          id: true,
          username: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return (
    <>
      <Header critCoinBalance={critCoinBalance} />
      <div className="min-h-screen relative overflow-hidden overflow-x-hidden" data-testid="worlds-page">
        {/* Background Image */}
        <div className="absolute inset-0 bg-dice-hero bg-cover bg-center bg-no-repeat" />

        {/* Overlay for better readability */}
        <div className="absolute inset-0 bg-black/30" />

        {/* Content */}
        <div className="relative z-10 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            {/* Worlds Header */}
            <div className="mb-8" data-testid="worlds-header">
              <div className="bg-crit-purple-600 rounded-t-lg px-4 sm:px-8 py-4 sm:py-6">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-display font-bold text-white break-words" data-testid="worlds-title">
                  Worlds Management
                </h1>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-b-lg px-4 sm:px-8 py-3 sm:py-4">
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300" data-testid="worlds-description">
                  Manage RPG worlds across the platform. Only admins can create new worlds.
                </p>
              </div>
            </div>

            {/* Worlds List */}
            <section data-testid="worlds-list-section">
              <div className="bg-white dark:bg-slate-900 rounded-lg px-4 sm:px-8 py-6">
                {/* Stats Summary */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-100 dark:bg-slate-800 rounded-lg p-4" data-testid="total-worlds-stat">
                    <div className="text-2xl font-bold text-crit-purple-400">{worlds.length}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Worlds</div>
                  </div>
                  <div className="bg-gray-100 dark:bg-slate-800 rounded-lg p-4" data-testid="active-worlds-stat">
                    <div className="text-2xl font-bold text-green-400">
                      {worlds.filter(w => !w.deletedAt).length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Active Worlds</div>
                  </div>
                  <div className="bg-gray-100 dark:bg-slate-800 rounded-lg p-4" data-testid="multiverse-worlds-stat">
                    <div className="text-2xl font-bold text-blue-400">
                      {worlds.filter(w => w.worldAnvilWorldId === process.env.WORLD_ANVIL_MULTIVERSE_WORLD_ID).length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Multiverse Worlds</div>
                  </div>
                </div>

                  {/* Worlds Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" data-testid="worlds-list-table">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-2 text-gray-700 dark:text-gray-300 font-semibold">Name</th>
                        <th className="text-left py-3 px-2 text-gray-700 dark:text-gray-300 font-semibold">Owner</th>
                        <th className="text-left py-3 px-2 text-gray-700 dark:text-gray-300 font-semibold">World Anvil ID</th>
                        <th className="text-left py-3 px-2 text-gray-700 dark:text-gray-300 font-semibold">Created</th>
                        <th className="text-left py-3 px-2 text-gray-700 dark:text-gray-300 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {worlds.map((world) => (
                        <tr
                          key={world.id}
                          className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-slate-800/50"
                          data-testid={`world-row-${world.id}`}
                        >
                          <td className="py-3 px-2 text-gray-900 dark:text-white font-medium">{world.name}</td>
                          <td className="py-3 px-2 text-gray-600 dark:text-gray-400 text-xs">
                            {world.owner?.username || '—'}
                          </td>
                          <td className="py-3 px-2 text-gray-600 dark:text-gray-400 text-xs font-mono">
                            {world.worldAnvilWorldId ? (
                              <span className={world.worldAnvilWorldId === process.env.WORLD_ANVIL_MULTIVERSE_WORLD_ID ? 'text-blue-400 font-semibold' : ''}>
                                {world.worldAnvilWorldId}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="py-3 px-2 text-gray-600 dark:text-gray-400 text-xs">
                            {new Date(world.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-2">
                            <button className="text-crit-purple-600 hover:text-crit-purple-700 dark:text-crit-purple-400 dark:hover:text-crit-purple-300 text-xs font-medium">
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {worlds.length === 0 && (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    No worlds found. Create your first world to get started.
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  )
}
