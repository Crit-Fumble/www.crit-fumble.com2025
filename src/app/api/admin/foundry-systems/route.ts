import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isOwner } from '@/lib/admin'

// GET - List all Foundry game systems
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.critUser.findUnique({
      where: { id: session.user.id },
    })

    if (!user || !isOwner(user)) {
      return NextResponse.json({ error: 'Forbidden - Owner access required' }, { status: 403 })
    }

    const systems = await prisma.foundryGameSystem.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: [
        { priority: 'desc' },
        { isCore: 'desc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json({ systems })
  } catch (error) {
    console.error('Error fetching Foundry game systems:', error)
    return NextResponse.json(
      { error: 'Failed to fetch game systems' },
      { status: 500 }
    )
  }
}

// POST - Add a new Foundry game system by manifest URL
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.critUser.findUnique({
      where: { id: session.user.id },
    })

    if (!user || !isOwner(user)) {
      return NextResponse.json({ error: 'Forbidden - Owner access required' }, { status: 403 })
    }

    const body = await request.json()
    const { manifestUrl, isCore = false, notes } = body

    if (!manifestUrl) {
      return NextResponse.json(
        { error: 'Manifest URL is required' },
        { status: 400 }
      )
    }

    // Fetch the manifest
    const manifestResponse = await fetch(manifestUrl)
    if (!manifestResponse.ok) {
      return NextResponse.json(
        { error: `Failed to fetch manifest: ${manifestResponse.statusText}` },
        { status: 400 }
      )
    }

    const manifest = await manifestResponse.json()

    // Validate required fields
    if (!manifest.id && !manifest.name) {
      return NextResponse.json(
        { error: 'Invalid manifest: missing id or name field' },
        { status: 400 }
      )
    }

    const systemId = manifest.id || manifest.name
    const systemName = manifest.name || manifest.id
    const systemTitle = manifest.title || systemName

    // Check if system already exists
    const existingSystem = await prisma.foundryGameSystem.findUnique({
      where: { systemId },
    })

    if (existingSystem && !existingSystem.deletedAt) {
      return NextResponse.json(
        { error: `System ${systemId} already exists` },
        { status: 409 }
      )
    }

    // Parse compatibility
    const compatibility = {
      minimum: manifest.compatibility?.minimum || manifest.minimumCoreVersion,
      verified: manifest.compatibility?.verified || manifest.compatibleCoreVersion,
      maximum: manifest.compatibility?.maximum,
    }

    // Create or update the system
    const system = await prisma.foundryGameSystem.upsert({
      where: { systemId },
      create: {
        systemId,
        name: systemName,
        title: systemTitle,
        manifestUrl,
        version: manifest.version || '0.0.0',
        compatibility,
        description: manifest.description,
        author: typeof manifest.author === 'string' ? manifest.author : manifest.author?.name,
        authors: Array.isArray(manifest.authors) ? manifest.authors : [],
        url: manifest.url,
        manifest: manifest.manifest,
        download: manifest.download,
        bugs: manifest.bugs,
        changelog: manifest.changelog,
        readme: manifest.readme,
        license: manifest.license,
        media: Array.isArray(manifest.media) ? manifest.media : [],
        manifestData: manifest,
        isEnabled: true,
        isCore,
        addedBy: user.id,
        notes,
      },
      update: {
        name: systemName,
        title: systemTitle,
        manifestUrl,
        version: manifest.version || '0.0.0',
        compatibility,
        description: manifest.description,
        author: typeof manifest.author === 'string' ? manifest.author : manifest.author?.name,
        authors: Array.isArray(manifest.authors) ? manifest.authors : [],
        url: manifest.url,
        manifest: manifest.manifest,
        download: manifest.download,
        bugs: manifest.bugs,
        changelog: manifest.changelog,
        readme: manifest.readme,
        license: manifest.license,
        media: Array.isArray(manifest.media) ? manifest.media : [],
        manifestData: manifest,
        deletedAt: null,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ system }, { status: 201 })
  } catch (error) {
    console.error('Error adding Foundry game system:', error)
    return NextResponse.json(
      { error: 'Failed to add game system' },
      { status: 500 }
    )
  }
}
