import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'Crit-Fumble | Discord Activity',
  description: 'Virtual tabletop companion for Discord voice channels',
  // Prevent indexing of the activity page
  robots: {
    index: false,
    follow: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Discord Activities have a specific viewport
  themeColor: '#6d28d9', // crit-purple-600
}

/**
 * Discord Activity Layout
 *
 * This is a minimal layout for the Discord Activity that doesn't include
 * the main site's header, footer, or navigation. It provides a clean
 * "kiosk-like" experience when embedded in Discord.
 */
export default function DiscordActivityLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="discord-activity-container">
      {children}
    </div>
  )
}
