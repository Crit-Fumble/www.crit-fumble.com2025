import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isOwner } from '@/lib/admin'
import { PageLayout } from '@/components/templates/PageLayout'
import { OwnerDashboardTabs } from '@/components/organisms/OwnerDashboardTabs'

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

export default async function OwnersPage() {
  const session = await auth()

  // Require authentication
  if (!session?.user) {
    redirect('/login')
  }

  // Get user from database
  const user = await prisma.critUser.findUnique({
    where: { id: session.user.id },
  })

  // Require owner access (4 founders only)
  if (!user || !isOwner(user)) {
    redirect('/dashboard')
  }

  // Get Crit-Coin balance for header
  const critCoinBalance = await getCritCoinBalance(user.id)

  // Get RPG systems
  const gameSystems = await prisma.rpgSystem.findMany({
    where: {
      deletedAt: null,
    },
    orderBy: [
      { priority: 'desc' },
      { isCore: 'desc' },
      { name: 'asc' },
    ],
  })

  return (
    <PageLayout
      title="Owners Portal"
      description="Platform management for the 4 founders. Configure systems and define core concepts."
      critCoinBalance={critCoinBalance}
      headerColor="bg-purple-600"
    >
      {/* Owner Notice */}
      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-purple-900 dark:text-purple-300 mb-2">
          👑 Founder Access
        </h2>
        <p className="text-sm text-purple-800 dark:text-purple-400">
          This portal is exclusive to the 4 founders. Manage game systems, configure platform
          settings, and define core concepts that power the entire Crit-Fumble platform.
        </p>
      </div>

      {/* Tabbed Dashboard */}
      <OwnerDashboardTabs gameSystems={gameSystems} />

      {/* Help Text */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
          What are Core Concepts?
        </h3>
        <div className="text-sm text-blue-800 dark:text-blue-400 space-y-2">
          <p>
            Core Concepts are the fundamental building blocks of the Crit-Fumble multiverse. They define:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li><strong>Scales</strong> - From interaction-level (1:1) to universe-level (60 MLY voxels)</li>
            <li><strong>Rules</strong> - Platform-wide game mechanics and systems</li>
            <li><strong>Entities</strong> - Core entity types like Players, Teams, Roles, Locations</li>
            <li><strong>Systems</strong> - How different game systems integrate</li>
          </ul>
          <p className="mt-2">
            Each concept has three versions: <strong>GM Content</strong> (full technical details),{' '}
            <strong>Player Content</strong> (simplified), and <strong>Builder Content</strong> (in-depth worldbuilding).
          </p>
        </div>
      </div>
    </PageLayout>
  )
}
