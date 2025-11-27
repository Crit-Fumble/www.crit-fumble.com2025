import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Header } from '@/components/organisms/Header'
import { AssetViewer } from '@/components/organisms/AssetViewer'
import { CopyUrlButton } from '@/components/molecules/CopyUrlButton'
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

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AssetDetailPage({ params }: PageProps) {
  const { id } = await params
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

  // Get the asset - must belong to the current user
  const asset = await prisma.rpgAsset.findUnique({
    where: {
      id,
      uploadedBy: user.id, // Only allow viewing own assets
      deletedAt: null,
    },
    include: {
      world: {
        select: {
          id: true,
          name: true,
        },
      },
      campaign: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  if (!asset) {
    notFound()
  }

  // Get Crit-Coin balance for header
  const critCoinBalance = await getCritCoinBalance(user.id)

  // Format file size
  const fileSizeKB = Number(asset.fileSize) / 1024
  const fileSizeDisplay = fileSizeKB > 1024
    ? `${(fileSizeKB / 1024).toFixed(2)} MB`
    : `${fileSizeKB.toFixed(1)} KB`

  return (
    <>
      <Header critCoinBalance={critCoinBalance} />
      <div className="min-h-screen relative overflow-hidden overflow-x-hidden" data-testid="asset-detail-page">
        {/* Background */}
        <div className="absolute inset-0 bg-dice-hero bg-cover bg-center bg-no-repeat" />
        <div className="absolute inset-0 bg-black/50" />

        {/* Content */}
        <div className="relative z-10 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            {/* Breadcrumb */}
            <nav className="mb-6" aria-label="Breadcrumb">
              <ol className="flex items-center gap-2 text-sm">
                <li>
                  <Link href="/creations" className="text-gray-400 hover:text-white transition-colors">
                    My Creations
                  </Link>
                </li>
                <li className="text-gray-500">/</li>
                <li className="text-white font-medium truncate max-w-xs">{asset.name}</li>
              </ol>
            </nav>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Asset Viewer - Takes 2/3 on large screens */}
              <div className="lg:col-span-2">
                <div className="bg-slate-900 rounded-lg overflow-hidden">
                  <AssetViewer asset={asset} />
                </div>
              </div>

              {/* Asset Info Sidebar */}
              <div className="space-y-4">
                {/* Title & Actions */}
                <div className="bg-white dark:bg-slate-900 rounded-lg p-6">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 break-words">
                    {asset.name}
                  </h1>
                  {asset.description && (
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {asset.description}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={asset.url}
                      download={asset.filename}
                      className="flex items-center gap-2 px-4 py-2 bg-crit-purple-600 text-white rounded-lg hover:bg-crit-purple-700 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </a>
                    <CopyUrlButton url={asset.url} />
                  </div>
                </div>

                {/* File Details */}
                <div className="bg-white dark:bg-slate-900 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">File Details</h2>
                  <dl className="space-y-3">
                    <div className="flex justify-between">
                      <dt className="text-gray-600 dark:text-gray-400">Type</dt>
                      <dd className="text-gray-900 dark:text-white font-medium">{asset.assetType}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600 dark:text-gray-400">MIME Type</dt>
                      <dd className="text-gray-900 dark:text-white font-medium text-sm">{asset.mimeType}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600 dark:text-gray-400">File Size</dt>
                      <dd className="text-gray-900 dark:text-white font-medium">{fileSizeDisplay}</dd>
                    </div>
                    {asset.width && asset.height && (
                      <div className="flex justify-between">
                        <dt className="text-gray-600 dark:text-gray-400">Dimensions</dt>
                        <dd className="text-gray-900 dark:text-white font-medium">{asset.width} x {asset.height}</dd>
                      </div>
                    )}
                    {asset.duration && (
                      <div className="flex justify-between">
                        <dt className="text-gray-600 dark:text-gray-400">Duration</dt>
                        <dd className="text-gray-900 dark:text-white font-medium">
                          {Math.floor(asset.duration / 60)}:{(asset.duration % 60).toString().padStart(2, '0')}
                        </dd>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <dt className="text-gray-600 dark:text-gray-400">Filename</dt>
                      <dd className="text-gray-900 dark:text-white font-medium text-sm truncate max-w-[200px]" title={asset.filename}>
                        {asset.filename}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Organization */}
                <div className="bg-white dark:bg-slate-900 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Organization</h2>
                  <dl className="space-y-3">
                    {asset.category && (
                      <div className="flex justify-between">
                        <dt className="text-gray-600 dark:text-gray-400">Category</dt>
                        <dd className="text-gray-900 dark:text-white font-medium">{asset.category}</dd>
                      </div>
                    )}
                    {asset.world && (
                      <div className="flex justify-between">
                        <dt className="text-gray-600 dark:text-gray-400">World</dt>
                        <dd>
                          <Link href={`/worlds/${asset.world.id}`} className="text-crit-purple-500 hover:underline">
                            {asset.world.name}
                          </Link>
                        </dd>
                      </div>
                    )}
                    {asset.campaign && (
                      <div className="flex justify-between">
                        <dt className="text-gray-600 dark:text-gray-400">Campaign</dt>
                        <dd>
                          <Link href={`/campaigns/${asset.campaign.id}`} className="text-crit-purple-500 hover:underline">
                            {asset.campaign.name}
                          </Link>
                        </dd>
                      </div>
                    )}
                    {asset.tags.length > 0 && (
                      <div>
                        <dt className="text-gray-600 dark:text-gray-400 mb-2">Tags</dt>
                        <dd className="flex flex-wrap gap-1">
                          {asset.tags.map((tag, i) => (
                            <span key={i} className="px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 text-xs rounded">
                              {tag}
                            </span>
                          ))}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Timestamps */}
                <div className="bg-white dark:bg-slate-900 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">History</h2>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-600 dark:text-gray-400">Created</dt>
                      <dd className="text-gray-900 dark:text-white">
                        {new Date(asset.createdAt).toLocaleString()}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600 dark:text-gray-400">Updated</dt>
                      <dd className="text-gray-900 dark:text-white">
                        {new Date(asset.updatedAt).toLocaleString()}
                      </dd>
                    </div>
                    {asset.usageCount > 0 && (
                      <div className="flex justify-between">
                        <dt className="text-gray-600 dark:text-gray-400">Used</dt>
                        <dd className="text-gray-900 dark:text-white">{asset.usageCount} times</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
