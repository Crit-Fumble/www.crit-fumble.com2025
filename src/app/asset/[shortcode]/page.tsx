/**
 * Asset Lookup Page by Shortcode
 * This page is accessed when someone scans a QR code on a printed tile
 */

import { notFound, redirect } from 'next/navigation';
import { lookupAssetByShortcode } from '@/lib/qr-utils';

interface PageProps {
  params: Promise<{ shortcode: string }>;
}

export default async function AssetLookupPage({ params }: PageProps) {
  const { shortcode } = await params;

  // Lookup the asset
  const asset = await lookupAssetByShortcode(shortcode.toUpperCase());

  if (!asset) {
    notFound();
  }

  // Redirect to the asset details page or display info
  // For now, we'll create a simple display page
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg text-2xl font-bold mb-4">
              {shortcode}
            </div>
            <h1 className="text-4xl font-display font-bold mb-2">
              {asset.name}
            </h1>
            {asset.description && (
              <p className="text-xl text-blue-200">{asset.description}</p>
            )}
          </div>

          {/* Asset Image */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 mb-8">
            <div className="relative aspect-square max-w-2xl mx-auto">
              <img
                src={asset.url}
                alt={asset.name}
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
          </div>

          {/* Asset Details */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 space-y-4">
            <h2 className="text-2xl font-bold mb-4">Asset Details</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-blue-200">Type</div>
                <div className="font-semibold capitalize">{asset.assetType}</div>
              </div>

              {asset.category && (
                <div>
                  <div className="text-sm text-blue-200">Category</div>
                  <div className="font-semibold capitalize">{asset.category}</div>
                </div>
              )}

              {asset.width && asset.height && (
                <div>
                  <div className="text-sm text-blue-200">Dimensions</div>
                  <div className="font-semibold">{asset.width} × {asset.height}px</div>
                </div>
              )}

              {asset.world && (
                <div>
                  <div className="text-sm text-blue-200">World</div>
                  <div className="font-semibold">{asset.world.name}</div>
                </div>
              )}
            </div>

            {asset.tags && asset.tags.length > 0 && (
              <div>
                <div className="text-sm text-blue-200 mb-2">Tags</div>
                <div className="flex flex-wrap gap-2">
                  {asset.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-blue-600 px-3 py-1 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex gap-4 justify-center">
            <a
              href={asset.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              View Full Size
            </a>
            <a
              href={`/api/rpg/assets/print?id=${asset.id}`}
              download
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Download Print Version
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { shortcode } = await params;
  const asset = await lookupAssetByShortcode(shortcode.toUpperCase());

  if (!asset) {
    return {
      title: 'Asset Not Found',
    };
  }

  return {
    title: `${asset.name} - ${shortcode}`,
    description: asset.description || `View details for asset ${shortcode}`,
  };
}
