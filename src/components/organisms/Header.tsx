import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { syncAdminStatus, isOwner } from '@/lib/admin'
import { HeaderClient } from './HeaderClient'

interface HeaderProps {
  critCoinBalance?: number
}

export async function Header({ critCoinBalance }: HeaderProps = {}) {
  const session = await auth()

  // Check if user is admin/owner and get user details
  let userIsAdmin = false
  let userIsOwner = false
  let userData = null
  let viewAsRole = null
  if (session?.user) {
    // Sync admin status (one-way: grant admin if env vars match, but never revoke)
    userIsAdmin = await syncAdminStatus(session.user.id!)

    // Fetch user data for display
    const user = await prisma.critUser.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        discordId: true,
        verifiedDiscord: true,
        discordAvatar: true,
        githubAvatar: true,
        isAdmin: true,
        tier: true,
        viewAsRole: true,
      },
    })
    userData = user
    viewAsRole = user?.viewAsRole

    // Check if user is owner
    if (user) {
      userIsOwner = isOwner(user)
    }
  }

  return (
    <HeaderClient
      session={session}
      critCoinBalance={critCoinBalance}
      isAdmin={userIsAdmin}
      isOwner={userIsOwner}
      userData={userData}
      viewAsRole={viewAsRole as any}
    />
  )
}
