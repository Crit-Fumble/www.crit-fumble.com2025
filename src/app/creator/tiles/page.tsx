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

export default async function TilesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const user = await prisma.critUser.findUnique({
    where: { id: session.user.id },
  });

  if (!user || !isAdmin(user)) {
    redirect('/dashboard');
  }

  const critCoinBalance = await getCritCoinBalance(user.id);

  return (
    <>
      <Header critCoinBalance={critCoinBalance} />
      <div className="min-h-screen relative overflow-hidden overflow-x-hidden" data-testid="tiles-page">
        <div className="absolute inset-0 bg-dice-hero bg-cover bg-center bg-no-repeat" />
        <div className="absolute inset-0 bg-black/30" />

        <div className="relative z-10 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            {/* Header */}
            <div className="mb-8">
              <div className="bg-crit-purple-600 rounded-t-lg px-4 sm:px-8 py-4 sm:py-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-display font-bold text-white">
                    RPG Tiles
                  </h1>
                  <Link
                    href="/creator"
                    className="text-white/80 hover:text-white text-sm font-medium"
                  >
                    ← Back to Creator Tools
                  </Link>
                </div>
              </div>
              <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-b-lg px-4 sm:px-8 py-3 sm:py-4">
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
                  Define multi-scale tiles for terrain, structures, decorations, hazards, and effects. Each tile can store assets for all 8 scales and 4 resolutions.
                </p>
              </div>
            </div>

            {/* Coming Soon */}
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-lg p-12 text-center">
              <svg className="w-24 h-24 mx-auto text-gray-400 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
              </svg>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Tile Management Coming Soon
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
                This interface will allow you to create and manage RPG tiles with multi-scale/multi-resolution support. Define tiles once, use everywhere.
              </p>
              <div className="text-left max-w-2xl mx-auto bg-gray-100 dark:bg-slate-800 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Planned Features:</h3>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li>✓ Create tiles with name, category, and tags</li>
                  <li>✓ Upload assets for all 8 scales (Arena → Realm)</li>
                  <li>✓ Support 4 resolutions (Low, Medium, High, Print)</li>
                  <li>✓ Organize by category (Terrain, Structure, Decoration, Hazard, Effect, Overlay)</li>
                  <li>✓ Grid type selection (Square, Hex, Voxel)</li>
                  <li>✓ RPG system tagging (D&D 5e, Cypher, etc.)</li>
                  <li>✓ Audio assets for ambient sounds</li>
                  <li>✓ Animation frame support</li>
                  <li>✓ Tile variants</li>
                  <li>✓ Coverage visualization (see which scale/resolution combinations are populated)</li>
                </ul>
              </div>
              <div className="mt-6">
                <Link
                  href="/creator"
                  className="inline-block px-6 py-3 bg-crit-purple-600 text-white rounded-lg hover:bg-crit-purple-700 font-medium"
                >
                  Back to Creator Tools
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
