import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getUserRole, canEditWiki } from '@/lib/permissions'
import { WikiDashboard } from './WikiDashboard'

export default async function DashboardPage() {
  const session = await auth()

  // Require login
  if (!session?.user?.id) {
    redirect('/api/auth/signin?callbackUrl=/dashboard')
  }

  // Get user's role
  const { role } = await getUserRole(session.user.id)
  const canEdit = canEditWiki(role)

  return (
    <div className="min-h-screen bg-slate-950">
      <WikiDashboard
        user={{
          id: session.user.id,
          name: session.user.name ?? 'User',
          image: session.user.image ?? null,
        }}
        role={role}
        canEdit={canEdit}
      />
    </div>
  )
}
