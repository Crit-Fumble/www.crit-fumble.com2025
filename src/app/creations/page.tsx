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

export default async function CreationsPage() {
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

  // Get user's assets
  const assets = await prisma.rpgAsset.findMany({
    where: {
      uploadedBy: user.id,
      deletedAt: null,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  })

  // Get asset statistics
  const assetStats = await prisma.rpgAsset.groupBy({
    by: ['assetType'],
    where: {
      uploadedBy: user.id,
      deletedAt: null,
    },
    _count: {
      id: true,
    },
  })

  const totalAssets = assets.length
  const totalSize = assets.reduce((sum, asset) => sum + Number(asset.fileSize), 0)

  return (
    <>
      <Header critCoinBalance={critCoinBalance} />
      <div className="min-h-screen relative overflow-hidden overflow-x-hidden" data-testid="creations-page">
        {/* Background Image */}
        <div className="absolute inset-0 bg-dice-hero bg-cover bg-center bg-no-repeat" />

        {/* Overlay for better readability */}
        <div className="absolute inset-0 bg-black/30" />

        {/* Content */}
        <div className="relative z-10 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            {/* Header */}
            <div className="mb-8" data-testid="creations-header">
              <div className="bg-crit-purple-600 rounded-t-lg px-4 sm:px-8 py-4 sm:py-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-display font-bold text-white break-words" data-testid="creations-title">
                    My Creations
                  </h1>
                  <Link
                    href="/creator/assets"
                    className="bg-white text-crit-purple-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-sm sm:text-base"
                    data-testid="upload-asset-button"
                  >
                    + Upload Asset
                  </Link>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-b-lg px-4 sm:px-8 py-3 sm:py-4">
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300" data-testid="creations-description">
                  Manage your uploaded RPG assets. Upload images, audio, video files for use in your campaigns and VTT.
                </p>
              </div>
            </div>

            {/* Stats Summary */}
            <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-900 rounded-lg p-4" data-testid="total-assets-stat">
                <div className="text-2xl font-bold text-crit-purple-400">{totalAssets}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Assets</div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-lg p-4" data-testid="storage-used-stat">
                <div className="text-2xl font-bold text-green-400">
                  {(totalSize / (1024 * 1024)).toFixed(2)} MB
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Storage Used</div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-lg p-4" data-testid="asset-types-stat">
                <div className="text-2xl font-bold text-blue-400">{assetStats.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Asset Types</div>
              </div>
            </div>

            {/* Assets List */}
            <section data-testid="assets-list-section">
              <div className="bg-white dark:bg-slate-900 rounded-lg px-4 sm:px-8 py-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Assets</h2>

                {assets.length === 0 ? (
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
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">No assets uploaded yet</p>
                    <Link
                      href="/creator/assets"
                      className="inline-block bg-crit-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-crit-purple-700 transition-colors"
                    >
                      Upload Your First Asset
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {assets.map((asset) => (
                      <div
                        key={asset.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                        data-testid={`asset-${asset.id}`}
                      >
                        {/* Asset Preview */}
                        <div className="aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          {asset.assetType === 'image' ? (
                            <img
                              src={asset.url}
                              alt={asset.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-center p-4">
                              <div className="text-4xl mb-2">
                                {asset.assetType === 'audio' && '🎵'}
                                {asset.assetType === 'video' && '🎬'}
                                {!['image', 'audio', 'video'].includes(asset.assetType) && '📄'}
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400">{asset.assetType}</p>
                            </div>
                          )}
                        </div>

                        {/* Asset Info */}
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 truncate">
                            {asset.name}
                          </h3>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                            {(Number(asset.fileSize) / 1024).toFixed(1)} KB
                          </p>
                          {asset.width && asset.height && (
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              {asset.width} × {asset.height}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {assets.length > 0 && (
                  <div className="mt-6 text-center">
                    <Link
                      href="/creator/assets"
                      className="text-crit-purple-600 dark:text-crit-purple-400 hover:underline text-sm font-medium"
                    >
                      View All Assets →
                    </Link>
                  </div>
                )}
              </div>
            </section>

            {/* Quick Actions */}
            <div className="mt-8 bg-white dark:bg-slate-900 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  href="/creator/assets"
                  className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-crit-purple-400 transition-colors"
                >
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white text-sm">Upload Asset</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Add new media files</div>
                  </div>
                </Link>

                <Link
                  href="/creator"
                  className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-crit-purple-400 transition-colors"
                >
                  <div className="w-10 h-10 bg-crit-purple-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white text-sm">Creator Tools</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Manage tiles & collections</div>
                  </div>
                </Link>

                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-crit-purple-400 transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white text-sm">Dashboard</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Back to main dashboard</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
