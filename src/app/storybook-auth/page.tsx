import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { getUserRole, canEditWiki } from '@/lib/permissions'
import { generateStorybookToken } from '@/lib/storybook-token'
import { CenteredLayout, EmptyState, Button } from '@crit-fumble/react'

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
  const { role } = await getUserRole(session.user.id)

  if (!canEditWiki(role)) {
    return (
      <CenteredLayout>
        <EmptyState
          icon="lock"
          title="Access Denied"
          description="You need admin or owner permissions to access the component library."
        />
        <div className="mt-6 text-center">
          <Link href="/dashboard">
            <Button variant="secondary">Back to Dashboard</Button>
          </Link>
        </div>
      </CenteredLayout>
    )
  }

  // Generate access token and redirect to storybook
  const token = generateStorybookToken(session.user.id, role)

  // Build redirect URL with token
  const storybookUrl = new URL(targetUrl)
  storybookUrl.searchParams.set('_sb_token', token)

  redirect(storybookUrl.toString())
}
