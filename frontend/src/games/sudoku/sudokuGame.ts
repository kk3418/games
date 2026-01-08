import '@/games/sudoku/sudoku.css'
import generateSudoku from '@/games/sudoku/generateSudoku'
import { createDifficultySelect, createKeypad, createSudokuTable } from '@/games/sudoku/sudokuUI'
import { getAllInput } from '@/games/sudoku/getStorageInput'
import { showEndGameModal } from '@/games/sudoku/endGameModal'
import type { Game } from '@/types/game'
import { sudokuApi, type SudokuGameData } from '@/games/sudoku/sudokuApi'
import { debounce } from '@/utilities/debounce'

export class SudokuGame implements Game {
  id = 'sudoku'
  name = 'Sudoku'
  private activeCellInput: HTMLInputElement | null = null
  private container: HTMLElement | null = null
  private sudokuWrap: HTMLElement | null = null
  private gameData: SudokuGameData | null = null
  private isFirstTimeUser = true

  // Debounced function for updating the game state
  private debouncedUpdateGame = debounce((puzzle: string[][], level: string) => {
    this.updateGameToServer(puzzle, level)
  }, 500)

  async init(rootElement: HTMLElement): Promise<void> {
    this.container = document.createElement('div')
    this.container.className = 'container'

    this.sudokuWrap = document.createElement('div')
    this.sudokuWrap.className = 'sudoku-wrap'

    // Try to load game from server first
    try {
      await this.loadGameFromServer()
    } catch (error) {
      console.log('First time user or error loading game, will create new game')
      this.isFirstTimeUser = true
    }

    // Use saved level or default to medium
    const level = this.gameData?.level || localStorage.getItem('level') || 'medium'

    // Generate sudoku puzzle or use one from server
    let puzzle
    if (this.gameData?.puzzle) {
      puzzle = this.gameData.puzzle
    } else {
      const generated = generateSudoku(level)
      puzzle = generated.puzzle
      // Save the board for validation
      localStorage.setItem('board', JSON.stringify(generated.board))
      localStorage.setItem('level', level)

      // If first time user, create new game on server
      if (this.isFirstTimeUser) {
        this.createGameOnServer(puzzle, generated.board, level)
      }
    }

    this.sudokuWrap.appendChild(
      createSudokuTable(puzzle, (input) => {
        this.activeCellInput = input
        // When input changes, update the game state with debounce
        input.addEventListener('input', () => {
          const currentPuzzle = this.getCurrentPuzzleState()
          this.debouncedUpdateGame(currentPuzzle, level)
        })
      }),
    )

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
  }

  private resetGame(level: string) {
    if (!this.sudokuWrap) return
    localStorage.clear()
    const generated = generateSudoku(level)
    const { puzzle, board } = generated

    // Save the board for validation
    localStorage.setItem('board', JSON.stringify(board))
    localStorage.setItem('level', level)

    this.sudokuWrap.replaceChildren(
      createSudokuTable(puzzle, (input) => {
        this.activeCellInput = input
        // When input changes, update the game state with debounce
        input.addEventListener('input', () => {
          const currentPuzzle = this.getCurrentPuzzleState()
          this.debouncedUpdateGame(currentPuzzle, level)
        })
      }),
    )

    // Update the game on server
    this.updateGameToServer(puzzle, level)
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

  // Load game data from server
  private async loadGameFromServer(): Promise<void> {
    try {
      this.gameData = await sudokuApi.getSudokuGame()
      this.isFirstTimeUser = false
      console.log('Game loaded from server:', this.gameData)
    } catch (error) {
      console.error('Error loading game from server:', error)
      throw error // Re-throw so init knows this is a first time user
    }
  }

  // Create a new game on the server for first-time users
  private async createGameOnServer(puzzle: string[][], board: any[], level: string): Promise<void> {
    try {
      this.gameData = await sudokuApi.createSudokuGame({
        puzzle,
        board,
        level
      })
      this.isFirstTimeUser = false
      console.log('Game created on server:', this.gameData)
    } catch (error) {
      console.error('Error creating game on server:', error)
    }
  }

  // Update the game on the server (used by debounce and reset)
  private async updateGameToServer(puzzle: string[][], level: string): Promise<void> {
    try {
      this.gameData = await sudokuApi.updateSudokuGame({
        puzzle,
        level
      })
      console.log('Game updated on server:', this.gameData)
    } catch (error) {
      console.error('Error updating game on server:', error)
    }
  }

  // Get the current state of the puzzle from the UI
  private getCurrentPuzzleState(): string[][] {
    const inputValues = getAllInput()
    // Get the original puzzle from gameData or localStorage
    let currentPuzzle: string[][] = []

    if (this.gameData?.puzzle) {
      currentPuzzle = JSON.parse(JSON.stringify(this.gameData.puzzle)) // Deep copy
    } else {
      // If no gameData, initialize an empty 9x9 grid
      currentPuzzle = Array(9).fill(0).map(() => Array(9).fill(''))
    }

    // Update with current input values
    for (const [key, value] of Object.entries(inputValues)) {
      const [row, col] = key.split('-').map(Number)
      if (currentPuzzle[row] && typeof currentPuzzle[row][col] !== 'undefined') {
        currentPuzzle[row][col] = value || ''
      }
    }

    return currentPuzzle
  }
}
