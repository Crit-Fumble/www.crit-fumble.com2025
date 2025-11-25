'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Location {
  id: string;
  name: string;
  locationType: string;
  description?: string;
  coordinates?: { x: number; y: number };
  parentLocationId?: string;
  imageUrl?: string;
  tags: string[];
  inhabitants?: number;
  lastVisited?: string;
}

export default function LocationsPage() {
  const params = useParams();
  const worldId = params.worldId as string;

  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    // TODO: Fetch from /api/rpg/locations?worldId=${worldId}
    // For now, using mock data
    setLoading(false);
    setLocations([
      {
        id: '1',
        name: 'Millhaven',
        locationType: 'Town',
        description: 'A small trading town at the crossroads of the kingdom',
        inhabitants: 450,
        tags: ['Settlement', 'Safe Zone', 'Quest Hub'],
        lastVisited: '2024-11-15T10:00:00Z'
      },
      {
        id: '2',
        name: 'Darkwood Forest',
        locationType: 'Wilderness',
        description: 'Ancient forest known for its mysterious creatures and hidden ruins',
        tags: ['Dungeon', 'Exploration', 'Dangerous'],
        lastVisited: '2024-11-10T14:30:00Z'
      },
      {
        id: '3',
        name: 'The Rusty Tankard',
        locationType: 'Tavern',
        parentLocationId: '1',
        description: 'Popular tavern in Millhaven, owned by the dwarf Thorgrim',
        tags: ['Social', 'Safe Zone', 'Inn'],
        lastVisited: '2024-11-15T18:00:00Z'
      }
    ]);
  }, [worldId]);

  const filteredLocations = locations.filter(location => {
    const matchesSearch = location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || location.tags.some(tag => tag.toLowerCase() === filterType.toLowerCase());
    return matchesSearch && matchesType;
  });

  const locationTypes = ['all', ...Array.from(new Set(locations.flatMap(l => l.tags)))];

  const formatLastVisited = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
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
                <span>📍</span>
                Locations
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Browse and manage all locations in your world
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
              >
                {viewMode === 'grid' ? '☰' : '⊞'}
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                + New Location
              </button>
            </div>
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
              <label htmlFor="search" className="sr-only">Search locations</label>
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
                {locationTypes.map(type => (
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
          Showing {filteredLocations.length} of {locations.length} locations
        </div>

        {/* Locations Display */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-500">Loading locations...</p>
          </div>
        ) : filteredLocations.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <p className="text-gray-500">No locations found</p>
            <p className="text-sm text-gray-400 mt-1">
              {searchTerm || filterType !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first location to get started'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLocations.map((location) => (
              <Link
                key={location.id}
                href={`/worlds/${worldId}/locations/${location.id}`}
                className="block bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-blue-300 hover:shadow-lg transition-all"
              >
                {/* Image Placeholder */}
                <div className="h-40 bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
                  {location.imageUrl ? (
                    <img src={location.imageUrl} alt={location.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl">
                      {location.locationType === 'Town' ? '🏘️' :
                       location.locationType === 'Wilderness' ? '🌲' :
                       location.locationType === 'Tavern' ? '🍺' :
                       '📍'}
                    </span>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-lg text-gray-900">{location.name}</h3>
                    {location.parentLocationId && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        Sub-location
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{location.locationType}</p>

                  {/* Description */}
                  {location.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{location.description}</p>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    {location.inhabitants && (
                      <span>👥 {location.inhabitants} inhabitants</span>
                    )}
                    <span>🕐 {formatLastVisited(location.lastVisited)}</span>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {location.tags.map(tag => (
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
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {filteredLocations.map((location, index) => (
              <Link
                key={location.id}
                href={`/worlds/${worldId}/locations/${location.id}`}
                className={`block p-4 hover:bg-gray-50 transition-colors ${
                  index !== filteredLocations.length - 1 ? 'border-b border-gray-200' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg flex items-center justify-center text-2xl">
                    {location.locationType === 'Town' ? '🏘️' :
                     location.locationType === 'Wilderness' ? '🌲' :
                     location.locationType === 'Tavern' ? '🍺' :
                     '📍'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900">{location.name}</h3>
                      {location.parentLocationId && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                          Sub-location
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{location.locationType}</p>
                    {location.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">{location.description}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right text-sm">
                    {location.inhabitants && (
                      <div className="text-gray-600 mb-1">👥 {location.inhabitants}</div>
                    )}
                    <div className="text-gray-400 text-xs">
                      {formatLastVisited(location.lastVisited)}
                    </div>
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
