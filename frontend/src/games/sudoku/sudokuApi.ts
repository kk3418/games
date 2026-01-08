import { api } from '@/utilities/api';

export interface SudokuGameData {
  id?: string;
  userId?: string;
  puzzle?: string[][];
  board?: string[][];
  level?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const sudokuApi = {
  // Get the current sudoku game for the user
  getSudokuGame: async (): Promise<SudokuGameData> => {
    return api.get<SudokuGameData>('/sudoku-game');
  },

  // Create a new sudoku game (for first-time users)
  createSudokuGame: async (data: SudokuGameData): Promise<SudokuGameData> => {
    return api.post<SudokuGameData>('/sudoku-game', data);
  },

  // Update the sudoku game (for game progress or reset)
  updateSudokuGame: async (data: Partial<SudokuGameData>): Promise<SudokuGameData> => {
    return api.patch<SudokuGameData>('/sudoku-game', data);
  },
};
