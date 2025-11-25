'use client'

interface AdminDashboardTabsProps {
  discordContent: React.ReactNode
}

export function AdminDashboardTabs({
  discordContent,
}: AdminDashboardTabsProps) {
  return (
    <div className="w-full" data-testid="admin-dashboard-tabs">
      {/* Discord Content */}
      <div className="w-full" data-testid="tab-content-discord">
        {discordContent}
      </div>
    </div>
  )
}
