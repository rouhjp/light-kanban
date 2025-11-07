import { useState, useEffect, useRef } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  closestCenter,
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
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type Card = {
  id: number
  title: string
  memo: string
  color?: string
}

type Column = {
  id: string
  title: string
  cards: Card[]
  color?: string
}

// カラムの色オプション
const COLUMN_COLORS = [
  { name: '白', value: '#ffffff', border: '#e5e7eb' },
  { name: 'グレー', value: '#f3f4f6', border: '#e5e7eb' },
  { name: 'ブルー', value: '#dbeafe', border: '#bfdbfe' },
  { name: 'グリーン', value: '#dcfce7', border: '#bbf7d0' },
  { name: 'イエロー', value: '#fef9c3', border: '#fef08a' },
  { name: 'オレンジ', value: '#fed7aa', border: '#fdba74' },
  { name: 'レッド', value: '#fee2e2', border: '#fecaca' },
  { name: 'パープル', value: '#e9d5ff', border: '#d8b4fe' },
  { name: 'ピンク', value: '#fce7f3', border: '#fbcfe8' },
]

// カラム編集モーダルコンポーネント
function EditColumnModal({
  isOpen,
  columnTitle,
  columnColor,
  onSave,
  onCancel,
  onTitleChange,
  onColorChange,
  isAddMode = false
}: {
  isOpen: boolean
  columnTitle: string
  columnColor?: string
  onSave: () => void
  onCancel: () => void
  onTitleChange: (title: string) => void
  onColorChange: (color: string) => void
  isAddMode?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      const input = inputRef.current
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
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {isAddMode ? 'カラムを追加' : 'カラム名を編集'}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              カラム名
            </label>
            <input
              ref={inputRef}
              type="text"
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={columnTitle}
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
              placeholder="カラム名を入力..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              カラーテーマ
            </label>
            <div className="flex gap-2 flex-wrap">
              {COLUMN_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => onColorChange(color.value)}
                  className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                    columnColor === color.value
                      ? 'ring-2 ring-blue-500 ring-offset-2'
                      : ''
                  }`}
                  style={{
                    backgroundColor: color.value,
                    borderColor: color.border,
                  }}
                  title={color.name}
                />
              ))}
            </div>
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

// カラム削除確認モーダルコンポーネント
function DeleteColumnConfirmModal({
  isOpen,
  columnTitle,
  cardCount,
  onConfirm,
  onCancel
}: {
  isOpen: boolean
  columnTitle: string
  cardCount: number
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
          <h3 className="text-lg font-semibold text-gray-800 mb-2">「{columnTitle}」を削除しますか？</h3>
          {cardCount > 0 && (
            <p className="text-sm text-gray-600 mt-2">
              このカラムには{cardCount}個のカードがあります。カラムを削除すると、すべてのカードも削除されます。
            </p>
          )}
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

// カード削除確認モーダルコンポーネント
function DeleteCardConfirmModal({
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

// カードの色オプション
const CARD_COLORS = [
  { name: '白', value: '#ffffff', border: '#e5e7eb' },
  { name: 'グレー', value: '#f3f4f6', border: '#e5e7eb' },
  { name: 'ブルー', value: '#dbeafe', border: '#bfdbfe' },
  { name: 'グリーン', value: '#dcfce7', border: '#bbf7d0' },
  { name: 'イエロー', value: '#fef9c3', border: '#fef08a' },
  { name: 'オレンジ', value: '#fed7aa', border: '#fdba74' },
  { name: 'レッド', value: '#fee2e2', border: '#fecaca' },
  { name: 'パープル', value: '#e9d5ff', border: '#d8b4fe' },
  { name: 'ピンク', value: '#fce7f3', border: '#fbcfe8' },
]

// 編集モーダルコンポーネント
function EditModal({
  isOpen,
  title,
  memo,
  color,
  onSave,
  onCancel,
  onTitleChange,
  onMemoChange,
  onColorChange
}: {
  isOpen: boolean
  title: string
  memo: string
  color?: string
  onSave: () => void
  onCancel: () => void
  onTitleChange: (title: string) => void
  onMemoChange: (memo: string) => void
  onColorChange: (color: string) => void
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              カラーテーマ
            </label>
            <div className="flex gap-2 flex-wrap">
              {CARD_COLORS.map((cardColor) => (
                <button
                  key={cardColor.value}
                  onClick={() => onColorChange(cardColor.value)}
                  className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                    color === cardColor.value
                      ? 'ring-2 ring-blue-500 ring-offset-2'
                      : ''
                  }`}
                  style={{
                    backgroundColor: cardColor.value,
                    borderColor: cardColor.border,
                  }}
                  title={cardColor.name}
                />
              ))}
            </div>
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
        backgroundColor: card.color || '#f9fafb',
      }}
      {...attributes}
      {...listeners}
      className="border border-gray-800 p-3 hover:shadow-md transition-shadow cursor-move group select-none"
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

