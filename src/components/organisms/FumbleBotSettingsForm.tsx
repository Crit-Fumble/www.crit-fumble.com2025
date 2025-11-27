'use client'

import { useState } from 'react'

interface FumbleBotSettings {
  enabled?: boolean
  systemName?: string
  defaultDiceNotation?: string
  voiceEnabled?: boolean
  voiceDefaultVolume?: number
  customCommands?: Array<{
    name: string
    description: string
    enabled: boolean
  }>
}

interface FumbleBotSettingsFormProps {
  systemId: string
  currentSettings?: FumbleBotSettings
  onSave: (settings: FumbleBotSettings) => Promise<void>
  onCancel: () => void
}

export function FumbleBotSettingsForm({
  systemId,
  currentSettings,
  onSave,
  onCancel,
}: FumbleBotSettingsFormProps) {
  const [enabled, setEnabled] = useState(currentSettings?.enabled ?? true)
  const [systemName, setSystemName] = useState(currentSettings?.systemName || '')
  const [defaultDiceNotation, setDefaultDiceNotation] = useState(
    currentSettings?.defaultDiceNotation || ''
  )
  const [voiceEnabled, setVoiceEnabled] = useState(currentSettings?.voiceEnabled ?? true)
  const [voiceDefaultVolume, setVoiceDefaultVolume] = useState(
    currentSettings?.voiceDefaultVolume ?? 0.5
  )
  const [customCommands, setCustomCommands] = useState<
    Array<{ name: string; description: string; enabled: boolean }>
  >(currentSettings?.customCommands || [])
  const [newCommandName, setNewCommandName] = useState('')
  const [newCommandDescription, setNewCommandDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const handleAddCommand = () => {
    if (!newCommandName.trim() || !newCommandDescription.trim()) return

    setCustomCommands([
      ...customCommands,
      {
        name: newCommandName.trim(),
        description: newCommandDescription.trim(),
        enabled: true,
      },
    ])
    setNewCommandName('')
    setNewCommandDescription('')
  }

  const handleRemoveCommand = (index: number) => {
    setCustomCommands(customCommands.filter((_, i) => i !== index))
  }

  const handleToggleCommand = (index: number) => {
    setCustomCommands(
      customCommands.map((cmd, i) =>
        i === index ? { ...cmd, enabled: !cmd.enabled } : cmd
      )
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      await onSave({
        enabled,
        systemName: systemName.trim() || undefined,
        defaultDiceNotation: defaultDiceNotation.trim() || undefined,
        voiceEnabled,
        voiceDefaultVolume,
        customCommands: customCommands.length > 0 ? customCommands : undefined,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Enable/Disable FumbleBot */}
      <div className="flex items-center gap-3">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
        </label>
        <div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Enable FumbleBot Integration
          </span>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Allow FumbleBot to use this system for Discord interactions
          </p>
        </div>
      </div>

      {enabled && (
        <>
          {/* System Display Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              System Display Name (for Discord)
            </label>
            <input
              type="text"
              value={systemName}
              onChange={(e) => setSystemName(e.target.value)}
              placeholder={`e.g., ${systemId}`}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              How this system appears in Discord command autocomplete. Defaults to systemId if
              not set.
            </p>
          </div>

          {/* Default Dice Notation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Default Dice Notation
            </label>
            <input
              type="text"
              value={defaultDiceNotation}
              onChange={(e) => setDefaultDiceNotation(e.target.value)}
              placeholder="e.g., 1d20"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white font-mono"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Default dice to roll when using /roll without specifying dice (e.g., d20, 2d6+3)
            </p>
          </div>

          {/* Voice Integration */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
              Voice Channel Integration
            </h4>

            <div className="flex items-center gap-3 mb-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={voiceEnabled}
                  onChange={(e) => setVoiceEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
              </label>
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable Voice Features
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Allow FumbleBot to join voice channels and play sound effects
                </p>
              </div>
            </div>

            {voiceEnabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Default Sound Volume
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={voiceDefaultVolume}
                    onChange={(e) => setVoiceDefaultVolume(parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono text-gray-700 dark:text-gray-300 w-12 text-right">
                    {Math.round(voiceDefaultVolume * 100)}%
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Default volume for sound effects played in voice channels
                </p>
              </div>
            )}
          </div>

          {/* FumbleBot Features Notice */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
              Available FumbleBot Features
            </h4>
            <div className="text-xs text-blue-800 dark:text-blue-400 space-y-1">
              <p>• <strong>/roll</strong> - Dice rolling with system-specific modifiers</p>
              <p>• <strong>/ai</strong> - AI-powered game master assistance</p>
              <p>• <strong>/server</strong> - Foundry VTT server management</p>
              <p>• <strong>/session</strong> - Session tracking and management</p>
            </div>
          </div>

          {/* Custom Commands */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              System-Specific Commands
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Define custom slash commands specific to this RPG system. These will be available
              in Discord servers using FumbleBot.
            </p>

            {/* Command List */}
            {customCommands.length > 0 && (
              <div className="space-y-2 mb-4">
                {customCommands.map((command, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-gray-50 dark:bg-slate-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleCommand(index)}
                      className={`w-8 h-8 rounded flex items-center justify-center text-sm ${
                        command.enabled
                          ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      }`}
                      title={command.enabled ? 'Enabled' : 'Disabled'}
                    >
                      {command.enabled ? '✓' : '✕'}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 dark:text-white font-mono">
                        /{command.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {command.description}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveCommand(index)}
                      className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Command Form */}
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-300">
                Add Custom Command
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Command Name
                  </label>
                  <input
                    type="text"
                    value={newCommandName}
                    onChange={(e) => setNewCommandName(e.target.value)}
                    placeholder="e.g., spellcheck"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newCommandDescription}
                    onChange={(e) => setNewCommandDescription(e.target.value)}
                    placeholder="e.g., Look up spell details"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddCommand}
                disabled={!newCommandName.trim() || !newCommandDescription.trim()}
                className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Add Command
              </button>
            </div>
          </div>
        </>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium transition-colors"
        >
          {saving ? 'Saving...' : 'Save FumbleBot Settings'}
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
