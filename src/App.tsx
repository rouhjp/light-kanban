import { useState } from 'react'

type Card = {
  id: number
  content: string
}

type Column = {
  title: string
  cards: Card[]
}

function App() {
  const [columns, setColumns] = useState<Column[]>([
    {
      title: 'To Do',
      cards: [
        { id: 1, content: 'タスク 1' },
        { id: 2, content: 'タスク 2' },
      ]
    },
    {
      title: 'In Progress',
      cards: [
        { id: 3, content: 'タスク 3' },
      ]
    },
    {
      title: 'Done',
      cards: [
        { id: 4, content: 'タスク 4' },
        { id: 5, content: 'タスク 5' },
      ]
    }
  ])

  const [newCardContent, setNewCardContent] = useState('')
  const [isAddingCard, setIsAddingCard] = useState(false)

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

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Light Kanban</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((column, columnIndex) => (
          <div key={column.title} className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              {column.title}
            </h2>

            <div className="space-y-3">
              {column.cards.map((card) => (
                <div
                  key={card.id}
                  className="bg-gray-50 border border-gray-200 rounded p-3 hover:shadow-md transition-shadow"
                >
                  <p className="text-gray-800">{card.content}</p>
                </div>
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
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
