interface SubTab {
  id: string
  label: string
  count?: number
}

interface SubTabsProps {
  tabs: SubTab[]
  activeTab: string
  onTabChange: (tabId: string) => void
}

export function SubTabs({ tabs, activeTab, onTabChange }: SubTabsProps) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === tab.id
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
            }`}
          >
            {tab.label} {tab.count !== undefined && `(${tab.count})`}
          </button>
        ))}
      </nav>
    </div>
  )
}
