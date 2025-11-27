/**
 * RPG Asset System
 *
 * RpgAsset is a simple file storage system that can store any media type:
 * - Images (PNG, JPG, WebP, etc.)
 * - Audio (MP3, OGG, WAV, etc.)
 * - Video (MP4, WebM, etc.)
 * - Documents (PDF, etc.)
 * - Data files (JSON, etc.)
 *
 * Assets are referenced by RpgTile and other systems.
 * Each asset is a single file with metadata.
 */

/**
 * Asset Media Type
 * Broad categories of media types
 */
export enum AssetMediaType {
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  DOCUMENT = 'document',
  DATA = 'data',
  OTHER = 'other',
}

/**
 * Asset Storage Provider
 * Where the asset is stored
 */
export enum AssetStorageProvider {
  /** Vercel Blob Storage */
  VERCEL_BLOB = 'vercel_blob',
  /** Local filesystem (dev only) */
  LOCAL = 'local',
  /** AWS S3 */
  S3 = 's3',
  /** Cloudinary */
  CLOUDINARY = 'cloudinary',
}

/**
 * Asset Access Level
 * Controls who can access the asset
 */
export enum AssetAccessLevel {
  /** Public - anyone can access */
  PUBLIC = 'public',
  /** Authenticated - only logged-in users */
  AUTHENTICATED = 'authenticated',
  /** Premium - only premium tier users */
  PREMIUM = 'premium',
  /** Admin - only admins */
  ADMIN = 'admin',
  /** Private - only creator */
  PRIVATE = 'private',
}

/**
 * RPG Asset
 * Simple file storage with metadata
 */
export interface RpgAsset {
  /** Unique asset ID */
  id: string;

  /** Asset name */
  name: string;

  /** Asset description */
  description?: string;

  /** Media type category */
  mediaType: AssetMediaType;

  /** MIME type (e.g., "image/png", "audio/mp3", "video/mp4") */
  mimeType: string;

  /** File size in bytes */
  fileSize: number;

  /** Storage provider */
  storageProvider: AssetStorageProvider;

  /** Storage URL or path */
  storageUrl: string;

  /** Storage key/path (for deletion/management) */
  storageKey: string;

  /** Access level */
  accessLevel: AssetAccessLevel;

  /** Optional: Image dimensions (for images) */
  width?: number;
  height?: number;

  /** Optional: Duration in seconds (for audio/video) */
  duration?: number;

  /** Optional: Checksum for integrity verification */
  checksum?: string;

  /** Optional: Tags for searching */
  tags?: string[];

  /** Optional: Alternative text (for accessibility) */
  altText?: string;

  /** Optional: Attribution/credit */
  attribution?: string;

  /** Optional: License information */
  license?: string;

  /** Metadata */
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;

  /** Optional: Deleted at (soft delete) */
  deletedAt?: Date | null;
}

/**
 * Asset Upload Request
 * Data needed to upload a new asset
 */
export interface AssetUploadRequest {
  /** File to upload */
  file: File | Buffer;
  /** Asset name */
  name: string;
  /** Optional description */
  description?: string;
  /** Media type */
  mediaType: AssetMediaType;
  /** Access level */
  accessLevel: AssetAccessLevel;
  /** Optional tags */
  tags?: string[];
  /** Optional alt text */
  altText?: string;
  /** Optional attribution */
  attribution?: string;
}

/**
 * Asset Upload Response
 * Result of uploading an asset
 */
export interface AssetUploadResponse {
  /** Created asset */
  asset: RpgAsset;
  /** Whether upload was successful */
  success: boolean;
  /** Error message if failed */
  error?: string;
}

/**
 * Asset Query Filters
 * Filters for querying assets
 */
export interface AssetQueryFilters {
  /** Filter by media type */
  mediaType?: AssetMediaType;
  /** Filter by access level */
  accessLevel?: AssetAccessLevel;
  /** Filter by tags (any match) */
  tags?: string[];
  /** Filter by creator */
  createdBy?: string;
  /** Search term (searches name and description) */
  search?: string;
  /** Pagination: page number */
  page?: number;
  /** Pagination: items per page */
  pageSize?: number;
}

