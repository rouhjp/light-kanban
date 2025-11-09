type DeleteColumnConfirmModalProps = {
  isOpen: boolean
  columnTitle: string
  cardCount: number
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteColumnConfirmModal({
  isOpen,
  columnTitle,
  cardCount,
  onConfirm,
  onCancel
}: DeleteColumnConfirmModalProps) {
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
