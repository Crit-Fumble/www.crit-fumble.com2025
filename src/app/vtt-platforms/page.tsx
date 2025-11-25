import { redirect } from 'next/navigation'

// REMOVED: VTT platform integrations not in March 2026 scope
// Building our own VTT takes priority over FoundryVTT integration
// FoundryVTT integration is planned for Phase 5+ (2027+)
// See: /docs/agent/future/README.md

export default async function VttPlatformsPage() {
  // Redirect to dashboard - this feature is not yet available
  redirect('/dashboard')
}
