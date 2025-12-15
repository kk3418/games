import generateSudoku from '@/generateSudoku'
import '@/style.css'

const { puzzle } = generateSudoku()

const mainDiv = document.getElementById("main")

let activeCellInput: HTMLInputElement | null = null

// function sanitizeCellValue(raw: string): string {
//   const match = raw.match(/[1-9]/)
//   return match ? match[0] : ''
// }

function setCellValue(input: HTMLInputElement, value: string): void {
  if (input.disabled || input.readOnly) return
  input.value = value
  // input.dispatchEvent(new Event('input', { bubbles: true }))
  input.focus()
}

function setInputToStorage(inputValue: string, row: number, col: number): void {
  localStorage.setItem(`input-${row}-${col}`, inputValue)
}

function getInputFromStorage(row: number, col: number): string {
  return localStorage.getItem(`input-${row}-${col}`) ?? ''
}

function createKeypad(): HTMLDivElement {
  const keypad = document.createElement('div')
  keypad.className = 'keypad'

  for (let n = 1; n <= 9; n++) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'keypad-btn'
    btn.textContent = String(n)
    btn.addEventListener('click', () => {
      if (!activeCellInput) return
      setCellValue(activeCellInput, String(n))
      setInputToStorage(String(n), Number(activeCellInput.dataset.row), Number(activeCellInput.dataset.col))
    })
    keypad.appendChild(btn)
  }

  const clearBtn = document.createElement('button')
  clearBtn.type = 'button'
  clearBtn.className = 'keypad-btn keypad-clear'
  clearBtn.textContent = 'Clear'
  clearBtn.addEventListener('click', () => {
    if (!activeCellInput) return
    setCellValue(activeCellInput, '')
      setInputToStorage('', Number(activeCellInput.dataset.row), Number(activeCellInput.dataset.col))
  })
  keypad.appendChild(clearBtn)

  return keypad
}

function createSudokuTable(puzzle: number[][]): HTMLTableElement {
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

      const value = puzzle?.[r]?.[c] ?? 0
      input.value = value === 0 ? '' : String(value)
      if (value !== 0) {
        input.disabled = true
        td.classList.add('given')
      } else {
        if (getInputFromStorage(r, c)) {
          input.value = getInputFromStorage(r, c)
        }
        input.addEventListener('focus', () => {
          activeCellInput = input
        })
        input.addEventListener('click', () => {
          activeCellInput = input
        })
        // input.addEventListener('input', () => {
        //   input.value = sanitizeCellValue(input.value)
        // })
        input.addEventListener('keydown', (e) => {
          if (e.ctrlKey || e.metaKey || e.altKey) return
          if (e.isComposing) return

          // const allowedNonChar = new Set([
          //   'Backspace',
          //   'Delete',
          //   'Tab',
          //   'ArrowLeft',
          //   'ArrowRight',
          //   'ArrowUp',
          //   'ArrowDown',
          //   'Home',
          //   'End',
          //   'Enter',
          //   'Escape',
          // ])

          // if (allowedNonChar.has(e.key)) return

          if (e.key === '0') {
            e.preventDefault()
            setCellValue(input, '')
            setInputToStorage('', r, c)
            return
          }

          if (e.key.length === 1) {
            if (e.key >= '1' && e.key <= '9') {
              e.preventDefault()
              setCellValue(input, e.key)
              setInputToStorage(e.key, r, c)
            }
          }
        })
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

  const sudokuWrap = document.createElement('div')
  sudokuWrap.className = 'sudoku-wrap'
  sudokuWrap.appendChild(createSudokuTable(puzzle))

  const controlsWrap = document.createElement('div')
  controlsWrap.className = 'controls'
  controlsWrap.appendChild(createKeypad())

  container.appendChild(sudokuWrap)
  container.appendChild(controlsWrap)
  mainDiv.replaceChildren(container)
}
