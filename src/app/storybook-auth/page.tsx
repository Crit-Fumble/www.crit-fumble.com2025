import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { getUserRole, canEditWiki } from '@/lib/permissions'
import { generateStorybookToken } from '@/lib/storybook-token'

/**
 * Storybook Authentication Page
 *
 * This page handles the authentication flow for storybook access:
 * 1. If not authenticated, redirect to Discord OAuth
 * 2. If authenticated but not authorized, show access denied
 * 3. If authorized, generate token and redirect to storybook
 */
export default async function StorybookAuthPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>
}) {
  const session = await auth()
  const params = await searchParams

  // Target URL after auth (default to storybook root)
  const targetUrl = params.redirect || 'https://storybook.crit-fumble.com/'

  // If not authenticated, redirect to signin
  if (!session?.user?.id) {
    const callbackUrl = encodeURIComponent(
      `https://www.crit-fumble.com/storybook-auth?redirect=${encodeURIComponent(targetUrl)}`
    )
    redirect(`/api/auth/signin?callbackUrl=${callbackUrl}`)
  }

  // Check authorization (admin or owner only)
  const { role, discordId } = await getUserRole(session.user.id)

  // Debug logging for auth issues
  console.log('[storybook-auth] Session user:', {
    id: session.user.id,
    discordId,
    role,
    sessionUser: JSON.stringify(session.user),
  })

  if (!canEditWiki(role)) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="text-6xl">🔒</div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
            <p className="text-gray-400">
              You need admin or owner permissions to access the component library.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  // Generate access token and redirect to storybook
  const token = generateStorybookToken(session.user.id, role)

  // Build redirect URL with token
  const storybookUrl = new URL(targetUrl)
  storybookUrl.searchParams.set('_sb_token', token)

  redirect(storybookUrl.toString())
}
