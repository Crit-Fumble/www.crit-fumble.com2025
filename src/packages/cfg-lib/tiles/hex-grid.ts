/**
 * Hex Grid Utilities
 * Based on Red Blob Games hex grid guide
 * https://www.redblobgames.com/grids/hexagons/
 */

import { HexCoordinate, AxialHexCoordinate } from '@/types/tiles'

// ============================================================================
// Coordinate Conversion
// ============================================================================

/**
 * Convert offset coordinates to axial coordinates
 * Using "odd-r" horizontal layout (odd rows shifted right)
 */
export function offsetToAxial(offset: HexCoordinate): AxialHexCoordinate {
  const q = offset.col - (offset.row - (offset.row & 1)) / 2
  const r = offset.row
  return { q, r }
}

/**
 * Convert axial coordinates to offset coordinates
 */
export function axialToOffset(axial: AxialHexCoordinate): HexCoordinate {
  const col = axial.q + (axial.r - (axial.r & 1)) / 2
  const row = axial.r
  return { col, row }
}

/**
 * Convert axial to cube coordinates (for easier math)
 */
export function axialToCube(axial: AxialHexCoordinate) {
  const q = axial.q
  const r = axial.r
  const s = -q - r
  return { q, r, s }
}

/**
 * Convert cube to axial coordinates
 */
export function cubeToAxial(cube: { q: number; r: number; s: number }): AxialHexCoordinate {
  return { q: cube.q, r: cube.r }
}

// ============================================================================
// Distance & Navigation
// ============================================================================

/**
 * Calculate distance between two hexes (in hex steps)
 */
export function hexDistance(a: HexCoordinate, b: HexCoordinate): number {
  const axialA = offsetToAxial(a)
  const axialB = offsetToAxial(b)

  const cubeA = axialToCube(axialA)
  const cubeB = axialToCube(axialB)

  return (
    Math.abs(cubeA.q - cubeB.q) +
    Math.abs(cubeA.r - cubeB.r) +
    Math.abs(cubeA.s - cubeB.s)
  ) / 2
}

/**
 * Get all hexes within a certain range
 */
export function hexRange(center: HexCoordinate, range: number): HexCoordinate[] {
  const results: HexCoordinate[] = []
  const axialCenter = offsetToAxial(center)
  const cubeCenter = axialToCube(axialCenter)

  for (let q = -range; q <= range; q++) {
    for (let r = Math.max(-range, -q - range); r <= Math.min(range, -q + range); r++) {
      const s = -q - r
      const cubeCoord = {
        q: cubeCenter.q + q,
        r: cubeCenter.r + r,
        s: cubeCenter.s + s,
      }
      const axialCoord = cubeToAxial(cubeCoord)
      results.push(axialToOffset(axialCoord))
    }
  }

  return results
}

/**
 * Get the 6 neighbors of a hex
 */
export function hexNeighbors(hex: HexCoordinate): HexCoordinate[] {
  const axial = offsetToAxial(hex)
  const cube = axialToCube(axial)

  // Cube direction vectors for 6 neighbors
  const directions = [
    { q: +1, r: 0, s: -1 },
    { q: +1, r: -1, s: 0 },
    { q: 0, r: -1, s: +1 },
    { q: -1, r: 0, s: +1 },
    { q: -1, r: +1, s: 0 },
    { q: 0, r: +1, s: -1 },
  ]

  return directions.map(dir => {
    const neighborCube = {
      q: cube.q + dir.q,
      r: cube.r + dir.r,
      s: cube.s + dir.s,
    }
    return axialToOffset(cubeToAxial(neighborCube))
  })
}

// ============================================================================
// Pixel Conversion (for rendering)
// ============================================================================

export interface HexLayout {
  size: number       // Hex size (point-to-point)
  originX: number    // Origin pixel x
  originY: number    // Origin pixel y
}

/**
 * Convert hex coordinate to pixel position (center of hex)
 */
export function hexToPixel(hex: HexCoordinate, layout: HexLayout): { x: number; y: number } {
  const axial = offsetToAxial(hex)

  // Flat-top hex orientation
  const x = layout.size * (3/2 * axial.q)
  const y = layout.size * (Math.sqrt(3)/2 * axial.q + Math.sqrt(3) * axial.r)

  return {
    x: x + layout.originX,
    y: y + layout.originY,
  }
}

/**
 * Convert pixel position to hex coordinate (nearest hex)
 */
export function pixelToHex(x: number, y: number, layout: HexLayout): HexCoordinate {
  // Remove origin offset
  const relX = x - layout.originX
  const relY = y - layout.originY

  // Convert to fractional axial coordinates
  const q = (2/3 * relX) / layout.size
  const r = (-1/3 * relX + Math.sqrt(3)/3 * relY) / layout.size

  // Convert to cube and round
  const cube = axialToCube({ q, r })
  const rounded = roundCube(cube)

  // Convert back to offset
  return axialToOffset(cubeToAxial(rounded))
}

/**
 * Round fractional cube coordinates to nearest integer cube
 */
function roundCube(cube: { q: number; r: number; s: number }) {
  let q = Math.round(cube.q)
  let r = Math.round(cube.r)
  let s = Math.round(cube.s)

  const qDiff = Math.abs(q - cube.q)
  const rDiff = Math.abs(r - cube.r)
  const sDiff = Math.abs(s - cube.s)

  // Fix rounding errors (q + r + s must equal 0)
  if (qDiff > rDiff && qDiff > sDiff) {
    q = -r - s
  } else if (rDiff > sDiff) {
    r = -q - s
  } else {
    s = -q - r
  }

  return { q, r, s }
}

// ============================================================================
// Pathfinding
// ============================================================================

