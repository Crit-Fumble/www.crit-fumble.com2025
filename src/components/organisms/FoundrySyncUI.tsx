'use client'

import { useState } from 'react'

interface SyncResult {
  count: number
  created: number
  updated: number
  errors: Array<{ error: string }>
}

interface SyncResponse {
  worldId: string
  foundryWorldId: string
  timestamp: string
  imported?: Record<string, SyncResult>
  exported?: Record<string, SyncResult>
}

interface AssetStats {
  total: number
  byType: Record<string, number>
  totalSize: number
  mirrored: number
  notMirrored: number
  highUsage: number
  totalUsage: number
}

interface FoundrySyncUIProps {
  worlds: Array<{
    id: string
    name: string
    description: string | null
  }>
}

export function FoundrySyncUI({ worlds }: FoundrySyncUIProps) {
  const [selectedWorldId, setSelectedWorldId] = useState<string>('')
  const [syncMode, setSyncMode] = useState<'import' | 'export'>('import')
  const [isLoading, setIsLoading] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [assetStats, setAssetStats] = useState<AssetStats | null>(null)
  const [loadingAssetStats, setLoadingAssetStats] = useState(false)

  // Entity selection
  const [selectedEntities, setSelectedEntities] = useState({
    actors: true,
    items: true,
    scenes: true,
    journal: true,
    tables: true,
    macros: true,
    chat: false,
    combats: false,
  })

  const handleEntityToggle = (entity: string) => {
    setSelectedEntities(prev => ({
      ...prev,
      [entity]: !prev[entity as keyof typeof prev]
    }))
  }

  const handleSelectAll = () => {
    setSelectedEntities({
      actors: true,
      items: true,
      scenes: true,
      journal: true,
      tables: true,
      macros: true,
      chat: true,
      combats: true,
    })
  }

  const handleDeselectAll = () => {
    setSelectedEntities({
      actors: false,
      items: false,
      scenes: false,
      journal: false,
      tables: false,
      macros: false,
      chat: false,
      combats: false,
    })
  }

  const handleSync = async () => {
    if (!selectedWorldId) {
      setError('Please select a world')
      return
    }

    setIsLoading(true)
    setError(null)
    setSyncResult(null)

    try {
      // Use our API proxy instead of direct Foundry connection to keep API token server-side
      const endpoint = syncMode === 'import'
        ? '/api/foundry/sync?mode=import'
        : '/api/foundry/sync?mode=export'

      const body = syncMode === 'import'
        ? {
            rpgWorldId: selectedWorldId,
            entities: selectedEntities,
            options: {}
          }
        : {
            rpgWorldId: selectedWorldId,
            entities: {
              creatures: selectedEntities.actors,
              things: selectedEntities.items,
              sheets: selectedEntities.scenes || selectedEntities.journal || selectedEntities.combats,
              tables: selectedEntities.tables,
              rules: selectedEntities.macros,
              events: selectedEntities.chat,
            }
          }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.statusText}`)
      }

      const data = await response.json()
      setSyncResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setIsLoading(false)
    }
  }

  const loadAssetStats = async () => {
    if (!selectedWorldId) return

    setLoadingAssetStats(true)
    try {
      const response = await fetch(`/api/foundry/assets?worldId=${selectedWorldId}&stats=true`)
      if (response.ok) {
        const data = await response.json()
        setAssetStats(data.stats)
      }
    } catch (err) {
      console.error('Failed to load asset stats:', err)
    } finally {
      setLoadingAssetStats(false)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-crit-purple-600 rounded-t-lg px-8 py-4">
        <h2 className="text-2xl font-display font-bold text-white">
          Foundry VTT Sync
        </h2>
        <p className="text-crit-purple-100 mt-1">
          Import worlds from Foundry or export to Foundry instances
        </p>
      </div>

      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-b-lg px-8 py-6 space-y-6">

        {/* Sync Mode Toggle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Sync Direction
          </label>
          <div className="flex gap-4">
            <button
              onClick={() => setSyncMode('import')}
              className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                syncMode === 'import'
                  ? 'border-crit-purple-500 bg-crit-purple-50 dark:bg-crit-purple-900/20 text-crit-purple-700 dark:text-crit-purple-300'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}
            >
              <div className="text-2xl mb-1">⬇️</div>
              <div className="font-semibold">Import from Foundry</div>
              <div className="text-xs opacity-75">Foundry → Crit-Fumble</div>
            </button>
            <button
              onClick={() => setSyncMode('export')}
              className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                syncMode === 'export'
                  ? 'border-crit-purple-500 bg-crit-purple-50 dark:bg-crit-purple-900/20 text-crit-purple-700 dark:text-crit-purple-300'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}
            >
              <div className="text-2xl mb-1">⬆️</div>
              <div className="font-semibold">Export to Foundry</div>
              <div className="text-xs opacity-75">Crit-Fumble → Foundry</div>
            </button>
          </div>
        </div>

        {/* World Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select World
          </label>
          <select
            value={selectedWorldId}
            onChange={(e) => {
              setSelectedWorldId(e.target.value)
              setSyncResult(null)
              setAssetStats(null)
            }}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-crit-purple-500"
          >
            <option value="">-- Select a World --</option>
            {worlds.map(world => (
              <option key={world.id} value={world.id}>
                {world.name} {world.description && `- ${world.description}`}
              </option>
            ))}
          </select>
        </div>

        {/* Entity Selection */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Entities to Sync
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleSelectAll}
                className="text-xs text-crit-purple-600 dark:text-crit-purple-400 hover:underline"
              >
                Select All
              </button>
              <button
                onClick={handleDeselectAll}
                className="text-xs text-gray-600 dark:text-gray-400 hover:underline"
              >
                Deselect All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries({
              actors: {
                label: 'Actors',
                icon: '🧙',
                description: 'NPCs, monsters, and characters',
                mapping: 'RpgCreature',
                table: 'rpg_creatures'
              },
              items: {
                label: 'Items',
                icon: '⚔️',
                description: 'Weapons, armor, and equipment',
                mapping: 'RpgThing',
                table: 'rpg_things'
              },
              scenes: {
                label: 'Scenes',
                icon: '🗺️',
                description: 'Active scenes with tokens, fog of war, lighting',
                mapping: 'RpgSheet',
                table: 'rpg_sheets'
              },
              journal: {
                label: 'Journal',
                icon: '📖',
                description: 'Notes, handouts, and session logs',
                mapping: 'RpgSheet',
                table: 'rpg_sheets'
              },
              tables: {
                label: 'Tables',
                icon: '🎲',
                description: 'Random tables and generators',
                mapping: 'RpgTable',
                table: 'rpg_tables'
              },
              macros: {
                label: 'Macros',
                icon: '⚡',
                description: 'Automation scripts and rules',
                mapping: 'RpgRule',
                table: 'rpg_rules'
              },
              chat: {
                label: 'Chat',
                icon: '💬',
                description: 'Chat messages and logs',
                mapping: 'RpgEvent',
                table: 'rpg_events'
              },
              combats: {
                label: 'Combats',
                icon: '⚔️',
                description: 'Active combat encounters',
                mapping: 'RpgSheet',
                table: 'rpg_sheets'
              },
            }).map(([key, { label, icon, description, mapping, table }]) => (
              <label
                key={key}
                className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedEntities[key as keyof typeof selectedEntities]
                    ? 'border-crit-purple-500 bg-crit-purple-50 dark:bg-crit-purple-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedEntities[key as keyof typeof selectedEntities]}
                  onChange={() => handleEntityToggle(key)}
                  className="rounded border-gray-300 mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{icon}</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{label}</span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {description}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-crit-purple-600 dark:text-crit-purple-400 font-medium">
                      → {mapping}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-500 font-mono">
                      ({table})
                    </span>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Asset Stats */}
        {selectedWorldId && (
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Asset Information
              </h3>
              <button
                onClick={loadAssetStats}
                disabled={loadingAssetStats}
                className="text-xs text-crit-purple-600 dark:text-crit-purple-400 hover:underline disabled:opacity-50"
              >
                {loadingAssetStats ? 'Loading...' : 'Refresh Stats'}
              </button>
            </div>

            {assetStats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-100 dark:bg-slate-800 rounded-lg p-3">
                  <div className="text-lg font-bold text-crit-purple-600 dark:text-crit-purple-400">
                    {assetStats.total}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Total Assets</div>
                </div>
                <div className="bg-gray-100 dark:bg-slate-800 rounded-lg p-3">
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {formatBytes(assetStats.totalSize)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Total Size</div>
                </div>
                <div className="bg-gray-100 dark:bg-slate-800 rounded-lg p-3">
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    {assetStats.highUsage}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Popular Assets</div>
                </div>
                <div className="bg-gray-100 dark:bg-slate-800 rounded-lg p-3">
                  <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                    {assetStats.notMirrored}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Not Mirrored</div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                Click "Refresh Stats" to load asset information
              </div>
            )}
          </div>
        )}

        {/* Sync Button */}
        <div>
          <button
            onClick={handleSync}
            disabled={isLoading || !selectedWorldId}
            className="w-full bg-crit-purple-600 hover:bg-crit-purple-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Syncing...
              </span>
            ) : (
              `${syncMode === 'import' ? 'Import' : 'Export'} World`
            )}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <span className="text-red-600 dark:text-red-400 text-xl">⚠️</span>
              <div>
                <div className="font-semibold text-red-800 dark:text-red-300">Sync Failed</div>
                <div className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Success Display */}
        {syncResult && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-start gap-2 mb-4">
              <span className="text-green-600 dark:text-green-400 text-xl">✅</span>
              <div>
                <div className="font-semibold text-green-800 dark:text-green-300">
                  Sync Completed Successfully
                </div>
                <div className="text-sm text-green-700 dark:text-green-400 mt-1">
                  {syncMode === 'import' ? 'Imported' : 'Exported'} at {new Date(syncResult.timestamp).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Results Table */}
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                      Entity Type
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                      Total
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                      Created
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                      Updated
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                      Errors
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {Object.entries(syncResult.imported || syncResult.exported || {}).map(([entity, result]) => (
                    <tr key={entity}>
                      <td className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {entity}
                      </td>
                      <td className="px-4 py-2 text-sm text-right text-gray-700 dark:text-gray-300">
                        {result.count}
                      </td>
                      <td className="px-4 py-2 text-sm text-right text-green-600 dark:text-green-400">
                        {result.created}
                      </td>
                      <td className="px-4 py-2 text-sm text-right text-blue-600 dark:text-blue-400">
                        {result.updated}
                      </td>
                      <td className="px-4 py-2 text-sm text-right text-red-600 dark:text-red-400">
                        {result.errors?.length || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p><strong>Note:</strong> Foundry VTT must be running with the foundry-core-concepts-api module active.</p>
          <p><strong>Import:</strong> Pulls data from Foundry into Crit-Fumble database</p>
          <p><strong>Export:</strong> Pushes data from Crit-Fumble to Foundry instance</p>
          <p><strong>Assets:</strong> Images and audio are tracked but not copied (Phase 2)</p>
        </div>
      </div>
    </div>
  )
}
