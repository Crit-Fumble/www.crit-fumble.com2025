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

export default async function CollectionsPage() {
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
      <div className="min-h-screen relative overflow-hidden overflow-x-hidden" data-testid="collections-page">
        <div className="absolute inset-0 bg-dice-hero bg-cover bg-center bg-no-repeat" />
        <div className="absolute inset-0 bg-black/30" />

        <div className="relative z-10 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            {/* Header */}
            <div className="mb-8">
              <div className="bg-crit-purple-600 rounded-t-lg px-4 sm:px-8 py-4 sm:py-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-display font-bold text-white">
                    Tile Collections
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
                  Organize tiles into collections (e.g., "5e Terrain Pack", "Dungeon Floors") for easy discovery and marketplace distribution.
                </p>
              </div>
            </div>

            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-lg p-12 text-center">
              <svg className="w-24 h-24 mx-auto text-gray-400 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Collection Management
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
                This feature is not yet available.
              </p>
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
