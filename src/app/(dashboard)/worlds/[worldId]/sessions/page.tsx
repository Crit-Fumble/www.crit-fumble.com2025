'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Session {
  id: string;
  title: string;
  description?: string;
  scheduledStart: string;
  actualStart?: string;
  actualEnd?: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  playerCount: number;
  gmName: string;
  duration?: number; // in minutes
  critCoinsCollected?: number;
  storyCreditsEarned?: number;
}

export default function SessionsPage() {
  const params = useParams();
  const worldId = params.worldId as string;

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    // TODO: Fetch from /api/rpg/sessions?worldId=${worldId}
    // For now, using mock data
    setLoading(false);
    setSessions([
      {
        id: '1',
        title: 'Session 1: The Darkwood Mystery',
        description: 'The party investigates strange disappearances in Darkwood Forest',
        scheduledStart: '2024-11-15T19:00:00Z',
        actualStart: '2024-11-15T19:05:00Z',
        actualEnd: '2024-11-15T22:30:00Z',
        status: 'completed',
        playerCount: 4,
        gmName: 'Game Master',
        duration: 205,
        critCoinsCollected: 20,
        storyCreditsEarned: 16
      },
      {
        id: '2',
        title: 'Session 2: Into the Ruins',
        description: 'Exploring the ancient ruins discovered in Darkwood',
        scheduledStart: '2024-11-22T19:00:00Z',
        status: 'scheduled',
        playerCount: 4,
        gmName: 'Game Master'
      },
      {
        id: '3',
        title: 'Session 0: Character Creation',
        description: 'Creating characters and establishing party dynamics',
        scheduledStart: '2024-11-08T18:00:00Z',
        actualStart: '2024-11-08T18:10:00Z',
        actualEnd: '2024-11-08T20:45:00Z',
        status: 'completed',
        playerCount: 4,
        gmName: 'Game Master',
        duration: 155,
        critCoinsCollected: 0,
        storyCreditsEarned: 0
      }
    ]);
  }, [worldId]);

  const filteredSessions = sessions.filter(session => {
    if (filterStatus === 'all') return true;
    return session.status === filterStatus;
  });

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: Session['status']) => {
    const styles = {
      scheduled: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };

    const icons = {
      scheduled: '📅',
      active: '🟢',
      completed: '✅',
      cancelled: '❌'
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${styles[status]}`}>
        <span>{icons[status]}</span>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const stats = {
    total: sessions.length,
    completed: sessions.filter(s => s.status === 'completed').length,
    scheduled: sessions.filter(s => s.status === 'scheduled').length,
    totalDuration: sessions.reduce((sum, s) => sum + (s.duration || 0), 0),
    totalEarned: sessions.reduce((sum, s) => sum + (s.storyCreditsEarned || 0), 0)
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
                <span>🎮</span>
                Sessions
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                View session history and manage scheduled sessions
              </p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              + Schedule Session
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600">Total Sessions</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600">Completed</div>
            <div className="text-2xl font-bold text-green-600 mt-1">{stats.completed}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600">Scheduled</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">{stats.scheduled}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600">Total Play Time</div>
            <div className="text-2xl font-bold text-purple-600 mt-1">{formatDuration(stats.totalDuration)}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600">Total Earned</div>
            <div className="text-2xl font-bold text-yellow-600 mt-1">{stats.totalEarned} SC</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 font-medium">Filter:</span>
            <div className="flex gap-2">
              {['all', 'scheduled', 'active', 'completed', 'cancelled'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    filterStatus === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sessions List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-500">Loading sessions...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <p className="text-gray-500">No sessions found</p>
            <p className="text-sm text-gray-400 mt-1">
              {filterStatus !== 'all'
                ? 'Try adjusting your filter'
                : 'Schedule your first session to get started'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSessions.map((session) => (
              <Link
                key={session.id}
                href={`/worlds/${worldId}/sessions/${session.id}`}
                className="block bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{session.title}</h3>
                      {getStatusBadge(session.status)}
                    </div>
                    {session.description && (
                      <p className="text-sm text-gray-600 mb-3">{session.description}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500 mb-1">Scheduled</div>
                    <div className="font-medium text-gray-900">
                      {formatDateTime(session.scheduledStart)}
                    </div>
                  </div>

                  {session.duration && (
                    <div>
                      <div className="text-gray-500 mb-1">Duration</div>
                      <div className="font-medium text-gray-900">
                        {formatDuration(session.duration)}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="text-gray-500 mb-1">Players</div>
                    <div className="font-medium text-gray-900">
                      👥 {session.playerCount}
                    </div>
                  </div>

                  {session.status === 'completed' && session.storyCreditsEarned !== undefined && (
                    <div>
                      <div className="text-gray-500 mb-1">Earned</div>
                      <div className="font-medium text-yellow-600">
                        {session.storyCreditsEarned} Story Credits
                      </div>
                    </div>
                  )}
                </div>

                {session.status === 'completed' && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                    <div className="text-gray-500">
                      Collected: <strong className="text-gray-900">{session.critCoinsCollected} Crit-Coins</strong>
                    </div>
                    <div className="text-blue-600 hover:text-blue-800 font-medium">
                      View Details →
                    </div>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
