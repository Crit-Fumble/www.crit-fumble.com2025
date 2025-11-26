/**
 * Asset Upload API
 *
 * POST /api/assets/upload
 * Upload images or documents to the platform
 *
 * Supported file types:
 * - Images: .png, .jpg, .jpeg, .webp (converted to webp for storage)
 * - Documents: .pdf, .doc, .docx, .md, .txt, .rtf
 *
 * File size limits (role-based):
 * - Regular users: 50MB max per file
 * - Owners: 256MB max per file (supports high-resolution VTT tiles and print-ready with bleed)
 *
 * Resolution guidelines (not enforced, see docs/VTTImageScaleRecomendations.md):
 * - Interaction Scale: 6000x6000 pixels (100 PPI)
 * - Arena/Combat Scale: 60x60 pixels per 5ft square
 * - Print scale: 300 DPI with 0.125" bleed per side
 *
 * Security:
 * - Authentication required
 * - File type validation
 * - No executable or script files allowed
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { put } from '@vercel/blob'
import sharp from 'sharp'
import { randomBytes } from 'crypto'

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
const ALLOWED_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp']

const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/markdown',
  'text/plain',
  'application/rtf',
  'text/rtf',
]
const ALLOWED_DOCUMENT_EXTENSIONS = ['.pdf', '.doc', '.docx', '.md', '.txt', '.rtf']

// File size limits (role-based)
const MAX_FILE_SIZE_DEFAULT = 50 * 1024 * 1024 // 50MB for regular users
const MAX_FILE_SIZE_OWNER = 256 * 1024 * 1024 // 256MB for owners

/**
 * Get the maximum file size for a user based on their role
 */
function getMaxFileSize(isOwner: boolean): number {
  return isOwner ? MAX_FILE_SIZE_OWNER : MAX_FILE_SIZE_DEFAULT
}

// Blocked extensions (security)
const BLOCKED_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.sh', '.ps1', '.vbs', '.js', '.ts', '.jsx', '.tsx',
  '.php', '.py', '.rb', '.pl', '.cgi', '.dll', '.so', '.bin', '.msi', '.jar',
  '.com', '.scr', '.hta', '.wsf', '.wsh', '.reg', '.inf', '.lnk', '.pif',
]

/**
 * Generate a unique shortcode for the asset
 */
function generateShortcode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let result = ''
  const bytes = randomBytes(8)
  for (let i = 0; i < 8; i++) {
    result += chars[bytes[i] % chars.length]
  }
  return result
}

/**
 * Get file extension from filename
 */
function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  if (lastDot === -1) return ''
  return filename.slice(lastDot).toLowerCase()
}

/**
 * Validate file type and extension
 */
function validateFile(
  filename: string,
  mimeType: string,
  size: number,
  maxFileSize: number
): { valid: boolean; error?: string; category?: 'image' | 'document' } {
  const ext = getFileExtension(filename)

  // Check for blocked extensions
  if (BLOCKED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: `File type ${ext} is not allowed for security reasons` }
  }

  // Check file size against role-based limit
  if (size > maxFileSize) {
    return { valid: false, error: `File too large. Maximum size is ${maxFileSize / (1024 * 1024)}MB` }
  }

  // Check if it's an image
  if (ALLOWED_IMAGE_TYPES.includes(mimeType) || ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
    if (!ALLOWED_IMAGE_TYPES.includes(mimeType) && !ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
      return { valid: false, error: `Invalid image type. Allowed: ${ALLOWED_IMAGE_EXTENSIONS.join(', ')}` }
    }
    return { valid: true, category: 'image' }
  }

  // Check if it's a document
  if (ALLOWED_DOCUMENT_TYPES.includes(mimeType) || ALLOWED_DOCUMENT_EXTENSIONS.includes(ext)) {
    if (!ALLOWED_DOCUMENT_TYPES.includes(mimeType) && !ALLOWED_DOCUMENT_EXTENSIONS.includes(ext)) {
      return { valid: false, error: `Invalid document type. Allowed: ${ALLOWED_DOCUMENT_EXTENSIONS.join(', ')}` }
    }
    return { valid: true, category: 'document' }
  }

  return {
    valid: false,
    error: `File type not supported. Allowed images: ${ALLOWED_IMAGE_EXTENSIONS.join(', ')}. Allowed documents: ${ALLOWED_DOCUMENT_EXTENSIONS.join(', ')}`
  }
}

