import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getUserRole, canEditWiki } from '@/lib/permissions'
import { generateStorybookToken } from '@/lib/storybook-token'
import { AccessDenied } from './AccessDenied'

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
    return <AccessDenied />
  }

  // Generate access token and redirect to storybook
  const token = generateStorybookToken(session.user.id, role)

  // Build redirect URL with token
  const storybookUrl = new URL(targetUrl)
  storybookUrl.searchParams.set('_sb_token', token)

  redirect(storybookUrl.toString())
}
