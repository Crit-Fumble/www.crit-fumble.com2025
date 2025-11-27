import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Header } from '@/components/organisms/Header'
import { prismaMain } from '@/lib/db'
import { LinkedAccountsContent } from '@/components/organisms/LinkedAccountsContent'

export default async function LinkedAccountsPage() {
  const session = await auth()

  // Require authentication
  if (!session?.user) {
    redirect('/login')
  }

  // Fetch user's linked account information
  const user = await prismaMain.critUser.findUnique({
    where: { id: session.user.id },
    select: {
      discordId: true,
      discordUsername: true,
      githubId: true,
      githubUsername: true,
      worldAnvilId: true,
      worldAnvilUsername: true,
    },
  })

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900" data-testid="linked-accounts-page">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8" data-testid="page-header">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="page-title">
              Linked Accounts
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400" data-testid="page-description">
              Connect your external accounts to enhance your Crit-Fumble experience
            </p>
          </div>

          <LinkedAccountsContent
            discordLinked={!!user?.discordId}
            discordUsername={user?.discordUsername}
            githubLinked={!!user?.githubId}
            githubUsername={user?.githubUsername}
            worldAnvilLinked={!!user?.worldAnvilId}
            worldAnvilUsername={user?.worldAnvilUsername}
          />
        </div>
      </div>
    </>
  )
}
