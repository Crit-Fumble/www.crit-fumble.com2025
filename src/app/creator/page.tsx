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

export default async function CreatorPage() {
  const session = await auth();

  // Require authentication
  if (!session?.user) {
    redirect('/login');
  }

  // Get user from database
  const user = await prisma.critUser.findUnique({
    where: { id: session.user.id },
  });

  // Require admin access (for now)
  if (!user || !isAdmin(user)) {
    redirect('/dashboard');
  }

  // Get Crit-Coin balance for header
  const critCoinBalance = await getCritCoinBalance(user.id);

  return (
    <>
      <Header critCoinBalance={critCoinBalance} />
      <div className="min-h-screen relative overflow-hidden overflow-x-hidden" data-testid="creator-page">
        {/* Background Image */}
        <div className="absolute inset-0 bg-dice-hero bg-cover bg-center bg-no-repeat" />

        {/* Overlay for better readability */}
        <div className="absolute inset-0 bg-black/30" />

        {/* Content */}
        <div className="relative z-10 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            {/* Creator Tools Header */}
            <div className="mb-8" data-testid="creator-header">
              <div className="bg-crit-purple-600 rounded-t-lg px-4 sm:px-8 py-4 sm:py-6">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-display font-bold text-white break-words" data-testid="creator-title">
                  Creator Tools
                </h1>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-b-lg px-4 sm:px-8 py-3 sm:py-4">
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300" data-testid="creator-description">
                  Create and manage assets for your VTT. Define tiles, upload assets, and organize collections for your campaigns.
                </p>
              </div>
            </div>

            {/* Creator Tools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* RPG Assets */}
              <Link
                href="/assets"
                className="bg-white dark:bg-slate-900 rounded-lg p-6 hover:bg-white dark:hover:bg-slate-900 transition-all hover:shadow-lg"
                data-testid="creator-assets-card"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">My Assets</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Images & documents</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Upload and manage images and documents. Assets are automatically optimized for VTT use.
                </p>
                <div className="mt-4 text-sm text-green-600 dark:text-green-400 font-medium">
                  Manage Assets →
                </div>
              </Link>

              {/* RPG Tiles - Coming Soon */}
              <div
                className="bg-white dark:bg-slate-900 rounded-lg p-6 opacity-60"
                data-testid="creator-tiles-card"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-crit-purple-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">RPG Tiles</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Coming soon</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Define tiles with multiple scales and resolutions. Terrain, structures, decorations, and effects.
                </p>
                <div className="mt-4 text-sm text-gray-400 font-medium">
                  Coming Soon
                </div>
              </div>

              {/* Tile Collections - Coming Soon */}
              <div
                className="bg-white dark:bg-slate-900 rounded-lg p-6 opacity-60"
                data-testid="creator-collections-card"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tile Collections</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Coming soon</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Group tiles into themed collections for easy organization and sharing.
                </p>
                <div className="mt-4 text-sm text-gray-400 font-medium">
                  Coming Soon
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-8 bg-white dark:bg-slate-900 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Stats</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-crit-purple-600">0</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Tiles</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">0</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Assets</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">0</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Collections</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">0 MB</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Storage Used</div>
                </div>
              </div>
            </div>

            {/* Documentation */}
            <div className="mt-8 bg-white dark:bg-slate-900 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Documentation</h2>
              <div className="space-y-2">
                <a
                  href="/docs/agent/architecture/TILE_ASSET_SYSTEM.md"
                  target="_blank"
                  className="block text-sm text-crit-purple-600 dark:text-crit-purple-400 hover:underline"
                >
                  📖 Tile & Asset System Documentation
                </a>
                <a
                  href="/docs/VTTImageScaleGuidelines.md"
                  target="_blank"
                  className="block text-sm text-crit-purple-600 dark:text-crit-purple-400 hover:underline"
                >
                  📐 VTT Scale Guidelines
                </a>
                <a
                  href="/docs/todo/3.24.26-release.md"
                  target="_blank"
                  className="block text-sm text-crit-purple-600 dark:text-crit-purple-400 hover:underline"
                >
                  🗓️ March 2026 Release Plan
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
