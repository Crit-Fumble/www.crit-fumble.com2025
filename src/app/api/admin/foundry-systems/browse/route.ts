import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isOwner } from '@/lib/admin'

const FOUNDRY_PACKAGE_API = 'https://foundryvtt.com/api/packages'

// GET - Browse available Foundry VTT systems from the official package repository
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

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || 'system' // 'system' or 'module'

    // Fetch from Foundry's package API
    const response = await fetch(`${FOUNDRY_PACKAGE_API}?type=${type}`)

    if (!response.ok) {
      throw new Error('Failed to fetch from Foundry package repository')
    }

    const data = await response.json()
    let packages = data.packages || []

    // Filter by search term if provided
    if (search) {
      const searchLower = search.toLowerCase()
      packages = packages.filter((pkg: any) =>
        pkg.title?.toLowerCase().includes(searchLower) ||
        pkg.name?.toLowerCase().includes(searchLower) ||
        pkg.description?.toLowerCase().includes(searchLower) ||
        pkg.author?.toLowerCase().includes(searchLower)
      )
    }

    // Get currently enabled systems
    const enabledSystems = await prisma.foundryGameSystem.findMany({
      where: { deletedAt: null, isEnabled: true },
      select: { systemId: true },
    })
    const enabledSystemIds = new Set(enabledSystems.map(s => s.systemId))

    // Add enabled status to packages
    packages = packages.map((pkg: any) => ({
      ...pkg,
      isEnabled: enabledSystemIds.has(pkg.name || pkg.id),
    }))

    // Sort: enabled first, then by title
    packages.sort((a: any, b: any) => {
      if (a.isEnabled && !b.isEnabled) return -1
      if (!a.isEnabled && b.isEnabled) return 1
      return (a.title || a.name || '').localeCompare(b.title || b.name || '')
    })

    return NextResponse.json({ packages, total: packages.length })
  } catch (error) {
    console.error('Error browsing Foundry packages:', error)
    return NextResponse.json(
      { error: 'Failed to browse Foundry packages' },
      { status: 500 }
    )
  }
}
