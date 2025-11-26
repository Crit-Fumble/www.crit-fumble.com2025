'use client';

import { useState, useMemo } from 'react';
import { AssetTypeFilter } from '@/components/molecules/AssetTypeFilter';
import { AssetListItem } from '@/components/molecules/AssetListItem';
import { getCategoryFromAssetType, type AssetTypeCategory } from '@/lib/constants/asset-types';

interface Asset {
  id: string;
  name: string;
  description: string | null;
  assetType: string;
  url: string;
  mimeType: string;
  fileSize: bigint | number;
  filename: string;
  width: number | null;
  height: number | null;
  duration: number | null;
  createdAt: Date;
  category: string | null;
  tags: string[];
}

type SortField = 'name' | 'createdAt' | 'fileSize' | 'assetType';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'grid' | 'list';

interface AssetManagerProps {
  assets: Asset[];
  assetCounts: Record<string, number>;
}

export function AssetManager({ assets, assetCounts }: AssetManagerProps) {
  const [selectedType, setSelectedType] = useState<AssetTypeCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Filter and sort assets
  const filteredAssets = useMemo(() => {
    let result = [...assets];

    // Filter by type
    if (selectedType !== 'all') {
      result = result.filter(asset => {
        const category = getCategoryFromAssetType(asset.assetType);
        return category === selectedType;
      });
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(asset =>
        asset.name.toLowerCase().includes(query) ||
        asset.filename.toLowerCase().includes(query) ||
        asset.description?.toLowerCase().includes(query) ||
        asset.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'fileSize':
          comparison = Number(a.fileSize) - Number(b.fileSize);
          break;
        case 'assetType':
          comparison = a.assetType.localeCompare(b.assetType);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [assets, selectedType, searchQuery, sortField, sortOrder]);

  // Calculate counts by category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      document: 0,
      image: 0,
      audio: 0,
      video: 0,
    };
    assets.forEach(asset => {
      const category = getCategoryFromAssetType(asset.assetType);
      counts[category] = (counts[category] || 0) + 1;
    });
    return counts;
  }, [assets]);

  return (
    <div className="space-y-6">
      {/* Filters and Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-lg p-4 space-y-4">
        {/* Type Filter */}
        <AssetTypeFilter
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          counts={categoryCounts}
        />

        {/* Search and Sort Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-crit-purple-500 focus:border-transparent"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Sort */}
          <div className="flex gap-2">
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-crit-purple-500"
            >
              <option value="createdAt">Date</option>
              <option value="name">Name</option>
              <option value="fileSize">Size</option>
              <option value="assetType">Type</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
              title={sortOrder === 'asc' ? 'Sort ascending' : 'Sort descending'}
            >
              {sortOrder === 'asc' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                </svg>
              )}
            </button>
          </div>

          {/* View Toggle */}
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-crit-purple-600 text-white' : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
              title="Grid view"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 ${viewMode === 'list' ? 'bg-crit-purple-600 text-white' : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
              title="List view"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredAssets.length} {filteredAssets.length === 1 ? 'asset' : 'assets'}
        {selectedType !== 'all' && ` in ${selectedType}`}
        {searchQuery && ` matching "${searchQuery}"`}
      </div>

      {/* Asset List/Grid */}
      {filteredAssets.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-lg p-12 text-center">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No assets found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchQuery
              ? 'Try adjusting your search or filter.'
              : 'Upload your first asset to get started.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAssets.map(asset => (
            <AssetListItem key={asset.id} asset={asset} view="grid" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredAssets.map(asset => (
            <AssetListItem key={asset.id} asset={asset} view="list" />
          ))}
        </div>
      )}
    </div>
  );
}
