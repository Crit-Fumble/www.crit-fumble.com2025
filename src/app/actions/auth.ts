'use server'

import { signOut } from '@/lib/auth'

/**
 * Server action to handle user sign out
 * Redirects to login page after successful sign out
 */
export async function handleSignOut() {
  await signOut({ redirectTo: '/login' })
}
