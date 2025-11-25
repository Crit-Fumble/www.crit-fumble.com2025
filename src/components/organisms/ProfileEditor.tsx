'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  type LinkedAccount,
  getAccountAvatarUrl,
  getProviderDisplayName,
} from '@/lib/linked-accounts'

interface ProfileEditorProps {
  userId: string
  username: string
  email: string | null
  avatarUrl: string | null
  displayName: string | null
  bio: string | null
  linkedAccounts: LinkedAccount[]
}

export function ProfileEditor({
  userId,
  username,
  email,
  avatarUrl,
  displayName,
  bio,
  linkedAccounts,
}: ProfileEditorProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [editDisplayName, setEditDisplayName] = useState(displayName || '')
  const [editBio, setEditBio] = useState(bio || '')
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(avatarUrl)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Get suggested avatars from linked accounts
  const suggestedAvatars = linkedAccounts
    .map((account) => {
      const avatarUrl = getAccountAvatarUrl(account)
      if (!avatarUrl) return null
      return {
        url: avatarUrl,
        provider: account.provider,
        label: `${getProviderDisplayName(account.provider)} Avatar`,
      }
    })
    .filter(Boolean) as Array<{ url: string; provider: string; label: string }>

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: editDisplayName || null,
          bio: editBio || null,
          avatarUrl: selectedAvatar,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile')
      }

      setSuccess(true)
      setIsEditing(false)
      router.refresh()

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setEditDisplayName(displayName || '')
    setEditBio(bio || '')
    setSelectedAvatar(avatarUrl)
    setIsEditing(false)
    setError(null)
  }

  const displayAvatar = selectedAvatar || suggestedAvatars[0]?.url

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Profile Information
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Update your display name, bio, and avatar
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 text-sm font-medium text-crit-purple-600 dark:text-crit-purple-400 hover:text-crit-purple-700 dark:hover:text-crit-purple-300 transition-colors"
          >
            Edit Profile
          </button>
        )}
      </div>

      {success && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-sm text-green-800 dark:text-green-200">
            Profile updated successfully!
          </p>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Avatar
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* No avatar option */}
              <button
                type="button"
                onClick={() => setSelectedAvatar(null)}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  selectedAvatar === null
                    ? 'border-crit-purple-500 bg-crit-purple-50 dark:bg-crit-purple-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400 text-center">
                  None
                </span>
              </button>

              {/* Provider avatars */}
              {suggestedAvatars.map((avatar, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedAvatar(avatar.url)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    selectedAvatar === avatar.url
                      ? 'border-crit-purple-500 bg-crit-purple-50 dark:bg-crit-purple-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <img
                    src={avatar.url}
                    alt={avatar.label}
                    className="w-12 h-12 rounded-full"
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-400 text-center">
                    {getProviderDisplayName(avatar.provider)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label
              htmlFor="displayName-edit"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Display Name
            </label>
            <input
              type="text"
              id="displayName-edit"
              value={editDisplayName}
              onChange={(e) => setEditDisplayName(e.target.value)}
              maxLength={50}
              placeholder={username}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-crit-purple-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Your display name is shown to others. Leave empty to use your username.
            </p>
          </div>

          {/* Bio */}
          <div>
            <label
              htmlFor="bio-edit"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Bio
            </label>
            <textarea
              id="bio-edit"
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              maxLength={200}
              rows={4}
              placeholder="Tell us a bit about yourself..."
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-crit-purple-500 focus:border-transparent resize-none"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {editBio.length}/200 characters
            </p>
          </div>

          {/* Read-only Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Username (read-only)
            </label>
            <div className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400">
              {username}
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Username cannot be changed at this time.
            </p>
          </div>

          {/* Read-only Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email (read-only)
            </label>
            <div className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400">
              {email || <span className="italic">Not set</span>}
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Email editing will be available once email verification is implemented.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2 px-4 bg-crit-purple-600 hover:bg-crit-purple-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          {/* Current Avatar */}
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 w-32">
              Avatar:
            </div>
            {displayAvatar ? (
              <img
                src={displayAvatar}
                alt="Avatar"
                className="w-16 h-16 rounded-full"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Current Display Name */}
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 w-32">
              Display Name:
            </div>
            <div className="text-gray-900 dark:text-white font-medium">
              {displayName || username}
            </div>
          </div>

          {/* Current Bio */}
          <div className="flex items-start gap-4">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 w-32 pt-1">
              Bio:
            </div>
            <div className="text-gray-900 dark:text-white flex-1">
              {bio || (
                <span className="text-gray-500 dark:text-gray-400 italic">
                  No bio set
                </span>
              )}
            </div>
          </div>

          {/* Current Username */}
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 w-32">
              Username:
            </div>
            <div className="text-gray-900 dark:text-white">
              {username}
            </div>
          </div>

          {/* Current Email */}
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 w-32">
              Email:
            </div>
            <div className="text-gray-900 dark:text-white">
              {email || (
                <span className="text-gray-500 dark:text-gray-400 italic">
                  Not set
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
