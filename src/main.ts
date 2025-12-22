import generateSudoku from '@/generateSudoku'
import '@/style.css'
import { createDifficultySelect, createKeypad, createSudokuTable } from '@/sudokuUI'
import { getAllInput } from '@/getStorageInput'
import { showEndGameModal } from '@/endGameModal'

// TODO:
// - 做一個選單 可以選擇其他遊戲 例如貪吃蛇
// - 數獨優化：新增上下左右鍵移動 focus input

// initial dom
const mainDiv = document.getElementById("main")

const container = document.createElement('div')
container.className = 'container'

const sudokuWrap = document.createElement('div')
sudokuWrap.className = 'sudoku-wrap'


let activeCellInput: HTMLInputElement | null = null

function resetGame(level: string, sudokuWrap: HTMLElement) {
  localStorage.clear()
  const { puzzle } = generateSudoku(level)

  sudokuWrap.replaceChildren(
    createSudokuTable(puzzle, (input) => {
      activeCellInput = input
    }),
  )
}

function checkSolution() {
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
    endGame: resetGame,
    endGameArgs: [lastGameLevel, sudokuWrap],
  })
}

if (mainDiv) {
  const { puzzle } = generateSudoku(localStorage.getItem('level') || 'medium')

  sudokuWrap.appendChild(
    createSudokuTable(puzzle, (input) => {
      activeCellInput = input
    }),
  )

  const difficultyWrap = createDifficultySelect((level) => {
    resetGame(level, sudokuWrap)
  })

  const controlsWrap = document.createElement('div')
  controlsWrap.className = 'controls'
  controlsWrap.appendChild(createKeypad(
    () => activeCellInput,
    checkSolution,
    () => resetGame(localStorage.getItem('level') ?? 'medium', sudokuWrap),
  ))

  const sideWrap = document.createElement('div')
  sideWrap.className = 'side'
  sideWrap.appendChild(difficultyWrap)
  sideWrap.appendChild(controlsWrap)

  container.appendChild(sudokuWrap)
  container.appendChild(sideWrap)
  mainDiv.appendChild(container)
}
