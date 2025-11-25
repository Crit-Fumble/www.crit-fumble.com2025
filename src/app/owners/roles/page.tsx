import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Header } from '@/components/organisms/Header'
import { isOwner } from '@/lib/admin'
import { parseRoles, getRoleInfo, type UserRole } from '@/lib/permissions'

const ALL_ROLES: UserRole[] = ['Player', 'GameMaster', 'Storyteller', 'Worldbuilder', 'Creator', 'Moderator', 'Admin']

async function getCritCoinBalance(playerId: string): Promise<number> {
  const transactions = await prisma.critCoinTransaction.findMany({
    where: { playerId },
    select: {
      transactionType: true,
      amount: true,
    },
  })

  return transactions.reduce((balance: number, tx) => {
    return tx.transactionType === 'credit' ? balance + tx.amount : balance - tx.amount
  }, 0)
}

export default async function RoleManagementPage() {
  const session = await auth()

  // Require authentication
  if (!session?.user) {
    redirect('/login')
  }

  // Get user from database
  const user = await prisma.critUser.findUnique({
    where: { id: session.user.id },
  })

  // Require owner access
  if (!user || !isOwner(user)) {
    redirect('/dashboard')
  }

  // Get Crit-Coin balance for header
  const critCoinBalance = await getCritCoinBalance(user.id)

  // Get all users with their roles
  const users = await prisma.critUser.findMany({
    where: {
      deletedAt: null,
    },
    orderBy: {
      username: 'asc',
    },
    select: {
      id: true,
      username: true,
      email: true,
      isAdmin: true,
      isOwner: true,
      roles: true,
      createdAt: true,
    },
    take: 100,
  })

  return (
    <>
      <Header critCoinBalance={critCoinBalance} />
      <div className="min-h-screen relative overflow-hidden overflow-x-hidden" data-testid="role-management-page">
        {/* Background Image */}
        <div className="absolute inset-0 bg-dice-hero bg-cover bg-center bg-no-repeat" />

        {/* Overlay for better readability */}
        <div className="absolute inset-0 bg-black/30" />

        {/* Content */}
        <div className="relative z-10 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            {/* Header */}
            <div className="mb-8" data-testid="role-management-header">
              <div className="bg-crit-purple-600 rounded-t-lg px-4 sm:px-8 py-4 sm:py-6">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-display font-bold text-white break-words" data-testid="role-management-title">
                  Role Management
                </h1>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-b-lg px-4 sm:px-8 py-3 sm:py-4">
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300" data-testid="role-management-description">
                  Grant and manage user roles. Owners have all roles by default.
                </p>
              </div>
            </div>

            {/* Role Descriptions */}
            <div className="mb-8 bg-white dark:bg-slate-900 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Available Roles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ALL_ROLES.map((role) => {
                  const info = getRoleInfo(role)
                  return (
                    <div key={role} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className={`inline-block px-3 py-1 rounded text-sm font-medium mb-2 ${info.color}`}>
                        {info.name}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{info.description}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Users List */}
            <section data-testid="users-list-section">
              <div className="bg-white dark:bg-slate-900 rounded-lg px-4 sm:px-8 py-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Users ({users.length})</h2>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-2 text-gray-700 dark:text-gray-300 font-semibold">User</th>
                        <th className="text-left py-3 px-2 text-gray-700 dark:text-gray-300 font-semibold">Status</th>
                        <th className="text-left py-3 px-2 text-gray-700 dark:text-gray-300 font-semibold">Roles</th>
                        <th className="text-left py-3 px-2 text-gray-700 dark:text-gray-300 font-semibold">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => {
                        const userRoles = parseRoles(u.roles)
                        return (
                          <tr
                            key={u.id}
                            className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-slate-800/50"
                          >
                            <td className="py-3 px-2">
                              <div className="font-medium text-gray-900 dark:text-white">{u.username}</div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">{u.email}</div>
                            </td>
                            <td className="py-3 px-2">
                              {u.isOwner && (
                                <span className="px-2 py-1 bg-red-600 text-white rounded text-xs font-medium">
                                  Owner
                                </span>
                              )}
                              {!u.isOwner && u.isAdmin && (
                                <span className="px-2 py-1 bg-crit-purple-600 text-white rounded text-xs font-medium">
                                  Admin
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-2">
                              {u.isOwner ? (
                                <span className="text-xs text-gray-500 dark:text-gray-400 italic">All roles</span>
                              ) : userRoles.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {userRoles.map((role) => {
                                    const info = getRoleInfo(role)
                                    return (
                                      <span
                                        key={role}
                                        className={`px-2 py-1 rounded text-xs font-medium ${info.color}`}
                                      >
                                        {info.name}
                                      </span>
                                    )
                                  })}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-500 dark:text-gray-400">No roles</span>
                              )}
                            </td>
                            <td className="py-3 px-2 text-gray-600 dark:text-gray-400 text-xs">
                              {new Date(u.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Future Enhancement Notice */}
            <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Interactive Role Management
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                This feature is not yet available. For now, roles can be managed via the database or API.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
