import { api } from '@/utilities/api'

export interface SudokuHistoryItem {
  id: number
  userId?: number
  initialPuzzle: number[][]
  puzzle: number[][]
  board: number[][]
  level: string
  isComplete: boolean
  createdAt?: string
  updatedAt?: string
}

export const sudokuHistoryApi = {
  getHistory: async (): Promise<SudokuHistoryItem[]> => {
    return api.get<SudokuHistoryItem[]>('/sudoku-history')
  },
  createHistory: async (data: Omit<SudokuHistoryItem, 'id'>): Promise<SudokuHistoryItem> => {
    return api.post<SudokuHistoryItem>('/sudoku-history', data)
  },
  updateHistoryStatus: async (
    id: number,
    isComplete: boolean,
  ): Promise<SudokuHistoryItem | null> => {
    return api.patch<SudokuHistoryItem>(`/sudoku-history/${id}`, { isComplete })
  },
}
