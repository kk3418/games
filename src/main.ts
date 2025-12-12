import { puzzle } from '@/generateSudoku'
import '@/style.css'

const mainDiv = document.getElementById("main")


if (mainDiv) {
  const boardArea = puzzle.map(
    row => row.map(col => `<span class="cell">${col}</span>`).join('')
  ).join('<br>')

  mainDiv.innerHTML = `<div class="container">${boardArea}</div>`;
}
