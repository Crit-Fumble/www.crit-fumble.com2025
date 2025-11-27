import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prismaMain } from '@/lib/db'
import { Header } from '@/components/organisms/Header'
import { LinkedAccountsManager } from '@/components/organisms/LinkedAccountsManager'
import { ProfileEditor } from '@/components/organisms/ProfileEditor'
import { CoreConceptsInfo } from '@/components/organisms/CoreConceptsInfo'
import { AccountTabs } from '@/components/molecules/AccountTabs'
import { getUserLinkedAccounts } from '@/lib/linked-accounts'
import { isAdmin } from '@/lib/admin'

async function getCritCoinBalance(playerId: string): Promise<number> {
  const transactions = await prismaMain.critCoinTransaction.findMany({
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

export default async function AccountPage() {
  const session = await auth()

  // Require authentication
  if (!session?.user) {
    redirect('/login')
  }

  // Get user from database
  const user = await prismaMain.critUser.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      username: true,
      email: true,
      avatarUrl: true,
      displayName: true,
      bio: true,
      primaryAccountId: true,
      isAdmin: true,
      coreConceptsPlayerId: true,
    },
  })

  if (!user) {
    redirect('/login')
  }

  // Get Crit-Coin balance for header
  const critCoinBalance = await getCritCoinBalance(user.id)

  // Check if user is admin
  const userIsAdmin = await isAdmin(user)

  // Get all linked accounts
  const linkedAccounts = await getUserLinkedAccounts(user.id)

  // Get Core Concepts player data (if linked)
  // TODO: Query Core Concepts database via API or direct connection
  // For now, show placeholder data
  const coreConceptsPlayerData = user.coreConceptsPlayerId
    ? {
        playerId: user.coreConceptsPlayerId,
        playerEmail: null, // TODO: Fetch from Core Concepts DB
        playerDisplayName: null, // TODO: Fetch from Core Concepts DB
        linkedAccounts: [], // TODO: Fetch from Core Concepts DB
      }
    : {
        playerId: null,
        playerEmail: null,
        playerDisplayName: null,
        linkedAccounts: [],
      }

  // Core Concepts Tab Content
  const coreConceptsContent = (
    <CoreConceptsInfo
      playerId={coreConceptsPlayerData.playerId}
      playerEmail={coreConceptsPlayerData.playerEmail}
      playerDisplayName={coreConceptsPlayerData.playerDisplayName}
      linkedAccounts={coreConceptsPlayerData.linkedAccounts}
    />
  )

  // Profile Tab Content
  const profileContent = (
    <ProfileEditor
      userId={user.id}
      username={user.username}
      email={user.email}
      avatarUrl={user.avatarUrl}
      displayName={user.displayName}
      bio={user.bio}
      linkedAccounts={linkedAccounts}
    />
  )

  // Linked Accounts Tab Content
  const linkedAccountsContent = (
    <LinkedAccountsManager
      accounts={linkedAccounts}
      primaryAccountId={user.primaryAccountId}
    />
  )

  return (
    <>
      <Header critCoinBalance={critCoinBalance} />
      <div className="min-h-screen relative overflow-hidden overflow-x-hidden" data-testid="account-page">
        {/* Background Image */}
        <div className="absolute inset-0 bg-dice-hero bg-cover bg-center bg-no-repeat" />

        {/* Overlay for better readability */}
        <div className="absolute inset-0 bg-black/30" />

        {/* Content */}
        <div className="relative z-10 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            {/* Account Header */}
            <div className="mb-8" data-testid="account-header">
              <div className="bg-crit-purple-600 rounded-t-lg px-4 sm:px-8 py-4 sm:py-6">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-display font-bold text-white break-words" data-testid="account-title">
                  Account Settings
                </h1>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-b-lg px-4 sm:px-8 py-3 sm:py-4">
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300" data-testid="account-welcome">
                  Manage your account settings, linked accounts, and preferences.
                </p>
              </div>
            </div>

            {/* Tabbed Account Settings */}
            <AccountTabs
              profileContent={profileContent}
              linkedAccountsContent={linkedAccountsContent}
              coreConceptsContent={coreConceptsContent}
              isAdmin={userIsAdmin}
            />
          </div>
        </div>
      </div>
    </>
  )
}
