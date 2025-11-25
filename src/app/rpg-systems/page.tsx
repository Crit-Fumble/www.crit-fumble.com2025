import { redirect } from 'next/navigation'

// REMOVED: RPG Systems browsing not in March 2026 scope
// Focus is on D&D 5e (L1-20) only for test release
// Multi-system support is planned for Phase 2+ (Q2 2026+)
// See: /docs/agent/future/README.md

export default async function RpgSystemsPage() {
  // Redirect to dashboard - this feature is not yet available
  redirect('/dashboard')
}
