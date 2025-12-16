import shuffleArray from '@/shuffleArray'
import generateEmptyIndex from '@/generateEmptyIndex'
import { clone2DArray } from '@/copyUtilities'

function generateSudoku (level: string) {
  const puzzleStorage = JSON.parse(localStorage.getItem('puzzle') ?? '[]')
  const boardStorage = JSON.parse(localStorage.getItem('board') ?? '[]')

  if (puzzleStorage.length > 0 && boardStorage.length > 0) {
    return { puzzle: puzzleStorage, board: boardStorage }
  }

  const rows = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => false))
  const cols = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => false))
  const boxes = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => false))

  const board = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0))

  function isValid (num: number, r: number, c: number) {
    return !(rows[r][num - 1] || cols[c][num - 1] || boxes[Math.floor(r / 3) * 3 + Math.floor(c / 3)][num - 1])
  }

  function markUsed (num: number, r: number, c: number, used: boolean) {
    rows[r][num - 1] = used
    cols[c][num - 1] = used
    boxes[Math.floor(r / 3) * 3 + Math.floor(c / 3)][num - 1] = used
  }

  function generateCompleteBoard(r: number, c: number): boolean {
    // r, c is star at 0
    if (c === 9) {
      r += 1
      c = 0
    }

    if (r === 9) {
      return true
    }

    const tryNumbers = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9])

    for (const num of tryNumbers) {
      if (isValid(num, r, c)) {
        board[r][c] = num
        markUsed(num, r, c, true)
        if (generateCompleteBoard(r, c + 1)) {
          return true
        }
        board[r][c] = 0
        markUsed(num, r, c, false)
      }
    }

    return false
  }

  console.time('generate complete board')
  generateCompleteBoard(0, 0)
  console.timeEnd('generate complete board')

  let puzzle: number[][] = []
  let solution: number = 0

  function checkPuzzleSolution(r: number, c: number): void {
    if (solution >= 2) return

    if (c === 9) {
      r += 1
      c = 0
    }

    if (r === 9) {
      solution += 1
      return
    }

    if (puzzle[r][c] !== 0) {
      checkPuzzleSolution(r, c + 1)
      return
    }

    for (const num of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
      if (isValid(num, r, c)) {
        markUsed(num, r, c, true)
        puzzle[r][c] = num
        checkPuzzleSolution(r, c + 1)
        puzzle[r][c] = 0
        markUsed(num, r, c, false)
        if (solution >= 2) return
      }
    }
    return
  }

  // generate puzzle - loop
  // 1. random empty position
  // 2. validate only one solution
  // 3. if none solution or more than 1 solution, re-generate random empty position

  console.time('check solution')
  do {
    puzzle = clone2DArray(board)
    solution = 0
    rows.forEach(row => row.fill(false))
    cols.forEach(col => col.fill(false))
    boxes.forEach(box => box.fill(false))

    const emptyIndex = generateEmptyIndex(level)
    emptyIndex.forEach(index => {
      const row = Math.floor(index / 9)
      const col = index % 9
      puzzle[row][col] = 0
    })

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const num = puzzle[r][c]
        if (num !== 0) markUsed(num, r, c, true)
      }
    }
    checkPuzzleSolution(0, 0)
  } while (solution !== 1)
  console.timeEnd('check solution')

  localStorage.setItem('board', JSON.stringify(board))
  localStorage.setItem('puzzle', JSON.stringify(puzzle))

  return { puzzle, board }
}

export default generateSudoku
