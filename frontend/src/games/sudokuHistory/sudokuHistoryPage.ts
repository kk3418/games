import './sudokuHistory.css'
import type { Game } from '@/types/game'
import { sudokuHistoryApi, type SudokuHistoryItem } from '@/games/sudokuHistory/sudokuHistoryApi'
import { sudokuApi } from '@/games/sudoku/sudokuApi'

export class SudokuHistoryPage implements Game {
  id = 'sudoku-history'
  name = 'Sudoku History'
  private container: HTMLElement | null = null
  private listContainer: HTMLElement | null = null
  private statusText: HTMLElement | null = null

  init(rootElement: HTMLElement): void {
    this.container = document.createElement('div')
    this.container.className = 'history-page'

    const header = document.createElement('div')
    header.className = 'history-header'

    const title = document.createElement('h2')
    title.className = 'history-title'
    title.textContent = 'Sudoku History'

    const actions = document.createElement('div')
    actions.className = 'history-actions'

    const refreshBtn = document.createElement('button')
    refreshBtn.className = 'history-btn secondary'
    refreshBtn.textContent = 'Refresh'
    refreshBtn.onclick = () => this.loadHistory()

    actions.appendChild(refreshBtn)

    header.appendChild(title)
    header.appendChild(actions)

    this.statusText = document.createElement('div')

    this.listContainer = document.createElement('div')
    this.listContainer.className = 'history-grid'

    this.container.appendChild(header)
    this.container.appendChild(this.statusText)
    this.container.appendChild(this.listContainer)

    rootElement.appendChild(this.container)

    this.loadHistory()
  }

  destroy(): void {
    if (this.container) {
      this.container.remove()
    }
    this.container = null
    this.listContainer = null
    this.statusText = null
  }

  private async loadHistory(): Promise<void> {
    if (!this.listContainer || !this.statusText) return
    this.statusText.textContent = 'Loading history...'
    this.listContainer.innerHTML = ''
    try {
      const histories = await sudokuHistoryApi.getHistory()
      if (histories.length === 0) {
        this.statusText.innerHTML = '<div class="history-empty">No Sudoku games recorded yet.</div>'
        return
      }
      this.statusText.textContent = ''
      histories.forEach((item) => {
        this.listContainer?.appendChild(this.createCard(item))
      })
    } catch (error) {
      console.error('Failed to load sudoku history', error)
      this.statusText.innerHTML = '<div class="history-error">Failed to load history.</div>'
    }
  }

  private createCard(item: SudokuHistoryItem): HTMLElement {
    const card = document.createElement('div')
    card.className = 'history-card'

    const level = document.createElement('div')
    level.className = 'history-level'
    level.textContent = item.level.toUpperCase()

    const meta = document.createElement('div')
    meta.className = 'history-meta'
    const created = this.formatDate(item.createdAt)
    const updated = this.formatDate(item.updatedAt)

    let statusText = 'Unfinished'
    if (item.isComplete) {
      statusText = 'Completed'
    } else if (item.isInProgress) {
      statusText = 'In progress'
    }

    meta.innerHTML = `<span>Created at: ${created}</span>
    <span>Updated at: ${updated}</span>
    <span class="history-status">${statusText}</span>`

    if (!item.isComplete && !item.isInProgress) {
      const resumeBtn = document.createElement('button')
      resumeBtn.className = 'history-btn primary'
      resumeBtn.textContent = 'Resume'
      resumeBtn.onclick = async () => {
        try {
          resumeBtn.disabled = true
          resumeBtn.textContent = 'Resuming...'
          await sudokuApi.updateSudokuGame({ id: item.id, isInProgress: true })
          window.location.hash = 'sudoku'
        } catch (error) {
          console.error('Failed to resume game', error)
          resumeBtn.disabled = false
          resumeBtn.textContent = 'Resume'
        }
      }
      meta.appendChild(resumeBtn)
    }

    const gridWrap = document.createElement('div')
    const grid = document.createElement('table')
    grid.className = 'history-sudoku-grid'

    for (let r = 0; r < 9; r++) {
      const tr = document.createElement('tr')
      for (let c = 0; c < 9; c++) {
        const td = document.createElement('td')
        const initialPuzzleValue = item.initialPuzzle?.[r]?.[c] ?? 0
        const puzzleValue = item.puzzle?.[r]?.[c] ?? 0

        if (initialPuzzleValue !== 0) {
          td.textContent = String(initialPuzzleValue)
          td.classList.add('history-cell-given')
        }

        if (puzzleValue !== 0) {
          td.textContent = String(puzzleValue)
        }

        tr.appendChild(td)
      }
      grid.appendChild(tr)
    }

    gridWrap.appendChild(grid)

    card.appendChild(level)
    card.appendChild(meta)
    card.appendChild(gridWrap)

    return card
  }

  private formatDate(dateInput?: string): string {
    const date = dateInput ? new Date(dateInput) : new Date()
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    const hh = String(date.getHours()).padStart(2, '0')
    const mi = String(date.getMinutes()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`
  }
}
