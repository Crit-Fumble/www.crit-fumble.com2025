import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isOwner } from '@/lib/admin'

// GET - List all RPG systems
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

    const systems = await prisma.rpgSystem.findMany({
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
    console.error('Error fetching RPG systems:', error)
    return NextResponse.json(
      { error: 'Failed to fetch RPG systems' },
      { status: 500 }
    )
  }
}

// POST - Add a new RPG system manually
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
    const { systemId, name, title, description, isCore = false, notes } = body

    if (!systemId || !name || !title) {
      return NextResponse.json(
        { error: 'systemId, name, and title are required' },
        { status: 400 }
      )
    }

    // Validate systemId format (lowercase, numbers, hyphens only)
    if (!/^[a-z0-9-]+$/.test(systemId)) {
      return NextResponse.json(
        { error: 'systemId must contain only lowercase letters, numbers, and hyphens' },
        { status: 400 }
      )
    }

    // Check if system already exists
    const existingSystem = await prisma.rpgSystem.findUnique({
      where: { systemId },
    })

    if (existingSystem && !existingSystem.deletedAt) {
      return NextResponse.json(
        { error: `System ${systemId} already exists` },
        { status: 409 }
      )
    }

    // Create the system
    const system = await prisma.rpgSystem.create({
      data: {
        systemId,
        name,
        title,
        description,
        platforms: {}, // Empty JSON object, can be populated later with Foundry settings
        isEnabled: true,
        isCore,
        priority: isCore ? 100 : 0,
        addedBy: user.id,
        notes,
      },
    })

    return NextResponse.json({ system }, { status: 201 })
  } catch (error) {
    console.error('Error adding RPG system:', error)
    return NextResponse.json(
      { error: 'Failed to add RPG system' },
      { status: 500 }
    )
  }
}
