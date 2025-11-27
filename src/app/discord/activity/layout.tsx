import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Crit-Fumble Gaming - Discord Activity',
  description: 'Play tabletop RPGs in Discord voice channels',
}

export default function DiscordActivityLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
