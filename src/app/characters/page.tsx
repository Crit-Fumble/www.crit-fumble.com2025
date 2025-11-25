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

export default async function CharactersPage() {
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

  // Get user's characters (RpgSheets with type 'character' or 'hand')
  const characters = await prisma.rpgSheet.findMany({
    where: {
      createdBy: user.id,
      type: {
        in: ['character', 'hand'], // 'hand' type represents character inventory/cards
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return (
    <PageLayout
      title="My Characters"
      description="Manage your RPG characters across all campaigns and game systems."
      critCoinBalance={critCoinBalance}
    >
      <section data-testid="characters-list-section">
        <div className="bg-white dark:bg-slate-900 rounded-lg px-4 sm:px-8 py-6">
          {/* Stats Summary */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-100 dark:bg-slate-800 rounded-lg p-4" data-testid="total-characters-stat">
              <div className="text-2xl font-bold text-crit-purple-400">{characters.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Characters</div>
            </div>
            <div className="bg-gray-100 dark:bg-slate-800 rounded-lg p-4" data-testid="character-sheets-stat">
              <div className="text-2xl font-bold text-green-400">
                {characters.filter(c => c.type === 'character').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Character Sheets</div>
            </div>
            <div className="bg-gray-100 dark:bg-slate-800 rounded-lg p-4" data-testid="campaigns-stat">
              <div className="text-2xl font-bold text-blue-400">
                {new Set(characters.map(c => c.campaignId).filter(Boolean)).size}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Campaigns</div>
            </div>
          </div>

          {characters.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No characters found. Create your first character to get started.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {characters.map((character) => (
                <div
                  key={character.id}
                  className="bg-gray-100 dark:bg-slate-800 rounded-lg p-4 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {character.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Type: {character.type}
                  </p>
                  {character.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 line-clamp-2">
                      {character.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </PageLayout>
  )
}
