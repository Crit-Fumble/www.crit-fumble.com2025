/**
 * Database User Cleanup Script
 *
 * Removes duplicate or test users from the database
 * Run with: npx tsx scripts/db/cleanup-users.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Starting user cleanup...\n')

  try {
    // Get all users
    const allUsers = await prisma.critUser.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        discordId: true,
        githubId: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    console.log(`📊 Found ${allUsers.length} total users:\n`)

    // Display all users
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username}`)
      console.log(`   Email: ${user.email || 'N/A'}`)
      console.log(`   Discord ID: ${user.discordId || 'N/A'}`)
      console.log(`   GitHub ID: ${user.githubId || 'N/A'}`)
      console.log(`   Created: ${user.createdAt.toISOString()}`)
      console.log(`   Last Login: ${user.lastLoginAt?.toISOString() || 'Never'}`)
      console.log(`   ID: ${user.id}`)
      console.log('')
    })

    // Find users with duplicate usernames
    const usernameCounts = allUsers.reduce((acc, user) => {
      acc[user.username] = (acc[user.username] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const duplicateUsernames = Object.entries(usernameCounts)
      .filter(([, count]) => count > 1)
      .map(([username]) => username)

    if (duplicateUsernames.length > 0) {
      console.log(`⚠️  Found duplicate usernames: ${duplicateUsernames.join(', ')}\n`)

      for (const username of duplicateUsernames) {
        const duplicates = allUsers.filter(u => u.username === username)
        console.log(`Duplicate username "${username}":`)
        duplicates.forEach((user, index) => {
          console.log(`  ${index + 1}. ID: ${user.id}, Created: ${user.createdAt.toISOString()}`)
        })
        console.log('')
      }
    }

    // Delete ALL users
    console.log('\n🗑️  Deleting ALL users...\n')

    const usersToDelete = allUsers

    if (usersToDelete.length === 0) {
      console.log('✅ No users found to delete.')
    } else {
      console.log(`Found ${usersToDelete.length} users to delete:`)
      usersToDelete.forEach(user => {
        console.log(`  - ${user.username} (${user.id})`)
      })
      console.log('')

      // Delete sessions first (foreign key constraint)
      for (const user of usersToDelete) {
        console.log(`🗑️  Deleting sessions for ${user.username}...`)
        await prisma.session.deleteMany({
          where: { userId: user.id },
        })

        console.log(`🗑️  Deleting accounts for ${user.username}...`)
        await prisma.account.deleteMany({
          where: { userId: user.id },
        })

        console.log(`🗑️  Deleting session logs for ${user.username}...`)
        await prisma.critSessionLog.deleteMany({
          where: { playerId: user.id },
        })

        console.log(`🗑️  Deleting user ${user.username}...`)
        await prisma.critUser.delete({
          where: { id: user.id },
        })

        console.log(`✅ Deleted ${user.username}\n`)
      }
    }

    // Final count
    const remainingUsers = await prisma.critUser.count()
    console.log(`\n✨ Cleanup complete! ${remainingUsers} users remaining.`)

    // Show remaining users
    const remaining = await prisma.critUser.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    console.log('\n📋 Remaining users:')
    remaining.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} (${user.email || 'no email'})`)
    })

  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