/**
 * Helper: Get media type from MIME type
 */
export function getMediaTypeFromMimeType(mimeType: string): AssetMediaType {
  if (mimeType.startsWith('image/')) return AssetMediaType.IMAGE;
  if (mimeType.startsWith('audio/')) return AssetMediaType.AUDIO;
  if (mimeType.startsWith('video/')) return AssetMediaType.VIDEO;
  if (mimeType.startsWith('application/pdf')) return AssetMediaType.DOCUMENT;
  if (mimeType.startsWith('application/json')) return AssetMediaType.DATA;
  return AssetMediaType.OTHER;
}

/**
 * Helper: Check if user can access asset
 */
export function canAccessAsset(
  asset: RpgAsset,
  userTier?: string,
  isAdmin?: boolean,
  userId?: string
): boolean {
  // Check if asset is deleted
  if (asset.deletedAt) return false;

  // Public assets are always accessible
  if (asset.accessLevel === AssetAccessLevel.PUBLIC) return true;

  // Admin can access anything
  if (isAdmin) return true;

  // Private assets only accessible by creator
  if (asset.accessLevel === AssetAccessLevel.PRIVATE) {
    return userId === asset.createdBy;
  }

  // Admin-only assets
  if (asset.accessLevel === AssetAccessLevel.ADMIN) {
    return false; // Already checked isAdmin above
  }

  // Premium assets require premium tier
  if (asset.accessLevel === AssetAccessLevel.PREMIUM) {
    return userTier === 'PREMIUM' || userTier === 'LEGACY';
  }

  // Authenticated assets require login
  if (asset.accessLevel === AssetAccessLevel.AUTHENTICATED) {
    return !!userId;
  }

  return false;
}

/**
 * Helper: Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Helper: Format duration for display
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Example: Image Asset
 *
 * const grassImageAsset: RpgAsset = {
 *   id: 'asset-grass-arena-high-001',
 *   name: 'Grass Tile - Arena Scale - High Res',
 *   description: '5ft grass tile for arena-scale combat',
 *   mediaType: AssetMediaType.IMAGE,
 *   mimeType: 'image/png',
 *   fileSize: 1048576, // 1 MB
 *   storageProvider: AssetStorageProvider.VERCEL_BLOB,
 *   storageUrl: 'https://blob.vercel-storage.com/grass-arena-high-xyz123.png',
 *   storageKey: 'grass-arena-high-xyz123.png',
 *   accessLevel: AssetAccessLevel.PUBLIC,
 *   width: 6000,
 *   height: 6000,
 *   tags: ['terrain', 'grass', 'outdoor', 'arena'],
 *   altText: 'Green grass texture for tabletop gaming',
 *   createdAt: new Date(),
 *   updatedAt: new Date(),
 *   createdBy: 'admin',
 * };
 *
 * Example: Audio Asset
 *
 * const windAudioAsset: RpgAsset = {
 *   id: 'asset-wind-grass-001',
 *   name: 'Wind Through Grass',
 *   description: 'Ambient wind sound for outdoor scenes',
 *   mediaType: AssetMediaType.AUDIO,
 *   mimeType: 'audio/mp3',
 *   fileSize: 524288, // 512 KB
 *   storageProvider: AssetStorageProvider.VERCEL_BLOB,
 *   storageUrl: 'https://blob.vercel-storage.com/wind-grass-xyz456.mp3',
 *   storageKey: 'wind-grass-xyz456.mp3',
 *   accessLevel: AssetAccessLevel.PUBLIC,
 *   duration: 120, // 2 minutes
 *   tags: ['audio', 'ambient', 'wind', 'outdoor'],
 *   createdAt: new Date(),
 *   updatedAt: new Date(),
 *   createdBy: 'admin',
 * };
 */
