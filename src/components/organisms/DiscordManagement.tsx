'use client'

import { useState } from 'react'
import type { DiscordRole, DiscordChannel, DiscordMember } from '@/lib/discord'
import { SubTabs } from '../molecules/SubTabs'

interface DiscordManagementProps {
  roles: DiscordRole[]
  channels: DiscordChannel[]
  members: DiscordMember[]
  channelsByType: {
    text: number
    voice: number
    announcement: number
    category: number
    forum: number
  }
  rolesByType: {
    managed: number
    custom: number
    mentionable: number
  }
  membersByType: {
    bots: number
    humans: number
    boosters: number
  }
}

export function DiscordManagement({
  roles,
  channels,
  members,
  channelsByType,
  rolesByType,
  membersByType,
}: DiscordManagementProps) {
  const [activeTab, setActiveTab] = useState<'members' | 'bots' | 'roles' | 'channels'>('members')
  const [showCreateRole, setShowCreateRole] = useState(false)
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [memberSearch, setMemberSearch] = useState('')
  const [botSearch, setBotSearch] = useState('')

  // Helper to convert color number to hex
  const colorToHex = (color: number) => {
    return '#' + color.toString(16).padStart(6, '0')
  }

  // Helper to get channel type name
  const getChannelTypeName = (type: number) => {
    switch (type) {
      case 0: return 'Text'
      case 2: return 'Voice'
      case 4: return 'Category'
      case 5: return 'Announcement'
      case 13: return 'Stage'
      case 15: return 'Forum'
      default: return 'Unknown'
    }
  }

  // Helper to get avatar URL
  const getAvatarUrl = (member: DiscordMember) => {
    if (member.user.avatar) {
      return `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png`
    }
    // Default Discord avatar based on discriminator
    const defaultAvatarNum = parseInt(member.user.discriminator) % 5
    return `https://cdn.discordapp.com/embed/avatars/${defaultAvatarNum}.png`
  }

  // Helper to get member display name
  const getMemberDisplayName = (member: DiscordMember) => {
    return member.nick || member.user.username
  }

  // Separate humans and bots
  const humanMembers = members.filter(m => !m.user.bot)
  const botMembers = members.filter(m => m.user.bot)

  // Filter human members based on search
  const filteredMembers = humanMembers.filter(member => {
    if (!memberSearch) return true
    const displayName = getMemberDisplayName(member).toLowerCase()
    const username = member.user.username.toLowerCase()
    const search = memberSearch.toLowerCase()
    return displayName.includes(search) || username.includes(search)
  })

  // Filter bots based on search
  const filteredBots = botMembers.filter(bot => {
    if (!botSearch) return true
    const displayName = getMemberDisplayName(bot).toLowerCase()
    const username = bot.user.username.toLowerCase()
    const search = botSearch.toLowerCase()
    return displayName.includes(search) || username.includes(search)
  })

  // Sort members: boosters first, then by join date
  const sortedMembers = [...filteredMembers].sort((a, b) => {
    if (a.premium_since && !b.premium_since) return -1
    if (!a.premium_since && b.premium_since) return 1
    return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime()
  })

  // Sort bots by join date
  const sortedBots = [...filteredBots].sort((a, b) => {
    return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime()
  })

  // Sort roles by position (highest first, excluding @everyone)
  const sortedRoles = [...roles]
    .filter(r => r.name !== '@everyone')
    .sort((a, b) => b.position - a.position)

  // Group channels by category
  const categories = channels.filter(c => c.type === 4)
  const channelsWithoutCategory = channels.filter(c => c.type !== 4 && !c.parent_id)
  const channelsByCategory = categories.map(cat => ({
    category: cat,
    channels: channels.filter(c => c.parent_id === cat.id),
  }))

  const tabs = [
    { id: 'members', label: 'Members', count: humanMembers.length },
    { id: 'bots', label: 'Bots', count: botMembers.length },
    { id: 'roles', label: 'Roles', count: roles.length },
    { id: 'channels', label: 'Channels', count: channels.filter(c => c.type !== 4).length },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-indigo-100 dark:bg-indigo-900/30 rounded-lg p-4">
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {membersByType.humans}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Human Members</div>
        </div>
        <div className="bg-gray-100 dark:bg-gray-900/30 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
            {membersByType.bots}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Bots</div>
        </div>
        <div className="bg-pink-100 dark:bg-pink-900/30 rounded-lg p-4">
          <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">
            {membersByType.boosters}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Boosters</div>
        </div>
        <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {channelsByType.text}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Text Channels</div>
        </div>
        <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {channelsByType.voice}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Voice Channels</div>
        </div>
        <div className="bg-amber-100 dark:bg-amber-900/30 rounded-lg p-4">
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {rolesByType.custom}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Custom Roles</div>
        </div>
      </div>

      {/* Tabs with background */}
      <div className="bg-white dark:bg-slate-900 rounded-lg p-4 shadow-sm">
        <SubTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId as 'members' | 'bots' | 'roles' | 'channels')}
        />
      </div>

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Server Members
            </h3>
            <input
              type="text"
              placeholder="Search members..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {sortedMembers.map((member) => {
              const memberRoles = roles.filter(r => member.roles.includes(r.id))
              const highestRole = memberRoles.sort((a, b) => b.position - a.position)[0]

              return (
                <div
                  key={member.user.id}
                  className="bg-white dark:bg-slate-800 rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <img
                      src={getAvatarUrl(member)}
                      alt={getMemberDisplayName(member)}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {getMemberDisplayName(member)}
                        </div>
                        {member.premium_since && (
                          <span className="bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200 px-2 py-0.5 rounded text-xs">
                            ⭐ Booster
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <span>{member.user.username}#{member.user.discriminator}</span>
                        {highestRole && (
                          <>
                            <span>•</span>
                            <span
                              className="flex items-center gap-1"
                              style={{ color: highestRole.color ? colorToHex(highestRole.color) : undefined }}
                            >
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: highestRole.color ? colorToHex(highestRole.color) : '#99AAB5' }}
                              />
                              {highestRole.name}
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span>Joined {new Date(member.joined_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <button className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium">
                    Manage
                  </button>
                </div>
              )
            })}
          </div>

          {filteredMembers.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No members found matching &quot;{memberSearch}&quot;
            </div>
          )}
        </div>
      )}

      {/* Bots Tab */}
      {activeTab === 'bots' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Server Bots
            </h3>
            <input
              type="text"
              placeholder="Search bots..."
              value={botSearch}
              onChange={(e) => setBotSearch(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {sortedBots.map((bot) => {
              const botRoles = roles.filter(r => bot.roles.includes(r.id))
              const highestRole = botRoles.sort((a, b) => b.position - a.position)[0]

              return (
                <div
                  key={bot.user.id}
                  className="bg-white dark:bg-slate-800 rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <img
                      src={getAvatarUrl(bot)}
                      alt={getMemberDisplayName(bot)}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {getMemberDisplayName(bot)}
                        </div>
                        <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-0.5 rounded text-xs">
                          BOT
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <span>{bot.user.username}#{bot.user.discriminator}</span>
                        {highestRole && (
                          <>
                            <span>•</span>
                            <span
                              className="flex items-center gap-1"
                              style={{ color: highestRole.color ? colorToHex(highestRole.color) : undefined }}
                            >
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: highestRole.color ? colorToHex(highestRole.color) : '#99AAB5' }}
                              />
                              {highestRole.name}
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span>Added {new Date(bot.joined_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <button className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium">
                    Manage
                  </button>
                </div>
              )
            })}
          </div>

          {filteredBots.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              {botSearch ? `No bots found matching "${botSearch}"` : 'No bots in this server'}
            </div>
          )}
        </div>
      )}

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Server Roles
            </h3>
            <button
              onClick={() => setShowCreateRole(!showCreateRole)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
            >
              Create Role
            </button>
          </div>

          {showCreateRole && (
            <div className="bg-gray-100 dark:bg-slate-800 rounded-lg p-4 space-y-4">
              <h4 className="font-semibold text-gray-900 dark:text-white">Create New Role</h4>
              <p className="text-sm text-amber-600 dark:text-amber-400">
                This feature is not yet available.
              </p>
              <button
                onClick={() => setShowCreateRole(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 text-sm"
              >
                Cancel
              </button>
            </div>
          )}

          <div className="space-y-2">
            {sortedRoles.map((role) => (
              <div
                key={role.id}
                className="bg-white dark:bg-slate-800 rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: role.color ? colorToHex(role.color) : '#99AAB5' }}
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {role.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 space-x-2">
                      {role.managed && (
                        <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">
                          Bot Managed
                        </span>
                      )}
                      {role.hoist && (
                        <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded">
                          Hoisted
                        </span>
                      )}
                      {role.mentionable && (
                        <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-0.5 rounded">
                          Mentionable
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium">
                  Edit
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Channels Tab */}
      {activeTab === 'channels' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Server Channels
            </h3>
            <button
              onClick={() => setShowCreateChannel(!showCreateChannel)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
            >
              Create Channel
            </button>
          </div>

          {showCreateChannel && (
            <div className="bg-gray-100 dark:bg-slate-800 rounded-lg p-4 space-y-4">
              <h4 className="font-semibold text-gray-900 dark:text-white">Create New Channel</h4>
              <p className="text-sm text-amber-600 dark:text-amber-400">
                This feature is not yet available.
              </p>
              <button
                onClick={() => setShowCreateChannel(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 text-sm"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Channels without category */}
          {channelsWithoutCategory.length > 0 && (
            <div className="space-y-2">
              {channelsWithoutCategory.map((channel) => (
                <div
                  key={channel.id}
                  className="bg-white dark:bg-slate-800 rounded-lg p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      # {channel.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {getChannelTypeName(channel.type)}
                      {channel.topic && ` • ${channel.topic.slice(0, 60)}${channel.topic.length > 60 ? '...' : ''}`}
                    </div>
                  </div>
                  <button className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium">
                    Edit
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Channels grouped by category */}
          {channelsByCategory.map(({ category, channels: categoryChannels }) => (
            <div key={category.id} className="space-y-2">
              <div className="font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wider">
                {category.name}
              </div>
              <div className="space-y-2 ml-4">
                {categoryChannels.map((channel) => (
                  <div
                    key={channel.id}
                    className="bg-white dark:bg-slate-800 rounded-lg p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {channel.type === 2 ? '🔊' : channel.type === 15 ? '💬' : '#'} {channel.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {getChannelTypeName(channel.type)}
                        {channel.topic && ` • ${channel.topic.slice(0, 60)}${channel.topic.length > 60 ? '...' : ''}`}
                      </div>
                    </div>
                    <button className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium">
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
