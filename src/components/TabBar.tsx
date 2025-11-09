import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { SortableTab } from './SortableTab'
import type { Tab } from '../types'

type TabBarProps = {
  tabs: Tab[]
  activeTab: number
  onTabChange: (tabIndex: number) => void
  onAddTab: () => void
  onEditTab: (tab: Tab) => void
  onDeleteTab: (tab: Tab) => void
}

export function TabBar({
  tabs,
  activeTab,
  onTabChange,
  onAddTab,
  onEditTab,
  onDeleteTab
}: TabBarProps) {
  return (
    <div className="flex gap-2 overflow-x-auto">
      <SortableContext
        items={tabs.map(tab => tab.id)}
        strategy={horizontalListSortingStrategy}
      >
        {tabs.map((tab) => (
          <SortableTab
            key={tab.id}
            tab={tab}
            isActive={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
            onEdit={onEditTab}
            onDelete={onDeleteTab}
          />
        ))}
      </SortableContext>
      <button
        onClick={onAddTab}
        className="px-4 py-3 font-medium transition-all bg-gray-200 text-gray-600 hover:bg-gray-300 flex-shrink-0"
        title="新しいボードを追加"
      >
        +
      </button>
    </div>
  )
}
