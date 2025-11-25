import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Header } from '@/components/organisms/Header';
import { isAdmin } from '@/lib/admin';
import Link from 'next/link';

async function getCritCoinBalance(playerId: string): Promise<number> {
  const transactions = await prisma.critCoinTransaction.findMany({
    where: { playerId },
    select: {
      transactionType: true,
      amount: true,
    },
  });

  return transactions.reduce((balance: number, tx) => {
    return tx.transactionType === 'credit' ? balance + tx.amount : balance - tx.amount;
  }, 0);
}

export default async function AssetsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const user = await prisma.critUser.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    redirect('/login');
  }

  const critCoinBalance = await getCritCoinBalance(user.id);

  // Get user's assets
  const assets = await prisma.rpgAsset.findMany({
    where: {
      uploadedBy: user.id,
      deletedAt: null,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
  });

  return (
    <>
      <Header critCoinBalance={critCoinBalance} />
      <div className="min-h-screen relative overflow-hidden overflow-x-hidden" data-testid="assets-page">
        <div className="absolute inset-0 bg-dice-hero bg-cover bg-center bg-no-repeat" />
        <div className="absolute inset-0 bg-black/30" />

        <div className="relative z-10 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            {/* Header */}
            <div className="mb-8">
              <div className="bg-crit-purple-600 rounded-t-lg px-4 sm:px-8 py-4 sm:py-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-display font-bold text-white">
                    RPG Assets
                  </h1>
                  <Link
                    href="/creator"
                    className="text-white/80 hover:text-white text-sm font-medium"
                  >
                    ← Back to Creator Tools
                  </Link>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-b-lg px-4 sm:px-8 py-3 sm:py-4">
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
                  Upload and manage media assets (images, audio, video, documents) for use in tiles, maps, and campaigns.
                </p>
              </div>
            </div>

            {/* Upload Section */}
            <section className="mb-8">
              <div className="bg-white dark:bg-slate-900 rounded-lg px-4 sm:px-8 py-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Upload New Asset</h2>

                {/* Upload Form - Placeholder */}
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-12 text-center">
                  <svg
                    className="w-16 h-16 mx-auto mb-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Drag and drop files here
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    or click to browse your computer
                  </p>
                  <button
                    type="button"
                    className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled
                  >
                    Select Files (Not Available)
                  </button>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
                    Supported: Images (PNG, JPG, WebP), Audio (MP3, OGG, WAV), Video (MP4, WebM)
                  </p>
                </div>
              </div>
            </section>

            {/* Assets List */}
            <section>
              <div className="bg-white dark:bg-slate-900 rounded-lg px-4 sm:px-8 py-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your Assets</h2>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {assets.length} {assets.length === 1 ? 'asset' : 'assets'}
                  </div>
                </div>

                {assets.length === 0 ? (
                  <div className="text-center py-12">
                    <svg
                      className="w-16 h-16 mx-auto mb-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      No assets uploaded yet.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3 px-2 text-gray-700 dark:text-gray-300 font-semibold">Preview</th>
                          <th className="text-left py-3 px-2 text-gray-700 dark:text-gray-300 font-semibold">Name</th>
                          <th className="text-left py-3 px-2 text-gray-700 dark:text-gray-300 font-semibold">Type</th>
                          <th className="text-left py-3 px-2 text-gray-700 dark:text-gray-300 font-semibold">Size</th>
                          <th className="text-left py-3 px-2 text-gray-700 dark:text-gray-300 font-semibold">Dimensions</th>
                          <th className="text-left py-3 px-2 text-gray-700 dark:text-gray-300 font-semibold">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assets.map((asset) => (
                          <tr
                            key={asset.id}
                            className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-slate-800/50"
                          >
                            <td className="py-3 px-2">
                              {asset.assetType === 'image' ? (
                                <img
                                  src={asset.url}
                                  alt={asset.name}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-xl">
                                  {asset.assetType === 'audio' && '🎵'}
                                  {asset.assetType === 'video' && '🎬'}
                                  {!['image', 'audio', 'video'].includes(asset.assetType) && '📄'}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-2 text-gray-900 dark:text-white font-medium">{asset.name}</td>
                            <td className="py-3 px-2 text-gray-600 dark:text-gray-400 text-xs">
                              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                                {asset.assetType}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-gray-600 dark:text-gray-400 text-xs">
                              {(Number(asset.fileSize) / 1024).toFixed(1)} KB
                            </td>
                            <td className="py-3 px-2 text-gray-600 dark:text-gray-400 text-xs">
                              {asset.width && asset.height ? `${asset.width}×${asset.height}` : '—'}
                            </td>
                            <td className="py-3 px-2 text-gray-600 dark:text-gray-400 text-xs">
                              {new Date(asset.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
