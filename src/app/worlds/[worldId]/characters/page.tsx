'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Character {
  id: string;
  name: string;
  race?: string;
  class?: string;
  level: number;
  imageUrl?: string;
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'retired';
  createdAt: string;
  alignment?: string;
}

export default function CharactersPage() {
  const params = useParams();
  const worldId = params.worldId as string;

  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');

  useEffect(() => {
    // TODO: Fetch from /api/rpg/characters?worldId=${worldId}
    // For now, using mock data
    setLoading(false);
    setCharacters([
      {
        id: '1',
        name: 'Aragorn',
        race: 'Human',
        class: 'Ranger',
        level: 5,
        approvalStatus: 'approved',
        alignment: 'Lawful Good',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Gandalf',
        race: 'Wizard (Istari)',
        class: 'Wizard',
        level: 20,
        approvalStatus: 'approved',
        alignment: 'Neutral Good',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '3',
        name: 'Legolas',
        race: 'Elf',
        class: 'Fighter (Archer)',
        level: 4,
        approvalStatus: 'pending',
        alignment: 'Chaotic Good',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      },
    ]);
  }, [worldId]);

  const filteredCharacters = characters.filter((char) =>
    filter === 'all' ? true : char.approvalStatus === filter
  );

  const getStatusBadge = (status: Character['approvalStatus']) => {
    const badges = {
      approved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
      retired: 'bg-gray-100 text-gray-800',
    };

    const labels = {
      approved: 'Approved',
      pending: 'Pending GM Approval',
      rejected: 'Rejected',
      retired: 'Retired',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
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
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
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
                <span>👤</span>
                Characters
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your player characters for this world
              </p>
            </div>
            <Link
              href={`/worlds/${worldId}/characters/new`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              + Create Character
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-6 flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            All ({characters.length})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'approved'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Approved ({characters.filter((c) => c.approvalStatus === 'approved').length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Pending ({characters.filter((c) => c.approvalStatus === 'pending').length})
          </button>
        </div>

        {/* Characters List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-500">Loading characters...</p>
          </div>
        ) : filteredCharacters.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <p className="text-gray-500">No characters found</p>
            {filter !== 'all' ? (
              <p className="text-sm text-gray-400 mt-1">Try adjusting your filter</p>
            ) : (
              <Link
                href={`/worlds/${worldId}/characters/new`}
                className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Create Your First Character
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCharacters.map((character) => (
              <Link
                key={character.id}
                href={`/worlds/${worldId}/characters/${character.id}`}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Character Image */}
                {character.imageUrl ? (
                  <div className="aspect-video bg-gray-200">
                    <img
                      src={character.imageUrl}
                      alt={character.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-6xl text-white">👤</span>
                  </div>
                )}

                {/* Character Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{character.name}</h3>
                    {getStatusBadge(character.approvalStatus)}
                  </div>

                  {/* Race & Class */}
                  {(character.race || character.class) && (
                    <p className="text-sm text-gray-600 mb-2">
                      {[character.race, character.class].filter(Boolean).join(' • ')}
                    </p>
                  )}

                  {/* Level & Alignment */}
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                    <span className="inline-flex items-center">
                      <strong className="mr-1">Level:</strong> {character.level}
                    </span>
                    {character.alignment && (
                      <span className="inline-flex items-center">
                        <strong className="mr-1">Alignment:</strong> {character.alignment}
                      </span>
                    )}
                  </div>

                  {/* Created Date */}
                  <div className="text-xs text-gray-400 border-t border-gray-100 pt-3">
                    Created {formatDate(character.createdAt)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
