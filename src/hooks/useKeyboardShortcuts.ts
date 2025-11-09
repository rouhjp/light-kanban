import { useEffect } from 'react'

type ModalState = {
  editingCardId: number | null
  editingColumnId: string | null
  editingTab: any
  deletingCard: any
  deletingColumn: any
  deletingTab: any
  isAddingColumn: boolean
  isAddingCard: boolean
}

export function useKeyboardShortcuts(
  modalState: ModalState,
  onEnter: () => void
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // モーダルが開いている場合は何もしない
      const {
        editingCardId,
        editingColumnId,
        editingTab,
        deletingCard,
        deletingColumn,
        deletingTab,
        isAddingColumn,
        isAddingCard
      } = modalState

      if (editingCardId !== null || editingColumnId !== null || editingTab !== null ||
          deletingCard !== null || deletingColumn !== null || deletingTab !== null ||
          isAddingColumn || isAddingCard) {
        return
      }

      // Enterキーが押された場合
      if (e.key === 'Enter') {
        e.preventDefault()
        onEnter()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [modalState, onEnter])
}
