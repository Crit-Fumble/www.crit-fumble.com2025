import { notFound, redirect } from 'next/navigation'
import { Metadata } from 'next'
import DOMPurify from 'isomorphic-dompurify'
import { auth } from '@/lib/auth'
import { getUserRole, canViewWiki, canEditWiki, toWebRole, hasEarlyAccess } from '@/lib/permissions'
import { WikiContent } from './WikiContent'

interface WikiPage {
  id: string
  slug: string
  title: string
  category: string
  content: string
  isPublished: boolean
  updatedAt: string
  author: { name: string | null } | null
  lastEditor: { name: string | null } | null
}

interface PageProps {
  params: Promise<{ slug: string }>
}

const CORE_API_URL = process.env.CORE_API_URL || 'https://core.crit-fumble.com'
const CORE_API_SECRET = process.env.CORE_API_SECRET

/**
 * Fetch a wiki page by slug from the Core API
 */
async function getWikiPage(slug: string): Promise<WikiPage | null> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (CORE_API_SECRET) {
      headers['X-Core-Secret'] = CORE_API_SECRET
    }

    const res = await fetch(`${CORE_API_URL}/wiki/public/${slug}`, {
      headers,
      next: { revalidate: 60 }, // Cache for 60 seconds
    })

    if (!res.ok) {
      if (res.status === 404) return null
      throw new Error(`Failed to fetch wiki page: ${res.status}`)
    }

    return res.json()
  } catch (error) {
    console.error('Error fetching wiki page:', error)
    return null
  }
}

/**
 * Sanitize markdown/HTML content to prevent XSS attacks
 */
function sanitizeContent(content: string): string {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'ul', 'ol', 'li',
      'blockquote', 'pre', 'code',
      'strong', 'em', 'b', 'i', 'u', 's', 'del',
      'a', 'img',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span',
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'id',
      'target', 'rel',
    ],
    ALLOW_DATA_ATTR: false,
  })
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const page = await getWikiPage(slug)

  if (!page) {
    return {
      title: 'Page Not Found | Crit Fumble Wiki',
    }
  }

  return {
    title: `${page.title} | Crit Fumble Wiki`,
    description: page.content.slice(0, 160).replace(/[#*_`]/g, ''),
  }
}

export default async function WikiPage({ params }: PageProps) {
  const { slug } = await params

  // Require authentication
  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/api/auth/signin?callbackUrl=/wiki/${slug}`)
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

  const page = await getWikiPage(slug)

  if (!page) {
    notFound()
  }

  const sanitizedContent = sanitizeContent(page.content)
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
            <a href="/wiki" className="text-gray-400 hover:text-white text-sm">
              Wiki
            </a>
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
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-4">
          <a href="/wiki" className="hover:text-gray-300">Wiki</a>
          <span className="mx-2">/</span>
          <span className="text-gray-300">{page.title}</span>
        </nav>

        {/* Title */}
        <h1 className="text-4xl font-display font-bold text-white mb-2">
          {page.title}
        </h1>

        {/* Metadata */}
        <div className="text-sm text-gray-500 mb-8">
          {page.category && (
            <span className="inline-block bg-slate-800 text-gray-300 px-2 py-1 rounded mr-2">
              {page.category}
            </span>
          )}
          <span>
            Last updated {new Date(page.updatedAt).toLocaleDateString()}
            {page.lastEditor?.name && ` by ${page.lastEditor.name}`}
          </span>
        </div>

        {/* Article content */}
        <WikiContent content={sanitizedContent} />
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
