import { useState, useEffect, useRef } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from '@dnd-kit/core'
import type {
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type Card = {
  id: number
  content: string
}

type Column = {
  id: string
  title: string
  cards: Card[]
}

// ドラッグ可能なカードコンポーネント
function SortableCard({
  card,
  isEditing,
  editingContent,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onContentChange,
  onDelete
}: {
  card: Card
  isEditing: boolean
  editingContent: string
  onStartEdit: (card: Card) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onContentChange: (content: string) => void
  onDelete: (cardId: number) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, disabled: isEditing })

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const textarea = textareaRef.current
      const length = textarea.value.length
      textarea.focus()
      textarea.setSelectionRange(length, length)
    }
  }, [isEditing])

  if (isEditing) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-white border-2 border-blue-300 rounded p-3"
      >
        <textarea
          ref={textareaRef}
          className="w-full p-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={editingContent}
          onChange={(e) => onContentChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              onSaveEdit()
            }
            if (e.key === 'Escape') {
              onCancelEdit()
            }
          }}
          onBlur={onSaveEdit}
          rows={2}
        />
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-gray-50 border border-gray-200 rounded p-3 hover:shadow-md transition-shadow cursor-move group select-none"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-gray-800">{card.content}</p>
        </div>
        <div
          className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              onStartEdit(card)
            }}
            className="p-1 hover:bg-blue-100 rounded cursor-pointer"
            title="編集"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(card.id)
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
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// ドロップ可能なカラムコンポーネント
function DroppableColumn({
  column,
  columnIndex,
  children
}: {
  column: Column
  columnIndex: number
  children: React.ReactNode
}) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  })

  return (
    <div ref={setNodeRef} className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">
        {column.title}
      </h2>

      <SortableContext
        items={column.cards.map(card => card.id)}
        strategy={verticalListSortingStrategy}
      >
        {children}
      </SortableContext>
    </div>
  )
}

