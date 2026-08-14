import { api } from '@/utilities/api'

export interface SudokuHistoryItem {
  id: number
  userId?: number
  initialPuzzle: number[][]
  puzzle: number[][]
  board: number[][]
  level: string
  isComplete?: boolean
  isInProgress: boolean
  createdAt?: string
  updatedAt?: string
}

export const sudokuHistoryApi = {
  getHistory: async (): Promise<SudokuHistoryItem[]> => {
    return api.get<SudokuHistoryItem[]>('/sudoku-game/history')
  },
}
