'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Creature {
  id: string;
  name: string;
  creatureType: string;
  level?: number;
  hitPoints?: number;
  armorClass?: number;
  description?: string;
  imageUrl?: string;
  tags: string[];
  lastUpdated: string;
}

export default function CreaturesPage() {
  const params = useParams();
  const worldId = params.worldId as string;

  const [creatures, setCreatures] = useState<Creature[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    // TODO: Fetch from /api/rpg/creatures?worldId=${worldId}
    // For now, using mock data
    setLoading(false);
    setCreatures([
      {
        id: '1',
        name: 'Goblin Scout',
        creatureType: 'Humanoid (Goblinoid)',
        level: 1,
        hitPoints: 7,
        armorClass: 13,
        description: 'Small, cunning goblin scout that patrols the forest',
        tags: ['Enemy', 'Scout', 'Forest'],
        lastUpdated: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Elder Grimwald',
        creatureType: 'Humanoid (Human)',
        level: 5,
        hitPoints: 45,
        armorClass: 10,
        description: 'Wise village elder who knows the ancient lore',
        tags: ['NPC', 'Quest Giver', 'Village'],
        lastUpdated: new Date().toISOString()
      }
    ]);
  }, [worldId]);

  const filteredCreatures = creatures.filter(creature => {
    const matchesSearch = creature.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         creature.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || creature.tags.some(tag => tag.toLowerCase() === filterType.toLowerCase());
    return matchesSearch && matchesType;
  });

  const creatureTypes = ['all', ...Array.from(new Set(creatures.flatMap(c => c.tags)))];

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
                <span>👥</span>
                Creatures & NPCs
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Browse and manage all creatures in your world
              </p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              + New Creature
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <label htmlFor="search" className="sr-only">Search creatures</label>
              <div className="relative">
                <input
                  type="text"
                  id="search"
                  placeholder="Search by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg
                  className="absolute right-3 top-2.5 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Type Filter */}
            <div className="md:w-64">
              <label htmlFor="filterType" className="sr-only">Filter by type</label>
              <select
                id="filterType"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {creatureTypes.map(type => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'All Types' : type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredCreatures.length} of {creatures.length} creatures
        </div>

        {/* Creatures Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-500">Loading creatures...</p>
          </div>
        ) : filteredCreatures.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <p className="text-gray-500">No creatures found</p>
            <p className="text-sm text-gray-400 mt-1">
              {searchTerm || filterType !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first creature to get started'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCreatures.map((creature) => (
              <Link
                key={creature.id}
                href={`/worlds/${worldId}/creatures/${creature.id}`}
                className="block bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-blue-300 hover:shadow-lg transition-all"
              >
                {/* Image Placeholder */}
                <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  {creature.imageUrl ? (
                    <img src={creature.imageUrl} alt={creature.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-6xl">👤</span>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-900 mb-1">{creature.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{creature.creatureType}</p>

                  {/* Stats */}
                  {(creature.level || creature.hitPoints || creature.armorClass) && (
                    <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                      {creature.level && (
                        <div className="bg-blue-50 rounded p-2">
                          <div className="text-xs text-gray-600">Level</div>
                          <div className="font-bold text-blue-600">{creature.level}</div>
                        </div>
                      )}
                      {creature.hitPoints && (
                        <div className="bg-red-50 rounded p-2">
                          <div className="text-xs text-gray-600">HP</div>
                          <div className="font-bold text-red-600">{creature.hitPoints}</div>
                        </div>
                      )}
                      {creature.armorClass && (
                        <div className="bg-gray-50 rounded p-2">
                          <div className="text-xs text-gray-600">AC</div>
                          <div className="font-bold text-gray-600">{creature.armorClass}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Description */}
                  {creature.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{creature.description}</p>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {creature.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded"
                      >
                        {tag}
                      </span>
                    ))}
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
