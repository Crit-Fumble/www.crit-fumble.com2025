import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const CORE_URL = process.env.CORE_PUBLIC_URL ?? 'https://core.crit-fumble.com'

export async function GET() {
  try {
    const res = await fetch(`${CORE_URL}/health`, {
      signal: AbortSignal.timeout(5000),
    })
    return NextResponse.json({ ok: res.ok })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
