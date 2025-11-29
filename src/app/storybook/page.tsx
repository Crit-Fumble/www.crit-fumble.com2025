import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getUserRole, canEditWiki } from '@/lib/permissions'

export default async function StorybookPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/api/auth/signin?callbackUrl=/storybook')
  }

  const { role } = await getUserRole(session.user.id)

  // Only admins and owners can access storybook
  if (!canEditWiki(role)) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400">
            You need admin or owner permissions to view the component library.
          </p>
          <a
            href="/dashboard"
            className="inline-block mt-6 px-4 py-2 bg-crit-purple-600 text-white rounded hover:bg-crit-purple-500"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    )
  }

  // Redirect to GitHub Pages storybook for authorized users
  redirect('https://crit-fumble.github.io/storybook/')
}
