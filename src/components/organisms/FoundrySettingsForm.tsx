'use client'

import { useState } from 'react'

interface FoundryModule {
  name: string
  manifestUrl: string
}

interface FoundrySettings {
  manifestUrl?: string
  modules?: FoundryModule[]
}

interface FoundrySettingsFormProps {
  systemId: string
  currentSettings?: FoundrySettings
  onSave: (settings: FoundrySettings) => Promise<void>
  onCancel: () => void
}

export function FoundrySettingsForm({
  systemId,
  currentSettings,
  onSave,
  onCancel,
}: FoundrySettingsFormProps) {
  const [manifestUrl, setManifestUrl] = useState(currentSettings?.manifestUrl || '')
  const [modules, setModules] = useState<FoundryModule[]>(currentSettings?.modules || [])
  const [newModuleName, setNewModuleName] = useState('')
  const [newModuleUrl, setNewModuleUrl] = useState('')
  const [saving, setSaving] = useState(false)

  const handleAddModule = () => {
    if (!newModuleName.trim() || !newModuleUrl.trim()) return

    setModules([...modules, { name: newModuleName.trim(), manifestUrl: newModuleUrl.trim() }])
    setNewModuleName('')
    setNewModuleUrl('')
  }

  const handleRemoveModule = (index: number) => {
    setModules(modules.filter((_, i) => i !== index))
  }

  const handleMoveModule = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === modules.length - 1)
    ) {
      return
    }

    const newModules = [...modules]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const temp = newModules[targetIndex]
    newModules[targetIndex] = newModules[index]
    newModules[index] = temp
    setModules(newModules)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      await onSave({
        manifestUrl: manifestUrl.trim() || undefined,
        modules: modules.length > 0 ? modules : undefined,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* System Manifest URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Foundry VTT System Manifest URL
        </label>
        <input
          type="url"
          value={manifestUrl}
          onChange={(e) => setManifestUrl(e.target.value)}
          placeholder="https://github.com/foundryvtt/dnd5e/releases/latest/download/system.json"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Optional: URL to the system.json manifest file. If provided, system metadata will be fetched
          from this URL.
        </p>
      </div>

      {/* Auto-included Module Notice */}
      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-2">
          Auto-Included Module
        </h4>
        <p className="text-xs text-purple-800 dark:text-purple-400 mb-3">
          The Core Concepts module is automatically included for all game systems:
        </p>
        <div className="flex items-start gap-3 bg-white/50 dark:bg-slate-800/50 rounded-lg p-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-purple-700 dark:text-purple-300">crit-fumble-core-concepts</span>
              <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs rounded">
                Open Source
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              System-agnostic TTRPG framework with optional API integration.
              Attribute mappings are fetched from your configured API on load.
            </p>
          </div>
        </div>
        <p className="text-xs text-purple-600 dark:text-purple-400 mt-3">
          <a
            href="https://github.com/Crit-Fumble/foundry-core-concepts"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            MIT + CC BY 4.0 License
          </a>
        </p>
      </div>

      {/* Additional Modules */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Additional Foundry VTT Modules (Load Order)
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          These modules will be loaded after the Core Concepts module when spinning up a
          Foundry VTT instance for this system.
        </p>

        {/* Module List */}
        {modules.length > 0 && (
          <div className="space-y-2 mb-4">
            {modules.map((module, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-gray-50 dark:bg-slate-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => handleMoveModule(index, 'up')}
                    disabled={index === 0}
                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move up"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveModule(index, 'down')}
                    disabled={index === modules.length - 1}
                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move down"
                  >
                    ▼
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900 dark:text-white">
                    {index + 1}. {module.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {module.manifestUrl}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveModule(index)}
                  className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add Module Form */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300">
            Add Module
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Module Name
              </label>
              <input
                type="text"
                value={newModuleName}
                onChange={(e) => setNewModuleName(e.target.value)}
                placeholder="e.g., dice-so-nice"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Manifest URL
              </label>
              <input
                type="url"
                value={newModuleUrl}
                onChange={(e) => setNewModuleUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleAddModule}
            disabled={!newModuleName.trim() || !newModuleUrl.trim()}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Add Module
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium transition-colors"
        >
          {saving ? 'Saving...' : 'Save Foundry Settings'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