/**
 * Find shortest path between two hexes using A* algorithm
 * blockedHexes: Set of hex keys that cannot be traversed
 */
export function hexPathfind(
  start: HexCoordinate,
  goal: HexCoordinate,
  blockedHexes: Set<string> = new Set()
): HexCoordinate[] | null {
  const hexKey = (hex: HexCoordinate) => `${hex.col},${hex.row}`

  if (blockedHexes.has(hexKey(start)) || blockedHexes.has(hexKey(goal))) {
    return null
  }

  const openSet = new Set<string>([hexKey(start)])
  const cameFrom = new Map<string, HexCoordinate>()

  const gScore = new Map<string, number>()
  gScore.set(hexKey(start), 0)

  const fScore = new Map<string, number>()
  fScore.set(hexKey(start), hexDistance(start, goal))

  while (openSet.size > 0) {
    // Find hex in openSet with lowest fScore
    let current: string | null = null
    let lowestF = Infinity

    for (const key of openSet) {
      const f = fScore.get(key) ?? Infinity
      if (f < lowestF) {
        lowestF = f
        current = key
      }
    }

    if (!current) break

    const [col, row] = current.split(',').map(Number)
    const currentHex = { col, row }

    // Check if we reached the goal
    if (hexKey(currentHex) === hexKey(goal)) {
      // Reconstruct path
      const path: HexCoordinate[] = [currentHex]
      let temp = current

      while (cameFrom.has(temp)) {
        const prev = cameFrom.get(temp)!
        path.unshift(prev)
        temp = hexKey(prev)
      }

      return path
    }

    openSet.delete(current)

    // Check all neighbors
    for (const neighbor of hexNeighbors(currentHex)) {
      const neighborKey = hexKey(neighbor)

      if (blockedHexes.has(neighborKey)) continue

      const tentativeGScore = (gScore.get(current) ?? Infinity) + 1

      if (tentativeGScore < (gScore.get(neighborKey) ?? Infinity)) {
        cameFrom.set(neighborKey, currentHex)
        gScore.set(neighborKey, tentativeGScore)
        fScore.set(neighborKey, tentativeGScore + hexDistance(neighbor, goal))

        if (!openSet.has(neighborKey)) {
          openSet.add(neighborKey)
        }
      }
    }
  }

  // No path found
  return null
}

// ============================================================================
// Hex Drawing (for canvas rendering)
// ============================================================================

/**
 * Get polygon points for drawing a hex
 * Returns array of [x, y] points for a flat-top hex
 */
export function hexCorners(hex: HexCoordinate, layout: HexLayout): [number, number][] {
  const center = hexToPixel(hex, layout)
  const corners: [number, number][] = []

  for (let i = 0; i < 6; i++) {
    const angleDeg = 60 * i
    const angleRad = (Math.PI / 180) * angleDeg
    const x = center.x + layout.size * Math.cos(angleRad)
    const y = center.y + layout.size * Math.sin(angleRad)
    corners.push([x, y])
  }

  return corners
}

/**
 * Draw a hex on canvas
 */
export function drawHex(
  ctx: CanvasRenderingContext2D,
  hex: HexCoordinate,
  layout: HexLayout,
  fillStyle?: string,
  strokeStyle?: string
) {
  const corners = hexCorners(hex, layout)

  ctx.beginPath()
  ctx.moveTo(corners[0][0], corners[0][1])

  for (let i = 1; i < corners.length; i++) {
    ctx.lineTo(corners[i][0], corners[i][1])
  }

  ctx.closePath()

  if (fillStyle) {
    ctx.fillStyle = fillStyle
    ctx.fill()
  }

  if (strokeStyle) {
    ctx.strokeStyle = strokeStyle
    ctx.stroke()
  }
}

// ============================================================================
// Field of View / Line of Sight
// ============================================================================

/**
 * Get line of hexes from start to end (Bresenham-like)
 */
export function hexLine(start: HexCoordinate, end: HexCoordinate): HexCoordinate[] {
  const distance = hexDistance(start, end)
  if (distance === 0) return [start]

  const results: HexCoordinate[] = []
  const startAxial = offsetToAxial(start)
  const endAxial = offsetToAxial(end)

  for (let i = 0; i <= distance; i++) {
    const t = i / distance
    const lerpQ = startAxial.q + (endAxial.q - startAxial.q) * t
    const lerpR = startAxial.r + (endAxial.r - startAxial.r) * t

    const cube = axialToCube({ q: lerpQ, r: lerpR })
    const rounded = roundCube(cube)
    const axial = cubeToAxial(rounded)

    results.push(axialToOffset(axial))
  }

  return results
}

/**
 * Check if there's line of sight between two hexes
 * blockedHexes: Set of hex keys that block vision
 */
export function hasLineOfSight(
  start: HexCoordinate,
  end: HexCoordinate,
  blockedHexes: Set<string>
): boolean {
  const line = hexLine(start, end)

  // Don't check start and end hexes themselves
  for (let i = 1; i < line.length - 1; i++) {
    const hex = line[i]
    const key = `${hex.col},${hex.row}`
    if (blockedHexes.has(key)) {
      return false
    }
  }

  return true
}

/**
 * Get all hexes visible from a position (within range and not blocked)
 */
export function hexFieldOfView(
  origin: HexCoordinate,
  range: number,
  blockedHexes: Set<string>
): HexCoordinate[] {
  const visible: HexCoordinate[] = []
  const hexesInRange = hexRange(origin, range)

  for (const hex of hexesInRange) {
    if (hasLineOfSight(origin, hex, blockedHexes)) {
      visible.push(hex)
    }
  }

  return visible
}
