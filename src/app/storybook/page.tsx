import { redirect } from 'next/navigation'

/**
 * Legacy storybook redirect - points to the new storybook-auth flow
 *
 * The actual storybook is served through storybook.crit-fumble.com
 * which uses token-based auth to avoid cross-domain cookie issues.
 */
export default function StorybookPage() {
  redirect('/storybook-auth')
}
