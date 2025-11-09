import { useEffect, useRef } from 'react'
import { THEME_COLORS } from '../constants'

type EditModalProps = {
  isOpen: boolean
  title: string
  memo: string
  color?: string
  onSave: () => void
  onCancel: () => void
  onTitleChange: (title: string) => void
  onMemoChange: (memo: string) => void
  onColorChange: (color: string) => void
}

export function EditModal({
  isOpen,
  title,
  memo,
  color,
  onSave,
  onCancel,
  onTitleChange,
  onMemoChange,
  onColorChange
}: EditModalProps) {
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
              {THEME_COLORS.map((themeColor) => (
                <button
                  key={themeColor.value}
                  onClick={() => onColorChange(themeColor.value)}
                  className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                    color === themeColor.value
                      ? 'ring-2 ring-blue-500 ring-offset-2'
                      : ''
                  }`}
                  style={{
                    backgroundColor: themeColor.value,
                    borderColor: themeColor.border,
                  }}
                  title={themeColor.name}
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
