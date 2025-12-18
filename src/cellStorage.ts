export function setCellValueToStorage(inputValue: string, row: number, col: number): void {
  localStorage.setItem(`input-${row}-${col}`, inputValue)
}

export function getCellValueFromStorage(row: number, col: number): string {
  return localStorage.getItem(`input-${row}-${col}`) ?? ''
}
