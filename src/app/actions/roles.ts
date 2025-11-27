'use server'

import { auth } from '@/lib/auth'
import { prismaMain } from '@/lib/db';
import { prisma } from '@/lib/db'
import { isOwner } from '@/lib/admin'
import type { UserRole } from '@/lib/permissions'
import { revalidatePath } from 'next/cache'
/**
 * Set the viewAsRole for the current user (owners only)
 */
export async function setViewAsRole(role: UserRole | null) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Not authenticated')
  }
  // Get user from database
  const user = await prismaMain.critUser.findUnique({
    where: { id: session.user.id },
  })
  if (!user || !isOwner(user)) {
    throw new Error('Only owners can use View As feature')
  }

  // Update viewAsRole
  await prismaMain.critUser.update({
    where: { id: session.user.id },
    data: { viewAsRole: role },
  })

  // Revalidate all pages to reflect the change
  revalidatePath('/', 'layout')
}

/**
 * Clear the viewAsRole (return to normal view)
 */
export async function clearViewAsRole() {
  await setViewAsRole(null)
