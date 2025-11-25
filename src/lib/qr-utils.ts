/**
 * QR Code and Shortcode Utilities
 * Handles shortcode generation and QR code overlay for printable assets
 */

import prismaMain from '@/packages/cfg-lib/db-main';

const prisma = prismaMain;

/**
 * Generate a unique shortcode for an asset
 * Format: 6-8 character alphanumeric (uppercase for readability)
 */
export async function generateShortcode(length: number = 6): Promise<string> {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous: 0,O,1,I
  const maxAttempts = 10;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let shortcode = '';
    for (let i = 0; i < length; i++) {
      shortcode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Check if shortcode already exists
    const existing = await prisma.rpgAsset.findUnique({
      where: { shortcode }
    });

    if (!existing) {
      return shortcode;
    }
  }

  // If we couldn't generate a unique code, try with longer length
  if (length < 10) {
    return generateShortcode(length + 1);
  }

  throw new Error('Failed to generate unique shortcode');
}

/**
 * Validate shortcode format
 */
export function validateShortcode(shortcode: string): boolean {
  // 6-10 characters, alphanumeric, uppercase
  return /^[A-Z0-9]{6,10}$/.test(shortcode);
}

/**
 * Generate QR code URL for an asset
 * This creates a URL that points to the asset lookup endpoint
 */
export function generateQRCodeUrl(shortcode: string, baseUrl?: string): string {
  const domain = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://crit-fumble.com';
  return `${domain}/asset/${shortcode}`;
}

/**
 * QR Code generation options for subtle overlay on tiles
 */
export interface QRCodeOptions {
  shortcode: string;
  size?: number;          // QR code size in pixels (default: 64)
  opacity?: number;       // Opacity 0-1 (default: 0.15 for subtle)
  position?: 'corner' | 'center' | 'edge'; // Position on tile
  cornerOffset?: number;  // Offset from corner in pixels
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'; // Default: 'M'
}

/**
 * Default QR code options for tile overlays
 */
export const DEFAULT_QR_OPTIONS: Partial<QRCodeOptions> = {
  size: 64,
  opacity: 0.15,
  position: 'corner',
  cornerOffset: 8,
  errorCorrectionLevel: 'M',
};

/**
 * Generate QR code as data URL
 * This function will use the qrcode package when available
 */
export async function generateQRCodeDataUrl(
  shortcode: string,
  options: Partial<QRCodeOptions> = {}
): Promise<string> {
  const opts = { ...DEFAULT_QR_OPTIONS, ...options };
  const url = generateQRCodeUrl(shortcode);

  try {
    // Dynamically import qrcode to avoid issues if not installed yet
    const QRCode = await import('qrcode');

    return await QRCode.toDataURL(url, {
      width: opts.size,
      margin: 1,
      errorCorrectionLevel: opts.errorCorrectionLevel,
      color: {
        dark: '#000000',
        light: '#FFFFFF00', // Transparent background
      },
    });
  } catch (error) {
    console.error('Failed to generate QR code:', error);
    throw new Error('QR code generation failed. Ensure qrcode package is installed.');
  }
}

/**
 * Calculate QR code position on tile
 */
export function calculateQRPosition(
  tileWidth: number,
  tileHeight: number,
  qrSize: number,
  position: 'corner' | 'center' | 'edge' = 'corner',
  cornerOffset: number = 8
): { x: number; y: number } {
  switch (position) {
    case 'corner':
      // Bottom-right corner
      return {
        x: tileWidth - qrSize - cornerOffset,
        y: tileHeight - qrSize - cornerOffset,
      };
    case 'center':
      return {
        x: (tileWidth - qrSize) / 2,
        y: (tileHeight - qrSize) / 2,
      };
    case 'edge':
      // Bottom edge, centered
      return {
        x: (tileWidth - qrSize) / 2,
        y: tileHeight - qrSize - cornerOffset,
      };
    default:
      return calculateQRPosition(tileWidth, tileHeight, qrSize, 'corner', cornerOffset);
  }
}

/**
 * Lookup asset by shortcode
 */
export async function lookupAssetByShortcode(shortcode: string) {
  if (!validateShortcode(shortcode)) {
    return null;
  }

  return await prisma.rpgAsset.findUnique({
    where: { shortcode: shortcode.toUpperCase() },
    include: {
      uploader: {
        select: {
          id: true,
          userId: true,
        },
      },
      world: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}
