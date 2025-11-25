/**
 * Sync Admin Status Script
 *
 * Manually sync admin status for users based on environment variables.
 * This is a one-way operation - sets isAdmin=true if env vars match,
 * but never sets it to false.
 *
 * Usage: npx tsx scripts/sync-admin-status.ts [userId]
 *
 * If no userId is provided, syncs all users with matching credentials.
 */

import { prisma } from '../src/lib/db'
import { syncAdminStatus, checkAdminStatus } from '../src/lib/admin'

async function syncAllAdmins() {
  console.log('🔍 Checking all users for admin credentials...\n')

  const users = await prisma.critUser.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      verifiedPhone: true,
      verifiedEmail: true,
      verifiedDiscord: true,
      discordId: true,
      isAdmin: true,
    },
  })

  let synced = 0
  let alreadyAdmin = 0
  let notAdmin = 0

  for (const user of users) {
    const shouldBeAdmin = checkAdminStatus(user)

    if (shouldBeAdmin && !user.isAdmin) {
      // Grant admin
      await prisma.critUser.update({
        where: { id: user.id },
        data: { isAdmin: true },
      })
      console.log(`✅ Granted admin to: ${user.username} (${user.email})`)
      synced++
    } else if (user.isAdmin) {
      console.log(`ℹ️  Already admin: ${user.username} (${user.email})`)
      alreadyAdmin++
    } else {
      notAdmin++
    }
  }

  console.log(`\n📊 Summary:`)
  console.log(`   - ${synced} user(s) granted admin`)
  console.log(`   - ${alreadyAdmin} user(s) already admin`)
  console.log(`   - ${notAdmin} user(s) without admin credentials`)
}

async function syncSingleUser(userId: string) {
  console.log(`🔍 Syncing admin status for user: ${userId}\n`)

  const wasAdmin = await syncAdminStatus(userId)

  const user = await prisma.critUser.findUnique({
    where: { id: userId },
    select: {
      username: true,
      email: true,
      isAdmin: true,
    },
  })

  if (!user) {
    console.log(`❌ User not found: ${userId}`)
    return
  }

  if (wasAdmin && user.isAdmin) {
    console.log(`✅ ${user.username} is now an admin`)
  } else if (user.isAdmin) {
    console.log(`ℹ️  ${user.username} was already an admin`)
  } else {
    console.log(`❌ ${user.username} does not match admin credentials`)
  }
}

async function main() {
  const userId = process.argv[2]

  try {
    if (userId) {
      await syncSingleUser(userId)
    } else {
      await syncAllAdmins()
    }
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
