'use client';

import { ASSET_TYPE_CATEGORIES, type AssetTypeCategory } from '@/lib/constants/asset-types';

interface AssetTypeFilterProps {
  selectedType: AssetTypeCategory | 'all';
  onTypeChange: (type: AssetTypeCategory | 'all') => void;
  counts?: Record<string, number>;
}

export function AssetTypeFilter({ selectedType, onTypeChange, counts = {} }: AssetTypeFilterProps) {
  const categories = [
    { key: 'all' as const, label: 'All Assets', icon: 'grid' },
    ...Object.entries(ASSET_TYPE_CATEGORIES).map(([key, config]) => ({
      key: key as AssetTypeCategory,
      label: config.label,
      icon: config.icon,
    })),
  ];

  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter assets by type">
      {categories.map(({ key, label, icon }) => {
        const isSelected = selectedType === key;
        const count = key === 'all'
          ? Object.values(counts).reduce((sum, c) => sum + c, 0)
          : counts[key] || 0;

        return (
          <button
            key={key}
            role="tab"
            aria-selected={isSelected}
            onClick={() => onTypeChange(key)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
              transition-all duration-200
              ${isSelected
                ? 'bg-crit-purple-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-gray-700'
              }
            `}
          >
            <AssetIcon icon={icon} className="w-4 h-4" />
            <span>{label}</span>
            {count > 0 && (
              <span className={`
                px-2 py-0.5 rounded-full text-xs font-semibold
                ${isSelected
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'
                }
              `}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function AssetIcon({ icon, className }: { icon: string; className?: string }) {
  const iconClass = className || 'w-5 h-5';

  switch (icon) {
    case 'grid':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      );
    case 'file-text':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case 'image':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'music':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      );
    case 'video':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
    default:
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
  }
}

export { AssetIcon };
