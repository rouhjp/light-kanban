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
  title: string
  memo: string
}

type Column = {
  id: string
  title: string
  cards: Card[]
}

// 削除確認モーダルコンポーネント
function DeleteConfirmModal({
  isOpen,
  cardTitle,
  onConfirm,
  onCancel
}: {
  isOpen: boolean
  cardTitle: string
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">「{cardTitle}」を削除しますか？</h3>
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            削除
          </button>
        </div>
      </div>
    </div>
  )
}

// 確認モーダルコンポーネント
function ViewModal({
  isOpen,
  title,
  memo,
  onClose,
  onEdit
}: {
  isOpen: boolean
  title: string
  memo: string
  onClose: () => void
  onEdit: () => void
}) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">カードの詳細</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="閉じる"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
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

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              タイトル
            </label>
            <div className="w-full p-3 bg-gray-50 border border-gray-200 rounded">
              <p className="text-gray-800">{title}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              メモ
            </label>
            <div className="w-full p-3 bg-gray-50 border border-gray-200 rounded min-h-[150px]">
              <p className="text-gray-800 whitespace-pre-wrap">{memo}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
          >
            閉じる
          </button>
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            編集
          </button>
        </div>
      </div>
    </div>
  )
}

// 編集モーダルコンポーネント
function EditModal({
  isOpen,
  title,
  memo,
  onSave,
  onCancel,
  onTitleChange,
  onMemoChange
}: {
  isOpen: boolean
  title: string
  memo: string
  onSave: () => void
  onCancel: () => void
  onTitleChange: (title: string) => void
  onMemoChange: (memo: string) => void
}) {
  const titleInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && titleInputRef.current) {
      const input = titleInputRef.current
      const length = input.value.length
      input.focus()
      input.setSelectionRange(length, length)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4">カードを編集</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              タイトル
            </label>
            <input
              ref={titleInputRef}
              type="text"
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  onSave()
                }
                if (e.key === 'Escape') {
                  onCancel()
                }
              }}
              placeholder="タイトルを入力..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              メモ
            </label>
            <textarea
              className="w-full p-3 border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={memo}
              onChange={(e) => onMemoChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  onCancel()
                }
              }}
              rows={6}
              placeholder="メモを入力..."
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}

// ドラッグ可能なカードコンポーネント
function SortableCard({
  card,
  onStartEdit,
  onDelete,
  onView
}: {
  card: Card
  onStartEdit: (card: Card) => void
  onDelete: (card: Card) => void
  onView: (card: Card) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-gray-50 border border-gray-200 rounded p-3 hover:shadow-md transition-shadow cursor-move group select-none"
      onDoubleClick={(e) => {
        e.stopPropagation()
        onView(card)
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-gray-800">{card.title}</p>
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
        { id: 1, title: 'タスク 1', memo: '' },
        { id: 2, title: 'タスク 2', memo: '' },
      ]
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      cards: [
        { id: 3, title: 'タスク 3', memo: '' },
      ]
    },
    {
      id: 'done',
      title: 'Done',
      cards: [
        { id: 4, title: 'タスク 4', memo: '' },
        { id: 5, title: 'タスク 5', memo: '' },
      ]
    }
  ])

  const [newCardContent, setNewCardContent] = useState('')
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [activeCard, setActiveCard] = useState<Card | null>(null)
  const [editingCardId, setEditingCardId] = useState<number | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [editingMemo, setEditingMemo] = useState('')
  const [viewingCard, setViewingCard] = useState<Card | null>(null)
  const [deletingCard, setDeletingCard] = useState<Card | null>(null)

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
      title: newCardContent,
      memo: ''
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

  const updateCard = (cardId: number, newTitle: string, newMemo: string) => {
    if (!newTitle.trim()) return

    setColumns(prevColumns => {
      return prevColumns.map(column => ({
        ...column,
        cards: column.cards.map(card =>
          card.id === cardId ? { ...card, title: newTitle, memo: newMemo } : card
        )
      }))
    })
  }

  const startEditingCard = (card: Card) => {
    setEditingCardId(card.id)
    setEditingTitle(card.title)
    setEditingMemo(card.memo)
  }

  const saveCardEdit = () => {
    if (editingCardId !== null && editingTitle.trim()) {
      updateCard(editingCardId, editingTitle, editingMemo)
    }
    setEditingCardId(null)
    setEditingTitle('')
    setEditingMemo('')
  }

  const cancelCardEdit = () => {
    setEditingCardId(null)
    setEditingTitle('')
    setEditingMemo('')
  }

  const openDeleteConfirm = (card: Card) => {
    setDeletingCard(card)
  }

  const closeDeleteConfirm = () => {
    setDeletingCard(null)
  }

  const confirmDelete = () => {
    if (deletingCard) {
      setColumns(prevColumns => {
        return prevColumns.map(column => ({
          ...column,
          cards: column.cards.filter(card => card.id !== deletingCard.id)
        }))
      })
      setDeletingCard(null)
    }
  }

  const openViewModal = (card: Card) => {
    setViewingCard(card)
  }

  const closeViewModal = () => {
    setViewingCard(null)
  }

  const openEditFromView = () => {
    if (viewingCard) {
      setEditingCardId(viewingCard.id)
      setEditingTitle(viewingCard.title)
      setEditingMemo(viewingCard.memo)
      setViewingCard(null)
    }
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
                    onStartEdit={startEditingCard}
                    onDelete={openDeleteConfirm}
                    onView={openViewModal}
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
            <p className="text-gray-800">{activeCard.title}</p>
          </div>
        ) : null}
      </DragOverlay>

      <DeleteConfirmModal
        isOpen={deletingCard !== null}
        cardTitle={deletingCard?.title || ''}
        onConfirm={confirmDelete}
        onCancel={closeDeleteConfirm}
      />

      <ViewModal
        isOpen={viewingCard !== null}
        title={viewingCard?.title || ''}
        memo={viewingCard?.memo || ''}
        onClose={closeViewModal}
        onEdit={openEditFromView}
      />

      <EditModal
        isOpen={editingCardId !== null}
        title={editingTitle}
        memo={editingMemo}
        onSave={saveCardEdit}
        onCancel={cancelCardEdit}
        onTitleChange={setEditingTitle}
        onMemoChange={setEditingMemo}
      />
    </DndContext>
  )
}

export default App
