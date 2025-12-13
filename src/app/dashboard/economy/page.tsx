import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getCurrentUser } from '@/lib/core-auth'
import {
  Card,
  CardContent,
  CardHeader,
  Badge,
  EconomyDashboard,
  TransactionHistory,
  PayoutPanel,
  CritCoin,
  StoryCredit,
} from '@crit-fumble/react/shared'
import type { EconomyStats } from '@crit-fumble/react/shared'

// TODO: Replace with actual API calls when @crit-fumble/core@10.21.0 is available
// import { api } from '@crit-fumble/core'

export default async function EconomyPage() {
  const user = await getCurrentUser()

  // Require login
  if (!user) {
    redirect('/api/auth/signin?callbackUrl=/dashboard/economy')
  }

  // Require admin
  if (!user.isAdmin) {
    redirect('/dashboard')
  }

  // TODO: Fetch real data from Core API
  // const wallet = await api.economy.getWallet()
  // const transactions = await api.economy.listTransactions({ limit: 10 })
  // const payouts = await api.economy.listPayouts({ status: 'pending' })

  // Mock data for UI development
  const stats: EconomyStats = {
    critCoins: 1500,
    storyCredits: 750,
    totalEarned: 2500,
    totalSpent: 1000,
    pendingPayouts: 100,
  }

  const transactions = [
    {
      id: 'tx-1',
      type: 'tip_received' as const,
      amount: 50,
      currency: 'story-credits' as const,
      currencyIcon: <StoryCredit size="sm" />,
      description: 'Tip from DragonSlayer42',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      from: 'DragonSlayer42',
      status: 'completed' as const,
    },
    {
      id: 'tx-2',
      type: 'tip_sent' as const,
      amount: 25,
      currency: 'crit-coins' as const,
      currencyIcon: <CritCoin size="sm" />,
      description: 'Tip to WikiMaster',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      to: 'WikiMaster',
      status: 'completed' as const,
    },
    {
      id: 'tx-3',
      type: 'purchase' as const,
      amount: 500,
      currency: 'crit-coins' as const,
      currencyIcon: <CritCoin size="sm" />,
      description: 'Purchased 500 Crit-Coins',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      status: 'completed' as const,
    },
    {
      id: 'tx-4',
      type: 'payout' as const,
      amount: 100,
      currency: 'usd' as const,
      currencyIcon: <span className="text-green-400">$</span>,
      description: 'Payout to PayPal',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      status: 'pending' as const,
    },
  ]

  const payoutMethods = [
    { id: 'paypal-1', type: 'paypal' as const, label: 'PayPal', details: 'user@example.com' },
  ]

  const handleRequestPayout = async (amount: number, methodId: string) => {
    'use server'
    // TODO: Call api.economy.requestPayout({ amount, methodId })
    console.log('Payout requested:', { amount, methodId })
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-bold text-white hover:text-crit-purple-400 transition-colors">
              Crit-Fumble
            </Link>
            <span className="text-gray-600">/</span>
            <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
              Dashboard
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-gray-400">Economy</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {user.image && (
                <Image
                  src={user.image}
                  alt={user.name ?? 'User'}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              )}
              <span className="text-sm text-gray-300">{user.name}</span>
              <Badge size="sm" variant="default">
                admin
              </Badge>
            </div>
            <a
              href="/api/auth/signout"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Sign out
            </a>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <h1 className="text-3xl font-bold text-white">Economy Dashboard</h1>
          <Badge size="sm" variant="warning">Admin Only</Badge>
        </div>

        {/* Stats Overview */}
        <section className="mb-8">
          <EconomyDashboard stats={stats} showDetailedStats testId="economy-dashboard" />
        </section>

        {/* Two column layout for transactions and payouts */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Transaction History */}
          <section>
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-white">Recent Transactions</h2>
              </CardHeader>
              <CardContent>
                <TransactionHistory
                  transactions={transactions}
                  emptyMessage="No transactions yet"
                  testId="transaction-history"
                />
              </CardContent>
            </Card>
          </section>

          {/* Payout Panel */}
          <section>
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-white">Request Payout</h2>
              </CardHeader>
              <CardContent>
                <PayoutPanel
                  availableBalance={stats.storyCredits}
                  minimumPayout={1000}
                  payoutMethods={payoutMethods}
                  onRequestPayout={handleRequestPayout}
                  testId="payout-panel"
                />
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Admin notice */}
        <div className="mt-8 p-4 bg-amber-900/20 border border-amber-700/50 rounded-lg">
          <p className="text-amber-200 text-sm">
            <strong>Development Mode:</strong> This page displays mock data.
            Real economy data will be available when Core API integration is complete.
          </p>
        </div>
      </main>
    </div>
  )
}
