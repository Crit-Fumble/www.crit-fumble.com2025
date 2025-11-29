'use client'

import { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import DOMPurify from 'isomorphic-dompurify'
import type { UserRole } from '@/lib/permissions'
import {
  DashboardSidebar,
  PageListItem,
  ContentToolbar,
  EditorModeToggle,
  Banner,
  FumbleBotChat,
} from '@crit-fumble/react/web'
import type { EditorMode } from '@crit-fumble/react/web'

// Dynamic import for markdown editor (client-only)
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })
const MDPreview = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default.Markdown),
  { ssr: false }
)

interface WikiPage {
  id: string
  slug: string
  title: string
  category: string
  content: string
  isPublished: boolean
  updatedAt: string
  authorId: string
  author: { name: string | null } | null
  lastEditor: { name: string | null } | null
}

interface WikiDashboardProps {
  user: {
    id: string
    name: string
    image: string | null
  }
  role: UserRole
  canEdit: boolean
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

export function WikiDashboard({ user, role, canEdit }: WikiDashboardProps) {
  const [pages, setPages] = useState<WikiPage[]>([])
  const [selectedPage, setSelectedPage] = useState<WikiPage | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [editorMode, setEditorMode] = useState<EditorMode>('wysiwyg')

  // Owners can delete any page, authors can delete their own pages
  const isOwner = role === 'owner'
  const isAuthor = selectedPage?.authorId === user.id
  const canDeleteSelected = isOwner || isAuthor

  // Sanitize markdown content to prevent XSS
  const sanitizedContent = useMemo(() => {
    return selectedPage?.content ? sanitizeContent(selectedPage.content) : ''
  }, [selectedPage?.content])

  // Fetch pages on mount
  useEffect(() => {
    fetchPages()
  }, [])

  async function fetchPages() {
    try {
      const res = await fetch('/api/core/wiki')
      if (res.ok) {
        const data = await res.json()
        setPages(data.pages)
      }
    } catch (error) {
      console.error('Failed to fetch pages:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!selectedPage || !canEdit) return

    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch(`/api/core/wiki/${selectedPage.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          content: editContent,
        }),
      })

      if (res.ok) {
        const updated = await res.json()
        setPages(pages.map(p => p.id === updated.id ? updated : p))
        setSelectedPage(updated)
        setIsEditing(false)
        setMessage({ type: 'success', text: 'Page saved successfully' })
      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.error || 'Failed to save' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save page' })
    } finally {
      setSaving(false)
    }
  }

  async function handleCreate() {
    if (!canEdit) return

    const slug = prompt('Enter page slug (URL-friendly, e.g., "getting-started"):')
    if (!slug) return

    setSaving(true)
    try {
      const res = await fetch('/api/core/wiki', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          title: slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          category: 'general',
          content: '# New Page\n\nStart writing here...',
        }),
      })

      if (res.ok) {
        const newPage = await res.json()
        setPages([...pages, newPage])
        setSelectedPage(newPage)
        setEditTitle(newPage.title)
        setEditContent(newPage.content)
        setIsEditing(true)
        setMessage({ type: 'success', text: 'Page created' })
      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.error || 'Failed to create page' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create page' })
    } finally {
      setSaving(false)
    }
  }

  function startEditing() {
    if (!selectedPage || !canEdit) return
    setEditTitle(selectedPage.title)
    setEditContent(selectedPage.content)
    setIsEditing(true)
  }

  function cancelEditing() {
    setIsEditing(false)
    setEditTitle('')
    setEditContent('')
  }

  async function handleDelete() {
    if (!selectedPage || !canDeleteSelected) return

    const confirmed = confirm(`Are you sure you want to delete "${selectedPage.title}"? This action cannot be undone.`)
    if (!confirmed) return

    setDeleting(true)
    setMessage(null)

    try {
      const res = await fetch(`/api/core/wiki/${selectedPage.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setPages(pages.filter(p => p.id !== selectedPage.id))
        setSelectedPage(null)
        setIsEditing(false)
        setMessage({ type: 'success', text: 'Page deleted successfully' })
      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.error || 'Failed to delete page' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete page' })
    } finally {
      setDeleting(false)
    }
  }

  // Build metadata string for toolbar
  const metadataStr = selectedPage
    ? `Created by ${selectedPage.author?.name || 'Unknown'}${
        selectedPage.lastEditor?.name && selectedPage.lastEditor.name !== selectedPage.author?.name
          ? ` · Last edited by ${selectedPage.lastEditor.name}`
          : ''
      }`
    : undefined

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <DashboardSidebar
        user={{ name: user.name, image: user.image, role }}
        header={
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-xs font-semibold text-gray-400 uppercase">Pages</span>
            {canEdit && (
              <button
                onClick={handleCreate}
                className="text-xs text-crit-purple-400 hover:text-crit-purple-300"
              >
                + New
              </button>
            )}
          </div>
        }
        footer={
          <a
            href="/api/auth/signout"
            className="block text-sm text-gray-400 hover:text-white"
          >
            Sign out
          </a>
        }
      >
        {loading ? (
          <div className="text-gray-500 text-sm px-2">Loading...</div>
        ) : pages.length === 0 ? (
          <div className="text-gray-500 text-sm px-2">No pages yet</div>
        ) : (
          <ul className="space-y-1">
            {pages.map(page => (
              <li key={page.id}>
                <PageListItem
                  title={page.title}
                  slug={page.slug}
                  selected={selectedPage?.id === page.id}
                  onClick={() => {
                    setSelectedPage(page)
                    setIsEditing(false)
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </DashboardSidebar>

      {/* Main content */}
      <div className="flex-1 flex flex-col bg-slate-950">
        {/* Message banner */}
        {message && (
          <Banner
            variant={message.type === 'success' ? 'success' : 'danger'}
            onDismiss={() => setMessage(null)}
          >
            {message.text}
          </Banner>
        )}

        {selectedPage ? (
          <>
            {/* Toolbar */}
            <ContentToolbar
              title={selectedPage.title}
              subtitle={`/${selectedPage.slug}`}
              metadata={metadataStr}
              isEditing={isEditing}
              editTitle={editTitle}
              onTitleChange={setEditTitle}
              onSave={handleSave}
              onCancel={cancelEditing}
              onEdit={startEditing}
              onDelete={handleDelete}
              canEdit={canEdit}
              canDelete={canDeleteSelected}
              saving={saving}
              deleting={deleting}
            />

            {/* Editor mode toggle (only when editing) */}
            {isEditing && (
              <div className="px-6 py-2 border-b border-slate-800 flex items-center gap-2">
                <span className="text-xs text-gray-400">Editor:</span>
                <EditorModeToggle
                  mode={editorMode}
                  onChange={setEditorMode}
                  modes={['wysiwyg', 'markdown']}
                />
              </div>
            )}

            {/* Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Editor/Preview */}
              <div className="flex-1 overflow-auto p-6" data-color-mode="dark">
                {isEditing ? (
                  editorMode === 'wysiwyg' ? (
                    <MDEditor
                      value={editContent}
                      onChange={(val) => setEditContent(val || '')}
                      height="100%"
                      preview="live"
                      hideToolbar={false}
                      enableScroll={true}
                    />
                  ) : (
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full h-full bg-slate-900 text-gray-100 font-mono text-sm p-4 rounded border border-slate-700 resize-none focus:outline-none focus:border-crit-purple-500"
                      placeholder="Write your markdown here..."
                    />
                  )
                ) : (
                  <div className="prose prose-invert max-w-none">
                    <MDPreview source={sanitizedContent} />
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a page from the sidebar{canEdit && ' or create a new one'}
          </div>
        )}
      </div>

      {/* Floating FumbleBot */}
      <FumbleBotChat user={user} apiEndpoint="/api/fumblebot/chat" />
    </div>
  )
}
