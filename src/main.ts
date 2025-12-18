import generateSudoku from '@/generateSudoku'
import '@/style.css'
import { createDifficultySelect, createKeypad, createSudokuTable } from '@/sudokuUI'
import { getAllInput } from '@/getStorageInput'

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
  console.log(inputValue)
  const boardStorage = JSON.parse(localStorage.getItem('board') ?? '[]')
  for (const [k, v] of Object.entries(inputValue)) {
    const [row, col] = k.split('-')
    if (boardStorage[row][col] !== Number(v)) {
      alert('Something wrong :(')
      return
    }
  }
  alert('Congratulations! You solved the puzzle correctly!')
}

if (mainDiv) {
  const { puzzle } = generateSudoku('medium')

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
  ))

  const sideWrap = document.createElement('div')
  sideWrap.className = 'side'
  sideWrap.appendChild(difficultyWrap)
  sideWrap.appendChild(controlsWrap)

  container.appendChild(sudokuWrap)
  container.appendChild(sideWrap)
  mainDiv.appendChild(container)
}
