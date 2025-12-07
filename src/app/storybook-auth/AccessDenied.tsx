'use client'

import { useRouter } from 'next/navigation'
import { EmptyState } from '@crit-fumble/react/shared'

export function AccessDenied() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <EmptyState
        icon="🔒"
        title="Access Denied"
        description="You need admin or owner permissions to access the component library."
        actionLabel="Back to Dashboard"
        onAction={() => router.push('/dashboard')}
      />
    </div>
  )
}
