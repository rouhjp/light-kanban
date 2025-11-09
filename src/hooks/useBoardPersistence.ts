import { useEffect } from 'react'
import type { Column } from '../types'
import { getStorageKey } from '../constants'

export function useBoardPersistence(boardsData: Record<number, Column[]>) {
  useEffect(() => {
    Object.entries(boardsData).forEach(([tabId, columns]) => {
      try {
        localStorage.setItem(getStorageKey(Number(tabId)), JSON.stringify(columns))
      } catch (error) {
        console.error(`Failed to save board ${tabId} to localStorage:`, error)
      }
    })
  }, [boardsData])
}
