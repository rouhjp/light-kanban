import { useState } from 'react'
import type { Column, Tab } from '../types'
import { getStorageKey, DEFAULT_COLUMNS } from '../constants'

export function useBoardData(tabs: Tab[]) {
  const [boardsData, setBoardsData] = useState<Record<number, Column[]>>(() => {
    const initialData: Record<number, Column[]> = {}

    tabs.forEach(tab => {
      try {
        const saved = localStorage.getItem(getStorageKey(tab.id))
        if (saved) {
          initialData[tab.id] = JSON.parse(saved)
        } else {
          initialData[tab.id] = JSON.parse(JSON.stringify(DEFAULT_COLUMNS))
        }
      } catch (error) {
        console.error(`Failed to load board ${tab.id} from localStorage:`, error)
        initialData[tab.id] = JSON.parse(JSON.stringify(DEFAULT_COLUMNS))
      }
    })

    return initialData
  })

  return [boardsData, setBoardsData] as const
}
