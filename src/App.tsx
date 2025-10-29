function App() {
  const columns = [
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
  ]

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Light Kanban</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((column) => (
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
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
