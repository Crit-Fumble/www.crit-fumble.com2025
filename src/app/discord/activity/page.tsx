import { auth } from '@/lib/auth'
import { prismaMain } from '@/lib/db'
import { DiscordActivityClient } from './DiscordActivityClient'

export default async function DiscordActivityPage() {
  const session = await auth()

  // Check if user is authenticated
  let userInfo = null
  if (session?.user?.id) {
    const user = await prismaMain.critUser.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        isOwner: true,
        isAdmin: true,
        avatarUrl: true,
        discordUsername: true,
        discordId: true,
      },
    })

    if (user) {
      userInfo = {
        id: user.id,
        username: user.username,
        email: user.email,
        isOwner: user.isOwner,
        isAdmin: user.isAdmin,
        avatarUrl: user.avatarUrl,
        discordUsername: user.discordUsername,
        discordId: user.discordId,
      }
    }
  }

  return <DiscordActivityClient userInfo={userInfo} />
}
