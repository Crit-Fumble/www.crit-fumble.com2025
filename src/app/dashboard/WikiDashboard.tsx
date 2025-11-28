'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import type { UserRole } from '@/lib/permissions'

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
  const [editorMode, setEditorMode] = useState<'wysiwyg' | 'markdown'>('wysiwyg')

  // Owners can delete any page, authors can delete their own pages
  const isOwner = role === 'owner'
  const isAuthor = selectedPage?.authorId === user.id
  const canDeleteSelected = isOwner || isAuthor

  // Fetch pages on mount
  useEffect(() => {
    fetchPages()
  }, [])

  async function fetchPages() {
    try {
      const res = await fetch('/api/wiki')
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
      const res = await fetch(`/api/wiki/${selectedPage.id}`, {
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
      const res = await fetch('/api/wiki', {
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
      const res = await fetch(`/api/wiki/${selectedPage.id}`, {
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

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        {/* User info */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            {user.image && (
              <img src={user.image} alt="" className="w-8 h-8 rounded-full" />
            )}
            <div>
              <div className="text-sm font-medium text-white">{user.name}</div>
              <div className="text-xs text-gray-400 capitalize">{role}</div>
            </div>
          </div>
        </div>

        {/* Page list */}
        <div className="flex-1 overflow-auto p-2">
          <div className="flex items-center justify-between px-2 py-1 mb-2">
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

          {loading ? (
            <div className="text-gray-500 text-sm px-2">Loading...</div>
          ) : pages.length === 0 ? (
            <div className="text-gray-500 text-sm px-2">No pages yet</div>
          ) : (
            <ul className="space-y-1">
              {pages.map(page => (
                <li key={page.id}>
                  <button
                    onClick={() => {
                      setSelectedPage(page)
                      setIsEditing(false)
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded text-sm ${
                      selectedPage?.id === page.id
                        ? 'bg-crit-purple-600 text-white'
                        : 'text-gray-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="truncate">{page.title}</div>
                    <div className="text-xs text-gray-500">/{page.slug}</div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Sign out */}
        <div className="p-4 border-t border-slate-800">
          <a
            href="/api/auth/signout"
            className="block text-sm text-gray-400 hover:text-white"
          >
            Sign out
          </a>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col bg-slate-950">
        {/* Message banner */}
        {message && (
          <div
            className={`px-4 py-2 text-sm ${
              message.type === 'success' ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
            }`}
          >
            {message.text}
            <button
              onClick={() => setMessage(null)}
              className="float-right text-current opacity-70 hover:opacity-100"
            >
              x
            </button>
          </div>
        )}

        {selectedPage ? (
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800">
              <div>
                <h1 className="text-lg font-semibold text-white">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white"
                    />
                  ) : (
                    selectedPage.title
                  )}
                </h1>
                <div className="text-sm text-gray-500">/{selectedPage.slug}</div>
              </div>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={cancelEditing}
                      className="px-3 py-1.5 text-sm text-gray-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-3 py-1.5 text-sm bg-crit-purple-600 text-white rounded hover:bg-crit-purple-500 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </>
                ) : (
                  <>
                    {canEdit && (
                      <button
                        onClick={startEditing}
                        className="px-3 py-1.5 text-sm bg-slate-800 text-white rounded hover:bg-slate-700"
                      >
                        Edit
                      </button>
                    )}
                    {canDeleteSelected && (
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="px-3 py-1.5 text-sm bg-red-700 text-white rounded hover:bg-red-600 disabled:opacity-50"
                      >
                        {deleting ? 'Deleting...' : 'Delete'}
                      </button>
                    )}
                    {!canEdit && !canDeleteSelected && (
                      <span className="text-sm text-gray-500">Read-only</span>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Editor mode toggle (only when editing) */}
            {isEditing && (
              <div className="px-6 py-2 border-b border-slate-800 flex items-center gap-2">
                <span className="text-xs text-gray-400">Editor:</span>
                <button
                  onClick={() => setEditorMode('wysiwyg')}
                  className={`px-2 py-1 text-xs rounded ${
                    editorMode === 'wysiwyg'
                      ? 'bg-crit-purple-600 text-white'
                      : 'bg-slate-800 text-gray-400 hover:text-white'
                  }`}
                >
                  WYSIWYG
                </button>
                <button
                  onClick={() => setEditorMode('markdown')}
                  className={`px-2 py-1 text-xs rounded ${
                    editorMode === 'markdown'
                      ? 'bg-crit-purple-600 text-white'
                      : 'bg-slate-800 text-gray-400 hover:text-white'
                  }`}
                >
                  Markdown
                </button>
              </div>
            )}

            {/* Content */}
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
                  <MDPreview source={selectedPage.content} />
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a page from the sidebar{canEdit && ' or create a new one'}
          </div>
        )}
      </div>
    </div>
  )
}