function App() {
  const [columns, setColumns] = useState<Column[]>([
    {
      id: 'todo',
      title: 'To Do',
      cards: [
        { id: 1, content: 'タスク 1' },
        { id: 2, content: 'タスク 2' },
      ]
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      cards: [
        { id: 3, content: 'タスク 3' },
      ]
    },
    {
      id: 'done',
      title: 'Done',
      cards: [
        { id: 4, content: 'タスク 4' },
        { id: 5, content: 'タスク 5' },
      ]
    }
  ])

  const [newCardContent, setNewCardContent] = useState('')
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [activeCard, setActiveCard] = useState<Card | null>(null)
  const [editingCardId, setEditingCardId] = useState<number | null>(null)
  const [editingContent, setEditingContent] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const findContainer = (id: number | string): string | null => {
    // カラムIDかどうかをチェック
    if (typeof id === 'string') {
      const isColumnId = columns.some(col => col.id === id)
      if (isColumnId) {
        return id
      }
    }

    // カードIDからカラムを探す
    for (const column of columns) {
      if (column.cards.some(card => card.id === id)) {
        return column.id
      }
    }
    return null
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const card = columns
      .flatMap(col => col.cards)
      .find(card => card.id === active.id)
    setActiveCard(card || null)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeContainer = findContainer(active.id)
    const overContainer = findContainer(over.id)

    if (!activeContainer || !overContainer) return

    setColumns(prevColumns => {
      const activeColumnIndex = prevColumns.findIndex(col => col.id === activeContainer)
      const overColumnIndex = prevColumns.findIndex(col => col.id === overContainer)

      if (activeColumnIndex === -1 || overColumnIndex === -1) return prevColumns

      const activeColumn = prevColumns[activeColumnIndex]
      const overColumn = prevColumns[overColumnIndex]

      const activeCardIndex = activeColumn.cards.findIndex(card => card.id === active.id)

      if (activeCardIndex === -1) return prevColumns

      const newColumns = [...prevColumns]

      if (activeContainer === overContainer) {
        // 同じカラム内での並び替え
        const overCardIndex = overColumn.cards.findIndex(card => card.id === over.id)

        if (overCardIndex !== -1 && activeCardIndex !== overCardIndex) {
          newColumns[activeColumnIndex] = {
            ...activeColumn,
            cards: arrayMove(activeColumn.cards, activeCardIndex, overCardIndex)
          }
        }
      } else {
        // 異なるカラム間での移動
        // カードを移動元のカラムから削除
        const [movedCard] = newColumns[activeColumnIndex].cards.splice(activeCardIndex, 1)

        // カードを移動先のカラムに追加
        const overCardIndex = overColumn.cards.findIndex(card => card.id === over.id)
        const insertIndex = overCardIndex >= 0 ? overCardIndex : newColumns[overColumnIndex].cards.length
        newColumns[overColumnIndex].cards.splice(insertIndex, 0, movedCard)
      }

      return newColumns
    })
  }

  const handleDragEnd = () => {
    setActiveCard(null)
  }

  const addCard = () => {
    if (!newCardContent.trim()) return

    const newCard: Card = {
      id: Date.now(),
      content: newCardContent
    }

    setColumns(prevColumns => {
      const updatedColumns = [...prevColumns]
      updatedColumns[0] = {
        ...updatedColumns[0],
        cards: [...updatedColumns[0].cards, newCard]
      }
      return updatedColumns
    })

    setNewCardContent('')
    setIsAddingCard(false)
  }

  const updateCard = (cardId: number, newContent: string) => {
    if (!newContent.trim()) return

    setColumns(prevColumns => {
      return prevColumns.map(column => ({
        ...column,
        cards: column.cards.map(card =>
          card.id === cardId ? { ...card, content: newContent } : card
        )
      }))
    })
  }

  const startEditingCard = (card: Card) => {
    setEditingCardId(card.id)
    setEditingContent(card.content)
  }

  const saveCardEdit = () => {
    if (editingCardId !== null && editingContent.trim()) {
      updateCard(editingCardId, editingContent)
    }
    setEditingCardId(null)
    setEditingContent('')
  }

  const cancelCardEdit = () => {
    setEditingCardId(null)
    setEditingContent('')
  }

  const deleteCard = (cardId: number) => {
    setColumns(prevColumns => {
      return prevColumns.map(column => ({
        ...column,
        cards: column.cards.filter(card => card.id !== cardId)
      }))
    })
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-gray-100 p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Light Kanban</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map((column, columnIndex) => (
            <DroppableColumn key={column.id} column={column} columnIndex={columnIndex}>
              <div className="space-y-3 min-h-[200px]">
                {column.cards.map((card) => (
                  <SortableCard
                    key={card.id}
                    card={card}
                    isEditing={editingCardId === card.id}
                    editingContent={editingContent}
                    onStartEdit={startEditingCard}
                    onSaveEdit={saveCardEdit}
                    onCancelEdit={cancelCardEdit}
                    onContentChange={setEditingContent}
                    onDelete={deleteCard}
                  />
                ))}

                {columnIndex === 0 && (
                  <>
                    {isAddingCard ? (
                      <div className="bg-white border-2 border-blue-300 rounded p-3 space-y-2">
                        <textarea
                          className="w-full p-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="タスクの内容を入力..."
                          rows={3}
                          value={newCardContent}
                          onChange={(e) => setNewCardContent(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              addCard()
                            }
                            if (e.key === 'Escape') {
                              setIsAddingCard(false)
                              setNewCardContent('')
                            }
                          }}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={addCard}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                          >
                            追加
                          </button>
                          <button
                            onClick={() => {
                              setIsAddingCard(false)
                              setNewCardContent('')
                            }}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                          >
                            キャンセル
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsAddingCard(true)}
                        className="w-full p-3 text-left text-gray-600 hover:bg-gray-50 border-2 border-dashed border-gray-300 rounded hover:border-blue-400 transition-colors"
                      >
                        + カードを追加
                      </button>
                    )}
                  </>
                )}
              </div>
            </DroppableColumn>
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeCard ? (
          <div className="bg-gray-50 border border-gray-200 rounded p-3 shadow-lg rotate-3">
            <p className="text-gray-800">{activeCard.content}</p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

export default App
