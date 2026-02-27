import '@/games/sudoku/sudoku.css'
import generateSudoku from '@/games/sudoku/generateSudoku'
import { createDifficultySelect, createKeypad, createSudokuTable } from '@/games/sudoku/sudokuUI'
import { showEndGameModal } from '@/games/sudoku/endGameModal'
import type { Game } from '@/types/game'
import { sudokuApi, type SudokuGameData } from '@/games/sudoku/sudokuApi'
import { sudokuHistoryApi } from '@/games/sudokuHistory/sudokuHistoryApi'
import { debounce } from '@/utilities/debounce'

const UPDATE_GAME_DEBOUNCE_TIME = 1000
export class SudokuGame implements Game {
  id = 'sudoku'
  name = 'Sudoku'
  private activeCellInput: HTMLInputElement | null = null
  private container: HTMLElement | null = null
  private sudokuWrap: HTMLElement | null = null
  private gameData: SudokuGameData | null = null
  private basePuzzle?: number[][]
  private currentProgress: number[][] = this.createEmptyProgress()
  private solutionBoard?: number[][]
  private currentLevel = 'medium'

  private onCellChange = (event: Event) => {
    const detail = (event as CustomEvent<{ row: number; col: number; value: string }>).detail
    if (!detail) return
    const { row, col, value } = detail
    if (!this.currentProgress[row]) return
    const num = value ? Number(value) : 0
    this.currentProgress[row][col] = Number.isFinite(num) ? num : 0
    this.debouncedUpdateGame()
  }

  // Debounced function for updating the game state
  private debouncedUpdateGame = debounce(() => {
    const level = this.currentLevel || this.gameData?.level
    const basePuzzle = this.basePuzzle
    if (!basePuzzle) return
    const progressPuzzle = this.getProgressPuzzle(basePuzzle)
    this.updateGameToServer({
      id: this.gameData?.id,
      puzzle: progressPuzzle,
      initialPuzzle: this.basePuzzle,
      level,
    })
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

    // Use backend level or default to medium
    const level = serverGame?.level || 'medium'
    this.currentLevel = level

    let puzzle: number[][]
    let board: number[][]

    if (!serverGame) {
      // 1) If GET is 404 => frontend generates then creates record
      const generated = generateSudoku(level)
      puzzle = generated.puzzle
      board = generated.board
      this.basePuzzle = puzzle
      this.currentProgress = this.createEmptyProgress()
      this.solutionBoard = board

      this.createGameOnServer({ puzzle, initialPuzzle: puzzle, board, level })
    } else {
      const initial = serverGame.initialPuzzle || []
      const current = serverGame.puzzle || []
      board = serverGame.board ?? []
      this.solutionBoard = board

      this.currentProgress = this.extractProgress(initial, current)

      puzzle = initial
      this.basePuzzle = initial
    }

    this.sudokuWrap.appendChild(
      createSudokuTable(puzzle, (input) => {
        this.activeCellInput = input
      }, this.currentProgress),
    )

    window.addEventListener('sudoku:cell-change', this.onCellChange)

    const difficultyWrap = createDifficultySelect(this.currentLevel, (level) => {
      this.resetGame(level)
    })

    const controlsWrap = document.createElement('div')
    controlsWrap.className = 'controls'
    controlsWrap.appendChild(
      createKeypad(
        () => this.activeCellInput,
        () => this.checkSolution(),
        () => this.resetGame(this.currentLevel),
      ),
    )

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

  private resetGame(level: string) {
    if (!this.sudokuWrap) return
    this.currentLevel = level
    const generated = generateSudoku(level)
    const { puzzle, board } = generated

    this.basePuzzle = puzzle
    this.currentProgress = this.createEmptyProgress()
    this.solutionBoard = board

    this.sudokuWrap.replaceChildren(
      createSudokuTable(puzzle, (input) => {
        this.activeCellInput = input
      }, this.currentProgress),
    )

    // Update the game on server
    this.updateGameToServer({
      id: this.gameData?.id,
      puzzle,
      initialPuzzle: puzzle,
      board,
      level
    })
    // Track new puzzle as in-progress
    this.logHistory({ isComplete: false, isInProgress: true })
  }

  private logHistory({ isComplete, isInProgress }: { isComplete: boolean; isInProgress: boolean }) {
    const level = this.currentLevel || this.gameData?.level || 'medium'
    const initialPuzzle = this.basePuzzle
    const puzzle = this.currentProgress
    const board = this.solutionBoard

    if (!initialPuzzle || !puzzle || !board) return

    sudokuHistoryApi
      .createHistory({ initialPuzzle, puzzle, board, level, isComplete, isInProgress })
      .catch((err) => console.error('Failed to log sudoku history', err))
  }

  private checkSolution() {
    console.log('check solution')

    const boardStorage = this.solutionBoard
    const inputValue = this.currentProgress

    if (!inputValue.length || !boardStorage || !boardStorage.length) {
      showEndGameModal({
        title: 'Not yet',
        message: 'Something wrong :(',
        primaryText: 'Continue',
      })
      return
    }

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const v = inputValue[r]?.[c]
        if (!v) continue
        if (boardStorage[r]?.[c] !== Number(v)) {
          showEndGameModal({
            title: 'Not yet',
            message: 'Something wrong :(',
            primaryText: 'Continue',
          })
          return
        }
      }
    }

    const lastGameLevel = this.currentLevel ?? ''

    // Record completed game
    this.logHistory({ isComplete: true, isInProgress: false })

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

  private createEmptyProgress(): number[][] {
    return Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0))
  }

  private extractProgress(initial: number[][], current: number[][]): number[][] {
    const progress = this.createEmptyProgress()

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (initial?.[r]?.[c] === 0 && current?.[r]?.[c]) {
          progress[r][c] = current[r][c]
        }
      }
    }

    return progress
  }

  // Get the current state of the puzzle (base puzzle + current inputs)
  private getProgressPuzzle(basePuzzle: number[][]): number[][] {
    const currentPuzzle: number[][] = JSON.parse(JSON.stringify(basePuzzle))

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const n = this.currentProgress?.[r]?.[c] ?? 0
        currentPuzzle[r][c] = Number.isFinite(n) ? n : 0
      }
    }

    return currentPuzzle
  }
}
