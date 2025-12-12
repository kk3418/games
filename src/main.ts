import { puzzle } from '@/generateSudoku'
import '@/style.css'

const mainDiv = document.getElementById("main")

function createSudokuTable(board: number[][]): HTMLTableElement {
  const table = document.createElement('table')
  table.className = 'sudoku'

  for (let r = 0; r < 9; r++) {
    const tr = document.createElement('tr')

    for (let c = 0; c < 9; c++) {
      const td = document.createElement('td')
      td.className = 'cell'

      const input = document.createElement('input')
      input.className = 'cell-input'
      input.type = 'text'
      input.inputMode = 'numeric'
      input.maxLength = 1

      const value = board?.[r]?.[c] ?? 0
      input.value = value === 0 ? '' : String(value)
      if (value !== 0) {
        input.readOnly = true
        input.tabIndex = -1
      }
      input.dataset.row = String(r)
      input.dataset.col = String(c)

      td.appendChild(input)
      tr.appendChild(td)
    }

    table.appendChild(tr)
  }

  return table
}


if (mainDiv) {
  const container = document.createElement('div')
  container.className = 'container'

  container.appendChild(createSudokuTable(puzzle))
  mainDiv.replaceChildren(container)
}
