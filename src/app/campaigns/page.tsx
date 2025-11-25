import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PageLayout } from '@/components/templates/PageLayout'

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

export default async function CampaignsPage() {
  const session = await auth()

  // Require authentication
  if (!session?.user) {
    redirect('/login')
  }

  // Get user from database
  const user = await prisma.critUser.findUnique({
    where: { id: session.user.id },
  })

  if (!user) {
    redirect('/login')
  }

  // Get Crit-Coin balance for header
  const critCoinBalance = await getCritCoinBalance(user.id)

  // Get campaigns where user is GM or player
  const gmCampaigns = await prisma.rpgCampaign.findMany({
    where: {
      ownerId: user.id,
      deletedAt: null,
    },
    include: {
      world: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return (
    <PageLayout
      title="My Campaigns"
      description="Manage your campaigns as a GM or track your adventures as a player."
      critCoinBalance={critCoinBalance}
    >
      <section data-testid="campaigns-list-section">
        <div className="bg-white dark:bg-slate-900 rounded-lg px-4 sm:px-8 py-6">
          {/* Stats Summary */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-100 dark:bg-slate-800 rounded-lg p-4" data-testid="gm-campaigns-stat">
              <div className="text-2xl font-bold text-crit-purple-400">{gmCampaigns.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Campaigns as GM</div>
            </div>
            <div className="bg-gray-100 dark:bg-slate-800 rounded-lg p-4" data-testid="player-campaigns-stat">
              <div className="text-2xl font-bold text-green-400">0</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Campaigns as Player</div>
            </div>
            <div className="bg-gray-100 dark:bg-slate-800 rounded-lg p-4" data-testid="active-campaigns-stat">
              <div className="text-2xl font-bold text-blue-400">{gmCampaigns.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Active Campaigns</div>
            </div>
          </div>

          {gmCampaigns.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No campaigns found. Create your first campaign to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {gmCampaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="bg-gray-100 dark:bg-slate-800 rounded-lg p-6 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {campaign.name}
                      </h3>
                      {campaign.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {campaign.description}
                        </p>
                      )}
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        World: {campaign.world?.name || 'N/A'}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-crit-purple-600 text-white rounded text-xs font-semibold">
                      GM
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </PageLayout>
  )
}