// ドラッグ&ドロップ可能なカラムコンポーネント
function SortableColumn({
  column,
  columnIndex,
  children,
  onEditColumn,
  onDeleteColumn
}: {
  column: Column
  columnIndex: number
  children: React.ReactNode
  onEditColumn: (columnId: string, columnTitle: string, columnColor?: string) => void
  onDeleteColumn: (column: Column) => void
}) {
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
      className={`shadow-md p-4 min-w-[320px] flex-shrink-0 border border-gray-800 h-full flex flex-col ${
        isDragging ? 'opacity-0' : ''
      }`}
    >
      <div
        className="flex items-center justify-between mb-4 group"
        {...attributes}
        {...listeners}
      >
        <h2 className="text-xl font-semibold text-gray-700 cursor-move select-none">
          {column.title}
        </h2>
        <div
          className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEditColumn(column.id, column.title, column.color)
            }}
            className="p-1 hover:bg-blue-100 rounded cursor-pointer"
            title="カラム名を編集"
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
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
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

const STORAGE_KEY = 'light-kanban-columns'

function App() {
  const [columns, setColumns] = useState<Column[]>(() => {
    // ローカルストレージからデータを読み込む
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error)
    }

    // デフォルトデータ
    return [
      {
        id: 'todo',
        title: 'To Do',
        cards: []
      },
      {
        id: 'in-progress',
        title: 'In Progress',
        cards: []
      },
      {
        id: 'done',
        title: 'Done',
        cards: []
      }
    ]
  })

  const [newCardContent, setNewCardContent] = useState('')
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [activeCard, setActiveCard] = useState<Card | null>(null)
  const [editingCardId, setEditingCardId] = useState<number | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [editingMemo, setEditingMemo] = useState('')
  const [editingColor, setEditingColor] = useState<string>('#ffffff')
  const [viewingCard, setViewingCard] = useState<Card | null>(null)
  const [deletingCard, setDeletingCard] = useState<Card | null>(null)
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null)
  const [editingColumnTitle, setEditingColumnTitle] = useState('')
  const [editingColumnColor, setEditingColumnColor] = useState<string>('#ffffff')
  const [deletingColumn, setDeletingColumn] = useState<Column | null>(null)
  const [isAddingColumn, setIsAddingColumn] = useState(false)
  const [newColumnTitle, setNewColumnTitle] = useState('')
  const [newColumnColor, setNewColumnColor] = useState<string>('#ffffff')
  const [activeColumn, setActiveColumn] = useState<Column | null>(null)
  const [addingColumnAtIndex, setAddingColumnAtIndex] = useState<number | null>(null)

  // columnsが変更されるたびにローカルストレージに保存
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(columns))
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
    }
  }, [columns])

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

    // カラムのドラッグかチェック
    const column = columns.find(col => col.id === active.id)
    if (column) {
      setActiveColumn(column)
      return
    }

    // カードのドラッグ
    const card = columns
      .flatMap(col => col.cards)
      .find(card => card.id === active.id)
    setActiveCard(card || null)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeData = active.data.current
    const overData = over.data.current

    // カラムのドラッグの場合
    if (activeData?.type === 'column') {
      // over先がカラムの場合
      if (overData?.type === 'column' && active.id !== over.id) {
        setColumns(prevColumns => {
          const oldIndex = prevColumns.findIndex(col => col.id === active.id)
          const newIndex = prevColumns.findIndex(col => col.id === over.id)
          return arrayMove(prevColumns, oldIndex, newIndex)
        })
      }
      // over先がカードの場合、そのカードが属するカラムを見つける
      else if (overData?.type === 'card') {
        const overColumnId = findContainer(over.id)
        if (overColumnId && active.id !== overColumnId) {
          setColumns(prevColumns => {
            const oldIndex = prevColumns.findIndex(col => col.id === active.id)
            const newIndex = prevColumns.findIndex(col => col.id === overColumnId)
            return arrayMove(prevColumns, oldIndex, newIndex)
          })
        }
      }
      return
    }

    // カードのドラッグの場合
    const activeContainer = findContainer(active.id)
    const overContainer = findContainer(over.id)

    if (!activeContainer || !overContainer) return

    setColumns(prevColumns => {
      const activeColumnIndex = prevColumns.findIndex(col => col.id === activeContainer)
      const overColumnIndex = prevColumns.findIndex(col => col.id === overContainer)

      if (activeColumnIndex === -1 || overColumnIndex === -1) return prevColumns

      const activeCol = prevColumns[activeColumnIndex]
      const overCol = prevColumns[overColumnIndex]

      const activeCardIndex = activeCol.cards.findIndex(card => card.id === active.id)

      if (activeCardIndex === -1) return prevColumns

      const newColumns = [...prevColumns]

      if (activeContainer === overContainer) {
        // 同じカラム内での並び替え
        const overCardIndex = overCol.cards.findIndex(card => card.id === over.id)

        if (overCardIndex !== -1 && activeCardIndex !== overCardIndex) {
          newColumns[activeColumnIndex] = {
            ...activeCol,
            cards: arrayMove(activeCol.cards, activeCardIndex, overCardIndex)
          }
        }
      } else {
        // 異なるカラム間での移動
        // カードを移動元のカラムから削除
        const [movedCard] = newColumns[activeColumnIndex].cards.splice(activeCardIndex, 1)

        // カードを移動先のカラムに追加
        const overCardIndex = overCol.cards.findIndex(card => card.id === over.id)
        const insertIndex = overCardIndex >= 0 ? overCardIndex : newColumns[overColumnIndex].cards.length
        newColumns[overColumnIndex].cards.splice(insertIndex, 0, movedCard)
      }

      return newColumns
    })
  }

  const handleDragEnd = () => {
    setActiveCard(null)
    setActiveColumn(null)
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

  const updateCard = (cardId: number, newTitle: string, newMemo: string, newColor: string) => {
    if (!newTitle.trim()) return

    setColumns(prevColumns => {
      return prevColumns.map(column => ({
        ...column,
        cards: column.cards.map(card =>
          card.id === cardId ? { ...card, title: newTitle, memo: newMemo, color: newColor } : card
        )
      }))
    })
  }

  const startEditingCard = (card: Card) => {
    setEditingCardId(card.id)
    setEditingTitle(card.title)
    setEditingMemo(card.memo)
    setEditingColor(card.color || '#ffffff')
  }

  const saveCardEdit = () => {
    if (editingCardId !== null && editingTitle.trim()) {
      updateCard(editingCardId, editingTitle, editingMemo, editingColor)
    }
    setEditingCardId(null)
    setEditingTitle('')
    setEditingMemo('')
    setEditingColor('#ffffff')
  }

  const cancelCardEdit = () => {
    setEditingCardId(null)
    setEditingTitle('')
    setEditingMemo('')
    setEditingColor('#ffffff')
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

  const startEditingColumn = (columnId: string, columnTitle: string, columnColor?: string) => {
    setEditingColumnId(columnId)
    setEditingColumnTitle(columnTitle)
    setEditingColumnColor(columnColor || '#ffffff')
  }

  const saveColumnEdit = () => {
    if (editingColumnId !== null && editingColumnTitle.trim()) {
      setColumns(prevColumns => {
        return prevColumns.map(column =>
          column.id === editingColumnId
            ? { ...column, title: editingColumnTitle, color: editingColumnColor }
            : column
        )
      })
    }
    setEditingColumnId(null)
    setEditingColumnTitle('')
    setEditingColumnColor('#ffffff')
  }

  const cancelColumnEdit = () => {
    setEditingColumnId(null)
    setEditingColumnTitle('')
    setEditingColumnColor('#ffffff')
  }

  const openDeleteColumnConfirm = (column: Column) => {
    setDeletingColumn(column)
  }

  const closeDeleteColumnConfirm = () => {
    setDeletingColumn(null)
  }

  const confirmDeleteColumn = () => {
    if (deletingColumn) {
      setColumns(prevColumns => prevColumns.filter(col => col.id !== deletingColumn.id))
      setDeletingColumn(null)
    }
  }

  const addColumn = () => {
    if (!newColumnTitle.trim()) return

    const newColumn: Column = {
      id: `column-${Date.now()}`,
      title: newColumnTitle,
      cards: [],
      color: newColumnColor
    }

    setColumns(prevColumns => {
      if (addingColumnAtIndex !== null) {
        // 指定された位置に挿入
        const newColumns = [...prevColumns]
        newColumns.splice(addingColumnAtIndex + 1, 0, newColumn)
        return newColumns
      } else {
        // 最後に追加
        return [...prevColumns, newColumn]
      }
    })
    setNewColumnTitle('')
    setNewColumnColor('#ffffff')
    setIsAddingColumn(false)
    setAddingColumnAtIndex(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-gray-100 p-8 flex flex-col">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Light Kanban</h1>

        <div className="flex justify-center flex-1 overflow-hidden">
          <div className="flex overflow-x-auto pb-4 h-full">
          {columns.length === 0 ? (
            /* カラムが0個の場合の追加枠 */
            <button
              onClick={() => setIsAddingColumn(true)}
              className="rounded-lg p-4 w-full text-left text-gray-600 border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors min-h-[200px] flex items-center justify-center"
            >
              + カラムを追加
            </button>
          ) : (
            <SortableContext
              items={columns.map(col => col.id)}
              strategy={horizontalListSortingStrategy}
            >
              {columns.map((column, columnIndex) => (
                <>
                  <SortableColumn
                    key={column.id}
                    column={column}
                    columnIndex={columnIndex}
                    onEditColumn={startEditingColumn}
                    onDeleteColumn={openDeleteColumnConfirm}
                  >
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
                  </SortableColumn>
                  {/* カラム間の追加エリア */}
                  <div className="group flex items-center justify-center w-6 flex-shrink-0">
                    <button
                      onClick={() => {
                        setAddingColumnAtIndex(columnIndex)
                        setIsAddingColumn(true)
                      }}
                      className="h-full w-6 border-2 border-dashed border-transparent group-hover:border-blue-400 rounded transition-all flex items-center justify-center"
                    >
                      <span className="text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity text-xl">
                        +
                      </span>
                    </button>
                  </div>
                </>
              ))}
            </SortableContext>
          )}
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeCard ? (
          <div
            className="border border-gray-800 p-3 shadow-lg rotate-3"
            style={{ backgroundColor: activeCard.color || '#f9fafb' }}
          >
            <p className="text-gray-800">{activeCard.title}</p>
          </div>
        ) : activeColumn ? (
          <div
            className="shadow-xl p-4 min-w-[320px] opacity-80 border border-gray-800"
            style={{ backgroundColor: activeColumn.color || '#ffffff' }}
          >
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              {activeColumn.title}
            </h2>
            <div className="space-y-3">
              {activeColumn.cards.map((card) => (
                <div
                  key={card.id}
                  className="border border-gray-800 p-3"
                  style={{ backgroundColor: card.color || '#f9fafb' }}
                >
                  <p className="text-gray-800">{card.title}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </DragOverlay>

      <EditColumnModal
        isOpen={editingColumnId !== null}
        columnTitle={editingColumnTitle}
        columnColor={editingColumnColor}
        onSave={saveColumnEdit}
        onCancel={cancelColumnEdit}
        onTitleChange={setEditingColumnTitle}
        onColorChange={setEditingColumnColor}
      />

      <EditColumnModal
        isOpen={isAddingColumn}
        columnTitle={newColumnTitle}
        columnColor={newColumnColor}
        onSave={addColumn}
        onCancel={() => {
          setIsAddingColumn(false)
          setNewColumnTitle('')
          setNewColumnColor('#ffffff')
          setAddingColumnAtIndex(null)
        }}
        onTitleChange={setNewColumnTitle}
        onColorChange={setNewColumnColor}
        isAddMode={true}
      />

      <DeleteColumnConfirmModal
        isOpen={deletingColumn !== null}
        columnTitle={deletingColumn?.title || ''}
        cardCount={deletingColumn?.cards.length || 0}
        onConfirm={confirmDeleteColumn}
        onCancel={closeDeleteColumnConfirm}
      />

      <DeleteCardConfirmModal
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
        color={editingColor}
        onSave={saveCardEdit}
        onCancel={cancelCardEdit}
        onTitleChange={setEditingTitle}
        onMemoChange={setEditingMemo}
        onColorChange={setEditingColor}
      />
    </DndContext>
  )
}

export default App
