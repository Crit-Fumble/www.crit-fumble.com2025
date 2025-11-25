import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SignUpForm } from '@/components/organisms/SignUpForm'
import { getUserLinkedAccounts } from '@/lib/linked-accounts'

export default async function SignUpPage() {
  const session = await auth()

  // Require authentication
  if (!session?.user) {
    redirect('/login')
  }

  // Get user from database
  const user = await prisma.critUser.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      username: true,
      email: true,
      avatarUrl: true,
      profileCompleted: true,
    },
  })

  if (!user) {
    redirect('/login')
  }

  // If profile already completed, redirect to dashboard
  if (user.profileCompleted) {
    redirect('/dashboard')
  }

  // Get linked accounts to suggest avatars
  const linkedAccounts = await getUserLinkedAccounts(user.id)

  return (
    <div className="min-h-screen relative overflow-hidden" data-testid="signup-page">
      {/* Background Image */}
      <div className="absolute inset-0 bg-dice-hero bg-cover bg-center bg-no-repeat" />

      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4">
        <div className="max-w-2xl w-full">
          {/* Header */}
          <div className="bg-crit-purple-600 rounded-t-lg px-6 sm:px-8 py-6">
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-white text-center">
              Complete Your Profile
            </h1>
          </div>

          {/* Content */}
          <div className="bg-white dark:bg-slate-900 rounded-b-lg px-6 sm:px-8 py-8">
            <p className="text-gray-700 dark:text-gray-300 text-center mb-6">
              Welcome to Crit-Fumble! Let's set up your profile to get started.
            </p>

            <SignUpForm
              userId={user.id}
              defaultUsername={user.username}
              defaultEmail={user.email || ''}
              defaultAvatarUrl={user.avatarUrl || undefined}
              linkedAccounts={linkedAccounts}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
