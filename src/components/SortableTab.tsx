import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Tab } from '../types'

type SortableTabProps = {
  tab: Tab
  isActive: boolean
  onClick: () => void
  onEdit: (tab: Tab) => void
  onDelete: (tab: Tab) => void
}

export function SortableTab({
  tab,
  isActive,
  onClick,
  onEdit,
  onDelete
}: SortableTabProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: tab.id,
    data: {
      type: 'tab',
      tab,
    }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        backgroundColor: isActive ? (tab.color || '#ffffff') : '#e5e7eb',
      }}
      {...attributes}
      {...listeners}
      onClick={onClick}
      onDoubleClick={(e) => {
        e.stopPropagation()
        onEdit(tab)
      }}
      className={`pl-6 pr-2 py-3 font-medium transition-all cursor-move group flex-shrink-0 ${
        isActive
          ? 'text-blue-600 shadow-md'
          : 'text-gray-600 hover:bg-gray-300'
      }`}
    >
      <div
        className="flex items-center justify-between gap-2"
      >
        <div className="flex-1 select-none">
          {tab.name}
        </div>
        <div
          className={`ml-2 w-4 flex items-center justify-center ${isActive ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'} transition-opacity`}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {isActive && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(tab)
              }}
              className="p-0.5 hover:bg-red-100 rounded cursor-pointer"
              title="削除"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
