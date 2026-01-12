import '@/games/sudoku/sudoku.css'
import generateSudoku from '@/games/sudoku/generateSudoku'
import { createDifficultySelect, createKeypad, createSudokuTable } from '@/games/sudoku/sudokuUI'
import { getAllInput } from '@/games/sudoku/getStorageInput'
import { showEndGameModal } from '@/games/sudoku/endGameModal'
import type { Game } from '@/types/game'
import { sudokuApi, type SudokuGameData } from '@/games/sudoku/sudokuApi'
import { debounce } from '@/utilities/debounce'

const UPDATE_GAME_DEBOUNCE_TIME = 1000
export class SudokuGame implements Game {
  id = 'sudoku'
  name = 'Sudoku'
  private activeCellInput: HTMLInputElement | null = null
  private container: HTMLElement | null = null
  private sudokuWrap: HTMLElement | null = null
  private gameData: SudokuGameData | null = null
  private basePuzzle: number[][] | null = null

  private onCellChange = () => {
    this.debouncedUpdateGame()
  }

  // Debounced function for updating the game state
  private debouncedUpdateGame = debounce(() => {
    const level = localStorage.getItem('level') || this.gameData?.level || 'medium'
    const basePuzzle = this.basePuzzle
    if (!basePuzzle) return
    const progressPuzzle = this.getProgressPuzzle(basePuzzle)
    this.updateGameToServer({ puzzle: progressPuzzle, level })
  }, UPDATE_GAME_DEBOUNCE_TIME)

  async init(rootElement: HTMLElement): Promise<void> {
    this.container = document.createElement('div')
    this.container.className = 'container'

    this.sudokuWrap = document.createElement('div')
    this.sudokuWrap.className = 'sudoku-wrap'

    // Try to load game from server first
    let serverGame: SudokuGameData | null = null
    try {
      serverGame = await sudokuApi.getSudokuGame()
      this.gameData = serverGame
    } catch (error) {
      if (error instanceof Error && error.name === 'NotFoundError') {
        serverGame = null
      } else {
        console.error('Error loading game from server:', error)
        serverGame = null
      }
    }

    // Use saved level or default to medium
    const level = localStorage.getItem('level') || serverGame?.level || 'medium'
    localStorage.setItem('level', level)

    // Generate sudoku puzzle or use one from localStorage
    const generated = generateSudoku(level)
    const puzzle = generated.puzzle
    const board = generated.board
    this.basePuzzle = puzzle

    this.sudokuWrap.appendChild(
      createSudokuTable(puzzle, (input) => {
        this.activeCellInput = input
      }),
    )

    window.addEventListener('sudoku:cell-change', this.onCellChange)

    const progressPuzzle = this.getProgressPuzzle(puzzle)
    const needsSync =
      !serverGame ||
      JSON.stringify(serverGame.puzzle) !== JSON.stringify(progressPuzzle) ||
      JSON.stringify(serverGame.board) !== JSON.stringify(board) ||
      serverGame.level !== level

    if (!serverGame) {
      this.createGameOnServer({ puzzle: progressPuzzle, board, level })
    } else if (needsSync) {
      this.updateGameToServer({ puzzle: progressPuzzle, board, level })
    }

    const difficultyWrap = createDifficultySelect((level) => {
      this.resetGame(level)
    })

    const controlsWrap = document.createElement('div')
    controlsWrap.className = 'controls'
    controlsWrap.appendChild(createKeypad(
      () => this.activeCellInput,
      () => this.checkSolution(),
      () => this.resetGame(localStorage.getItem('level') ?? 'medium'),
    ))


    this.container.appendChild(difficultyWrap)
    this.container.appendChild(this.sudokuWrap)
    this.container.appendChild(controlsWrap)
    rootElement.appendChild(this.container)
  }

  destroy(): void {
    if (this.container) {
      this.container.remove()
      this.container = null
    }
    window.removeEventListener('sudoku:cell-change', this.onCellChange)
  }

  private clearSudokuStorage(): void {
    localStorage.removeItem('puzzle')
    localStorage.removeItem('board')
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i)
      if (k && k.startsWith('input-')) {
        localStorage.removeItem(k)
      }
    }
  }

  private resetGame(level: string) {
    if (!this.sudokuWrap) return
    this.clearSudokuStorage()
    const generated = generateSudoku(level)
    const { puzzle, board } = generated

    // Save the board for validation
    localStorage.setItem('board', JSON.stringify(board))
    localStorage.setItem('level', level)
    this.basePuzzle = puzzle

    this.sudokuWrap.replaceChildren(
      createSudokuTable(puzzle, (input) => {
        this.activeCellInput = input
      }),
    )

    // Update the game on server
    this.updateGameToServer({ puzzle: this.getProgressPuzzle(puzzle), board, level })
  }

  private checkSolution() {
    console.log('check solution')

    const inputValue = getAllInput()
    const boardStorage = JSON.parse(localStorage.getItem('board') ?? '[]')

    if (Object.keys(inputValue)) {
      showEndGameModal({
        title: 'Not yet',
        message: 'Something wrong :(',
        primaryText: 'Continue',
      })
      return
    }

    for (const [k, v] of Object.entries(inputValue)) {
      const [row, col] = k.split('-')
      if (boardStorage[row][col] !== Number(v) && v) {
        showEndGameModal({
          title: 'Not yet',
          message: 'Something wrong :(',
          primaryText: 'Continue',
        })
        return
      }
    }

    const lastGameLevel = localStorage.getItem('level') ?? ''
    showEndGameModal({
      title: 'Congratulations!',
      message: 'You solved the puzzle correctly!',
      primaryText: 'New Game',
      endGame: (level: string) => this.resetGame(level),
      endGameArgs: [lastGameLevel],
    })
  }

  // Create a new game on the server for first-time users
  private async createGameOnServer(data: SudokuGameData): Promise<void> {
    try {
      this.gameData = await sudokuApi.createSudokuGame(data)
      console.log('Game created on server:', this.gameData)
    } catch (error) {
      console.error('Error creating game on server:', error)
    }
  }

  // Update the game on the server (used by debounce and reset)
  private async updateGameToServer(data: Partial<SudokuGameData>): Promise<void> {
    try {
      this.gameData = await sudokuApi.updateSudokuGame(data)
      console.log('Game updated on server:', this.gameData)
    } catch (error) {
      console.error('Error updating game on server:', error)
    }
  }

  // Get the current state of the puzzle (base puzzle + current inputs)
  private getProgressPuzzle(basePuzzle: number[][]): number[][] {
    const inputValues = getAllInput()
    const currentPuzzle: number[][] = JSON.parse(JSON.stringify(basePuzzle))

    for (const [key, value] of Object.entries(inputValues)) {
      const [row, col] = key.split('-').map(Number)
      if (!currentPuzzle[row] || typeof currentPuzzle[row][col] === 'undefined') continue
      const n = value ? Number(value) : 0
      currentPuzzle[row][col] = Number.isFinite(n) ? n : 0
    }

    return currentPuzzle
  }
}
