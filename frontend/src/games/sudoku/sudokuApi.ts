import { api } from '@/utilities/api'

export interface SudokuGameData {
  id?: string
  userId?: string
  puzzle?: number[][]
  initialPuzzle?: number[][]
  board?: number[][]
  level?: string
  isComplete?: boolean
  isInProgress?: boolean
  createdAt?: Date
  updatedAt?: Date
}

export const sudokuApi = {
  // Get the current sudoku game for the user
  getSudokuGame: async (): Promise<SudokuGameData> => {
    try {
      return await api.get<SudokuGameData>('/sudoku-game')
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (message.toLowerCase().includes('not found') || message.includes('404')) {
        const notFoundError = new Error(message)
        notFoundError.name = 'NotFoundError'
        throw notFoundError
      }
      throw error
    }
  },

  // Create a new sudoku game (for first-time users)
  createSudokuGame: async (data: SudokuGameData): Promise<SudokuGameData> => {
    return api.post<SudokuGameData>('/sudoku-game', data)
  },

  // Update the sudoku game (for game progress or reset)
  updateSudokuGame: async (data: Partial<SudokuGameData>): Promise<SudokuGameData> => {
    return api.patch<SudokuGameData>('/sudoku-game', data)
  },
}
