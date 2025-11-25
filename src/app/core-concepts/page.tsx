import { redirect } from 'next/navigation'

// REMOVED: Core Concepts API not in March 2026 scope
// This was for advanced game mechanics (cosmic scales, timelines, etc.)
// Advanced mechanics are planned for Phase 6+ (2027+)
// See: /docs/agent/future/README.md

export default async function CoreConceptsPage() {
  // Redirect to dashboard - this feature is not yet available
  redirect('/dashboard')
}
