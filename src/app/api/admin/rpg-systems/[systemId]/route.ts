import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isOwner } from '@/lib/admin'

// PATCH - Update an RPG system
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
    const { isEnabled, isCore, priority, notes, foundrySettings } = body

    const system = await prisma.rpgSystem.findUnique({
      where: { systemId },
    })

    if (!system || system.deletedAt) {
      return NextResponse.json({ error: 'System not found' }, { status: 404 })
    }

    let updateData: any = {}

    // If foundrySettings is provided, update the platforms.foundry field
    if (foundrySettings !== undefined) {
      const currentPlatforms = (system.platforms as any) || {}

      // If foundrySettings has a manifestUrl, fetch and parse it
      if (foundrySettings.manifestUrl) {
        try {
          const manifestResponse = await fetch(foundrySettings.manifestUrl)
          if (manifestResponse.ok) {
            const manifest = await manifestResponse.json()

            const author = typeof manifest.author === 'string'
              ? manifest.author
              : manifest.author?.name || manifest.authors?.[0]?.name

            // Update system metadata from manifest
            updateData.name = manifest.name || system.name
            updateData.title = manifest.title || system.title
            updateData.description = manifest.description
            updateData.version = manifest.version || system.version
            updateData.author = author
            updateData.publisher = author
            updateData.license = manifest.license

            // Build Foundry platform data with manifest + user settings
            updateData.platforms = {
              ...currentPlatforms,
              foundry: {
                manifestUrl: foundrySettings.manifestUrl,
                modules: foundrySettings.modules || [],
                version: manifest.version || '0.0.0',
                compatibility: {
                  minimum: manifest.compatibility?.minimum || manifest.minimumCoreVersion,
                  verified: manifest.compatibility?.verified || manifest.compatibleCoreVersion,
                  maximum: manifest.compatibility?.maximum,
                },
                url: manifest.url,
                manifest: manifest.manifest,
                download: manifest.download,
                bugs: manifest.bugs,
                changelog: manifest.changelog,
                readme: manifest.readme,
                media: Array.isArray(manifest.media) ? manifest.media : [],
                fullManifest: manifest,
              },
            }
          } else {
            // Manifest fetch failed, just save the URL and modules
            updateData.platforms = {
              ...currentPlatforms,
              foundry: {
                manifestUrl: foundrySettings.manifestUrl,
                modules: foundrySettings.modules || [],
              },
            }
          }
        } catch (error) {
          console.error('Error fetching Foundry manifest:', error)
          // Save settings anyway without manifest data
          updateData.platforms = {
            ...currentPlatforms,
            foundry: {
              manifestUrl: foundrySettings.manifestUrl,
              modules: foundrySettings.modules || [],
            },
          }
        }
      } else {
        // No manifestUrl, just update modules
        updateData.platforms = {
          ...currentPlatforms,
          foundry: {
            ...(currentPlatforms.foundry || {}),
            modules: foundrySettings.modules || [],
          },
        }
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

    const updatedSystem = await prisma.rpgSystem.update({
      where: { systemId },
      data: updateData,
    })

    return NextResponse.json({ system: updatedSystem })
  } catch (error) {
    console.error('Error updating RPG system:', error)
    return NextResponse.json(
      { error: 'Failed to update RPG system' },
      { status: 500 }
    )
  }
}

// DELETE - Soft delete an RPG system
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

    const system = await prisma.rpgSystem.findUnique({
      where: { systemId },
    })

    if (!system || system.deletedAt) {
      return NextResponse.json({ error: 'System not found' }, { status: 404 })
    }

    await prisma.rpgSystem.update({
      where: { systemId },
      data: {
        deletedAt: new Date(),
        isEnabled: false,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting RPG system:', error)
    return NextResponse.json(
      { error: 'Failed to delete RPG system' },
      { status: 500 }
    )
  }
}
