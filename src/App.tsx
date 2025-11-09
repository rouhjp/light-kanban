import { useState, useEffect } from 'react'
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import type { Card, Column, Tab } from './types'
import { getStorageKey, STORAGE_KEY_TABS, DEFAULT_COLUMNS, DEFAULT_TABS } from './constants'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useBoardData } from './hooks/useBoardData'
import { useBoardPersistence } from './hooks/useBoardPersistence'
import { useDragAndDrop } from './hooks/useDragAndDrop'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { EditColumnModal } from './components/EditColumnModal'
import { DeleteColumnConfirmModal } from './components/DeleteColumnConfirmModal'
import { DeleteCardConfirmModal } from './components/DeleteCardConfirmModal'
import { EditModal } from './components/EditModal'
import { EditTabModal } from './components/EditTabModal'
import { DeleteTabConfirmModal } from './components/DeleteTabConfirmModal'
import { SortableCard } from './components/SortableCard'
import { SortableColumn } from './components/SortableColumn'
import { TabBar } from './components/TabBar'

function App() {
  const [tabs, setTabs] = useLocalStorage<Tab[]>(STORAGE_KEY_TABS, DEFAULT_TABS)
  const [activeTab, setActiveTab] = useState(0)
  const [boardsData, setBoardsData] = useBoardData(tabs)

  // ローカルストレージに保存
  useBoardPersistence(boardsData)

  // 現在アクティブなタブのカンバンデータ
  const columns = boardsData[activeTab] || []

  const setColumns = (newColumns: Column[] | ((prev: Column[]) => Column[])) => {
    setBoardsData(prev => {
      const currentColumns = prev[activeTab] || []
      const updatedColumns = typeof newColumns === 'function'
        ? newColumns(currentColumns)
        : newColumns

      return {
        ...prev,
        [activeTab]: updatedColumns
      }
    })
  }

  const [newCardContent, setNewCardContent] = useState('')
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [editingCardId, setEditingCardId] = useState<number | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [editingMemo, setEditingMemo] = useState('')
  const [editingColor, setEditingColor] = useState<string>('#ffffff')
  const [deletingCard, setDeletingCard] = useState<Card | null>(null)
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null)
  const [editingColumnTitle, setEditingColumnTitle] = useState('')
  const [editingColumnColor, setEditingColumnColor] = useState<string>('#ffffff')
  const [deletingColumn, setDeletingColumn] = useState<Column | null>(null)
  const [isAddingColumn, setIsAddingColumn] = useState(false)
  const [newColumnTitle, setNewColumnTitle] = useState('')
  const [newColumnColor, setNewColumnColor] = useState<string>('#ffffff')
  const [addingColumnAtIndex, setAddingColumnAtIndex] = useState<number | null>(null)
  const [editingTab, setEditingTab] = useState<Tab | null>(null)
  const [editingTabName, setEditingTabName] = useState('')
  const [editingTabColor, setEditingTabColor] = useState<string>('#ffffff')
  const [deletingTab, setDeletingTab] = useState<Tab | null>(null)

  // ドラッグ&ドロップ
  const {
    sensors,
    activeCard,
    activeColumn,
    handleDragStart,
    handleDragOver,
    handleDragEnd
  } = useDragAndDrop(tabs, setTabs, columns, setColumns)

  // キーボードショートカット
  useKeyboardShortcuts(
    {
      editingCardId,
      editingColumnId,
      editingTab,
      deletingCard,
      deletingColumn,
      deletingTab,
      isAddingColumn,
      isAddingCard
    },
    () => setIsAddingCard(true)
  )

  // タブ切り替え時にカード入力状態をリセット
  useEffect(() => {
    if (isAddingCard) {
      setIsAddingCard(false)
      setNewCardContent('')
    }
  }, [activeTab])

  // 新しいタブを追加
  const addNewTab = () => {
    const newTabId = tabs.length > 0 ? Math.max(...tabs.map(t => t.id)) + 1 : 0
    const newTab: Tab = {
      id: newTabId,
      name: 'ボード',
      color: '#ffffff'
    }

    setTabs([...tabs, newTab])

    setBoardsData(prev => ({
      ...prev,
      [newTabId]: JSON.parse(JSON.stringify(DEFAULT_COLUMNS))
    }))

    setActiveTab(newTabId)
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
        const newColumns = [...prevColumns]
        newColumns.splice(addingColumnAtIndex + 1, 0, newColumn)
        return newColumns
      } else {
        return [...prevColumns, newColumn]
      }
    })
    setNewColumnTitle('')
    setNewColumnColor('#ffffff')
    setIsAddingColumn(false)
    setAddingColumnAtIndex(null)
  }

  const startEditingTab = (tab: Tab) => {
    setEditingTab(tab)
    setEditingTabName(tab.name)
    setEditingTabColor(tab.color || '#ffffff')
  }

  const saveTabEdit = () => {
    if (editingTab && editingTabName.trim()) {
      setTabs(prevTabs =>
        prevTabs.map(tab =>
          tab.id === editingTab.id
            ? { ...tab, name: editingTabName, color: editingTabColor }
            : tab
        )
      )
    }
    setEditingTab(null)
    setEditingTabName('')
    setEditingTabColor('#ffffff')
  }

  const cancelTabEdit = () => {
    setEditingTab(null)
    setEditingTabName('')
    setEditingTabColor('#ffffff')
  }

  const openDeleteTabConfirm = (tab: Tab) => {
    setDeletingTab(tab)
  }

  const closeDeleteTabConfirm = () => {
    setDeletingTab(null)
  }

  const confirmDeleteTab = () => {
    if (deletingTab) {
      setTabs(prevTabs => prevTabs.filter(tab => tab.id !== deletingTab.id))

      setBoardsData(prev => {
        const newData = { ...prev }
        delete newData[deletingTab.id]
        return newData
      })

      try {
        localStorage.removeItem(getStorageKey(deletingTab.id))
      } catch (error) {
        console.error(`Failed to delete board ${deletingTab.id} from localStorage:`, error)
      }

      if (activeTab === deletingTab.id) {
        const remainingTabs = tabs.filter(tab => tab.id !== deletingTab.id)
        if (remainingTabs.length > 0) {
          setActiveTab(remainingTabs[0].id)
        }
      }

      setDeletingTab(null)
    }
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

        <TabBar
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onAddTab={addNewTab}
          onEditTab={startEditingTab}
          onDeleteTab={openDeleteTabConfirm}
        />

        <div
          className="flex justify-center flex-1 overflow-hidden p-4"
          style={{ backgroundColor: tabs.find(t => t.id === activeTab)?.color || '#ffffff' }}
        >
          <div className="flex overflow-x-auto pb-4 w-full" style={{ height: '100%' }}>
          {tabs.length === 0 ? (
            <div className="flex items-center justify-center w-full">
              <p className="text-gray-500 text-lg">+ ボタンからボードを追加してください</p>
            </div>
          ) : columns.length === 0 ? (
            <button
              onClick={() => setIsAddingColumn(true)}
              className="p-4 w-[320px] text-left text-gray-600 border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors min-h-[200px] flex items-center justify-center"
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
                                e.stopPropagation()
                                addCard()
                              }
                              if (e.key === 'Escape') {
                                setIsAddingCard(false)
                                setNewCardContent('')
                              }
                            }}
                            autoFocus
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => {
                                setIsAddingCard(false)
                                setNewCardContent('')
                              }}
                              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                            >
                              キャンセル
                            </button>
                            <button
                              onClick={addCard}
                              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                            >
                              追加
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
            style={{ backgroundColor: activeCard.color || '#fef9c3' }}
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
                  style={{ backgroundColor: card.color || '#fef9c3' }}
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

      <EditTabModal
        isOpen={editingTab !== null}
        tabName={editingTabName}
        tabColor={editingTabColor}
        onSave={saveTabEdit}
        onCancel={cancelTabEdit}
        onTabNameChange={setEditingTabName}
        onTabColorChange={setEditingTabColor}
      />

      <DeleteTabConfirmModal
        isOpen={deletingTab !== null}
        tabName={deletingTab?.name || ''}
        onConfirm={confirmDeleteTab}
        onCancel={closeDeleteTabConfirm}
      />
    </DndContext>
  )
}

export default App
