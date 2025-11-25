import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isOwner } from '@/lib/admin'
import { PageLayout } from '@/components/templates/PageLayout'
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

  // Get all core concept wiki pages
  const wikiPages = await prisma.coreConceptWiki.findMany({
    where: {
      deletedAt: null,
    },
    include: {
      author: {
        select: {
          id: true,
          username: true,
        },
      },
      _count: {
        select: {
          revisions: true,
        },
      },
    },
    orderBy: [
      { category: 'asc' },
      { sortOrder: 'asc' },
      { title: 'asc' },
    ],
  })

  // Group pages by category
  const categories = wikiPages.reduce((acc, page) => {
    if (!acc[page.category]) {
      acc[page.category] = []
    }
    acc[page.category].push(page)
    return acc
  }, {} as Record<string, typeof wikiPages>)

  return (
    <PageLayout
      title="Owners Portal"
      description="Core Concepts management for the 4 founders. Define the fundamental concepts that power the entire Crit-Fumble multiverse."
      critCoinBalance={critCoinBalance}
      headerColor="bg-purple-600"
    >
      {/* Owner Notice */}
      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-purple-900 dark:text-purple-300 mb-2">
          👑 Founder Access
        </h2>
        <p className="text-sm text-purple-800 dark:text-purple-400">
          This portal is exclusive to the 4 founders. Here you can define the Core Concepts that
          power the entire platform - the fundamental building blocks that all worlds, games, and
          systems use.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
            {wikiPages.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Pages</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
            {wikiPages.filter((p) => p.isPublished).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Published</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
            {wikiPages.filter((p) => !p.isPublished).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Drafts</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {Object.keys(categories).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Categories</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end mb-6">
        <Link
          href="/owners/core-concepts/new"
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
        >
          ✨ Create New Core Concept
        </Link>
      </div>

      {/* Wiki Pages by Category */}
      {/* TODO: Core Concepts section - not functional yet */}
      {/* <div className="space-y-8">
        {Object.keys(categories).length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg p-12 text-center border border-gray-200 dark:border-gray-700">
            <div className="text-6xl mb-4">📖</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Core Concepts Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Start building the foundation of the Crit-Fumble multiverse.
            </p>
            <Link
              href="/owners/core-concepts/new"
              className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              Create First Concept
            </Link>
          </div>
        ) : (
          Object.entries(categories)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([category, pages]) => (
              <section key={category} className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-gray-50 dark:bg-slate-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                    {category}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {pages.length} {pages.length === 1 ? 'page' : 'pages'}
                  </p>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {pages.map((page) => (
                    <Link
                      key={page.id}
                      href={`/owners/core-concepts/${page.slug}`}
                      className="block px-6 py-4 hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {page.icon && <span className="text-xl">{page.icon}</span>}
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                              {page.title}
                            </h3>
                            {!page.isPublished && (
                              <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs font-semibold rounded">
                                Draft
                              </span>
                            )}
                          </div>
                          {page.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                              {page.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>By {page.author.username}</span>
                            <span>•</span>
                            <span>{page._count.revisions} {page._count.revisions === 1 ? 'revision' : 'revisions'}</span>
                            <span>•</span>
                            <span>Updated {new Date(page.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="text-gray-400 dark:text-gray-600">
                          →
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ))
        )}
      </div> */}

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
