import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isOwner } from '@/lib/admin'

// PATCH - Update a Foundry game system
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ systemId: string }> }
) {
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

    const { systemId } = await params
    const body = await request.json()
    const { isEnabled, isCore, priority, notes, refreshManifest } = body

    const system = await prisma.foundryGameSystem.findUnique({
      where: { systemId },
    })

    if (!system || system.deletedAt) {
      return NextResponse.json({ error: 'System not found' }, { status: 404 })
    }

    // If refreshManifest is true, fetch and update from manifest
    let updateData: any = {}

    if (refreshManifest) {
      try {
        const manifestResponse = await fetch(system.manifestUrl)
        if (manifestResponse.ok) {
          const manifest = await manifestResponse.json()

          const compatibility = {
            minimum: manifest.compatibility?.minimum || manifest.minimumCoreVersion,
            verified: manifest.compatibility?.verified || manifest.compatibleCoreVersion,
            maximum: manifest.compatibility?.maximum,
          }

          updateData = {
            name: manifest.name || system.name,
            title: manifest.title || system.title,
            version: manifest.version || system.version,
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
          }
        }
      } catch (error) {
        console.error('Error refreshing manifest:', error)
        // Continue with other updates even if refresh fails
      }
    }

    // Apply field updates
    if (typeof isEnabled === 'boolean') {
      updateData.isEnabled = isEnabled
    }
    if (typeof isCore === 'boolean') {
      updateData.isCore = isCore
    }
    if (typeof priority === 'number') {
      updateData.priority = priority
    }
    if (notes !== undefined) {
      updateData.notes = notes
    }

    const updatedSystem = await prisma.foundryGameSystem.update({
      where: { systemId },
      data: updateData,
    })

    return NextResponse.json({ system: updatedSystem })
  } catch (error) {
    console.error('Error updating Foundry game system:', error)
    return NextResponse.json(
      { error: 'Failed to update game system' },
      { status: 500 }
    )
  }
}

// DELETE - Soft delete a Foundry game system
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ systemId: string }> }
) {
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

    const { systemId } = await params

    const system = await prisma.foundryGameSystem.findUnique({
      where: { systemId },
    })

    if (!system || system.deletedAt) {
      return NextResponse.json({ error: 'System not found' }, { status: 404 })
    }

    await prisma.foundryGameSystem.update({
      where: { systemId },
      data: {
        deletedAt: new Date(),
        isEnabled: false,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting Foundry game system:', error)
    return NextResponse.json(
      { error: 'Failed to delete game system' },
      { status: 500 }
    )
  }
}
