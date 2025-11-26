// Asset type definitions for the RPG Asset system
// These are the primary asset categories used for filtering and display

export const ASSET_TYPE_CATEGORIES = {
  document: {
    label: 'Documents',
    icon: 'file-text',
    description: 'PDFs, text files, and other documents',
    mimeTypes: [
      'application/pdf',
      'text/plain',
      'text/markdown',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    extensions: ['.pdf', '.txt', '.md', '.doc', '.docx'],
  },
  image: {
    label: 'Images',
    icon: 'image',
    description: 'Maps, tokens, portraits, and other images',
    mimeTypes: [
      'image/png',
      'image/jpeg',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ],
    extensions: ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'],
  },
  audio: {
    label: 'Audio',
    icon: 'music',
    description: 'Music, sound effects, and voice recordings',
    mimeTypes: [
      'audio/mpeg',
      'audio/ogg',
      'audio/wav',
      'audio/webm',
      'audio/mp4',
    ],
    extensions: ['.mp3', '.ogg', '.wav', '.webm', '.m4a'],
  },
  video: {
    label: 'Video',
    icon: 'video',
    description: 'Animated maps, cutscenes, and tutorials',
    mimeTypes: [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/quicktime',
    ],
    extensions: ['.mp4', '.webm', '.ogv', '.mov'],
  },
} as const;

// Specific asset subtypes within each category
export const ASSET_SUBTYPES = {
  // Image subtypes
  token: { category: 'image', label: 'Token', description: 'Character or creature token' },
  map: { category: 'image', label: 'Map', description: 'Battle map or world map' },
  tile: { category: 'image', label: 'Tile', description: 'Reusable map tile' },
  portrait: { category: 'image', label: 'Portrait', description: 'Character or NPC portrait' },
  handout: { category: 'image', label: 'Handout', description: 'Player handout image' },

  // Audio subtypes
  music: { category: 'audio', label: 'Music', description: 'Background music' },
  sfx: { category: 'audio', label: 'Sound Effect', description: 'Sound effect' },
  ambience: { category: 'audio', label: 'Ambience', description: 'Ambient sound' },
  voice: { category: 'audio', label: 'Voice', description: 'Voice recording or narration' },

  // Video subtypes
  animated_map: { category: 'video', label: 'Animated Map', description: 'Animated battle map' },
  cutscene: { category: 'video', label: 'Cutscene', description: 'Story cutscene' },
  tutorial: { category: 'video', label: 'Tutorial', description: 'How-to video' },

  // Document subtypes
  rules: { category: 'document', label: 'Rules', description: 'Game rules or reference' },
  character_sheet: { category: 'document', label: 'Character Sheet', description: 'Printable character sheet' },
  adventure: { category: 'document', label: 'Adventure', description: 'Adventure module' },
} as const;

export type AssetTypeCategory = keyof typeof ASSET_TYPE_CATEGORIES;
export type AssetSubtype = keyof typeof ASSET_SUBTYPES;

// Helper to determine category from mime type
export function getCategoryFromMimeType(mimeType: string): AssetTypeCategory | null {
  for (const [category, config] of Object.entries(ASSET_TYPE_CATEGORIES)) {
    if (config.mimeTypes.includes(mimeType)) {
      return category as AssetTypeCategory;
    }
  }
  return null;
}

// Helper to determine category from asset type string
export function getCategoryFromAssetType(assetType: string): AssetTypeCategory {
  // Direct category match
  if (assetType in ASSET_TYPE_CATEGORIES) {
    return assetType as AssetTypeCategory;
  }

  // Subtype lookup
  if (assetType in ASSET_SUBTYPES) {
    return ASSET_SUBTYPES[assetType as AssetSubtype].category as AssetTypeCategory;
  }

  // Default to document for unknown types
  return 'document';
}

// Get all asset types (categories + subtypes) for a filter dropdown
export function getAllAssetTypes() {
  const types: { value: string; label: string; group?: string }[] = [];

  // Add categories
  for (const [key, config] of Object.entries(ASSET_TYPE_CATEGORIES)) {
    types.push({ value: key, label: config.label });
  }

  // Add subtypes grouped by category
  for (const [key, config] of Object.entries(ASSET_SUBTYPES)) {
    const categoryConfig = ASSET_TYPE_CATEGORIES[config.category as AssetTypeCategory];
    types.push({ value: key, label: config.label, group: categoryConfig.label });
  }

  return types;
}
