import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { getUserRole, canViewWiki, canEditWiki, toWebRole, hasEarlyAccess } from '@/lib/permissions'

interface WikiPage {
  id: string
  slug: string
  title: string
  category: string
  isPublished: boolean
  updatedAt: string
  author: { name: string | null } | null
}

const CORE_API_URL = process.env.CORE_API_URL || 'https://core.crit-fumble.com'
const CORE_API_SECRET = process.env.CORE_API_SECRET

/**
 * Fetch published wiki pages from the Core API
 */
async function getPublishedPages(): Promise<WikiPage[]> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (CORE_API_SECRET) {
      headers['X-Core-Secret'] = CORE_API_SECRET
    }

    const res = await fetch(`${CORE_API_URL}/wiki/public`, {
      headers,
      next: { revalidate: 60 }, // Cache for 60 seconds
    })

    if (!res.ok) {
      console.error('Failed to fetch wiki pages:', res.status)
      return []
    }

    const data = await res.json()
    return data.pages || []
  } catch (error) {
    console.error('Error fetching wiki pages:', error)
    return []
  }
}

/**
 * Group pages by category
 */
function groupByCategory(pages: WikiPage[]): Record<string, WikiPage[]> {
  return pages.reduce((acc, page) => {
    const category = page.category || 'General'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(page)
    return acc
  }, {} as Record<string, WikiPage[]>)
}

export const metadata: Metadata = {
  title: 'Wiki | Crit Fumble Gaming',
  description: 'Crit Fumble Gaming wiki - guides, lore, and resources for our TTRPG community.',
}

export default async function WikiIndexPage() {
  const session = await auth()

  // Require authentication
  if (!session?.user?.id) {
    redirect('/api/auth/signin?callbackUrl=/wiki')
  }

  // Get user role and check permissions
  const { role, discordId } = await getUserRole(session.user.id)

  // Check early access - redirect to home if not authorized
  const hasAccess = await hasEarlyAccess(discordId)
  if (!hasAccess) {
    redirect('/')
  }

  if (!canViewWiki(role)) {
    redirect('/')
  }

  const pages = await getPublishedPages()
  const groupedPages = groupByCategory(pages)
  const categories = Object.keys(groupedPages).sort()
  const webRole = toWebRole(role)
  const canEdit = canEditWiki(role)

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-crit-purple-400 hover:text-crit-purple-300 font-display font-bold text-xl">
            Crit Fumble
          </a>
          <nav className="flex items-center gap-4">
            <span className="text-white text-sm font-medium">Wiki</span>
            <a href="https://activity.crit-fumble.com" className="text-gray-400 hover:text-white text-sm">
              Activity
            </a>
            {canEdit && (
              <a href="/dashboard" className="text-gray-400 hover:text-white text-sm">
                Dashboard
              </a>
            )}
            <span className="text-xs text-gray-500 bg-slate-800 px-2 py-1 rounded">
              {webRole}
            </span>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-display font-bold text-white mb-2">
          Wiki
        </h1>
        <p className="text-gray-400 mb-8">
          Guides, lore, and resources for Crit Fumble Gaming.
        </p>

        {pages.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">No wiki pages published yet.</p>
            {canEdit && (
              <p className="text-gray-600 mt-2">
                <a href="/dashboard" className="text-crit-purple-400 hover:text-crit-purple-300">
                  Go to Dashboard
                </a>{' '}
                to create content.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {categories.map(category => (
              <section key={category}>
                <h2 className="text-xl font-semibold text-crit-purple-400 mb-4 pb-2 border-b border-slate-800">
                  {category}
                </h2>
                <ul className="grid gap-3">
                  {groupedPages[category].map(page => (
                    <li key={page.id}>
                      <Link
                        href={`/wiki/${page.slug}`}
                        className="block bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-crit-purple-500/50 rounded-lg p-4 transition-colors"
                      >
                        <h3 className="text-lg font-medium text-white mb-1">
                          {page.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Updated {new Date(page.updatedAt).toLocaleDateString()}
                          {page.author?.name && ` · By ${page.author.name}`}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-16">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Crit Fumble Gaming</p>
        </div>
      </footer>
    </div>
  )
}
