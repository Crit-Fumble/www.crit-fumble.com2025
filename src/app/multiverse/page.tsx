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

export default async function MultiversePage() {
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
      <div className="min-h-screen relative overflow-hidden overflow-x-hidden" data-testid="multiverse-page">
        <div className="absolute inset-0 bg-dice-hero bg-cover bg-center bg-no-repeat" />
        <div className="absolute inset-0 bg-black/30" />

        <div className="relative z-10 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            {/* Header */}
            <div className="mb-8">
              <div className="bg-crit-purple-600 rounded-t-lg px-4 sm:px-8 py-4 sm:py-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-display font-bold text-white">
                    Multiverse Manager
                  </h1>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-b-lg px-4 sm:px-8 py-3 sm:py-4">
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
                  Create universes to organize and group related worlds together.
                </p>
              </div>
            </div>

            {/* Coming Soon */}
            <div className="bg-white dark:bg-slate-900 rounded-lg p-12 text-center">
              <svg className="w-24 h-24 mx-auto text-gray-400 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Universe Management Coming Soon
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto">
                Create universes to group related worlds. Perfect for organizing shared settings like Forgotten Realms, Greyhawk, or your own custom multiverses.
              </p>

              <div className="max-w-md mx-auto text-left bg-gray-100 dark:bg-slate-800 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">What You'll Be Able to Do:</h3>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li>• Create universes with names and descriptions</li>
                  <li>• Assign worlds to specific universes</li>
                  <li>• View all worlds grouped by universe</li>
                  <li>• Set thumbnail images for universes</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
