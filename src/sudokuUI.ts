import { getCellValueFromStorage, setCellValueToStorage } from '@/cellStorage'

export function sanitizeCellValue(raw: string): string {
  const match = raw.match(/[1-9]/)
  return match ? match[0] : ''
}

export function setCellValue(input: HTMLInputElement, value: string): void {
  if (input.disabled || input.readOnly) return
  input.value = value
  // input.dispatchEvent(new Event('input', { bubbles: true }))
  input.focus()
}

export function createDifficultySelect(
  onLevelChange: (level: string) => void,
): HTMLDivElement {
  const wrap = document.createElement('div')
  wrap.className = 'difficulty'

  const label = document.createElement('label')
  label.className = 'difficulty-label'
  label.htmlFor = 'difficulty-select'
  label.textContent = 'LEVEL'

  const select = document.createElement('select')
  select.className = 'difficulty-select'
  select.id = 'difficulty-select'
  select.name = 'difficulty'

  const options: Array<{ value: string; text: string }> = [
    { value: 'easy', text: 'Easy' },
    { value: 'medium', text: 'Medium' },
    { value: 'hard', text: 'Hard' },
  ]

  select.addEventListener('change', () => {
    onLevelChange(select.value)
    localStorage.setItem('level', select.value)
  })

  for (const opt of options) {
    const option = document.createElement('option')
    option.value = opt.value
    option.textContent = opt.text
    select.appendChild(option)
  }

  select.value = localStorage.getItem('level') || 'medium'

  wrap.appendChild(label)
  wrap.appendChild(select)
  return wrap
}

export function createKeypad(
  getActiveCellInput: () => HTMLInputElement | null,
  checkSolution: () => void,
  resetGame: () => void,
): HTMLDivElement {
  const keypad = document.createElement('div')
  keypad.className = 'keypad'

  for (let n = 1; n <= 9; n++) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'keypad-btn'
    btn.textContent = String(n)
    btn.addEventListener('click', () => {
      const activeCellInput = getActiveCellInput()
      if (!activeCellInput) return
      setCellValue(activeCellInput, String(n))
      setCellValueToStorage(
        String(n),
        Number(activeCellInput.dataset.row),
        Number(activeCellInput.dataset.col),
      )
    })
    keypad.appendChild(btn)
  }

  const clearBtn = document.createElement('button')
  clearBtn.type = 'button'
  clearBtn.className = 'keypad-btn keypad-clear'
  clearBtn.textContent = 'Clear'
  clearBtn.addEventListener('click', () => {
    const activeCellInput = getActiveCellInput()
    if (!activeCellInput) return
    setCellValue(activeCellInput, '')
    setCellValueToStorage(
      '',
      Number(activeCellInput.dataset.row),
      Number(activeCellInput.dataset.col),
    )
  })
  keypad.appendChild(clearBtn)

  const checkBtn = document.createElement('button')
  checkBtn.type = 'button'
  checkBtn.className = 'keypad-btn keypad-check'
  checkBtn.textContent = 'Check'
  checkBtn.addEventListener('click', () => {
    checkSolution()
  })
  keypad.appendChild(checkBtn)

  const resetBtn = document.createElement('button')
  resetBtn.type = 'button'
  resetBtn.className = 'keypad-btn keypad-check'
  resetBtn.textContent = 'Reset'
  resetBtn.addEventListener('click', () => {
    resetGame()
  })
  keypad.appendChild(resetBtn)

  return keypad
}

export function createSudokuTable(
  puzzle: number[][],
  setActiveCellInput: (input: HTMLInputElement) => void,
): HTMLTableElement {
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
        const stored = getCellValueFromStorage(r, c)
        if (stored) {
          input.value = stored
        }
        input.addEventListener('focus', () => {
          setActiveCellInput(input)
        })
        input.addEventListener('click', () => {
          setActiveCellInput(input)
        })
        input.addEventListener('input', () => {
          input.value = sanitizeCellValue(input.value)
        })
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

          if (e.key === '0' || e.key === 'Backspace' || e.key === 'Delete') {
            e.preventDefault()
            setCellValue(input, '')
            setCellValueToStorage('', r, c)
            return
          }

          if (e.key.length === 1) {
            if (e.key >= '1' && e.key <= '9') {
              e.preventDefault()
              setCellValue(input, e.key)
              setCellValueToStorage(e.key, r, c)
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
