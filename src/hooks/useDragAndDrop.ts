import { useState } from 'react'
import { PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragStartEvent, DragOverEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import type { Card, Column, Tab } from '../types'

export function useDragAndDrop(
  tabs: Tab[],
  setTabs: (tabs: Tab[]) => void,
  columns: Column[],
  setColumns: (newColumns: Column[] | ((prev: Column[]) => Column[])) => void
) {
  const [activeCard, setActiveCard] = useState<Card | null>(null)
  const [activeColumn, setActiveColumn] = useState<Column | null>(null)

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

    // タブのドラッグの場合
    if (activeData?.type === 'tab' && overData?.type === 'tab' && active.id !== over.id) {
      const oldIndex = tabs.findIndex(t => t.id === active.id)
      const newIndex = tabs.findIndex(t => t.id === over.id)
      setTabs(arrayMove(tabs, oldIndex, newIndex))
      return
    }

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

  return {
    sensors,
    activeCard,
    activeColumn,
    handleDragStart,
    handleDragOver,
    handleDragEnd
  }
}
