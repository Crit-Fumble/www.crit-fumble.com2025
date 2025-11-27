'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FoundrySettingsForm } from './FoundrySettingsForm'

interface RpgSystem {
  id: string
  systemId: string
  name: string
  title: string
  description: string | null
  version: string | null
  author: string | null
  publisher: string | null
  license: string | null
  platforms: any
  isEnabled: boolean
  isCore: boolean
  priority: number
  notes: string | null
  createdAt: string
  updatedAt: string
}

interface RpgSystemsManagementProps {
  initialSystems: RpgSystem[]
}

export function RpgSystemsManagement({ initialSystems }: RpgSystemsManagementProps) {
  const router = useRouter()
  const [systems, setSystems] = useState<RpgSystem[]>(initialSystems)
  const [showAddForm, setShowAddForm] = useState(false)
  const [systemId, setSystemId] = useState('')
  const [systemName, setSystemName] = useState('')
  const [systemTitle, setSystemTitle] = useState('')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedSystem, setExpandedSystem] = useState<string | null>(null)
  const [editingFoundrySettings, setEditingFoundrySettings] = useState<string | null>(null)

  const handleAddSystem = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/rpg-systems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemId: systemId.trim(),
          name: systemName.trim(),
          title: systemTitle.trim(),
          description: description.trim() || null,
          notes: notes.trim() || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add system')
      }

      const { system } = await response.json()
      setSystems((prev) => [system, ...prev])
      setSystemId('')
      setSystemName('')
      setSystemTitle('')
      setDescription('')
      setNotes('')
      setShowAddForm(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add system')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleEnabled = async (systemId: string, currentState: boolean) => {
    try {
      const response = await fetch(`/api/admin/rpg-systems/${systemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: !currentState }),
      })

      if (!response.ok) throw new Error('Failed to update system')

      const { system } = await response.json()
      setSystems((prev) =>
        prev.map((s) => (s.systemId === systemId ? system : s))
      )
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update system')
    }
  }

  const handleSaveFoundrySettings = async (systemId: string, foundrySettings: any) => {
    try {
      const response = await fetch(`/api/admin/rpg-systems/${systemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foundrySettings }),
      })

      if (!response.ok) throw new Error('Failed to update Foundry settings')

      const { system } = await response.json()
      setSystems((prev) =>
        prev.map((s) => (s.systemId === systemId ? system : s))
      )
      setEditingFoundrySettings(null)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update Foundry settings')
      throw err
    }
  }

  const handleDeleteSystem = async (systemId: string) => {
    if (!confirm('Are you sure you want to delete this system?')) return

    try {
      const response = await fetch(`/api/admin/rpg-systems/${systemId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete system')

      setSystems((prev) => prev.filter((s) => s.systemId !== systemId))
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete system')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            RPG Game Systems
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage available RPG systems (D&D 5e, Cypher, Pathfinder, etc.)
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors"
        >
          {showAddForm ? 'Cancel' : '+ Add System'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Add System Form */}
      {showAddForm && (
        <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Add New RPG System
          </h3>
          <form onSubmit={handleAddSystem} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  System ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={systemId}
                  onChange={(e) => setSystemId(e.target.value)}
                  placeholder="dnd5e"
                  required
                  pattern="[a-z0-9-]+"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white font-mono"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Unique identifier (lowercase, numbers, hyphens only)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={systemName}
                  onChange={(e) => setSystemName(e.target.value)}
                  placeholder="D&D 5e"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Short display name
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={systemTitle}
                onChange={(e) => setSystemTitle(e.target.value)}
                placeholder="Dungeons & Dragons Fifth Edition"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                placeholder="Brief description of the RPG system..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                placeholder="Internal notes about this system..."
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium transition-colors"
              >
                {loading ? 'Adding...' : 'Add System'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Systems List */}
      <div className="space-y-4">
        {systems.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">No RPG systems configured yet</p>
          </div>
        ) : (
          systems.map((system) => {
            const foundryData = system.platforms?.foundry
            const isEditingFoundry = editingFoundrySettings === system.systemId
            return (
              <div
                key={system.id}
                className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* System Header */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {system.title}
                        </h3>
                        {!system.isEnabled && (
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-semibold rounded">
                            Disabled
                          </span>
                        )}
                        {foundryData && (
                          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-semibold rounded">
                            Foundry
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-mono">{system.systemId}</span>
                        {system.version && <span>v{system.version}</span>}
                        {system.author && <span>by {system.author}</span>}
                      </div>
                      {system.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                          {system.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setExpandedSystem(expandedSystem === system.id ? null : system.id)
                        }
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {expandedSystem === system.id ? '▼' : '▶'}
                      </button>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleToggleEnabled(system.systemId, system.isEnabled)}
                      className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                        system.isEnabled
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {system.isEnabled ? 'Enabled' : 'Disabled'}
                    </button>

                    <button
                      onClick={() => setEditingFoundrySettings(system.systemId)}
                      className="px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 font-medium transition-colors"
                    >
                      {foundryData ? 'Edit Foundry' : 'Configure Foundry'}
                    </button>

                    <button
                      onClick={() => handleDeleteSystem(system.systemId)}
                      className="px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Foundry Settings Editor */}
                {isEditingFoundry && (
                  <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-slate-900">
                    <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
                      Foundry VTT Settings
                    </h4>
                    <FoundrySettingsForm
                      systemId={system.systemId}
                      currentSettings={foundryData}
                      onSave={(settings) => handleSaveFoundrySettings(system.systemId, settings)}
                      onCancel={() => setEditingFoundrySettings(null)}
                    />
                  </div>
                )}

                {/* Expanded Details */}
                {expandedSystem === system.id && !isEditingFoundry && (
                  <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-slate-900 space-y-3">
                    {foundryData?.manifestUrl && (
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Foundry Manifest:
                        </span>
                        <a
                          href={foundryData.manifestUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline ml-2"
                        >
                          {foundryData.manifestUrl}
                        </a>
                      </div>
                    )}

                    {foundryData?.modules && foundryData.modules.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Foundry Modules ({foundryData.modules.length}):
                        </span>
                        <ul className="mt-2 space-y-1">
                          {foundryData.modules.map((module: any, index: number) => (
                            <li
                              key={index}
                              className="text-sm text-gray-600 dark:text-gray-400 ml-4"
                            >
                              {index + 1}. <span className="font-medium">{module.name}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-500 ml-2">
                                ({module.manifestUrl})
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {system.license && (
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          License:
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                          {system.license}
                        </span>
                      </div>
                    )}

                    {system.notes && (
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Notes:
                        </span>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {system.notes}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <div>
                        Added: {new Date(system.createdAt).toLocaleDateString()}
                      </div>
                      <div>
                        Updated: {new Date(system.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Quick Reference */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
          Example System IDs
        </h3>
        <div className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
          <p>
            <strong>D&D 5e:</strong> <code className="bg-blue-100 dark:bg-blue-900 px-2 py-0.5 rounded">dnd5e</code>
          </p>
          <p>
            <strong>Cypher System:</strong> <code className="bg-blue-100 dark:bg-blue-900 px-2 py-0.5 rounded">cyphersystem</code>
          </p>
          <p>
            <strong>Pathfinder 2e:</strong> <code className="bg-blue-100 dark:bg-blue-900 px-2 py-0.5 rounded">pf2e</code>
          </p>
        </div>
      </div>
    </div>
  )
}
