import generateSudoku from '@/generateSudoku'
import { createDifficultySelect, createKeypad, createSudokuTable } from '@/sudokuUI'
import { getAllInput } from '@/getStorageInput'
import { showEndGameModal } from '@/endGameModal'
import type { Game } from '@/game'

export class SudokuGame implements Game {
  name = 'Sudoku'
  private activeCellInput: HTMLInputElement | null = null
  private container: HTMLElement | null = null
  private sudokuWrap: HTMLElement | null = null

  init(rootElement: HTMLElement): void {
    this.container = document.createElement('div')
    this.container.className = 'container'

    this.sudokuWrap = document.createElement('div')
    this.sudokuWrap.className = 'sudoku-wrap'

    const { puzzle } = generateSudoku(localStorage.getItem('level') || 'medium')

    this.sudokuWrap.appendChild(
      createSudokuTable(puzzle, (input) => {
        this.activeCellInput = input
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

    const sideWrap = document.createElement('div')
    sideWrap.className = 'side'
    sideWrap.appendChild(difficultyWrap)
    sideWrap.appendChild(controlsWrap)

    this.container.appendChild(this.sudokuWrap)
    this.container.appendChild(sideWrap)
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
    const { puzzle } = generateSudoku(level)

    this.sudokuWrap.replaceChildren(
      createSudokuTable(puzzle, (input) => {
        this.activeCellInput = input
      }),
    )
  }

  private checkSolution() {
    console.log('check solution')

    const inputValue = getAllInput()
    const boardStorage = JSON.parse(localStorage.getItem('board') ?? '[]')

    if (Object.keys(inputValue).length !== boardStorage.length) {
      showEndGameModal({
        title: 'Not yet',
        message: 'Something wrong :(',
        primaryText: 'Continue',
      })
      return
    }

    for (const [k, v] of Object.entries(inputValue)) {
      const [row, col] = k.split('-')
      if (boardStorage[row][col] !== Number(v)) {
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
      secondaryText: 'Close',
      endGame: (level: string) => this.resetGame(level),
      endGameArgs: [lastGameLevel],
    })
  }
}
