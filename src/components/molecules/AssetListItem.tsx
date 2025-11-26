'use client';

import Link from 'next/link';
import { getCategoryFromAssetType, ASSET_TYPE_CATEGORIES } from '@/lib/constants/asset-types';
import { AssetIcon } from './AssetTypeFilter';

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

interface AssetListItemProps {
  asset: Asset;
  view: 'grid' | 'list';
}

export function AssetListItem({ asset, view }: AssetListItemProps) {
  const category = getCategoryFromAssetType(asset.assetType);
  const categoryConfig = ASSET_TYPE_CATEGORIES[category];
  const fileSizeKB = Number(asset.fileSize) / 1024;
  const fileSizeDisplay = fileSizeKB > 1024
    ? `${(fileSizeKB / 1024).toFixed(2)} MB`
    : `${fileSizeKB.toFixed(1)} KB`;

  if (view === 'grid') {
    return (
      <Link
        href={`/creations/${asset.id}`}
        className="block border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 hover:border-crit-purple-400 group"
        data-testid={`asset-${asset.id}`}
      >
        {/* Asset Preview */}
        <div className="aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center relative overflow-hidden">
          {category === 'image' ? (
            <img
              src={asset.url}
              alt={asset.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : category === 'video' ? (
            <div className="relative w-full h-full">
              <video
                src={asset.url}
                className="w-full h-full object-cover"
                muted
                playsInline
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-800 ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
              {asset.duration && (
                <span className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                  {formatDuration(asset.duration)}
                </span>
              )}
            </div>
          ) : (
            <div className="text-center p-4">
              <AssetIcon icon={categoryConfig.icon} className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p className="text-xs text-gray-600 dark:text-gray-400">{categoryConfig.label}</p>
              {category === 'audio' && asset.duration && (
                <span className="text-xs text-gray-500">{formatDuration(asset.duration)}</span>
              )}
            </div>
          )}
        </div>

        {/* Asset Info */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 truncate group-hover:text-crit-purple-500">
            {asset.name}
          </h3>
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
              {asset.assetType}
            </span>
            <span>{fileSizeDisplay}</span>
          </div>
          {asset.width && asset.height && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {asset.width} x {asset.height}
            </p>
          )}
        </div>
      </Link>
    );
  }

  // List view
  return (
    <Link
      href={`/creations/${asset.id}`}
      className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-crit-purple-400 transition-all duration-200 group"
      data-testid={`asset-${asset.id}`}
    >
      {/* Thumbnail */}
      <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
        {category === 'image' ? (
          <img
            src={asset.url}
            alt={asset.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <AssetIcon icon={categoryConfig.icon} className="w-8 h-8 text-gray-400" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-grow min-w-0">
        <h3 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-crit-purple-500">
          {asset.name}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
          {asset.description || asset.filename}
        </p>
      </div>

      {/* Metadata */}
      <div className="hidden sm:flex items-center gap-4 flex-shrink-0 text-sm text-gray-500 dark:text-gray-400">
        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
          {asset.assetType}
        </span>
        {asset.width && asset.height && (
          <span className="hidden md:inline">{asset.width}x{asset.height}</span>
        )}
        {asset.duration && (
          <span>{formatDuration(asset.duration)}</span>
        )}
        <span>{fileSizeDisplay}</span>
        <span className="hidden lg:inline text-xs">
          {new Date(asset.createdAt).toLocaleDateString()}
        </span>
      </div>

      {/* Arrow */}
      <svg className="w-5 h-5 text-gray-400 group-hover:text-crit-purple-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
