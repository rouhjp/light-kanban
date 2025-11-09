import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Card } from '../types'

type SortableCardProps = {
  card: Card
  onStartEdit: (card: Card) => void
  onDelete: (card: Card) => void
}

export function SortableCard({
  card,
  onStartEdit,
  onDelete
}: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: 'card',
      card,
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
        backgroundColor: card.color || '#fef9c3',
      }}
      {...attributes}
      {...listeners}
      className="border border-gray-800 p-3 hover:shadow-md transition-shadow cursor-move group/card select-none"
      onDoubleClick={(e) => {
        e.stopPropagation()
        onStartEdit(card)
      }}
      title={card.memo || undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-gray-800 break-words">{card.title}</p>
        </div>
        <div
          className="w-6 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(card)
            }}
            className="p-1 hover:bg-red-100 rounded cursor-pointer"
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
        </div>
      </div>
    </div>
  )
}
