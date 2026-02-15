export function setCellValueToStorage(inputValue: string, row: number, col: number): void {
  window.dispatchEvent(
    new CustomEvent('sudoku:cell-change', {
      detail: { row, col, value: inputValue },
    }),
  )
}