/**
 * Process and convert image to WebP
 */
async function processImage(
  buffer: Buffer,
  originalName: string
): Promise<{ buffer: Buffer; width: number; height: number; mimeType: string }> {
  // Get image metadata
  const metadata = await sharp(buffer).metadata()

  // Convert to WebP with quality optimization
  const processedBuffer = await sharp(buffer)
    .webp({ quality: 85 })
    .toBuffer()

  return {
    buffer: processedBuffer,
    width: metadata.width || 0,
    height: metadata.height || 0,
    mimeType: 'image/webp',
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const user = await prisma.critUser.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const name = formData.get('name') as string | null
    const description = formData.get('description') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Get role-based file size limit
    const maxFileSize = getMaxFileSize(user.isOwner)

    // Validate file
    const validation = validateFile(file.name, file.type, file.size, maxFileSize)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer()
    let buffer = Buffer.from(arrayBuffer)
    let finalMimeType = file.type
    let width: number | null = null
    let height: number | null = null
    let finalFilename = file.name

    // Process image (convert to WebP)
    if (validation.category === 'image') {
      try {
        const processed = await processImage(buffer, file.name)
        buffer = processed.buffer
        width = processed.width
        height = processed.height
        finalMimeType = processed.mimeType
        // Change extension to .webp
        finalFilename = file.name.replace(/\.[^.]+$/, '.webp')
      } catch (imgError) {
        console.error('Image processing error:', imgError)
        return NextResponse.json({ error: 'Failed to process image' }, { status: 400 })
      }
    }

    // Generate unique filename for storage
    const shortcode = generateShortcode()
    const timestamp = Date.now()
    const ext = getFileExtension(finalFilename)
    const storagePath = `assets/${user.id}/${timestamp}-${shortcode}${ext}`

    // Upload to Vercel Blob
    const blob = await put(storagePath, buffer, {
      access: 'public',
      contentType: finalMimeType,
    })

    // Create database record
    const assetName = name || file.name.replace(/\.[^.]+$/, '')
    const asset = await prisma.rpgAsset.create({
      data: {
        name: assetName,
        description: description || null,
        assetType: validation.category === 'image' ? 'image' : 'document',
        url: blob.url,
        mimeType: finalMimeType,
        fileSize: BigInt(buffer.length),
        filename: finalFilename,
        width,
        height,
        uploadedBy: user.id,
        shortcode,
        isPublic: false,
        category: validation.category,
        tags: [],
        metadata: {},
      },
    })

    // Return success response
    return NextResponse.json({
      success: true,
      asset: {
        id: asset.id,
        name: asset.name,
        description: asset.description,
        assetType: asset.assetType,
        url: asset.url,
        mimeType: asset.mimeType,
        fileSize: Number(asset.fileSize),
        filename: asset.filename,
        width: asset.width,
        height: asset.height,
        shortcode: asset.shortcode,
        createdAt: asset.createdAt,
      },
    })
  } catch (error) {
    console.error('Asset upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload asset', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * GET /api/assets/upload
 * Return allowed file types and size limits (role-based)
 */
export async function GET() {
  // Check if user is authenticated and get their role
  const session = await auth()
  let maxFileSize = MAX_FILE_SIZE_DEFAULT
  let isOwner = false

  if (session?.user?.id) {
    const user = await prisma.critUser.findUnique({
      where: { id: session.user.id },
      select: { isOwner: true },
    })
    if (user?.isOwner) {
      maxFileSize = MAX_FILE_SIZE_OWNER
      isOwner = true
    }
  }

  return NextResponse.json({
    allowedTypes: {
      images: {
        extensions: ALLOWED_IMAGE_EXTENSIONS,
        mimeTypes: ALLOWED_IMAGE_TYPES,
        note: 'Images are automatically converted to WebP format for optimal performance',
      },
      documents: {
        extensions: ALLOWED_DOCUMENT_EXTENSIONS,
        mimeTypes: ALLOWED_DOCUMENT_TYPES,
      },
    },
    maxFileSize,
    maxFileSizeLabel: `${maxFileSize / (1024 * 1024)}MB`,
    isOwner,
    blockedExtensions: BLOCKED_EXTENSIONS,
  })
}
