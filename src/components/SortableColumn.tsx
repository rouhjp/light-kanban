import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Column } from '../types'

type SortableColumnProps = {
  column: Column
  children: React.ReactNode
  onEditColumn: (columnId: string, columnTitle: string, columnColor?: string) => void
  onDeleteColumn: (column: Column) => void
}

export function SortableColumn({
  column,
  children,
  onEditColumn,
  onDeleteColumn
}: SortableColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: {
      type: 'column',
      column,
    }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        backgroundColor: column.color || '#ffffff',
      }}
      {...attributes}
      {...listeners}
      onDoubleClick={(e) => {
        e.stopPropagation()
        onEditColumn(column.id, column.title, column.color)
      }}
      className={`p-4 w-[320px] h-full flex-shrink-0 border border-gray-800 flex flex-col cursor-move group hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-0' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-700 select-none">
          {column.title}
        </h2>
        <div
          className="w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDeleteColumn(column)
            }}
            className="p-1 hover:bg-red-100 rounded cursor-pointer"
            title="カラムを削除"
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
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <SortableContext
          items={column.cards.map(card => card.id)}
          strategy={verticalListSortingStrategy}
        >
          {children}
        </SortableContext>
      </div>
    </div>
  )
}
