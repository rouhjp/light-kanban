export const THEME_COLORS = [
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

export const STORAGE_KEY_PREFIX = 'light-kanban-board-'
export const STORAGE_KEY_TABS = 'light-kanban-tabs'
export const getStorageKey = (tabId: number) => `${STORAGE_KEY_PREFIX}${tabId}`

export const DEFAULT_COLUMNS = [
  { id: 'todo', title: 'To Do', cards: [], color: '#ffffff' },
  { id: 'in-progress', title: 'In Progress', cards: [], color: '#ffffff' },
  { id: 'done', title: 'Done', cards: [], color: '#ffffff' }
]

export const DEFAULT_TABS = [
  { id: 0, name: 'ボード', color: '#ffffff' }
]
