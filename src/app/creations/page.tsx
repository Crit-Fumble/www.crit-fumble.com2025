import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Header } from '@/components/organisms/Header'
import { AssetManager } from '@/components/organisms/AssetManager'

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

  // Get ALL user's assets (no limit for proper filtering)
  const assets = await prisma.rpgAsset.findMany({
    where: {
      uploadedBy: user.id,
      deletedAt: null,
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      name: true,
      description: true,
      assetType: true,
      url: true,
      mimeType: true,
      fileSize: true,
      filename: true,
      width: true,
      height: true,
      duration: true,
      createdAt: true,
      category: true,
      tags: true,
    },
  })

  // Get asset statistics by type
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

  const assetCounts = assetStats.reduce((acc, stat) => {
    acc[stat.assetType] = stat._count.id
    return acc
  }, {} as Record<string, number>)

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
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-display font-bold text-white break-words" data-testid="creations-title">
                  My Creations
                </h1>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-b-lg px-4 sm:px-8 py-3 sm:py-4">
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300" data-testid="creations-description">
                  Manage your uploaded RPG assets - images, audio, video, and documents.
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
                <div className="text-2xl font-bold text-blue-400">{Object.keys(assetCounts).length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Asset Types</div>
              </div>
            </div>

            {/* Asset Manager with filtering and list view */}
            <section data-testid="assets-list-section">
              <AssetManager assets={assets} assetCounts={assetCounts} />
            </section>
          </div>
        </div>
      </div>
    </>
  )
}
