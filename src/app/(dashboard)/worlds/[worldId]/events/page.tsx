'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface GameEvent {
  id: string;
  eventType: string;
  timestamp: string;
  sessionId?: string;
  sessionTitle?: string;
  playerId?: string;
  playerName?: string;
  description: string;
  metadata?: Record<string, any>;
  isSignificant?: boolean;
}

export default function EventsPage() {
  const params = useParams();
  const worldId = params.worldId as string;

  const [events, setEvents] = useState<GameEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSession, setFilterSession] = useState<string>('all');

  useEffect(() => {
    // TODO: Fetch from /api/rpg/events?worldId=${worldId}
    // For now, using mock data
    setLoading(false);
    setEvents([
      {
        id: '1',
        eventType: 'combat',
        timestamp: '2024-11-15T20:15:00Z',
        sessionId: 'session-1',
        sessionTitle: 'Session 1: The Darkwood Mystery',
        playerId: 'player-1',
        playerName: 'Aragorn',
        description: 'Critical hit on Goblin Scout for 18 damage',
        metadata: { damage: 18, target: 'Goblin Scout', diceRoll: '2d6+6' },
        isSignificant: true
      },
      {
        id: '2',
        eventType: 'discovery',
        timestamp: '2024-11-15T20:45:00Z',
        sessionId: 'session-1',
        sessionTitle: 'Session 1: The Darkwood Mystery',
        description: 'Party discovered the Ancient Ruins in Darkwood Forest',
        metadata: { location: 'Ancient Ruins', discoveryType: 'exploration' },
        isSignificant: true
      },
      {
        id: '3',
        eventType: 'dialogue',
        timestamp: '2024-11-15T19:30:00Z',
        sessionId: 'session-1',
        sessionTitle: 'Session 1: The Darkwood Mystery',
        playerName: 'Gandalf',
        description: 'Persuaded Elder Grimwald to share information about the missing villagers',
        metadata: { npc: 'Elder Grimwald', skillCheck: 'Persuasion', result: 'success' }
      },
      {
        id: '4',
        eventType: 'loot',
        timestamp: '2024-11-15T21:00:00Z',
        sessionId: 'session-1',
        sessionTitle: 'Session 1: The Darkwood Mystery',
        description: 'Found a mysterious amulet in the ruins',
        metadata: { item: 'Amulet of the Ancients', rarity: 'rare' },
        isSignificant: true
      },
      {
        id: '5',
        eventType: 'quest',
        timestamp: '2024-11-15T19:15:00Z',
        sessionId: 'session-1',
        sessionTitle: 'Session 1: The Darkwood Mystery',
        description: 'Accepted quest: "Find the Missing Villagers"',
        metadata: { questGiver: 'Elder Grimwald', questStatus: 'accepted' },
        isSignificant: true
      }
    ]);
  }, [worldId]);

  const filteredEvents = events.filter(event => {
    const matchesType = filterType === 'all' || event.eventType === filterType;
    const matchesSession = filterSession === 'all' || event.sessionId === filterSession;
    return matchesType && matchesSession;
  });

  const eventTypes = ['all', ...Array.from(new Set(events.map(e => e.eventType)))];
  const sessions = [
    'all',
    ...Array.from(new Set(events.filter(e => e.sessionId).map(e => e.sessionId!)))
  ];

  const getEventIcon = (eventType: string) => {
    const icons: Record<string, string> = {
      combat: '⚔️',
      discovery: '🔍',
      dialogue: '💬',
      loot: '💰',
      quest: '📜',
      roll: '🎲',
      achievement: '🏆',
      death: '💀',
      levelUp: '⬆️',
      rest: '🏕️'
    };
    return icons[eventType] || '⚡';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href={`/worlds/${worldId}`}
                className="text-sm text-blue-600 hover:text-blue-800 mb-2 inline-block"
              >
                ← Back to World Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <span>⚡</span>
                Events Log
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Complete history of all events in your world
              </p>
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">{events.length}</span> total events
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Event Type Filter */}
            <div className="flex-1">
              <label htmlFor="filterType" className="block text-sm font-medium text-gray-700 mb-1">
                Event Type
              </label>
              <select
                id="filterType"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {eventTypes.map(type => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Session Filter */}
            <div className="flex-1">
              <label htmlFor="filterSession" className="block text-sm font-medium text-gray-700 mb-1">
                Session
              </label>
              <select
                id="filterSession"
                value={filterSession}
                onChange={(e) => setFilterSession(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Sessions</option>
                {sessions.filter(s => s !== 'all').map(sessionId => {
                  const event = events.find(e => e.sessionId === sessionId);
                  return (
                    <option key={sessionId} value={sessionId}>
                      {event?.sessionTitle || sessionId}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Toggle for Significant Events Only */}
          <div className="mt-4 flex items-center">
            <input
              type="checkbox"
              id="significantOnly"
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <label htmlFor="significantOnly" className="ml-2 text-sm text-gray-700">
              Show significant events only
            </label>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredEvents.length} of {events.length} events
        </div>

        {/* Events Timeline */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-500">Loading events...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <p className="text-gray-500">No events found</p>
            <p className="text-sm text-gray-400 mt-1">
              {filterType !== 'all' || filterSession !== 'all'
                ? 'Try adjusting your filters'
                : 'Events will appear here as you play'}
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {filteredEvents.map((event, index) => (
              <div
                key={event.id}
                className={`relative bg-white border-l-4 ${
                  event.isSignificant ? 'border-l-yellow-400' : 'border-l-gray-300'
                } ${index === 0 ? 'rounded-t-lg' : ''} ${
                  index === filteredEvents.length - 1 ? 'rounded-b-lg' : 'border-b border-gray-200'
                }`}
              >
                <div className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-xl">
                      {getEventIcon(event.eventType)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-1">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              {event.eventType}
                            </span>
                            {event.isSignificant && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                ⭐ Significant
                              </span>
                            )}
                          </div>
                          <p className="text-gray-900 font-medium">{event.description}</p>

                          {/* Metadata */}
                          {event.metadata && Object.keys(event.metadata).length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {Object.entries(event.metadata).map(([key, value]) => (
                                <span
                                  key={key}
                                  className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700"
                                >
                                  <strong className="mr-1">{key}:</strong> {String(value)}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Session & Player Info */}
                          <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                            {event.sessionTitle && (
                              <Link
                                href={`/worlds/${worldId}/sessions/${event.sessionId}`}
                                className="hover:text-blue-600 transition-colors"
                              >
                                📅 {event.sessionTitle}
                              </Link>
                            )}
                            {event.playerName && (
                              <span>👤 {event.playerName}</span>
                            )}
                          </div>
                        </div>

                        {/* Timestamp */}
                        <div className="flex-shrink-0 text-right">
                          <div className="text-sm text-gray-500">{formatTimestamp(event.timestamp)}</div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {new Date(event.timestamp).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
